"""Transform raw Zalo chat exports into standardized CSV format.

Handles two input modes:
1. Zalo chat export files (structured text with timestamps and sender names)
2. Raw copy-pasted text blocks (continuous messages, heuristic splitting)
"""

import csv
import re
from datetime import datetime
from pathlib import Path

# Pattern for Zalo export format: "[HH:MM DD/MM/YYYY] Sender Name: message"
ZALO_EXPORT_PATTERN = re.compile(
    r"\[(\d{1,2}:\d{2})\s+(\d{1,2}/\d{1,2}/\d{4})\]\s+([^:]+?):\s*(.*)",
    re.DOTALL,
)

# Pattern for detecting message boundaries in raw pasted text.
# Matches lines that start with a name-like pattern followed by a colon,
# or lines that start with a timestamp.
MESSAGE_BOUNDARY_PATTERN = re.compile(
    r"^(?:"
    r"\[?\d{1,2}[:/]\d{2}(?:\s+\d{1,2}/\d{1,2}/\d{4})?\]?\s+"  # timestamp prefix
    r"|[A-Z\u00C0-\u024F][a-z\u00E0-\u01FF]+"
    r"(?:\s+[A-Z\u00C0-\u024F][a-z\u00E0-\u01FF]+){1,4}:\s"  # "Name Name: "
    r")",
    re.MULTILINE,
)

CSV_COLUMNS = ["source_group", "sender_name", "message_text", "message_date", "source"]


def detect_message_boundaries(text: str) -> list[str]:
    """Split continuous text into individual messages using heuristics.

    Looks for patterns like timestamps or "Name: message" to identify
    where one message ends and another begins.

    Args:
        text: Raw continuous text, possibly multiple messages concatenated.

    Returns:
        List of individual message strings.
    """
    lines = text.strip().split("\n")
    if not lines:
        return []

    messages: list[str] = []
    current_lines: list[str] = []

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        if MESSAGE_BOUNDARY_PATTERN.match(stripped) and current_lines:
            messages.append("\n".join(current_lines))
            current_lines = [stripped]
        else:
            current_lines.append(stripped)

    if current_lines:
        messages.append("\n".join(current_lines))

    return messages


def _parse_zalo_export_message(line: str) -> dict | None:
    """Parse a single line from a Zalo chat export file.

    Args:
        line: A line in format "[HH:MM DD/MM/YYYY] Sender: message text"

    Returns:
        Dict with sender_name, message_text, message_date or None if no match.
    """
    match = ZALO_EXPORT_PATTERN.match(line.strip())
    if not match:
        return None

    time_str, date_str, sender, message = match.groups()
    try:
        dt = datetime.strptime(f"{date_str} {time_str}", "%d/%m/%Y %H:%M")
        message_date = dt.isoformat()
    except ValueError:
        message_date = ""

    return {
        "sender_name": sender.strip(),
        "message_text": message.strip(),
        "message_date": message_date,
    }


def transform_chat_export(input_path: Path, output_path: Path, source_group: str = "") -> int:
    """Convert a Zalo chat export file to standardized CSV.

    Args:
        input_path: Path to the raw Zalo export text file.
        output_path: Path where the CSV will be written.
        source_group: Name of the Zalo group (metadata).

    Returns:
        Number of messages written to CSV.
    """
    text = input_path.read_text(encoding="utf-8")
    records = _parse_export_text(text, source_group)
    return _write_csv(records, output_path)


def transform_raw_text(text: str, source_group: str = "") -> list[dict]:
    """Split raw pasted text into message records.

    Attempts Zalo export format first; falls back to boundary detection.

    Args:
        text: Raw text, either Zalo export format or copy-pasted messages.
        source_group: Name of the Zalo group (metadata).

    Returns:
        List of dicts with keys matching CSV_COLUMNS.
    """
    records = _parse_export_text(text, source_group)
    if records:
        return records

    # Fallback: heuristic message splitting
    messages = detect_message_boundaries(text)
    return [
        {
            "source_group": source_group,
            "sender_name": "",
            "message_text": msg,
            "message_date": "",
            "source": "zalo_manual",
        }
        for msg in messages
        if msg.strip()
    ]


def _parse_export_text(text: str, source_group: str) -> list[dict]:
    """Parse text assuming Zalo export format, return records if any match.

    Args:
        text: Text content to parse.
        source_group: Zalo group name metadata.

    Returns:
        List of record dicts, empty if text doesn't match export format.
    """
    records: list[dict] = []
    # Zalo exports may have multi-line messages; rejoin then split on timestamp lines
    lines = text.strip().split("\n")
    current_entry: list[str] = []

    for line in lines:
        if ZALO_EXPORT_PATTERN.match(line.strip()) and current_entry:
            entry_text = "\n".join(current_entry)
            parsed = _parse_zalo_export_message(entry_text)
            if parsed:
                parsed["source_group"] = source_group
                parsed["source"] = "zalo_manual"
                records.append(parsed)
            current_entry = [line]
        else:
            current_entry.append(line)

    # Process last entry
    if current_entry:
        entry_text = "\n".join(current_entry)
        parsed = _parse_zalo_export_message(entry_text)
        if parsed:
            parsed["source_group"] = source_group
            parsed["source"] = "zalo_manual"
            records.append(parsed)

    return records


def _write_csv(records: list[dict], output_path: Path) -> int:
    """Write records to a CSV file.

    Args:
        records: List of dicts with CSV_COLUMNS keys.
        output_path: Destination file path.

    Returns:
        Number of records written.
    """
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_COLUMNS)
        writer.writeheader()
        writer.writerows(records)
    return len(records)
