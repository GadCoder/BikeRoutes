from __future__ import annotations

import uuid
from datetime import datetime

from geoalchemy2 import Geometry
from sqlalchemy import Boolean, DateTime, Float, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base


class Route(Base):
    __tablename__ = "routes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # NOTE: FK to users(id) will be added once auth/users migration lands (Agent B).
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    geometry: Mapped[object] = mapped_column(Geometry(geometry_type="LINESTRING", srid=4326), nullable=False)

    distance_km: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    is_public: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false", index=True)
    share_token: Mapped[str | None] = mapped_column(String(64), nullable=True, unique=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    markers: Mapped[list["Marker"]] = relationship(
        back_populates="route",
        cascade="all, delete-orphan",
        order_by="Marker.order_index",
        lazy="selectin",
    )


from app.models.marker import Marker  # noqa: E402  (circular relationship)

