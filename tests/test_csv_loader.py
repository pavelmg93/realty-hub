"""Tests for the CSV loader module."""

import csv
from pathlib import Path

import pytest

from src.ingestion.csv_loader import validate_csv

VALID_COLUMNS = ["source_group", "sender_name", "message_text", "message_date", "source"]


@pytest.fixture()
def valid_csv(tmp_path: Path) -> Path:
    """Create a valid CSV file for testing."""
    csv_path = tmp_path / "valid.csv"
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=VALID_COLUMNS)
        writer.writeheader()
        writer.writerow(
            {
                "source_group": "Test Group",
                "sender_name": "Test User",
                "message_text": "Bán nhà 3 tầng giá 5 tỷ",
                "message_date": "2025-01-15T10:30:00",
                "source": "zalo_manual",
            }
        )
    return csv_path


@pytest.fixture()
def missing_columns_csv(tmp_path: Path) -> Path:
    """Create a CSV file with missing required columns."""
    csv_path = tmp_path / "missing_cols.csv"
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["source_group", "message_text"])
        writer.writeheader()
        writer.writerow(
            {
                "source_group": "Test Group",
                "message_text": "Some text",
            }
        )
    return csv_path


@pytest.fixture()
def empty_csv(tmp_path: Path) -> Path:
    """Create an empty CSV file (headers only)."""
    csv_path = tmp_path / "empty.csv"
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=VALID_COLUMNS)
        writer.writeheader()
    return csv_path


@pytest.fixture()
def empty_message_csv(tmp_path: Path) -> Path:
    """Create a CSV file with empty message_text."""
    csv_path = tmp_path / "empty_msg.csv"
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=VALID_COLUMNS)
        writer.writeheader()
        writer.writerow(
            {
                "source_group": "Test Group",
                "sender_name": "Test User",
                "message_text": "",
                "message_date": "2025-01-15T10:30:00",
                "source": "zalo_manual",
            }
        )
    return csv_path


class TestValidateCsv:
    def test_valid_csv(self, valid_csv: Path):
        is_valid, errors = validate_csv(valid_csv)
        assert is_valid is True
        assert errors == []

    def test_file_not_found(self, tmp_path: Path):
        is_valid, errors = validate_csv(tmp_path / "nonexistent.csv")
        assert is_valid is False
        assert any("not found" in e.lower() for e in errors)

    def test_missing_columns(self, missing_columns_csv: Path):
        is_valid, errors = validate_csv(missing_columns_csv)
        assert is_valid is False
        assert any("missing" in e.lower() for e in errors)

    def test_empty_csv(self, empty_csv: Path):
        is_valid, errors = validate_csv(empty_csv)
        assert is_valid is False
        assert any("empty" in e.lower() for e in errors)
