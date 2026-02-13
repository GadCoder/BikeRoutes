from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from geoalchemy2 import Geometry
from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base


class Marker(Base):
    __tablename__ = "markers"
    __table_args__ = (
        UniqueConstraint("route_id", "order_index", name="uq_markers_route_order_index"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    route_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("routes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    geometry: Mapped[object] = mapped_column(Geometry(geometry_type="POINT", srid=4326), nullable=False)

    label: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    icon_type: Mapped[str] = mapped_column(String(50), nullable=False, default="default", server_default="default")
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    route: Mapped["Route"] = relationship(back_populates="markers")


from app.models.route import Route  # noqa: E402  (circular relationship)
