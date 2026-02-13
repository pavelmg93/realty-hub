"""Vietnamese real estate listing parser.

Extracts structured fields (price, area, property type, location, etc.)
from Vietnamese-language listing text using regex patterns.
"""

import re
from dataclasses import dataclass, field

# ---------------------------------------------------------------------------
# Property type mappings
# ---------------------------------------------------------------------------
PROPERTY_TYPES: dict[str, list[str]] = {
    "nha": ["nhà mặt tiền", "nhà phố", "nhà cấp 4", "nhà", "nha"],
    "dat": ["đất nền", "lô đất", "đất", "dat", "lo dat"],
    "can_ho": ["căn hộ", "chung cư", "can ho", "chung cu"],
    "phong_tro": ["phòng trọ", "nhà trọ", "phong tro", "nha tro"],
    "biet_thu": ["biệt thự", "biet thu"],
    "khach_san": ["khách sạn", "khach san"],
    "mat_bang": ["mặt bằng", "mat bang"],
}

# Build a flat lookup: keyword -> canonical type (longest keywords first for greedy matching)
_PROPERTY_KEYWORD_MAP: dict[str, str] = {}
for ptype, keywords in PROPERTY_TYPES.items():
    for kw in sorted(keywords, key=len, reverse=True):
        _PROPERTY_KEYWORD_MAP[kw] = ptype

# Compound patterns that override simple keyword matching.
# "bán đất tặng nhà" = land sale, not house sale.
_LAND_OVERRIDE_PATTERNS = re.compile(
    r"(?:bán đất tặng nhà|ban dat tang nha|đất.*tặng nhà|dat.*tang nha)",
    re.IGNORECASE,
)

# ---------------------------------------------------------------------------
# Transaction type keywords
# ---------------------------------------------------------------------------
SELL_KEYWORDS = [
    "bán",
    "ban",
    "cần bán",
    "can ban",
    "bán gấp",
    "ban gap",
    "bán nhanh",
    "sang nhượng",
    "sang nhuong",
]
RENT_KEYWORDS = [
    "cho thuê",
    "cho thue",
    "cần thuê",
    "can thue",
    "thuê",
    "thue",
    "rent",
]

# ---------------------------------------------------------------------------
# Regex patterns
# ---------------------------------------------------------------------------

# Price: "3.5 tỷ", "3,5 tỷ", "350 triệu", "35tr", "3.5t", "800tr/tháng"
PRICE_PATTERN = re.compile(
    r"(\d+[.,]?\d*)\s*(tỷ|ty|tỉ|ti|triệu|trieu|tr|t)\b",
    re.IGNORECASE,
)

# Area: "100m2", "100 m2", "100m²", "5x20", "5 x 20", "5x20m", "5x20m2"
AREA_DIRECT_PATTERN = re.compile(
    r"(\d+[.,]?\d*)\s*m[2²]",
    re.IGNORECASE,
)
AREA_DIMENSION_PATTERN = re.compile(
    r"(\d+[.,]?\d*)\s*[xX×]\s*(\d+[.,]?\d*)",
)

# Location patterns
WARD_PATTERN = re.compile(
    r"(?:phường|phuong|p\.)\s*([\w\s]+?)(?:,|\.|$|\s*[-;])",
    re.IGNORECASE,
)
STREET_PATTERN = re.compile(
    r"(?:đường|duong|đ\.)\s*([\w\s]+?)(?:,|\.|$|\s*[-;])",
    re.IGNORECASE,
)
DISTRICT_PATTERN = re.compile(
    r"(?:quận|quan|q\.)\s*([\w\s]+?)(?:,|\.|$|\s*[-;])",
    re.IGNORECASE,
)

# Bedroom count: "3 phòng ngủ", "3pn", "3 PN"
BEDROOM_PATTERN = re.compile(
    r"(\d+)\s*(?:phòng ngủ|phong ngu|pn)\b",
    re.IGNORECASE,
)

# Floor count: "3 tầng", "3 tang", "3 lầu"
FLOOR_PATTERN = re.compile(
    r"(\d+)\s*(?:tầng|tang|lầu|lau)\b",
    re.IGNORECASE,
)

# Frontage: "mặt tiền 5m", "MT 5m", "ngang 4m", "4m mặt tiền"
FRONTAGE_PATTERN = re.compile(
    r"(?:(?:mặt tiền|mat tien|mt|ngang)\s*(\d+[.,]?\d*)\s*m"
    r"|(\d+[.,]?\d*)\s*m\s*(?:mặt tiền|mat tien|mt|ngang))\b",
    re.IGNORECASE,
)

# Access road patterns — describes road/alley access to the property
ACCESS_ROAD_PATTERNS: list[tuple[re.Pattern[str], str]] = [
    # Road-facing / frontage (most accessible)
    (
        re.compile(r"mặt (?:tiền )?đường|mat (?:tien )?duong|mặt phố|mat pho", re.IGNORECASE),
        "mat_duong",
    ),
    # Car-accessible alley with width
    (
        re.compile(
            r"hẻm ô tô\s*(?:rộng\s*)?(\d+[.,]?\d*)\s*m|hem o to\s*(?:rong\s*)?(\d+[.,]?\d*)\s*m",
            re.IGNORECASE,
        ),
        "hem_oto",
    ),
    # Car-accessible road/alley (no width specified)
    (
        re.compile(
            r"hẻm ô tô|hem o to|đường ô tô|duong o to|ô tô (?:đỗ|ra vào|quay đầu|vào)",
            re.IGNORECASE,
        ),
        "hem_oto",
    ),
    # Connecting alley
    (re.compile(r"hẻm thông|hem thong", re.IGNORECASE), "hem_thong"),
    # Wide alley (generic)
    (re.compile(r"hẻm rộng|hem rong", re.IGNORECASE), "hem_rong"),
    # Narrow alley / motorbike only
    (re.compile(r"hẻm (?:xe máy|2[–-]?3m|nhỏ)|hem (?:xe may|nho)", re.IGNORECASE), "hem_nho"),
    # Generic alley mention
    (re.compile(r"hẻm|hem\b", re.IGNORECASE), "hem"),
]

# Distance from main road: "cách mặt đường 50m", "cách đường X chỉ 50m"
ROAD_DISTANCE_PATTERN = re.compile(
    r"cách (?:mặt )?(?:đường|duong)\s*[\w\s]*?(?:chỉ\s*)?(\d+)\s*m",
    re.IGNORECASE,
)

# Furnished status patterns
FURNISHED_PATTERNS: list[tuple[re.Pattern[str], str]] = [
    (
        re.compile(
            r"full nội thất|full noi that|nội thất đầy đủ|noi that day du"
            r"|đầy đủ nội thất|nội thất đẹp|noi that dep|nội thất xịn",
            re.IGNORECASE,
        ),
        "full",
    ),
    (re.compile(r"nội thất cơ bản|noi that co ban", re.IGNORECASE), "co_ban"),
    (re.compile(r"nhà trống|nha trong|chưa có nội thất", re.IGNORECASE), "khong"),
]

# ---------------------------------------------------------------------------
# New feature patterns (19 extractors)
# ---------------------------------------------------------------------------

# Legal status patterns
LEGAL_STATUS_PATTERNS: list[tuple[re.Pattern[str], str]] = [
    (
        re.compile(
            r"sổ hồng chính chủ|so hong chinh chu|sổ hồng riêng|so hong rieng|sổ hồng|so hong",
            re.IGNORECASE,
        ),
        "so_hong",
    ),
    (re.compile(r"sổ đỏ|so do", re.IGNORECASE), "so_do"),
    (
        re.compile(
            r"hoàn công|hoan cong|đã hoàn công|da hoan cong",
            re.IGNORECASE,
        ),
        "hoan_cong",
    ),
    (
        re.compile(
            r"full\s*thổ cư|full\s*tho cu|100%\s*thổ cư|thổ cư|tho cu",
            re.IGNORECASE,
        ),
        "tho_cu",
    ),
    (
        re.compile(
            r"pháp lý (?:chuẩn|rõ ràng|đầy đủ|sạch)|phap ly (?:chuan|ro rang|day du|sach)"
            r"|giấy tờ đầy đủ|giay to day du",
            re.IGNORECASE,
        ),
        "phap_ly_chuan",
    ),
]

# Bathroom count: "3WC", "2 wc", "3 phòng tắm", "2 toilet"
BATHROOM_PATTERN = re.compile(
    r"(\d+)\s*(?:wc|phòng tắm|phong tam|phòng vệ sinh|phong ve sinh|toilet)\b",
    re.IGNORECASE,
)

# Structure type patterns
STRUCTURE_TYPE_PATTERNS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"mê đúc|me duc", re.IGNORECASE), "me_duc"),
    (
        re.compile(
            r"1\s*trệt\s*\d+\s*lửng|gác lửng|gac lung|trệt lửng|tret lung",
            re.IGNORECASE,
        ),
        "gac_lung",
    ),
    (
        re.compile(
            r"1\s*trệt\s*\d+\s*(?:lầu|tầng)|tret\s*\d+\s*(?:lau|tang)",
            re.IGNORECASE,
        ),
        "tret_lau",
    ),
    (re.compile(r"nhà cấp 4|nha cap 4|cấp 4|cap 4", re.IGNORECASE), "cap_4"),
]

# Direction patterns — compound first, then simple
DIRECTION_PATTERNS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"hướng\s*(?:đông\s*nam|dong\s*nam)", re.IGNORECASE), "dong_nam"),
    (re.compile(r"hướng\s*(?:tây\s*nam|tay\s*nam)", re.IGNORECASE), "tay_nam"),
    (re.compile(r"hướng\s*(?:đông\s*bắc|dong\s*bac)", re.IGNORECASE), "dong_bac"),
    (re.compile(r"hướng\s*(?:tây\s*bắc|tay\s*bac)", re.IGNORECASE), "tay_bac"),
    (re.compile(r"hướng\s*(?:đông|dong)\b", re.IGNORECASE), "dong"),
    (re.compile(r"hướng\s*(?:tây|tay)\b", re.IGNORECASE), "tay"),
    (re.compile(r"hướng\s*(?:nam)\b", re.IGNORECASE), "nam"),
    (re.compile(r"hướng\s*(?:bắc|bac)\b", re.IGNORECASE), "bac"),
]

# Depth: "sâu 22m", "dài 15m", "chiều sâu 20m", "nở hậu 4.25m"
DEPTH_PATTERN = re.compile(
    r"(?:sâu|sau|chiều sâu|chieu sau|nở hậu|no hau|dài|dai)\s*(\d+[.,]?\d*)\s*m",
    re.IGNORECASE,
)

# Corner lot: "lô góc", "2 mặt tiền", "căn góc"
CORNER_LOT_PATTERN = re.compile(
    r"lô góc|lo goc|2\s*mặt tiền|2\s*mat tien|2\s*mt\b|căn góc|can goc|hai mặt",
    re.IGNORECASE,
)

# Price per m2: "33tr/m²", "22 triệu/m2"
PRICE_PER_M2_PATTERN = re.compile(
    r"(\d+[.,]?\d*)\s*(?:triệu|trieu|tr)/\s*m[2²]",
    re.IGNORECASE,
)

# Negotiable: "thương lượng", "TL", "bớt lộc"
NEGOTIABLE_PATTERN = re.compile(
    r"thương lượng|thuong luong|bớt lộc|bot loc|còn thương lượng|con thuong luong",
    re.IGNORECASE,
)

# Rental income: "đang cho thuê 14TR/THÁNG", "thu nhập 10 triệu/tháng"
RENTAL_INCOME_PATTERN = re.compile(
    r"(?:cho\s*(?:thuê|thue)|thu\s*nhập|thu\s*nhap|doanh\s*thu)\s*(?:được\s*|duoc\s*)?"
    r"(\d+[.,]?\d*)\s*(?:triệu|trieu|tr)\s*/?\s*(?:tháng|thang)",
    re.IGNORECASE,
)

# Elevator: "thang máy"
ELEVATOR_PATTERN = re.compile(
    r"thang máy|thang may",
    re.IGNORECASE,
)

# Nearby amenities keywords
AMENITY_PATTERNS: list[tuple[re.Pattern[str], str]] = [
    (
        re.compile(
            r"gần biển|gan bien|cách biển|cach bien|sát biển|view biển", re.IGNORECASE
        ),
        "bien",
    ),
    (re.compile(r"gần chợ|gan cho|cách chợ|cach cho|sát chợ", re.IGNORECASE), "cho"),
    (
        re.compile(
            r"gần trường|gan truong|cách trường|cach truong|gần trường học",
            re.IGNORECASE,
        ),
        "truong_hoc",
    ),
    (
        re.compile(
            r"gần bệnh viện|gan benh vien|cách bệnh viện|cach benh vien|gần BV\b",
            re.IGNORECASE,
        ),
        "benh_vien",
    ),
    (
        re.compile(
            r"gần siêu thị|gan sieu thi|cách siêu thị|cach sieu thi|COOP|co\.op",
            re.IGNORECASE,
        ),
        "sieu_thi",
    ),
    (
        re.compile(
            r"gần công viên|gan cong vien|cách công viên|cach cong vien",
            re.IGNORECASE,
        ),
        "cong_vien",
    ),
    (re.compile(r"gần bờ kè|gan bo ke|cách bờ kè|cach bo ke|sát bờ kè", re.IGNORECASE), "bo_ke"),
]

# Investment use case keywords
INVESTMENT_PATTERNS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"đầu tư|dau tu", re.IGNORECASE), "dau_tu"),
    (re.compile(r"kinh doanh|kinh doang", re.IGNORECASE), "kinh_doanh"),
    (
        re.compile(
            r"cho thuê phòng|cho thue phong|cho thuê lại|cho thue lai", re.IGNORECASE
        ),
        "cho_thue",
    ),
    (re.compile(r"homestay", re.IGNORECASE), "homestay"),
    (re.compile(r"văn phòng|van phong|VP\b", re.IGNORECASE), "van_phong"),
    (re.compile(r"an cư|an cu|để ở|de o|vừa ở|vua o", re.IGNORECASE), "an_cu"),
]

# Outdoor features keywords
OUTDOOR_FEATURE_PATTERNS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"sân vườn|san vuon", re.IGNORECASE), "san_vuon"),
    (re.compile(r"sân để xe|san de xe|sân xe|san xe", re.IGNORECASE), "san_de_xe"),
    (re.compile(r"sân thượng|san thuong", re.IGNORECASE), "san_thuong"),
    (re.compile(r"giếng trời|gieng troi", re.IGNORECASE), "gieng_troi"),
    (re.compile(r"sân phơi|san phoi", re.IGNORECASE), "san_phoi"),
    (re.compile(r"ban công|ban cong|bancông", re.IGNORECASE), "ban_cong"),
    (re.compile(r"hồ bơi|ho boi", re.IGNORECASE), "ho_boi"),
]

# Special rooms keywords
SPECIAL_ROOM_PATTERNS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"phòng thờ|phong tho", re.IGNORECASE), "phong_tho"),
    (re.compile(r"phòng giặt|phong giat", re.IGNORECASE), "phong_giat"),
    (re.compile(r"bếp riêng|bep rieng|phòng bếp|phong bep", re.IGNORECASE), "bep_rieng"),
    (re.compile(r"phòng khách rộng|phong khach rong", re.IGNORECASE), "phong_khach"),
    (re.compile(r"gara|ga-ra|garage", re.IGNORECASE), "gara"),
]

# Feng shui
FENG_SHUI_PATTERN = re.compile(
    r"phong thủy\s*(tốt|ổn|đẹp|xấu)|phong thuy\s*(tot|on|dep|xau)",
    re.IGNORECASE,
)

# Total construction area: "tổng sàn 325m²", "DT sàn 200m2", "diện tích xây dựng 150m2"
TOTAL_CONSTRUCTION_AREA_PATTERN = re.compile(
    r"(?:tổng\s*(?:diện\s*tích\s*)?sàn|tong\s*(?:dien\s*tich\s*)?san"
    r"|dt\s*sàn|dt\s*san"
    r"|diện tích xây dựng|dien tich xay dung)\s*(\d+[.,]?\d*)\s*m[2²]",
    re.IGNORECASE,
)

# Land characteristics
LAND_CHAR_PATTERNS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"vuông vắn|vuong van|đất vuông|dat vuong", re.IGNORECASE), "vuong_van"),
    (re.compile(r"nở hậu|no hau", re.IGNORECASE), "no_hau"),
    (
        re.compile(
            r"full\s*đất ở|full\s*dat o|100%\s*đất ở|đất ở đô thị|dat o do thi",
            re.IGNORECASE,
        ),
        "dat_o_do_thi",
    ),
]

# Traffic connectivity
TRAFFIC_PATTERNS: list[tuple[re.Pattern[str], str]] = [
    (
        re.compile(
            r"trung tâm\s*(?:thành phố|tp)|trung tam\s*(?:thanh pho|tp)", re.IGNORECASE
        ),
        "trung_tam",
    ),
    (re.compile(r"gần sân bay|gan san bay", re.IGNORECASE), "gan_san_bay"),
    (re.compile(r"gần quốc lộ|gan quoc lo", re.IGNORECASE), "gan_quoc_lo"),
    (
        re.compile(
            r"trục (?:kinh doanh|giao thông|chính)|truc (?:kinh doanh|giao thong|chinh)",
            re.IGNORECASE,
        ),
        "truc_chinh",
    ),
]

# Building type
BUILDING_TYPE_PATTERNS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"xây mới|xay moi|mới xây|moi xay", re.IGNORECASE), "xay_moi"),
    (re.compile(r"xây kiên cố|xay kien co|kiên cố|kien co", re.IGNORECASE), "kien_co"),
    (re.compile(r"nhà cũ|nha cu|cũ|cu\b", re.IGNORECASE), "nha_cu"),
    (
        re.compile(
            r"mới sửa|moi sua|sửa chữa|sua chua|tân trang|tan trang", re.IGNORECASE
        ),
        "moi_sua",
    ),
]

# Road width: "đường rộng 20m", "đường 15m", "lộ 12m", "lộ rộng 8m"
ROAD_WIDTH_PATTERN = re.compile(
    r"(?:đường|duong|lộ|lo)\s*(?:rộng\s*)?(\d+[.,]?\d*)\s*m\b",
    re.IGNORECASE,
)

# Distance to beach: "cách biển 300m", "cách biển chỉ 500m"
DISTANCE_TO_BEACH_PATTERN = re.compile(
    r"cách\s*biển\s*(?:chỉ\s*)?(\d+[.,]?\d*)\s*m\b",
    re.IGNORECASE,
)

# Number of frontages: "2 mặt tiền", "3 MT", "hai mặt tiền"
NUM_FRONTAGES_PATTERN = re.compile(
    r"(\d+)\s*(?:mặt tiền|mat tien|mt)\b",
    re.IGNORECASE,
)

# Vietnamese word-form numbers for frontages
_VIET_NUM_WORDS: dict[str, int] = {
    "hai": 2, "ba": 3, "bốn": 4, "bon": 4,
}
NUM_FRONTAGES_WORD_PATTERN = re.compile(
    r"(hai|ba|bốn|bon)\s*(?:mặt tiền|mat tien|mt)\b",
    re.IGNORECASE,
)


# Nha Trang wards (phường) and communes (xã) — comprehensive list
# Includes both pre- and post-Nov 2024 merger names.
NHA_TRANG_WARDS = [
    # Current wards (post-merger)
    "Vĩnh Hòa",
    "Vĩnh Hải",
    "Vĩnh Phước",
    "Vĩnh Thọ",
    "Vạn Thạnh",
    "Phương Sài",
    "Ngọc Hiệp",
    "Phước Hòa",
    "Tân Tiến",
    "Phước Hải",
    "Lộc Thọ",
    "Vĩnh Nguyên",
    "Vĩnh Trường",
    "Phước Long",
    # Pre-merger wards (for historical lookups)
    "Phương Sơn",
    "Xương Huân",
    "Vạn Thắng",
    "Phước Tiến",
    "Phước Tân",
    "Tân Lập",
    # Communes (xã)
    "Vĩnh Lương",
    "Vĩnh Phương",
    "Vĩnh Ngọc",
    "Vĩnh Thạnh",
    "Vĩnh Trung",
    "Vĩnh Hiệp",
    "Vĩnh Thái",
    "Phước Đồng",
]


@dataclass
class ParsedListing:
    """Structured data extracted from a Vietnamese listing text."""

    # Core fields
    property_type: str | None = None
    transaction_type: str | None = None
    price_raw: str | None = None
    price_vnd: int | None = None
    area_m2: float | None = None
    address_raw: str | None = None
    ward: str | None = None
    street: str | None = None
    district: str | None = None
    num_bedrooms: int | None = None
    num_floors: int | None = None
    frontage_m: float | None = None
    access_road: str | None = None
    furnished: str | None = None
    description: str | None = None
    confidence: float = 0.0
    parse_errors: list[str] = field(default_factory=list)
    # 19 new feature fields
    legal_status: str | None = None
    num_bathrooms: int | None = None
    structure_type: str | None = None
    direction: str | None = None
    depth_m: float | None = None
    corner_lot: bool = False
    price_per_m2: int | None = None
    negotiable: bool = False
    rental_income_vnd: int | None = None
    has_elevator: bool = False
    nearby_amenities: list[str] | None = None
    investment_use_case: list[str] | None = None
    outdoor_features: list[str] | None = None
    special_rooms: list[str] | None = None
    feng_shui: str | None = None
    total_construction_area: float | None = None
    land_characteristics: str | None = None
    traffic_connectivity: str | None = None
    building_type: str | None = None
    # Session 9: scraping-derived fields
    road_width_m: float | None = None
    num_frontages: int | None = None
    distance_to_beach_m: float | None = None


def _normalize_number(s: str) -> float:
    """Convert Vietnamese number string to float (handles comma as decimal)."""
    return float(s.replace(",", "."))


def extract_price(text: str) -> tuple[str | None, int | None]:
    """Extract and normalize price from Vietnamese text.

    Args:
        text: Vietnamese listing text.

    Returns:
        Tuple of (raw price string, normalized price in VND).
        Returns (None, None) if no price found.
    """
    match = PRICE_PATTERN.search(text)
    if not match:
        return None, None

    raw = match.group(0)
    number = _normalize_number(match.group(1))
    unit = match.group(2).lower()

    if unit in ("tỷ", "ty", "tỉ", "ti", "t"):
        vnd = int(number * 1_000_000_000)
    elif unit in ("triệu", "trieu", "tr"):
        vnd = int(number * 1_000_000)
    else:
        vnd = int(number)

    return raw, vnd


def extract_area(text: str) -> float | None:
    """Extract area in square meters from Vietnamese text.

    Handles both direct area ("100m2") and dimensions ("5x20").

    Args:
        text: Vietnamese listing text.

    Returns:
        Area in m2, or None if not found.
    """
    # Try direct area first
    match = AREA_DIRECT_PATTERN.search(text)
    if match:
        return _normalize_number(match.group(1))

    # Try dimension pattern
    match = AREA_DIMENSION_PATTERN.search(text)
    if match:
        w = _normalize_number(match.group(1))
        h = _normalize_number(match.group(2))
        return round(w * h, 2)

    return None


def extract_location(text: str) -> dict[str, str | None]:
    """Extract location components from Vietnamese text.

    Args:
        text: Vietnamese listing text.

    Returns:
        Dict with keys: ward, street, district (values may be None).
    """
    location: dict[str, str | None] = {
        "ward": None,
        "street": None,
        "district": None,
    }

    ward_match = WARD_PATTERN.search(text)
    if ward_match:
        location["ward"] = ward_match.group(1).strip()

    street_match = STREET_PATTERN.search(text)
    if street_match:
        street_val = street_match.group(1).strip()
        # Reject false positives: "đường rộng 20m" (road width), not a street name
        if not re.match(
            r"^(?:rộng|rong|lớn|lon|nhỏ|nho)\b", street_val, re.IGNORECASE
        ):
            location["street"] = street_val

    district_match = DISTRICT_PATTERN.search(text)
    if district_match:
        location["district"] = district_match.group(1).strip()

    # Try to detect Nha Trang wards by name even without "phường" prefix
    if not location["ward"]:
        text_lower = text.lower()
        for ward_name in NHA_TRANG_WARDS:
            if ward_name.lower() in text_lower:
                location["ward"] = ward_name
                break

    return location


def extract_property_type(text: str) -> str | None:
    """Classify the property type from Vietnamese text.

    Uses a scoring approach: each keyword match adds a point to its type.
    Compound patterns (e.g., "bán đất tặng nhà") override simple matching.
    When both "đất" and "nhà" appear, the title/first line is checked
    to break the tie.

    Args:
        text: Vietnamese listing text.

    Returns:
        Canonical property type string or None.
    """
    text_lower = text.lower()

    # Check compound override patterns first
    if _LAND_OVERRIDE_PATTERNS.search(text_lower):
        return "dat"

    # Score each type by counting keyword matches
    type_scores: dict[str, int] = {}
    for keyword, ptype in _PROPERTY_KEYWORD_MAP.items():
        if keyword in text_lower:
            type_scores[ptype] = type_scores.get(ptype, 0) + 1

    if not type_scores:
        return None

    # If only one type matched, return it
    if len(type_scores) == 1:
        return next(iter(type_scores))

    # When multiple types match, check the title (first line) for the primary type
    first_line = text_lower.split("\n")[0]
    for keyword, ptype in _PROPERTY_KEYWORD_MAP.items():
        if keyword in first_line:
            return ptype

    # Fallback: return the type with highest score
    return max(type_scores, key=lambda k: type_scores[k])


def extract_transaction_type(text: str, has_property_info: bool = False) -> str | None:
    """Detect whether the listing is a sale or rental.

    Args:
        text: Vietnamese listing text.
        has_property_info: If True and no explicit keyword found, defaults to "ban"
            (most listings with property details but no verb are for sale).

    Returns:
        "ban" for sale, "cho_thue" for rent, or None if unclear.
    """
    text_lower = text.lower()

    for keyword in SELL_KEYWORDS:
        if keyword in text_lower:
            return "ban"

    for keyword in RENT_KEYWORDS:
        if keyword in text_lower:
            return "cho_thue"

    # Default to "ban" when the listing has property info (price, area, etc.)
    # but no explicit sell/rent keyword. In Vietnamese RE, most such listings
    # are for sale — rentals almost always say "cho thuê" explicitly.
    if has_property_info:
        return "ban"

    return None


def extract_bedrooms(text: str) -> int | None:
    """Extract number of bedrooms from text.

    Args:
        text: Vietnamese listing text.

    Returns:
        Number of bedrooms or None.
    """
    match = BEDROOM_PATTERN.search(text)
    if match:
        return int(match.group(1))
    return None


def extract_floors(text: str) -> int | None:
    """Extract number of floors from text.

    Args:
        text: Vietnamese listing text.

    Returns:
        Number of floors or None.
    """
    match = FLOOR_PATTERN.search(text)
    if match:
        return int(match.group(1))
    return None


def extract_frontage(text: str) -> float | None:
    """Extract frontage width in meters from text.

    Args:
        text: Vietnamese listing text.

    Returns:
        Frontage in meters or None.
    """
    match = FRONTAGE_PATTERN.search(text)
    if match:
        value = match.group(1) or match.group(2)
        if value:
            return _normalize_number(value)
    return None


def extract_access_road(text: str) -> str | None:
    """Extract road/alley access type from Vietnamese text.

    Args:
        text: Vietnamese listing text.

    Returns:
        Access road classification string or None.
    """
    for pattern, access_type in ACCESS_ROAD_PATTERNS:
        if pattern.search(text):
            return access_type
    return None


def extract_furnished(text: str) -> str | None:
    """Extract furnishing status from Vietnamese text.

    Args:
        text: Vietnamese listing text.

    Returns:
        "full" (fully furnished), "co_ban" (basic), "khong" (unfurnished),
        or None if not mentioned.
    """
    for pattern, status in FURNISHED_PATTERNS:
        if pattern.search(text):
            return status
    return None


# ---------------------------------------------------------------------------
# New feature extractors (19)
# ---------------------------------------------------------------------------


def extract_legal_status(text: str) -> str | None:
    """Extract legal/ownership document status from Vietnamese text.

    Args:
        text: Vietnamese listing text.

    Returns:
        Legal status code or None. Values: "so_hong", "so_do",
        "hoan_cong", "tho_cu", "phap_ly_chuan".
    """
    for pattern, status in LEGAL_STATUS_PATTERNS:
        if pattern.search(text):
            return status
    return None


def extract_bathrooms(text: str) -> int | None:
    """Extract number of bathrooms/WC from text.

    Args:
        text: Vietnamese listing text.

    Returns:
        Number of bathrooms or None.
    """
    match = BATHROOM_PATTERN.search(text)
    if match:
        return int(match.group(1))
    return None


def extract_structure_type(text: str) -> str | None:
    """Extract building structure type from Vietnamese text.

    Args:
        text: Vietnamese listing text.

    Returns:
        Structure type code or None. Values: "me_duc" (concrete frame),
        "gac_lung" (mezzanine), "tret_lau" (ground + upper floors),
        "cap_4" (single-story traditional).
    """
    for pattern, stype in STRUCTURE_TYPE_PATTERNS:
        if pattern.search(text):
            return stype
    return None


def extract_direction(text: str) -> str | None:
    """Extract compass direction/orientation from Vietnamese text.

    Args:
        text: Vietnamese listing text.

    Returns:
        Direction code or None. Values: "dong", "tay", "nam", "bac",
        "dong_nam", "tay_nam", "dong_bac", "tay_bac".
    """
    for pattern, direction in DIRECTION_PATTERNS:
        if pattern.search(text):
            return direction
    return None


def extract_depth(text: str) -> float | None:
    """Extract property depth in meters from text.

    Args:
        text: Vietnamese listing text.

    Returns:
        Depth in meters or None.
    """
    match = DEPTH_PATTERN.search(text)
    if match:
        return _normalize_number(match.group(1))
    return None


def extract_corner_lot(text: str) -> bool:
    """Check if property is a corner lot or has multiple frontages.

    Args:
        text: Vietnamese listing text.

    Returns:
        True if corner lot, False otherwise.
    """
    return bool(CORNER_LOT_PATTERN.search(text))


def extract_price_per_m2(text: str) -> int | None:
    """Extract stated price per square meter from Vietnamese text.

    Args:
        text: Vietnamese listing text.

    Returns:
        Price per m2 in VND or None.
    """
    match = PRICE_PER_M2_PATTERN.search(text)
    if match:
        number = _normalize_number(match.group(1))
        return int(number * 1_000_000)
    return None


def extract_negotiable(text: str) -> bool:
    """Check if price is negotiable.

    Args:
        text: Vietnamese listing text.

    Returns:
        True if negotiable, False otherwise.
    """
    return bool(NEGOTIABLE_PATTERN.search(text))


def extract_rental_income(text: str) -> int | None:
    """Extract current rental income from Vietnamese text.

    Args:
        text: Vietnamese listing text.

    Returns:
        Monthly rental income in VND or None.
    """
    match = RENTAL_INCOME_PATTERN.search(text)
    if match:
        number = _normalize_number(match.group(1))
        return int(number * 1_000_000)
    return None


def extract_elevator(text: str) -> bool:
    """Check if property has an elevator.

    Args:
        text: Vietnamese listing text.

    Returns:
        True if elevator mentioned, False otherwise.
    """
    return bool(ELEVATOR_PATTERN.search(text))


def extract_nearby_amenities(text: str) -> list[str] | None:
    """Extract nearby amenities mentioned in Vietnamese text.

    Args:
        text: Vietnamese listing text.

    Returns:
        List of amenity codes or None. Values include: "bien" (beach),
        "cho" (market), "truong_hoc" (school), "benh_vien" (hospital),
        "sieu_thi" (supermarket), "cong_vien" (park), "bo_ke" (embankment).
    """
    found: list[str] = []
    for pattern, amenity in AMENITY_PATTERNS:
        if pattern.search(text):
            found.append(amenity)
    return found if found else None


def extract_investment_use_case(text: str) -> list[str] | None:
    """Extract investment/use case mentions from Vietnamese text.

    Args:
        text: Vietnamese listing text.

    Returns:
        List of use case codes or None. Values: "dau_tu" (investment),
        "kinh_doanh" (business), "cho_thue" (rental), "homestay",
        "van_phong" (office), "an_cu" (residence).
    """
    found: list[str] = []
    for pattern, use_case in INVESTMENT_PATTERNS:
        if pattern.search(text):
            found.append(use_case)
    return found if found else None


def extract_outdoor_features(text: str) -> list[str] | None:
    """Extract outdoor features from Vietnamese text.

    Args:
        text: Vietnamese listing text.

    Returns:
        List of feature codes or None. Values: "san_vuon" (garden),
        "san_de_xe" (parking), "san_thuong" (rooftop), "gieng_troi" (skylight),
        "san_phoi" (drying area), "ban_cong" (balcony), "ho_boi" (pool).
    """
    found: list[str] = []
    for pattern, feature in OUTDOOR_FEATURE_PATTERNS:
        if pattern.search(text):
            found.append(feature)
    return found if found else None


def extract_special_rooms(text: str) -> list[str] | None:
    """Extract special room mentions from Vietnamese text.

    Args:
        text: Vietnamese listing text.

    Returns:
        List of room codes or None. Values: "phong_tho" (worship room),
        "phong_giat" (laundry room), "bep_rieng" (separate kitchen),
        "phong_khach" (large living room), "gara" (garage).
    """
    found: list[str] = []
    for pattern, room in SPECIAL_ROOM_PATTERNS:
        if pattern.search(text):
            found.append(room)
    return found if found else None


def extract_feng_shui(text: str) -> str | None:
    """Extract feng shui assessment from Vietnamese text.

    Args:
        text: Vietnamese listing text.

    Returns:
        Feng shui rating string or None. Values: "tot" (good),
        "on" (okay), "dep" (beautiful/good).
    """
    match = FENG_SHUI_PATTERN.search(text)
    if match:
        rating = (match.group(1) or match.group(2) or "").lower()
        rating_map = {
            "tốt": "tot",
            "tot": "tot",
            "ổn": "on",
            "on": "on",
            "đẹp": "dep",
            "dep": "dep",
            "xấu": "xau",
            "xau": "xau",
        }
        return rating_map.get(rating, rating)
    return None


def extract_total_construction_area(text: str) -> float | None:
    """Extract total construction/floor area from Vietnamese text.

    Args:
        text: Vietnamese listing text.

    Returns:
        Total construction area in m2 or None.
    """
    match = TOTAL_CONSTRUCTION_AREA_PATTERN.search(text)
    if match:
        return _normalize_number(match.group(1))
    return None


def extract_land_characteristics(text: str) -> str | None:
    """Extract land shape/characteristics from Vietnamese text.

    Args:
        text: Vietnamese listing text.

    Returns:
        Land characteristic code or None. Values: "vuong_van" (square),
        "no_hau" (wider at back), "dat_o_do_thi" (residential urban land).
    """
    for pattern, char in LAND_CHAR_PATTERNS:
        if pattern.search(text):
            return char
    return None


def extract_traffic_connectivity(text: str) -> str | None:
    """Extract traffic/location connectivity from Vietnamese text.

    Args:
        text: Vietnamese listing text.

    Returns:
        Connectivity code or None. Values: "trung_tam" (city center),
        "gan_san_bay" (near airport), "gan_quoc_lo" (near highway),
        "truc_chinh" (main road/business axis).
    """
    for pattern, connectivity in TRAFFIC_PATTERNS:
        if pattern.search(text):
            return connectivity
    return None


def extract_building_type(text: str) -> str | None:
    """Extract building condition/type from Vietnamese text.

    Args:
        text: Vietnamese listing text.

    Returns:
        Building type code or None. Values: "xay_moi" (newly built),
        "kien_co" (solid construction), "nha_cu" (old house),
        "moi_sua" (renovated).
    """
    for pattern, btype in BUILDING_TYPE_PATTERNS:
        if pattern.search(text):
            return btype
    return None


def extract_road_width(text: str) -> float | None:
    """Extract road/street width in meters from Vietnamese text.

    Args:
        text: Vietnamese listing text.

    Returns:
        Road width in meters or None.
    """
    match = ROAD_WIDTH_PATTERN.search(text)
    if match:
        return _normalize_number(match.group(1))
    return None


def extract_distance_to_beach(text: str) -> float | None:
    """Extract distance to beach in meters from Vietnamese text.

    Args:
        text: Vietnamese listing text.

    Returns:
        Distance to beach in meters or None.
    """
    match = DISTANCE_TO_BEACH_PATTERN.search(text)
    if match:
        return _normalize_number(match.group(1))
    return None


def extract_num_frontages(text: str) -> int | None:
    """Extract number of road-facing frontages from Vietnamese text.

    Args:
        text: Vietnamese listing text.

    Returns:
        Number of frontages (2, 3, etc.) or None.
    """
    # Try digit form first: "2 mặt tiền"
    match = NUM_FRONTAGES_PATTERN.search(text)
    if match:
        return int(match.group(1))
    # Try word form: "hai mặt tiền"
    match = NUM_FRONTAGES_WORD_PATTERN.search(text)
    if match:
        word = match.group(1).lower()
        return _VIET_NUM_WORDS.get(word)
    return None


def parse_listing(text: str) -> ParsedListing:
    """Extract all structured fields from a Vietnamese listing text.

    Args:
        text: Vietnamese listing text to parse.

    Returns:
        ParsedListing with all extracted fields and confidence score.
    """
    errors: list[str] = []
    result = ParsedListing()
    result.description = text.strip()

    # Extract core fields
    result.property_type = extract_property_type(text)

    price_raw, price_vnd = extract_price(text)
    result.price_raw = price_raw
    result.price_vnd = price_vnd

    result.area_m2 = extract_area(text)

    location = extract_location(text)
    result.ward = location["ward"]
    result.street = location["street"]
    result.district = location["district"]
    if any(location.values()):
        parts = [v for v in [location["street"], location["ward"], location["district"]] if v]
        result.address_raw = ", ".join(parts)

    result.num_bedrooms = extract_bedrooms(text)
    result.num_floors = extract_floors(text)
    result.frontage_m = extract_frontage(text)

    result.access_road = extract_access_road(text)
    result.furnished = extract_furnished(text)

    # Extract 19 new features
    result.legal_status = extract_legal_status(text)
    result.num_bathrooms = extract_bathrooms(text)
    result.structure_type = extract_structure_type(text)
    result.direction = extract_direction(text)
    result.depth_m = extract_depth(text)
    result.corner_lot = extract_corner_lot(text)
    result.price_per_m2 = extract_price_per_m2(text)
    result.negotiable = extract_negotiable(text)
    result.rental_income_vnd = extract_rental_income(text)
    result.has_elevator = extract_elevator(text)
    result.nearby_amenities = extract_nearby_amenities(text)
    result.investment_use_case = extract_investment_use_case(text)
    result.outdoor_features = extract_outdoor_features(text)
    result.special_rooms = extract_special_rooms(text)
    result.feng_shui = extract_feng_shui(text)
    result.total_construction_area = extract_total_construction_area(text)
    result.land_characteristics = extract_land_characteristics(text)
    result.traffic_connectivity = extract_traffic_connectivity(text)
    result.building_type = extract_building_type(text)

    # Session 9: new scraping-derived extractors
    result.road_width_m = extract_road_width(text)
    result.num_frontages = extract_num_frontages(text)
    result.distance_to_beach_m = extract_distance_to_beach(text)

    # Compute price_per_m2 if not stated explicitly but price and area are known
    if not result.price_per_m2 and result.price_vnd and result.area_m2:
        result.price_per_m2 = int(result.price_vnd / result.area_m2)

    # Determine transaction type — default to "ban" if listing has substantive property info
    has_property_info = any(
        [
            result.property_type,
            result.price_vnd,
            result.area_m2,
        ]
    )
    result.transaction_type = extract_transaction_type(text, has_property_info=has_property_info)

    # Calculate confidence based on how many core fields were extracted
    # (keeping same formula for backward compatibility with Kestra pipeline)
    fields_to_check = [
        result.property_type,
        result.transaction_type,
        result.price_vnd,
        result.area_m2,
        result.ward or result.street,
    ]
    extracted_count = sum(1 for f in fields_to_check if f is not None)
    result.confidence = round(extracted_count / len(fields_to_check), 2)

    if not result.property_type:
        errors.append("Could not determine property type")
    if not result.transaction_type:
        errors.append("Could not determine transaction type (sell/rent)")
    if not result.price_vnd:
        errors.append("Could not extract price")

    result.parse_errors = errors
    return result
