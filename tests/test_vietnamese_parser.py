"""Tests for the Vietnamese real estate listing parser."""

from src.parsing.vietnamese_parser import (
    extract_area,
    extract_bedrooms,
    extract_floors,
    extract_frontage,
    extract_location,
    extract_price,
    extract_property_type,
    extract_transaction_type,
    parse_listing,
)


# ---------------------------------------------------------------------------
# Price extraction
# ---------------------------------------------------------------------------
class TestExtractPrice:
    def test_price_ty(self):
        raw, vnd = extract_price("Giá 3.5 tỷ")
        assert raw is not None
        assert vnd == 3_500_000_000

    def test_price_ty_comma(self):
        raw, vnd = extract_price("giá 2,5 tỷ thương lượng")
        assert vnd == 2_500_000_000

    def test_price_trieu(self):
        raw, vnd = extract_price("giá 350 triệu")
        assert vnd == 350_000_000

    def test_price_tr_abbreviation(self):
        raw, vnd = extract_price("giá 8 tr/tháng")
        assert vnd == 8_000_000

    def test_price_t_abbreviation(self):
        raw, vnd = extract_price("giá 3.5t")
        assert vnd == 3_500_000_000

    def test_price_integer_ty(self):
        raw, vnd = extract_price("Giá 15 tỷ")
        assert vnd == 15_000_000_000

    def test_no_price(self):
        raw, vnd = extract_price("Nhà đẹp gần biển")
        assert raw is None
        assert vnd is None


# ---------------------------------------------------------------------------
# Area extraction
# ---------------------------------------------------------------------------
class TestExtractArea:
    def test_area_m2(self):
        assert extract_area("diện tích 100m2") == 100.0

    def test_area_m2_with_space(self):
        assert extract_area("diện tích 100 m2") == 100.0

    def test_area_dimensions(self):
        assert extract_area("DT 5x20m") == 100.0

    def test_area_dimensions_with_spaces(self):
        assert extract_area("5 x 20") == 100.0

    def test_area_decimal(self):
        assert extract_area("diện tích 85.5m2") == 85.5

    def test_no_area(self):
        assert extract_area("Nhà đẹp giá tốt") is None


# ---------------------------------------------------------------------------
# Location extraction
# ---------------------------------------------------------------------------
class TestExtractLocation:
    def test_ward(self):
        loc = extract_location("phường Lộc Thọ, Nha Trang")
        assert loc["ward"] == "Lộc Thọ"

    def test_street(self):
        loc = extract_location("đường Trần Phú, phường Lộc Thọ")
        assert loc["street"] == "Trần Phú"
        assert loc["ward"] == "Lộc Thọ"

    def test_district(self):
        loc = extract_location("quận Ninh Kiều, Cần Thơ")
        assert loc["district"] == "Ninh Kiều"

    def test_nha_trang_ward_by_name(self):
        loc = extract_location("Nhà gần biển Vĩnh Hòa")
        assert loc["ward"] == "Vĩnh Hòa"

    def test_no_location(self):
        loc = extract_location("Bán nhà đẹp giá tốt")
        assert loc["ward"] is None
        assert loc["street"] is None
        assert loc["district"] is None


# ---------------------------------------------------------------------------
# Property type extraction
# ---------------------------------------------------------------------------
class TestExtractPropertyType:
    def test_nha(self):
        assert extract_property_type("Bán nhà phố 3 tầng") == "nha"

    def test_dat(self):
        assert extract_property_type("Bán đất nền 100m2") == "dat"

    def test_can_ho(self):
        assert extract_property_type("Cho thuê căn hộ chung cư") == "can_ho"

    def test_phong_tro(self):
        assert extract_property_type("Cho thuê phòng trọ giá rẻ") == "phong_tro"

    def test_biet_thu(self):
        assert extract_property_type("Bán biệt thự view biển") == "biet_thu"

    def test_khach_san(self):
        assert extract_property_type("Bán khách sạn 20 phòng") == "khach_san"

    def test_mat_bang(self):
        assert extract_property_type("Cho thuê mặt bằng kinh doanh") == "mat_bang"

    def test_unknown(self):
        assert extract_property_type("Liên hệ 0901234567") is None


# ---------------------------------------------------------------------------
# Transaction type extraction
# ---------------------------------------------------------------------------
class TestExtractTransactionType:
    def test_ban(self):
        assert extract_transaction_type("Bán nhà 3 tầng") == "ban"

    def test_can_ban(self):
        assert extract_transaction_type("Cần bán gấp đất nền") == "ban"

    def test_cho_thue(self):
        assert extract_transaction_type("Cho thuê căn hộ") == "cho_thue"

    def test_no_ascii(self):
        assert extract_transaction_type("ban gap nha") == "ban"

    def test_unknown(self):
        assert extract_transaction_type("Liên hệ 0901234567") is None


# ---------------------------------------------------------------------------
# Bedroom extraction
# ---------------------------------------------------------------------------
class TestExtractBedrooms:
    def test_phong_ngu(self):
        assert extract_bedrooms("3 phòng ngủ") == 3

    def test_pn_abbreviation(self):
        assert extract_bedrooms("5PN, sân vườn") == 5

    def test_no_bedrooms(self):
        assert extract_bedrooms("Đất nền 100m2") is None


# ---------------------------------------------------------------------------
# Floor extraction
# ---------------------------------------------------------------------------
class TestExtractFloors:
    def test_tang(self):
        assert extract_floors("nhà 3 tầng") == 3

    def test_lau(self):
        assert extract_floors("nhà 2 lầu") == 2

    def test_no_floors(self):
        assert extract_floors("Đất nền 100m2") is None


# ---------------------------------------------------------------------------
# Frontage extraction
# ---------------------------------------------------------------------------
class TestExtractFrontage:
    def test_mat_tien(self):
        assert extract_frontage("mặt tiền 5m") == 5.0

    def test_ngang(self):
        assert extract_frontage("ngang 4.5m") == 4.5

    def test_no_frontage(self):
        assert extract_frontage("Nhà 3 tầng") is None


# ---------------------------------------------------------------------------
# Full parse_listing integration
# ---------------------------------------------------------------------------
class TestParseListing:
    def test_full_listing(self):
        text = (
            "Bán nhà mặt tiền đường Trần Phú, phường Lộc Thọ, "
            "3 tầng 4 phòng ngủ, diện tích 5x20m, giá 8.5 tỷ."
        )
        result = parse_listing(text)
        assert result.property_type == "nha"
        assert result.transaction_type == "ban"
        assert result.price_vnd == 8_500_000_000
        assert result.area_m2 == 100.0
        assert result.ward == "Lộc Thọ"
        assert result.street == "Trần Phú"
        assert result.num_bedrooms == 4
        assert result.num_floors == 3
        assert result.confidence == 1.0

    def test_rental_listing(self):
        text = (
            "Cho thuê căn hộ chung cư Mường Thanh, 2 phòng ngủ, "
            "view biển, giá 8 triệu/tháng. Phường Phước Hải."
        )
        result = parse_listing(text)
        assert result.property_type == "can_ho"
        assert result.transaction_type == "cho_thue"
        assert result.price_vnd == 8_000_000
        assert result.num_bedrooms == 2
        assert result.ward == "Phước Hải"

    def test_land_listing(self):
        text = "Cần bán gấp đất nền Vĩnh Hòa, diện tích 100m2, giá 2.3 tỷ"
        result = parse_listing(text)
        assert result.property_type == "dat"
        assert result.transaction_type == "ban"
        assert result.price_vnd == 2_300_000_000
        assert result.area_m2 == 100.0
        assert result.ward == "Vĩnh Hòa"

    def test_minimal_listing(self):
        text = "Liên hệ 0901234567 để biết thêm chi tiết"
        result = parse_listing(text)
        assert result.confidence == 0.0
        assert len(result.parse_errors) > 0

    def test_confidence_partial(self):
        text = "Bán nhà 3 tầng"
        result = parse_listing(text)
        assert result.property_type == "nha"
        assert result.transaction_type == "ban"
        assert 0 < result.confidence < 1.0
