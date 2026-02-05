"""Load validated CSV files into the raw_listings database table."""

from datetime import datetime
from pathlib import Path

import pandas as pd
from sqlalchemy import text

from src.db.connection import get_engine, get_session

REQUIRED_COLUMNS = {"source_group", "sender_name", "message_text", "message_date", "source"}


def validate_csv(file_path: Path) -> tuple[bool, list[str]]:
    """Validate that a CSV file has the required structure.

    Args:
        file_path: Path to the CSV file to validate.

    Returns:
        Tuple of (is_valid, list of error messages).
    """
    errors: list[str] = []

    if not file_path.exists():
        return False, [f"File not found: {file_path}"]

    try:
        df = pd.read_csv(file_path, nrows=0, encoding="utf-8")
    except Exception as e:
        return False, [f"Failed to read CSV: {e}"]

    missing = REQUIRED_COLUMNS - set(df.columns)
    if missing:
        errors.append(f"Missing required columns: {', '.join(sorted(missing))}")

    if errors:
        return False, errors

    # Validate content
    try:
        df_full = pd.read_csv(file_path, encoding="utf-8")
    except Exception as e:
        return False, [f"Failed to read CSV content: {e}"]

    if df_full.empty:
        errors.append("CSV file is empty (no data rows)")

    empty_messages = df_full["message_text"].isna().sum()
    if empty_messages > 0:
        errors.append(f"{empty_messages} rows have empty message_text")

    return len(errors) == 0, errors


def load_csv_to_db(file_path: Path, batch_id: str, db_url: str) -> int:
    """Load CSV rows into the raw_listings table.

    Args:
        file_path: Path to the validated CSV file.
        batch_id: Identifier for this ingestion batch (e.g. Kestra execution ID).
        db_url: PostgreSQL connection string.

    Returns:
        Number of rows inserted.

    Raises:
        ValueError: If CSV validation fails.
    """
    is_valid, errors = validate_csv(file_path)
    if not is_valid:
        raise ValueError(f"CSV validation failed: {'; '.join(errors)}")

    df = pd.read_csv(file_path, encoding="utf-8")
    engine = get_engine(db_url)
    session = get_session(engine)

    try:
        row_count = 0
        for _, row in df.iterrows():
            message_date = _parse_date(row.get("message_date", ""))

            session.execute(
                text(
                    "INSERT INTO raw_listings "
                    "(source, source_group, sender_name, "
                    "message_text, message_date, batch_id) "
                    "VALUES (:source, :source_group, :sender_name, "
                    ":message_text, :message_date, :batch_id)"
                ),
                {
                    "source": row.get("source", "zalo_manual"),
                    "source_group": row.get("source_group", ""),
                    "sender_name": row.get("sender_name", ""),
                    "message_text": row["message_text"],
                    "message_date": message_date,
                    "batch_id": batch_id,
                },
            )
            row_count += 1

        session.commit()
        return row_count
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def _parse_date(date_str: str | float) -> datetime | None:
    """Parse a date string from CSV into a datetime object.

    Args:
        date_str: ISO format datetime string, or empty/NaN.

    Returns:
        Parsed datetime or None.
    """
    if not date_str or (isinstance(date_str, float) and pd.isna(date_str)):
        return None

    date_str = str(date_str).strip()
    if not date_str:
        return None

    for fmt in ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S", "%d/%m/%Y %H:%M"):
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            continue

    return None
