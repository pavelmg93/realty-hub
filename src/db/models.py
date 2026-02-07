"""SQLAlchemy ORM models for the application database."""

from datetime import datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    SmallInteger,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """Base class for all ORM models."""


class Agent(Base):
    """Real estate agent who provides listings and uses the platform."""

    __tablename__ = "agents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(50))
    zalo_id: Mapped[str | None] = mapped_column(String(100))
    email: Mapped[str | None] = mapped_column(String(255))
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )
    # Auth fields
    username: Mapped[str | None] = mapped_column(String(100))
    password_hash: Mapped[str | None] = mapped_column(String(255))
    first_name: Mapped[str | None] = mapped_column(String(100))
    last_name: Mapped[str | None] = mapped_column(String(100))

    __table_args__ = (
        Index("idx_agents_username", "username", unique=True, postgresql_where="username IS NOT NULL"),
    )


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
    agent_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("agents.id"))

    __table_args__ = (
        CheckConstraint(
            "status IN ('pending', 'parsed', 'failed', 'skipped')",
            name="ck_raw_listings_status",
        ),
        Index("idx_raw_status", "status"),
        Index("idx_raw_agent", "agent_id"),
    )


class ParsedListing(Base):
    """Structured data extracted from raw listings or created via web UI."""

    __tablename__ = "parsed_listings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    raw_listing_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("raw_listings.id"))
    listing_hash: Mapped[str | None] = mapped_column(String(32))
    message_date: Mapped[datetime | None] = mapped_column(DateTime)
    # Core fields
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
    access_road: Mapped[str | None] = mapped_column(String(255))
    furnished: Mapped[str | None] = mapped_column(String(50))
    description: Mapped[str | None] = mapped_column(Text)
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    parsed_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    parse_errors: Mapped[str | None] = mapped_column(Text)
    # 19 new feature columns
    legal_status: Mapped[str | None] = mapped_column(String(50))
    num_bathrooms: Mapped[int | None] = mapped_column(SmallInteger)
    structure_type: Mapped[str | None] = mapped_column(String(50))
    direction: Mapped[str | None] = mapped_column(String(50))
    depth_m: Mapped[float | None] = mapped_column(Float)
    corner_lot: Mapped[bool] = mapped_column(Boolean, default=False)
    price_per_m2: Mapped[int | None] = mapped_column(BigInteger)
    negotiable: Mapped[bool] = mapped_column(Boolean, default=False)
    rental_income_vnd: Mapped[int | None] = mapped_column(BigInteger)
    has_elevator: Mapped[bool] = mapped_column(Boolean, default=False)
    nearby_amenities: Mapped[dict | None] = mapped_column(JSONB)
    investment_use_case: Mapped[dict | None] = mapped_column(JSONB)
    outdoor_features: Mapped[dict | None] = mapped_column(JSONB)
    special_rooms: Mapped[dict | None] = mapped_column(JSONB)
    feng_shui: Mapped[str | None] = mapped_column(String(50))
    total_construction_area: Mapped[float | None] = mapped_column(Float)
    land_characteristics: Mapped[str | None] = mapped_column(String(100))
    traffic_connectivity: Mapped[str | None] = mapped_column(String(100))
    building_type: Mapped[str | None] = mapped_column(String(50))
    # Web app management columns
    agent_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("agents.id"))
    status: Mapped[str] = mapped_column(String(20), default="for_sale")
    archived_at: Mapped[datetime | None] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    freestyle_text: Mapped[str | None] = mapped_column(Text)

    __table_args__ = (
        CheckConstraint(
            "status IN ('for_sale', 'in_negotiations', 'pending_closing', 'sold', 'not_for_sale')",
            name="ck_parsed_listings_status",
        ),
        Index("idx_parsed_price", "price_vnd"),
        Index("idx_parsed_ward", "ward"),
        Index("idx_parsed_type", "property_type"),
        Index("idx_parsed_agent", "agent_id"),
        Index("idx_parsed_status_col", "status"),
        Index("idx_parsed_archived", "archived_at"),
        Index("idx_parsed_created", "created_at"),
    )


class Conversation(Base):
    """Conversation thread between two agents."""

    __tablename__ = "conversations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    agent_1_id: Mapped[int] = mapped_column(Integer, ForeignKey("agents.id"), nullable=False)
    agent_2_id: Mapped[int] = mapped_column(Integer, ForeignKey("agents.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    __table_args__ = (
        CheckConstraint("agent_1_id < agent_2_id", name="ck_conversations_ordered"),
        UniqueConstraint("agent_1_id", "agent_2_id", name="uq_conversations_pair"),
        Index("idx_conversations_agent1", "agent_1_id"),
        Index("idx_conversations_agent2", "agent_2_id"),
    )


class Message(Base):
    """Individual message within a conversation."""

    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    conversation_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("conversations.id"), nullable=False
    )
    sender_id: Mapped[int] = mapped_column(Integer, ForeignKey("agents.id"), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    listing_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("parsed_listings.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    read_at: Mapped[datetime | None] = mapped_column(DateTime)

    __table_args__ = (
        Index("idx_messages_conversation", "conversation_id"),
        Index("idx_messages_sender", "sender_id"),
        Index("idx_messages_listing", "listing_id"),
        Index("idx_messages_created", "created_at"),
    )
