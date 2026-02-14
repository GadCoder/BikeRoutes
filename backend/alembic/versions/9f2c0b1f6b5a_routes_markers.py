"""routes + markers tables (PostGIS)

Revision ID: 9f2c0b1f6b5a
Revises:
Create Date: 2026-02-13
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from geoalchemy2 import Geometry

revision = "9f2c0b1f6b5a"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Extensions should be provisioned by the DB image/admin.
    # Creating extensions often requires superuser privileges, which the app DB user may not have.
    # postgis/postgis images already ship with PostGIS available.

    op.create_table(
        "routes",
        sa.Column(
            "id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            primary_key=True,
            nullable=False,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("user_id", sa.dialects.postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("geometry", Geometry(geometry_type="LINESTRING", srid=4326), nullable=False),
        sa.Column("distance_km", sa.Float(), nullable=False, server_default=sa.text("0")),
        sa.Column("is_public", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("share_token", sa.String(length=64), nullable=True, unique=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )

    op.create_index("ix_routes_user_id", "routes", ["user_id"])
    op.create_index("ix_routes_geometry_gist", "routes", ["geometry"], postgresql_using="gist")
    op.create_index(
        "ix_routes_public_true",
        "routes",
        ["is_public"],
        postgresql_where=sa.text("is_public = true"),
    )

    op.create_table(
        "markers",
        sa.Column(
            "id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            primary_key=True,
            nullable=False,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "route_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("routes.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("geometry", Geometry(geometry_type="POINT", srid=4326), nullable=False),
        sa.Column("label", sa.String(length=100), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("icon_type", sa.String(length=50), nullable=False, server_default=sa.text("'default'")),
        sa.Column("order_index", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("route_id", "order_index", name="uq_markers_route_order_index"),
    )

    op.create_index("ix_markers_route_id", "markers", ["route_id"])
    op.create_index("ix_markers_geometry_gist", "markers", ["geometry"], postgresql_using="gist")


def downgrade() -> None:
    op.drop_index("ix_markers_geometry_gist", table_name="markers")
    op.drop_index("ix_markers_route_id", table_name="markers")
    op.drop_table("markers")

    op.drop_index("ix_routes_public_true", table_name="routes")
    op.drop_index("ix_routes_geometry_gist", table_name="routes")
    op.drop_index("ix_routes_user_id", table_name="routes")
    op.drop_table("routes")
