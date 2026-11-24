from __future__ import annotations

from html import escape


TEMPLATE_SUBJECT = "Action Required: Project reminder for Automate Campus Quest"


def sanitize_name(name: str | None) -> str:
    """Trim and escape a participant name before inserting it into HTML."""
    if not name:
        return "Participant"
    cleaned = str(name).strip()
    return escape(cleaned) if cleaned else "Participant"


def build_email_html(participant_name: str | None) -> str:
    """Generate the HTML email body for the campaign."""
    greeting_name = sanitize_name(participant_name)

    return f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Automate Campus Quest Reminder</title>
    </head>
    <body style="margin:0; padding:0; background-color:#f4f4f4; font-family:Arial, Helvetica, sans-serif; color:#2d2d2d;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f4f4f4; margin:0; padding:0;">
        <tr>
          <td align="center" style="padding:30px 12px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:620px; background-color:#ffffff; border:1px solid #e6e6e6; border-radius:8px; overflow:hidden;">
              <tr>
                <td style="padding:18px 24px; border-bottom:1px solid #efefef; background:#ffffff;">
                  <div style="font-size:20px; font-weight:bold; color:#2b2b2b;">UiPath Community AJIET</div>
                  <div style="font-size:12px; color:#666666; letter-spacing:0.5px; margin-top:4px;">AUTOMATE CAMPUS QUEST</div>
                </td>
              </tr>

              <tr>
                <td style="padding:28px 24px 10px; font-size:15px; line-height:1.8; color:#2f2f2f;">
                  Hi {greeting_name},<br /><br />
                  I hope you are doing well.<br /><br />
                  This is a quick reminder about the Automate Campus Quest project submission. Thank you for registering for the challenge.
                  <br /><br />
                  <strong>Action Required:</strong> Please complete and submit your project before <strong>22 November 2026</strong>.
                </td>
              </tr>

              <tr>
                <td style="padding:8px 24px 0;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fafafa; border:1px solid #ececec; border-radius:6px;">
                    <tr>
                      <td style="padding:14px 16px; font-size:14px; line-height:1.7; color:#2f2f2f;">
                        <strong>Project guide:</strong><br />
                        <a href="https://drive.google.com/drive/folders/19vkCF3ZTlLw0sig-8N9oYnHpai9KIHdK?usp=sharing" style="color:#1a73e8; text-decoration:none;">Google Drive Folder</a>
                        <br /><br />
                        <strong>Submission page:</strong><br />
                        <a href="https://community.uipath.com/events/details/uipath-global-student-developer-presents-automate-campus-quest/" style="color:#1a73e8; text-decoration:none;">UiPath Campus Quest Submission</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td style="padding:22px 24px 10px; font-size:15px; line-height:1.8; color:#2f2f2f;">
                  If you need help with the instructions, building the project, or the submission process, you can simply reply to this email and I’ll be happy to assist.
                </td>
              </tr>

              <tr>
                <td style="padding:10px 24px 24px; font-size:15px; line-height:1.8; color:#2f2f2f;">
                  Best regards,<br />
                  Arjun R.<br />
                  UiPath Student Developer Champion (SDC)<br />
                  UiPath Community – AJIET
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """


def get_email_subject() -> str:
    """Return the subject line."""
    return TEMPLATE_SUBJECT
