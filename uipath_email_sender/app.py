from __future__ import annotations

import logging
import tempfile
import time
from datetime import datetime
from pathlib import Path

import pandas as pd
import streamlit as st

try:
    from .config import BASE_DIR, DEFAULT_DELAY_SECONDS, MAX_RECIPIENT_LIMIT_DEFAULT, SAFE_BATCH_MAX_RECIPIENTS, SAFE_BATCH_DELAY_SECONDS, get_gmail_address, get_gmail_app_password
    from .email_template import build_email_html, get_email_subject
    from .email_validator import validate_participant_emails
    from .excel_handler import ExcelLoadError, get_preview_rows, get_sheet_data, load_excel_file
    from .report_generator import build_initial_report, export_campaign_report, update_report_status
    from .smtp_sender import SMTPConfigurationError, SMTPConnectionError, send_campaign_email, send_test_email
except ImportError:  # pragma: no cover - direct-script compatibility
    from config import BASE_DIR, DEFAULT_DELAY_SECONDS, MAX_RECIPIENT_LIMIT_DEFAULT, SAFE_BATCH_MAX_RECIPIENTS, SAFE_BATCH_DELAY_SECONDS, get_gmail_address, get_gmail_app_password
    from email_template import build_email_html, get_email_subject
    from email_validator import validate_participant_emails
    from excel_handler import ExcelLoadError, get_preview_rows, get_sheet_data, load_excel_file
    from report_generator import build_initial_report, export_campaign_report, update_report_status
    from smtp_sender import SMTPConfigurationError, SMTPConnectionError, send_campaign_email, send_test_email

LOGGER = logging.getLogger(__name__)
LOG_PATH = BASE_DIR / "reports" / "email_campaign.log"
LOG_PATH.parent.mkdir(exist_ok=True)
if not LOGGER.handlers:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(levelname)s - %(message)s",
        handlers=[
            logging.FileHandler(LOG_PATH, mode="a", encoding="utf-8"),
            logging.StreamHandler(),
        ],
    )


def init_session_state() -> None:
    """Initialize persistent session state values used by the app."""
    defaults = {
        "uploaded_file": None,
        "file_path": None,
        "sheet_names": [],
        "selected_sheet": None,
        "sheet_df": None,
        "preview_df": pd.DataFrame(),
        "email_column": None,
        "name_column": None,
        "validation_result": None,
        "valid_recipients": [],
        "report_rows": [],
        "smtp_ready": False,
        "sending_active": False,
        "stop_requested": False,
        "campaign_started_at": None,
        "campaign_completed_at": None,
        "campaign_summary": None,
        "test_email_recipient": "",
    }
    for key, value in defaults.items():
        st.session_state.setdefault(key, value)


def reset_campaign_state() -> None:
    """Reset campaign state when a new file or sheet is selected."""
    st.session_state.validation_result = None
    st.session_state.valid_recipients = []
    st.session_state.report_rows = []
    st.session_state.sending_active = False
    st.session_state.stop_requested = False
    st.session_state.campaign_started_at = None
    st.session_state.campaign_completed_at = None
    st.session_state.campaign_summary = None


def get_uploaded_file_path(uploaded_file) -> str:
    """Save the uploaded file to a temporary file and return its absolute path."""
    with tempfile.NamedTemporaryFile(delete=False, suffix=Path(uploaded_file.name).suffix) as temp_file:
        temp_file.write(uploaded_file.getvalue())
        return temp_file.name


def credentials_status() -> tuple[bool, str]:
    """Check whether SMTP credentials are configured and provide a status message."""
    email = get_gmail_address()
    password = get_gmail_app_password()
    if email and password:
        return True, "SMTP credentials configured."
    return False, "Missing Gmail credentials. Update your .env file with GMAIL_ADDRESS and GMAIL_APP_PASSWORD."


def render_credentials_status() -> None:
    """Display SMTP config status in the UI."""
    ready, message = credentials_status()
    st.sidebar.markdown("### SMTP Status")
    if ready:
        st.sidebar.success(message)
    else:
        st.sidebar.warning(message)


def render_upload_and_preview() -> None:
    """Render the file upload section and worksheet preview."""
    uploaded_file = st.file_uploader(
        "Upload Excel file (.xlsx or .xls)",
        type=["xlsx", "xls"],
        accept_multiple_files=False,
    )

    if uploaded_file is None:
        st.info("Please upload an Excel workbook to begin.")
        return

    st.session_state.uploaded_file = uploaded_file
    st.session_state.file_path = get_uploaded_file_path(uploaded_file)

    try:
        workbook, first_sheet_preview = load_excel_file(st.session_state.file_path)
        st.session_state.sheet_names = workbook.sheet_names
        st.session_state.selected_sheet = st.session_state.selected_sheet or workbook.sheet_names[0]
    except ExcelLoadError as exc:
        st.error(str(exc))
        return

    st.subheader("Worksheet Selection")
    sheet_choice = st.selectbox("Select worksheet", options=st.session_state.sheet_names, index=0)
    st.session_state.selected_sheet = sheet_choice

    try:
        df = get_sheet_data(st.session_state.file_path, sheet_choice)
        st.session_state.sheet_df = df
        st.session_state.preview_df = get_preview_rows(df, n=5)
    except ExcelLoadError as exc:
        st.error(str(exc))
        return

    if st.session_state.preview_df.empty:
        st.warning("The selected worksheet is empty. Please choose another sheet or provide data.")
        return

    st.subheader("Preview (first 5 rows)")
    st.dataframe(st.session_state.preview_df, use_container_width=True, hide_index=True)

    columns = list(st.session_state.sheet_df.columns)
    if not columns:
        st.error("No columns were detected in the selected worksheet.")
        return

    st.write("### Available columns")
    st.code(", ".join(columns))


def render_column_selection() -> None:
    """Render email and name column selector controls."""
    if st.session_state.sheet_df is None:
        return

    columns = list(st.session_state.sheet_df.columns)
    st.subheader("Choose recipient columns")

    email_col = st.selectbox("Email Address Column", options=columns, index=0 if columns else None)
    name_col = st.selectbox("Participant Name Column (optional)", options=["No name column", *columns], index=0)
    st.session_state.email_column = email_col
    st.session_state.name_column = None if name_col == "No name column" else name_col

    if st.button("Validate recipients"):
        reset_campaign_state()
        try:
            validation = validate_participant_emails(
                st.session_state.sheet_df,
                email_column=email_col,
                name_column=st.session_state.name_column,
            )
            st.session_state.validation_result = validation
            st.session_state.valid_recipients = [
                {
                    "email": item["email"],
                    "name": item.get("name") or "Participant",
                    "excel_row": item.get("excel_row"),
                }
                for item in validation.valid_recipients
            ]
        except Exception as exc:  # pragma: no cover - defensive UI validation
            st.error(f"Validation failed: {exc}")
            return

        metrics = {
            "Total records": validation.total_records,
            "Valid email addresses": validation.valid_count,
            "Invalid email addresses": validation.invalid_count,
            "Duplicate email addresses": validation.duplicate_count,
            "Empty email entries": validation.empty_count,
        }

        st.session_state.campaign_summary = metrics
        st.subheader("Validation Summary")
        cols = st.columns(5)
        for col, (label, value) in zip(cols, metrics.items()):
            col.metric(label, value)

        if validation.valid_recipients:
            preview_df = pd.DataFrame(validation.valid_recipients)
            st.write("### Valid recipients preview")
            st.dataframe(preview_df, use_container_width=True, hide_index=True)
        else:
            st.warning("No valid recipient addresses were found after validation.")

        if validation.invalid_emails or validation.duplicate_emails or validation.empty_emails:
            invalid_df = pd.DataFrame([
                {
                    "excel_row": item.get("excel_row"),
                    "email": item.get("email"),
                    "name": item.get("name"),
                    "reason": item.get("reason"),
                }
                for item in validation.invalid_emails + validation.duplicate_emails + validation.empty_emails
            ])
            st.write("### Validation issues")
            st.dataframe(invalid_df, use_container_width=True, hide_index=True)


def render_email_preview() -> None:
    """Render the HTML email preview and campaign controls."""
    if not st.session_state.validation_result:
        return

    total_valid = st.session_state.validation_result.valid_count
    if total_valid == 0:
        st.warning("There are no valid recipients to send to.")
        return

    st.subheader("Email Preview")
    st.write(f"Subject: {get_email_subject()}")
    participant_name = st.session_state.valid_recipients[0].get("name") or "Participant"
    preview_html = build_email_html(participant_name)
    st.components.v1.html(preview_html, height=780, scrolling=True)

    with st.form("test_email_form"):
        recipient_email = st.text_input("Send a test email to your own address", value=get_gmail_address())
        submitted = st.form_submit_button("Send Test Email")
        if submitted:
            try:
                result = send_test_email(recipient_email, participant_name)
                st.success(result)
            except (SMTPConfigurationError, SMTPConnectionError) as exc:
                st.error(str(exc))

    if st.session_state.valid_recipients and len(st.session_state.valid_recipients) <= SAFE_BATCH_MAX_RECIPIENTS:
        st.info("Safe small-batch mode is enabled for testing. This app will default to a very small recipient count to reduce Gmail filtering risk.")

        max_recipient_count = st.number_input(
            "Maximum recipients for this campaign",
            min_value=1,
            max_value=min(len(st.session_state.valid_recipients), SAFE_BATCH_MAX_RECIPIENTS),
            value=min(len(st.session_state.valid_recipients), SAFE_BATCH_MAX_RECIPIENTS),
        )
        delay_seconds = st.slider("Delay between emails (seconds)", min_value=1, max_value=15, value=SAFE_BATCH_DELAY_SECONDS)
    else:
        max_recipient_count = st.number_input(
            "Maximum recipients for this campaign",
            min_value=1,
            max_value=max(len(st.session_state.valid_recipients), 1),
            value=min(len(st.session_state.valid_recipients), MAX_RECIPIENT_LIMIT_DEFAULT),
        )
        delay_seconds = st.slider("Delay between emails (seconds)", min_value=0, max_value=10, value=DEFAULT_DELAY_SECONDS)

    allowed_recipients = st.session_state.valid_recipients[:max_recipient_count]
    st.info(f"Final recipient count: {len(allowed_recipients)}")

    st.session_state.valid_recipients = allowed_recipients
    st.session_state.report_rows = build_initial_report(allowed_recipients)

    confirm = st.checkbox("I confirm that I want to proceed with sending to the selected recipients.")
    send_button = st.button("Send Campaign", type="primary")
    if send_button and not confirm:
        st.warning("Please confirm the campaign before sending.")
    elif send_button and confirm:
        run_campaign(allowed_recipients, delay_seconds)


def run_campaign(recipients: list[dict], delay_seconds: int) -> None:
    """Run the bulk sending process with progress updates and safe stop handling."""
    sender_email = get_gmail_address()
    password = get_gmail_app_password()

    if not sender_email or not password:
        st.error("SMTP credentials are missing. Please configure your Gmail App Password in the .env file before sending.")
        return

    total = len(recipients)
    if total == 0:
        st.warning("There are no recipients available to send to.")
        return

    st.session_state.sending_active = True
    st.session_state.stop_requested = False
    st.session_state.campaign_started_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    progress_bar = st.progress(0.0)
    status_text = st.empty()
    sent_count = 0
    failed_count = 0
    pending = total

    for index, recipient in enumerate(recipients, start=1):
        if st.session_state.stop_requested:
            status_text.warning("Sending stopped by the user. Remaining recipients are marked as pending.")
            break

        email = recipient["email"]
        name = recipient.get("name") or "Participant"
        status_text.write(f"Sending to {email} ({index}/{total})")
        progress_value = index / total
        progress_bar.progress(progress_value)

        try:
            send_campaign_email(email, name, sender_email, password)
            status = "success"
            error_message = ""
            sent_count += 1
            pending -= 1
            LOGGER.info("Successfully submitted email to %s", email)
        except (SMTPConnectionError, SMTPConfigurationError) as exc:
            status = "failed"
            error_message = str(exc)
            failed_count += 1
            pending -= 1
            LOGGER.warning("Failed email submission for %s: %s", email, exc)

        update_report_status(st.session_state.report_rows, email, status, error_message)

        if delay_seconds > 0 and index < total and not st.session_state.stop_requested:
            time.sleep(delay_seconds)

    st.session_state.campaign_completed_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    st.session_state.sending_active = False

    completed_summary = {
        "total_recipients": total,
        "successful_submissions": sent_count,
        "failed_attempts": failed_count,
        "pending_recipients": pending,
        "campaign_start_time": st.session_state.campaign_started_at,
        "campaign_completion_time": st.session_state.campaign_completed_at,
    }
    st.session_state.campaign_summary = completed_summary

    st.success("Campaign processing complete.")
    st.write(f"Total recipients: {total}")
    st.write(f"Successfully submitted to SMTP: {sent_count}")
    st.write(f"Failed attempts: {failed_count}")
    st.write(f"Pending recipients: {pending}")

    with st.container():
        st.subheader("Campaign Report")
        report_df = pd.DataFrame(st.session_state.report_rows)
        st.dataframe(report_df, use_container_width=True, hide_index=True)

        excel_path, csv_path = export_campaign_report(st.session_state.report_rows, campaign_name="automate_campus_quest")
        st.download_button(
            label="Download Excel report",
            data=open(excel_path, "rb").read(),
            file_name=excel_path.name,
            mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        st.download_button(
            label="Download CSV report",
            data=open(csv_path, "rb").read(),
            file_name=csv_path.name,
            mime="text/csv",
        )


def render_stop_control() -> None:
    """Render the safe stop button while sending."""
    if st.session_state.sending_active:
        if st.button("Stop Sending", type="secondary"):
            st.session_state.stop_requested = True
            st.warning("Stopping the campaign after the current SMTP operation completes.")


def test_smtp_connection() -> None:
    """Attempt a lightweight Gmail SMTP handshake without sending messages."""
    sender_email = get_gmail_address()
    password = get_gmail_app_password()
    if not sender_email or not password:
        st.error("Missing Gmail credentials. Configure the .env file before testing the connection.")
        return

    try:
        import smtplib
        import ssl

        with smtplib.SMTP("smtp.gmail.com", 587, timeout=30) as server:
            server.starttls(context=ssl.create_default_context())
            server.login(sender_email, password)
        st.success("SMTP connection succeeded. Gmail credentials are valid and ready to use.")
    except Exception as exc:  # pragma: no cover - depends on live environment
        st.error(f"SMTP connection failed: {exc}")


def main() -> None:
    """Run the Streamlit application."""
    st.set_page_config(page_title="UiPath Campus Quest Email Campaign Manager", page_icon="📧", layout="wide")
    init_session_state()

    st.title("UiPath Automate Campus Quest – Email Campaign Manager")
    st.caption("Send personalized bulk emails to registered participants safely and professionally.")

    with st.sidebar:
        render_credentials_status()
        if st.button("Test SMTP Connection"):
            test_smtp_connection()

    render_upload_and_preview()
    render_column_selection()
    render_email_preview()
    render_stop_control()


if __name__ == "__main__":
    main()
