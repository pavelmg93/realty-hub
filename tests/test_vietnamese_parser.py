"""Tests for the Vietnamese real estate listing parser."""

from src.parsing.vietnamese_parser import (
    extract_access_road,
    extract_area,
    extract_bathrooms,
    extract_bedrooms,
    extract_building_type,
    extract_corner_lot,
    extract_depth,
    extract_direction,
    extract_elevator,
    extract_feng_shui,
    extract_floors,
    extract_frontage,
    extract_furnished,
    extract_investment_use_case,
    extract_land_characteristics,
    extract_legal_status,
    extract_location,
    extract_nearby_amenities,
    extract_negotiable,
    extract_outdoor_features,
    extract_price,
    extract_price_per_m2,
    extract_property_type,
    extract_rental_income,
    extract_special_rooms,
    extract_structure_type,
    extract_total_construction_area,
    extract_traffic_connectivity,
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

    def test_dat_tang_nha_override(self):
        """'bán đất tặng nhà' should be classified as land, not house."""
        text = "BÁN ĐẤT TẶNG NHÀ ĐƯỜNG HƯƠNG ĐIỀN 227M²\n🏡 Bán đất tặng nhà cấp 4"
        assert extract_property_type(text) == "dat"

    def test_dat_in_title_nha_in_body(self):
        """When title says 'đất' but body mentions 'nhà', prioritize title."""
        text = "ĐẤT ĐẸP PHƯỚC LONG 95M²\n🏡 Nhà cấp 4 còn sử dụng tốt"
        assert extract_property_type(text) == "dat"

    def test_nha_in_title_dat_in_body(self):
        """When title says 'nhà' but body mentions 'đất', prioritize title."""
        text = "NHÀ ĐẸP 3 TẦNG 100M²\n📐 Diện tích đất 100m²"
        assert extract_property_type(text) == "nha"


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

    def test_default_ban_with_property_info(self):
        """Should default to 'ban' when property info exists but no verb."""
        assert extract_transaction_type("NHÀ ĐẸP 100M² GIÁ 5 TỶ", has_property_info=True) == "ban"

    def test_no_default_without_property_info(self):
        """Should return None when no verb and no property info."""
        assert extract_transaction_type("Liên hệ tư vấn", has_property_info=False) is None


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

    def test_default_transaction_type_ban(self):
        """Listings with property info but no sell/rent verb should default to 'ban'."""
        text = "NHÀ ĐẸP BỬU ĐÓA 55M², 1 TRỆT 1 LỬNG, 2PN, GIÁ 3.75 TỶ"
        result = parse_listing(text)
        assert result.transaction_type == "ban"

    def test_real_listing_dat_tang_nha(self):
        """Real listing from testing log: 'bán đất tặng nhà' should be land."""
        text = (
            "KHÔNG NHANH LÀ MẤT! BÁN ĐẤT TẶNG NHÀ ĐƯỜNG HƯƠNG ĐIỀN"
            " 227M², NGANG 8M, GIÁ CHỈ 33TR/M\n"
            "🌿 Gần trung tâm TP, khu buôn bán sầm uất\n"
            "🏡 Bán đất tặng nhà cấp 4 còn sử dụng tốt\n"
            "📐 Diện tích 226,5m², ngang 8m vuông đẹp\n"
            "🚗 Ô tô ra vào thoải mái, sân để xe rộng\n"
            "💰 Giá: ~7,48 tỷ (33 triệu/m², thương lượng nhẹ)"
        )
        result = parse_listing(text)
        assert result.property_type == "dat"
        assert result.transaction_type == "ban"
        assert result.area_m2 == 227.0
        assert result.access_road == "hem_oto"

    def test_access_road_extracted(self):
        text = "NHÀ ĐẸP HẺM Ô TÔ LÊ HỒNG PHONG 73M²"
        result = parse_listing(text)
        assert result.access_road == "hem_oto"

    def test_furnished_extracted(self):
        text = "NHÀ ĐẸP 3 TẦNG, FULL NỘI THẤT, GIÁ 7.8 TỶ"
        result = parse_listing(text)
        assert result.furnished == "full"

    def test_new_fields_real_listing(self):
        """Real listing exercising many of the 19 new extractor fields."""
        text = (
            "SIÊU PHẨM! NHÀ ĐẸP KĐT MỸ GIA GÓI 5, 3 TẦNG, 100M², NỘI THẤT ĐẸP\n"
            "🏡 Nhà xây mới 3 tầng mê đúc\n"
            "🛏️ 3PN, 3WC, phòng thờ, phòng giặt riêng\n"
            "📐 Diện tích 100m², ngang 5m\n"
            "🌞 Hướng Tây Nam, phong thủy tốt\n"
            "🚗 Sân để xe riêng\n"
            "📕 Sổ hồng chính chủ, đã hoàn công\n"
            "💰 Giá bán: 9,4 tỷ (thương lượng)"
        )
        result = parse_listing(text)
        # Core fields
        assert result.property_type == "nha"
        assert result.transaction_type == "ban"
        assert result.price_vnd == 9_400_000_000
        assert result.area_m2 == 100.0
        assert result.num_bedrooms == 3
        assert result.num_floors == 3
        assert result.frontage_m == 5.0
        assert result.furnished == "full"
        # New fields
        assert result.legal_status == "so_hong"
        assert result.num_bathrooms == 3
        assert result.structure_type == "me_duc"
        assert result.direction == "tay_nam"
        assert result.negotiable is True
        assert result.building_type == "xay_moi"
        assert result.feng_shui == "tot"
        assert result.special_rooms is not None
        assert "phong_tho" in result.special_rooms
        assert "phong_giat" in result.special_rooms
        assert result.outdoor_features is not None
        assert "san_de_xe" in result.outdoor_features


# ---------------------------------------------------------------------------
# Access road extraction
# ---------------------------------------------------------------------------
class TestExtractAccessRoad:
    def test_hem_oto(self):
        assert extract_access_road("Hẻm ô tô rộng 5m") == "hem_oto"

    def test_hem_oto_simple(self):
        assert extract_access_road("hẻm ô tô, cách biển 400m") == "hem_oto"

    def test_mat_duong(self):
        assert extract_access_road("Mặt đường rộng, ô tô đỗ cửa") == "mat_duong"

    def test_mat_tien_duong(self):
        assert extract_access_road("Mặt tiền đường lớn") == "mat_duong"

    def test_hem_thong(self):
        assert extract_access_road("Hẻm thông thoáng") == "hem_thong"

    def test_hem_rong(self):
        assert extract_access_road("Hẻm rộng, dễ di chuyển") == "hem_rong"

    def test_hem_nho(self):
        assert extract_access_road("Hẻm 2–3m, xe ba gác vào tận nhà") == "hem_nho"

    def test_oto_do_cua(self):
        assert extract_access_road("Ô tô đỗ cửa thuận tiện") == "hem_oto"

    def test_oto_quay_dau(self):
        assert extract_access_road("Ô tô quay đầu thoải mái") == "hem_oto"

    def test_no_access(self):
        assert extract_access_road("Nhà đẹp giá tốt") is None


# ---------------------------------------------------------------------------
# Furnished extraction
# ---------------------------------------------------------------------------
class TestExtractFurnished:
    def test_full_noi_that(self):
        assert extract_furnished("Full nội thất xịn sò") == "full"

    def test_noi_that_dep(self):
        assert extract_furnished("Nội thất đẹp, hoàn thiện chỉn chu") == "full"

    def test_noi_that_day_du(self):
        assert extract_furnished("Nội thất đầy đủ, vào ở ngay") == "full"

    def test_noi_that_co_ban(self):
        assert extract_furnished("Nội thất cơ bản") == "co_ban"

    def test_nha_trong(self):
        assert extract_furnished("Nhà trống, chưa có nội thất") == "khong"

    def test_no_mention(self):
        assert extract_furnished("Đất nền 100m²") is None


# ---------------------------------------------------------------------------
# Legal status extraction
# ---------------------------------------------------------------------------
class TestExtractLegalStatus:
    def test_so_hong(self):
        assert extract_legal_status("Sổ hồng chính chủ, sang tên ngay") == "so_hong"

    def test_so_hong_rieng(self):
        assert extract_legal_status("sổ hồng riêng, pháp lý rõ ràng") == "so_hong"

    def test_so_do(self):
        assert extract_legal_status("Có sổ đỏ đầy đủ") == "so_do"

    def test_hoan_cong(self):
        assert extract_legal_status("Nhà đã hoàn công, giấy tờ đầy đủ") == "hoan_cong"

    def test_tho_cu(self):
        assert extract_legal_status("Full thổ cư, xây dựng tự do") == "tho_cu"

    def test_phap_ly_chuan(self):
        assert extract_legal_status("Pháp lý chuẩn, an tâm mua bán") == "phap_ly_chuan"

    def test_no_legal(self):
        assert extract_legal_status("Nhà đẹp giá tốt 3 tầng") is None


# ---------------------------------------------------------------------------
# Bathroom extraction
# ---------------------------------------------------------------------------
class TestExtractBathrooms:
    def test_wc_number(self):
        assert extract_bathrooms("3PN, 2WC, sân vườn") == 2

    def test_wc_with_space(self):
        assert extract_bathrooms("4 phòng ngủ, 3 WC") == 3

    def test_phong_tam(self):
        assert extract_bathrooms("2 phòng tắm riêng biệt") == 2

    def test_toilet(self):
        assert extract_bathrooms("nhà có 1 toilet") == 1

    def test_no_bathrooms(self):
        assert extract_bathrooms("Đất nền 200m2") is None


# ---------------------------------------------------------------------------
# Structure type extraction
# ---------------------------------------------------------------------------
class TestExtractStructureType:
    def test_me_duc(self):
        assert extract_structure_type("Nhà 3 tầng mê đúc kiên cố") == "me_duc"

    def test_gac_lung(self):
        assert extract_structure_type("1 trệt 1 lửng, có sân thượng") == "gac_lung"

    def test_gac_lung_keyword(self):
        assert extract_structure_type("Có gác lửng rộng rãi") == "gac_lung"

    def test_tret_lau(self):
        assert extract_structure_type("1 trệt 2 lầu, sân thượng") == "tret_lau"

    def test_cap_4(self):
        assert extract_structure_type("Nhà cấp 4, diện tích rộng") == "cap_4"

    def test_no_structure(self):
        assert extract_structure_type("Đất nền trống") is None


# ---------------------------------------------------------------------------
# Direction extraction
# ---------------------------------------------------------------------------
class TestExtractDirection:
    def test_dong_nam(self):
        assert extract_direction("Hướng Đông Nam, thoáng mát") == "dong_nam"

    def test_tay_nam(self):
        assert extract_direction("Hướng Tây Nam thoáng") == "tay_nam"

    def test_dong_bac(self):
        assert extract_direction("Hướng Đông Bắc, view đẹp") == "dong_bac"

    def test_tay_bac(self):
        assert extract_direction("Hướng Tây Bắc") == "tay_bac"

    def test_dong(self):
        assert extract_direction("Hướng Đông, nắng sớm") == "dong"

    def test_tay(self):
        assert extract_direction("Hướng Tây") == "tay"

    def test_nam(self):
        assert extract_direction("Hướng Nam mát mẻ") == "nam"

    def test_bac(self):
        assert extract_direction("Hướng Bắc") == "bac"

    def test_no_direction(self):
        assert extract_direction("Nhà đẹp 3 tầng giá tốt") is None


# ---------------------------------------------------------------------------
# Depth extraction
# ---------------------------------------------------------------------------
class TestExtractDepth:
    def test_sau(self):
        assert extract_depth("sâu 22m, nở hậu đẹp") == 22.0

    def test_chieu_sau(self):
        assert extract_depth("Chiều sâu 18.5m") == 18.5

    def test_dai(self):
        assert extract_depth("dài 15m, ngang 5m") == 15.0

    def test_no_hau(self):
        assert extract_depth("Nở hậu 4.25m") == 4.25

    def test_no_depth(self):
        assert extract_depth("Nhà 3 tầng 100m2") is None


# ---------------------------------------------------------------------------
# Corner lot extraction
# ---------------------------------------------------------------------------
class TestExtractCornerLot:
    def test_lo_goc(self):
        assert extract_corner_lot("Lô góc 2 mặt tiền đường") is True

    def test_hai_mat_tien(self):
        assert extract_corner_lot("2 mặt tiền, view đẹp") is True

    def test_can_goc(self):
        assert extract_corner_lot("Căn góc thoáng mát") is True

    def test_two_mt(self):
        assert extract_corner_lot("2MT đường lớn, kinh doanh tốt") is True

    def test_not_corner(self):
        assert extract_corner_lot("Nhà mặt tiền đường Trần Phú") is False


# ---------------------------------------------------------------------------
# Price per m2 extraction
# ---------------------------------------------------------------------------
class TestExtractPricePerM2:
    def test_tr_per_m2(self):
        assert extract_price_per_m2("Giá 33tr/m², thương lượng nhẹ") == 33_000_000

    def test_trieu_per_m2(self):
        assert extract_price_per_m2("22 triệu/m2 thương lượng") == 22_000_000

    def test_decimal_tr_per_m2(self):
        assert extract_price_per_m2("giá 18.5tr/m²") == 18_500_000

    def test_no_price_per_m2(self):
        assert extract_price_per_m2("Giá 5 tỷ thương lượng") is None


# ---------------------------------------------------------------------------
# Negotiable extraction
# ---------------------------------------------------------------------------
class TestExtractNegotiable:
    def test_thuong_luong(self):
        assert extract_negotiable("Giá 5 tỷ thương lượng") is True

    def test_bot_loc(self):
        assert extract_negotiable("Giá tốt, bớt lộc cho khách thiện chí") is True

    def test_con_thuong_luong(self):
        assert extract_negotiable("Giá 3.5 tỷ còn thương lượng") is True

    def test_not_negotiable(self):
        assert extract_negotiable("Giá 5 tỷ, không bớt") is False


# ---------------------------------------------------------------------------
# Rental income extraction
# ---------------------------------------------------------------------------
class TestExtractRentalIncome:
    def test_cho_thue_monthly(self):
        assert extract_rental_income("Đang cho thuê 14tr/tháng") == 14_000_000

    def test_thu_nhap(self):
        assert extract_rental_income("Thu nhập 10 triệu/tháng ổn định") == 10_000_000

    def test_doanh_thu(self):
        assert extract_rental_income("Doanh thu 20tr/tháng") == 20_000_000

    def test_cho_thue_duoc(self):
        assert extract_rental_income("Cho thuê được 8 triệu/tháng") == 8_000_000

    def test_no_rental_income(self):
        assert extract_rental_income("Nhà đẹp 3 tầng giá 5 tỷ") is None


# ---------------------------------------------------------------------------
# Elevator extraction
# ---------------------------------------------------------------------------
class TestExtractElevator:
    def test_thang_may(self):
        assert extract_elevator("Nhà 5 tầng có thang máy") is True

    def test_thang_may_no_diacritics(self):
        assert extract_elevator("thang may rieng biet") is True

    def test_no_elevator(self):
        assert extract_elevator("Nhà 3 tầng, sân thượng rộng") is False


# ---------------------------------------------------------------------------
# Nearby amenities extraction
# ---------------------------------------------------------------------------
class TestExtractNearbyAmenities:
    def test_gan_bien(self):
        result = extract_nearby_amenities("Gần biển 500m, view đẹp")
        assert result is not None
        assert "bien" in result

    def test_gan_cho(self):
        result = extract_nearby_amenities("Gần chợ Vĩnh Hải, thuận tiện")
        assert result is not None
        assert "cho" in result

    def test_multiple_amenities(self):
        result = extract_nearby_amenities(
            "Gần biển 300m, gần chợ, gần trường học, sát bờ kè"
        )
        assert result is not None
        assert "bien" in result
        assert "cho" in result
        assert "truong_hoc" in result
        assert "bo_ke" in result

    def test_benh_vien(self):
        result = extract_nearby_amenities("Gần bệnh viện tỉnh, thuận tiện")
        assert result is not None
        assert "benh_vien" in result

    def test_no_amenities(self):
        assert extract_nearby_amenities("Nhà đẹp 3 tầng giá tốt") is None


# ---------------------------------------------------------------------------
# Investment use case extraction
# ---------------------------------------------------------------------------
class TestExtractInvestmentUseCase:
    def test_dau_tu(self):
        result = extract_investment_use_case("Phù hợp đầu tư sinh lời")
        assert result is not None
        assert "dau_tu" in result

    def test_kinh_doanh(self):
        result = extract_investment_use_case("Vị trí kinh doanh sầm uất")
        assert result is not None
        assert "kinh_doanh" in result

    def test_homestay(self):
        result = extract_investment_use_case("Thích hợp làm homestay")
        assert result is not None
        assert "homestay" in result

    def test_an_cu(self):
        result = extract_investment_use_case("Phù hợp an cư lâu dài")
        assert result is not None
        assert "an_cu" in result

    def test_multiple_use_cases(self):
        result = extract_investment_use_case(
            "Vừa để ở vừa đầu tư, kinh doanh homestay"
        )
        assert result is not None
        assert "dau_tu" in result
        assert "kinh_doanh" in result
        assert "homestay" in result
        assert "an_cu" in result

    def test_no_use_case(self):
        assert extract_investment_use_case("Nhà 3 tầng 100m²") is None


# ---------------------------------------------------------------------------
# Outdoor features extraction
# ---------------------------------------------------------------------------
class TestExtractOutdoorFeatures:
    def test_san_vuon(self):
        result = extract_outdoor_features("Có sân vườn rộng rãi")
        assert result is not None
        assert "san_vuon" in result

    def test_san_de_xe(self):
        result = extract_outdoor_features("Sân để xe riêng, rộng thoáng")
        assert result is not None
        assert "san_de_xe" in result

    def test_san_thuong(self):
        result = extract_outdoor_features("Sân thượng view biển")
        assert result is not None
        assert "san_thuong" in result

    def test_ban_cong(self):
        result = extract_outdoor_features("Ban công thoáng mát, view đẹp")
        assert result is not None
        assert "ban_cong" in result

    def test_multiple_features(self):
        result = extract_outdoor_features(
            "Sân vườn rộng, sân thượng view đẹp, ban công thoáng"
        )
        assert result is not None
        assert "san_vuon" in result
        assert "san_thuong" in result
        assert "ban_cong" in result

    def test_no_outdoor(self):
        assert extract_outdoor_features("Đất nền 100m2 giá tốt") is None


# ---------------------------------------------------------------------------
# Special rooms extraction
# ---------------------------------------------------------------------------
class TestExtractSpecialRooms:
    def test_phong_tho(self):
        result = extract_special_rooms("Có phòng thờ riêng trang nghiêm")
        assert result is not None
        assert "phong_tho" in result

    def test_phong_giat(self):
        result = extract_special_rooms("Phòng giặt riêng biệt, tiện lợi")
        assert result is not None
        assert "phong_giat" in result

    def test_bep_rieng(self):
        result = extract_special_rooms("Bếp riêng, thoáng mát")
        assert result is not None
        assert "bep_rieng" in result

    def test_multiple_rooms(self):
        result = extract_special_rooms("Phòng thờ, phòng giặt riêng, bếp riêng")
        assert result is not None
        assert "phong_tho" in result
        assert "phong_giat" in result
        assert "bep_rieng" in result

    def test_gara(self):
        result = extract_special_rooms("Có gara để xe rộng rãi")
        assert result is not None
        assert "gara" in result

    def test_no_special_rooms(self):
        assert extract_special_rooms("Đất nền 200m² ngang 8m") is None


# ---------------------------------------------------------------------------
# Feng shui extraction
# ---------------------------------------------------------------------------
class TestExtractFengShui:
    def test_phong_thuy_tot(self):
        assert extract_feng_shui("Phong thủy tốt, hợp tuổi") == "tot"

    def test_phong_thuy_dep(self):
        assert extract_feng_shui("Phong thủy đẹp, hài hòa") == "dep"

    def test_phong_thuy_on(self):
        assert extract_feng_shui("Phong thủy ổn, không kiêng kỵ") == "on"

    def test_no_feng_shui(self):
        assert extract_feng_shui("Nhà đẹp 3 tầng, hướng Đông Nam") is None


# ---------------------------------------------------------------------------
# Total construction area extraction
# ---------------------------------------------------------------------------
class TestExtractTotalConstructionArea:
    def test_tong_san(self):
        assert extract_total_construction_area("Tổng sàn 325m²") == 325.0

    def test_dt_san(self):
        assert extract_total_construction_area("DT sàn 200m2, thiết kế đẹp") == 200.0

    def test_dien_tich_xay_dung(self):
        assert extract_total_construction_area("Diện tích xây dựng 150m2") == 150.0

    def test_tong_dien_tich_san(self):
        assert extract_total_construction_area("Tổng diện tích sàn 280m²") == 280.0

    def test_no_construction_area(self):
        assert extract_total_construction_area("Diện tích 100m2, 3 tầng") is None


# ---------------------------------------------------------------------------
# Land characteristics extraction
# ---------------------------------------------------------------------------
class TestExtractLandCharacteristics:
    def test_vuong_van(self):
        assert extract_land_characteristics("Đất vuông vắn, nở hậu nhẹ") == "vuong_van"

    def test_no_hau(self):
        assert extract_land_characteristics("Nở hậu 4m, phong thủy tốt") == "no_hau"

    def test_dat_o_do_thi(self):
        assert extract_land_characteristics("100% đất ở đô thị, xây tự do") == "dat_o_do_thi"

    def test_no_characteristics(self):
        assert extract_land_characteristics("Nhà 3 tầng đẹp giá tốt") is None


# ---------------------------------------------------------------------------
# Traffic connectivity extraction
# ---------------------------------------------------------------------------
class TestExtractTrafficConnectivity:
    def test_trung_tam(self):
        assert extract_traffic_connectivity("Gần trung tâm thành phố") == "trung_tam"

    def test_trung_tam_tp(self):
        assert extract_traffic_connectivity("Gần trung tâm TP, thuận tiện") == "trung_tam"

    def test_gan_san_bay(self):
        assert extract_traffic_connectivity("Gần sân bay Cam Ranh") == "gan_san_bay"

    def test_truc_chinh(self):
        assert extract_traffic_connectivity("Trục kinh doanh sầm uất") == "truc_chinh"

    def test_no_traffic(self):
        assert extract_traffic_connectivity("Nhà đẹp 100m² giá tốt") is None


# ---------------------------------------------------------------------------
# Building type extraction
# ---------------------------------------------------------------------------
class TestExtractBuildingType:
    def test_xay_moi(self):
        assert extract_building_type("Nhà xây mới 3 tầng") == "xay_moi"

    def test_moi_xay(self):
        assert extract_building_type("Mới xây năm 2025, kiên cố") == "xay_moi"

    def test_kien_co(self):
        assert extract_building_type("Xây kiên cố, móng chắc") == "kien_co"

    def test_nha_cu(self):
        assert extract_building_type("Nhà cũ tiện sửa chữa") == "nha_cu"

    def test_moi_sua(self):
        assert extract_building_type("Mới sửa lại hoàn toàn, đẹp") == "moi_sua"

    def test_no_building_type(self):
        assert extract_building_type("Đất nền 100m2 ngang 5m") is None
