"""Generate sample CSV data for testing the ingestion pipeline.

Usage:
    python scripts/seed_sample_data.py
    python scripts/seed_sample_data.py --output data/samples/sample_listings.csv
"""

import csv
from pathlib import Path

import click

SAMPLE_LISTINGS = [
    {
        "source_group": "BDS Nha Trang 24/7",
        "sender_name": "Nguyen Van A",
        "message_text": (
            "Bán nhà mặt tiền đường Trần Phú, phường Lộc Thọ, "
            "3 tầng 4 phòng ngủ, diện tích 5x20m, giá 8.5 tỷ. "
            "Liên hệ: 0901234567"
        ),
        "message_date": "2025-01-15T10:30:00",
        "source": "zalo_manual",
    },
    {
        "source_group": "BDS Nha Trang 24/7",
        "sender_name": "Tran Thi B",
        "message_text": (
            "Cần bán gấp đất nền Vĩnh Hòa, diện tích 100m2, "
            "mặt tiền 5m, giá 2.3 tỷ thương lượng. LH: 0912345678"
        ),
        "message_date": "2025-01-15T11:45:00",
        "source": "zalo_manual",
    },
    {
        "source_group": "Mua Ban BDS Nha Trang",
        "sender_name": "Le Van C",
        "message_text": (
            "Cho thuê căn hộ chung cư Mường Thanh, 2 phòng ngủ, "
            "view biển, đầy đủ nội thất, giá 8 triệu/tháng. "
            "Phường Phước Hải. LH 0923456789"
        ),
        "message_date": "2025-01-16T09:00:00",
        "source": "zalo_manual",
    },
    {
        "source_group": "Mua Ban BDS Nha Trang",
        "sender_name": "Pham Van D",
        "message_text": (
            "Bán biệt thự đường Nguyễn Thiện Thuật, phường Tân Lập. "
            "DT 10x25m, 3 tầng 5PN, sân vườn rộng. Giá 15 tỷ."
        ),
        "message_date": "2025-01-16T14:20:00",
        "source": "zalo_manual",
    },
    {
        "source_group": "BDS Nha Trang 24/7",
        "sender_name": "Hoang Thi E",
        "message_text": (
            "Cần cho thuê mặt bằng kinh doanh đường Yersin, "
            "phường Phương Sài, 80m2, ngang 8m. Giá 25 triệu/tháng."
        ),
        "message_date": "2025-01-17T08:15:00",
        "source": "zalo_manual",
    },
    {
        "source_group": "BDS Nha Trang VIP",
        "sender_name": "Do Van F",
        "message_text": (
            "Bán nhà cấp 4 đường Ngô Đến, phường Vạn Thắng. "
            "DT 4x15m, 2 phòng ngủ. Giá chỉ 1.8 tỷ. Sổ hồng chính chủ."
        ),
        "message_date": "2025-01-17T16:30:00",
        "source": "zalo_manual",
    },
    {
        "source_group": "BDS Nha Trang VIP",
        "sender_name": "Vu Thi G",
        "message_text": (
            "Cho thuê phòng trọ gần biển, phường Vĩnh Nguyên. "
            "Phòng rộng 25m2, có máy lạnh. Giá 3.5 triệu/tháng."
        ),
        "message_date": "2025-01-18T07:45:00",
        "source": "zalo_manual",
    },
    {
        "source_group": "BDS Nha Trang 24/7",
        "sender_name": "Bui Van H",
        "message_text": (
            "Bán khách sạn 20 phòng đường Hùng Vương, phường Lộc Thọ. "
            "DT 8x20m, 5 tầng. Giá 28 tỷ. Đang kinh doanh tốt."
        ),
        "message_date": "2025-01-18T10:00:00",
        "source": "zalo_manual",
    },
]

CSV_COLUMNS = ["source_group", "sender_name", "message_text", "message_date", "source"]


@click.command()
@click.option(
    "--output",
    "-o",
    type=click.Path(path_type=Path),
    default="data/samples/sample_listings.csv",
    help="Output CSV file path.",
)
def main(output: Path) -> None:
    """Generate a sample CSV file with Vietnamese real estate listings."""
    output.parent.mkdir(parents=True, exist_ok=True)

    with open(output, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_COLUMNS)
        writer.writeheader()
        writer.writerows(SAMPLE_LISTINGS)

    click.echo(f"Created {len(SAMPLE_LISTINGS)} sample listings in {output}")


if __name__ == "__main__":
    main()
