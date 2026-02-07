"""Tests for the Zalo chat export transformer."""

from pathlib import Path

from src.ingestion.zalo_transformer import (
    _parse_short_date_text,
    detect_message_boundaries,
    transform_chat_export,
    transform_raw_text,
)


class TestDetectMessageBoundaries:
    def test_timestamp_boundaries(self):
        text = (
            "[10:30 15/01/2025] Nguyen Van A: Bán nhà 3 tầng\n"
            "[11:45 15/01/2025] Tran Thi B: Cho thuê căn hộ"
        )
        messages = detect_message_boundaries(text)
        assert len(messages) == 2

    def test_single_message(self):
        text = "Bán nhà 3 tầng phường Lộc Thọ giá 5 tỷ"
        messages = detect_message_boundaries(text)
        assert len(messages) == 1
        assert "Bán nhà" in messages[0]

    def test_empty_text(self):
        assert detect_message_boundaries("") == []
        assert detect_message_boundaries("   ") == []

    def test_multiline_message(self):
        text = (
            "[10:30 15/01/2025] Nguyen Van A: Bán nhà 3 tầng\n"
            "Giá 5 tỷ thương lượng\n"
            "Liên hệ 0901234567\n"
            "[11:45 15/01/2025] Tran Thi B: Cho thuê căn hộ"
        )
        messages = detect_message_boundaries(text)
        assert len(messages) == 2
        assert "Liên hệ" in messages[0]


class TestTransformRawText:
    def test_zalo_export_format(self):
        text = (
            "[10:30 15/01/2025] Nguyen Van A: Bán nhà 3 tầng giá 5 tỷ\n"
            "[11:45 15/01/2025] Tran Thi B: Cho thuê căn hộ 8 triệu"
        )
        records = transform_raw_text(text, source_group="Test Group")
        assert len(records) == 2
        assert records[0]["sender_name"] == "Nguyen Van A"
        assert records[0]["source_group"] == "Test Group"
        assert records[0]["source"] == "zalo_manual"
        assert "Bán nhà" in records[0]["message_text"]

    def test_raw_text_fallback(self):
        text = "Bán nhà 3 tầng phường Lộc Thọ giá 5 tỷ"
        records = transform_raw_text(text, source_group="BDS Group")
        assert len(records) == 1
        assert records[0]["source_group"] == "BDS Group"
        assert records[0]["sender_name"] == ""

    def test_empty_text(self):
        records = transform_raw_text("", source_group="Test")
        assert len(records) == 0


class TestParseShortDateText:
    def test_single_message(self):
        text = "jan 4\n\nBán nhà 3 tầng giá 5 tỷ\nLiên hệ 0901234567\n"
        records = _parse_short_date_text(text, "Test Group", year=2026)
        assert len(records) == 1
        assert records[0]["message_date"] == "2026-01-04T00:00:00"
        assert "Bán nhà" in records[0]["message_text"]
        assert records[0]["source_group"] == "Test Group"
        assert records[0]["sender_name"] == ""

    def test_multiple_messages(self):
        text = (
            "feb 4\n\nNhà đẹp 100m² giá 9.4 tỷ\n\n\n"
            "jan 30\n\nĐất nền 95m² giá 4.9 tỷ\n"
        )
        records = _parse_short_date_text(text, "BDS", year=2026)
        assert len(records) == 2
        assert records[0]["message_date"] == "2026-02-04T00:00:00"
        assert records[1]["message_date"] == "2026-01-30T00:00:00"

    def test_no_short_dates(self):
        text = "Bán nhà 3 tầng giá 5 tỷ\nLiên hệ 0901234567"
        records = _parse_short_date_text(text, "Test", year=2026)
        assert len(records) == 0

    def test_case_insensitive(self):
        text = "JAN 15\n\nNhà đẹp giá tốt\n"
        records = _parse_short_date_text(text, "", year=2026)
        assert len(records) == 1
        assert records[0]["message_date"] == "2026-01-15T00:00:00"

    def test_multiline_message_body(self):
        text = (
            "jan 5\n\n"
            "SIÊU PHẨM! NHÀ 5 TẦNG\n"
            "📐 Diện tích 58m²\n"
            "💰 Giá bán: 9 TỶ\n"
            "☎️ 0868.33.1111\n"
        )
        records = _parse_short_date_text(text, "Dean", year=2026)
        assert len(records) == 1
        assert "SIÊU PHẨM" in records[0]["message_text"]
        assert "0868.33.1111" in records[0]["message_text"]

    def test_default_year(self):
        text = "mar 1\n\nTest message\n"
        records = _parse_short_date_text(text, "")
        assert len(records) == 1
        # Should use current year (2026)
        assert "2026-03-01" in records[0]["message_date"]


class TestTransformRawTextShortDate:
    def test_short_date_format_detected(self):
        text = "jan 10\n\nBán nhà giá 5 tỷ\n\njan 9\n\nĐất nền 4 tỷ\n"
        records = transform_raw_text(text, "Group", year=2026)
        assert len(records) == 2
        assert records[0]["message_date"] == "2026-01-10T00:00:00"

    def test_zalo_export_takes_priority(self):
        text = "[10:30 15/01/2025] Nguyen Van A: Bán nhà 3 tầng giá 5 tỷ\n"
        records = transform_raw_text(text, "Test", year=2026)
        assert len(records) == 1
        assert records[0]["sender_name"] == "Nguyen Van A"


class TestTransformChatExport:
    def test_export_file(self, tmp_path: Path):
        input_file = tmp_path / "export.txt"
        output_file = tmp_path / "output.csv"

        input_file.write_text(
            "[10:30 15/01/2025] Nguyen Van A: Bán nhà 3 tầng giá 5 tỷ\n"
            "[11:45 15/01/2025] Tran Thi B: Cho thuê căn hộ 8 triệu\n",
            encoding="utf-8",
        )

        count = transform_chat_export(input_file, output_file, source_group="Test Group")
        assert count == 2
        assert output_file.exists()

        # Verify CSV content
        import csv

        with open(output_file, encoding="utf-8") as f:
            reader = csv.DictReader(f)
            rows = list(reader)

        assert len(rows) == 2
        assert rows[0]["sender_name"] == "Nguyen Van A"
        assert rows[1]["sender_name"] == "Tran Thi B"
        assert rows[0]["message_date"] == "2025-01-15T10:30:00"
