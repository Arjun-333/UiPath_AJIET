from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

import pandas as pd

LOGGER = logging.getLogger(__name__)


class ExcelLoadError(ValueError):
    """Raised when an uploaded Excel file cannot be parsed safely."""


def load_excel_file(file_path: str | Path) -> tuple[pd.ExcelFile, pd.DataFrame | None]:
    """Load workbook and return workbook object plus first worksheet data preview."""
    path = Path(file_path)
    if not path.exists():
        raise ExcelLoadError(f"The Excel file does not exist: {path}")

    if path.suffix.lower() not in {".xlsx", ".xls"}:
        raise ExcelLoadError("Unsupported file type. Please upload an Excel file (.xlsx or .xls).")

    try:
        workbook = pd.ExcelFile(path)
        sheet_names = workbook.sheet_names
        if not sheet_names:
            raise ExcelLoadError("The Excel file does not contain any worksheets.")

        first_sheet = sheet_names[0]
        preview_df = pd.read_excel(path, sheet_name=first_sheet)
        return workbook, preview_df
    except Exception as exc:  # pragma: no cover - exercised by API-level validation
        LOGGER.exception("Failed to read Excel workbook %s", path)
        raise ExcelLoadError(f"Unable to read the Excel file: {exc}") from exc


def get_sheet_data(file_path: str | Path, sheet_name: str) -> pd.DataFrame:
    """Load a single worksheet as a DataFrame."""
    path = Path(file_path)
    try:
        df = pd.read_excel(path, sheet_name=sheet_name)
        if df.empty:
            raise ExcelLoadError(f"Worksheet '{sheet_name}' is empty.")
        return df
    except ValueError as exc:
        raise ExcelLoadError(f"Sheet '{sheet_name}' could not be loaded: {exc}") from exc
    except Exception as exc:  # pragma: no cover
        LOGGER.exception("Failed to load worksheet %s from %s", sheet_name, path)
        raise ExcelLoadError(f"Unable to load worksheet '{sheet_name}': {exc}") from exc


def get_preview_rows(df: pd.DataFrame, n: int = 5) -> pd.DataFrame:
    """Return the first n rows of the DataFrame for preview."""
    return df.head(n).copy()


def ensure_required_columns(df: pd.DataFrame, required_columns: list[str]) -> None:
    """Validate that required columns exist in the DataFrame."""
    missing = [col for col in required_columns if col not in df.columns]
    if missing:
        raise ExcelLoadError(f"Missing required column(s): {', '.join(missing)}")
