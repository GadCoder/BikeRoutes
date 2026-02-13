"""merge heads

Revision ID: ce2e3d9acf16
Revises: 20260213_0001, 9f2c0b1f6b5a
Create Date: 2026-02-12 23:23:42.151144

"""

from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ce2e3d9acf16'
down_revision: Union[str, None] = ('20260213_0001', '9f2c0b1f6b5a')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass

