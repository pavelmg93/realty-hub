"""SQLAlchemy ORM models for the application database."""

from datetime import datetime

from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    DateTime,
    Float,
    Index,
    Integer,
    SmallInteger,
    String,
    Text,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """Base class for all ORM models."""


class RawListing(Base):
    """Raw ingested listing data, exactly as received from source."""

    __tablename__ = "raw_listings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    source: Mapped[str] = mapped_column(String(50), nullable=False, default="zalo_manual")
    source_group: Mapped[str | None] = mapped_column(String(255))
    sender_name: Mapped[str | None] = mapped_column(String(255))
    message_text: Mapped[str] = mapped_column(Text, nullable=False)
    message_date: Mapped[datetime | None] = mapped_column(DateTime)
    ingested_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )
    batch_id: Mapped[str | None] = mapped_column(String(100))
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")

    __table_args__ = (
        CheckConstraint(
            "status IN ('pending', 'parsed', 'failed', 'skipped')",
            name="ck_raw_listings_status",
        ),
        Index("idx_raw_status", "status"),
    )


class ParsedListing(Base):
    """Structured data extracted from raw listings."""

    __tablename__ = "parsed_listings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    raw_listing_id: Mapped[int | None] = mapped_column(Integer)
    property_type: Mapped[str | None] = mapped_column(String(50))
    transaction_type: Mapped[str | None] = mapped_column(String(20))
    price_raw: Mapped[str | None] = mapped_column(String(100))
    price_vnd: Mapped[int | None] = mapped_column(BigInteger)
    area_m2: Mapped[float | None] = mapped_column(Float)
    address_raw: Mapped[str | None] = mapped_column(String(500))
    ward: Mapped[str | None] = mapped_column(String(100))
    street: Mapped[str | None] = mapped_column(String(255))
    district: Mapped[str | None] = mapped_column(String(100))
    num_bedrooms: Mapped[int | None] = mapped_column(SmallInteger)
    num_floors: Mapped[int | None] = mapped_column(SmallInteger)
    frontage_m: Mapped[float | None] = mapped_column(Float)
    description: Mapped[str | None] = mapped_column(Text)
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    parsed_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    parse_errors: Mapped[str | None] = mapped_column(Text)

    __table_args__ = (
        Index("idx_parsed_price", "price_vnd"),
        Index("idx_parsed_ward", "ward"),
        Index("idx_parsed_type", "property_type"),
    )
