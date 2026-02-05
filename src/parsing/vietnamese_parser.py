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

# Nha Trang specific location keywords
NHA_TRANG_WARDS = [
    "Vĩnh Hòa",
    "Vĩnh Hải",
    "Vĩnh Phước",
    "Vĩnh Thọ",
    "Xương Huân",
    "Vạn Thắng",
    "Vạn Thạnh",
    "Phương Sài",
    "Phương Sơn",
    "Ngọc Hiệp",
    "Phước Hòa",
    "Phước Tân",
    "Phước Tiến",
    "Phước Hải",
    "Phước Long",
    "Lộc Thọ",
    "Tân Lập",
    "Vĩnh Nguyên",
    "Vĩnh Trường",
]


@dataclass
class ParsedListing:
    """Structured data extracted from a Vietnamese listing text."""

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
    description: str | None = None
    confidence: float = 0.0
    parse_errors: list[str] = field(default_factory=list)


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
        location["street"] = street_match.group(1).strip()

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

    Args:
        text: Vietnamese listing text.

    Returns:
        Canonical property type string or None.
    """
    text_lower = text.lower()
    for keyword, ptype in _PROPERTY_KEYWORD_MAP.items():
        if keyword in text_lower:
            return ptype
    return None


def extract_transaction_type(text: str) -> str | None:
    """Detect whether the listing is a sale or rental.

    Args:
        text: Vietnamese listing text.

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

    # Extract each field
    result.property_type = extract_property_type(text)
    result.transaction_type = extract_transaction_type(text)

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

    # Calculate confidence based on how many fields were extracted
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
