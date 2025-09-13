"""Fix Drop and recreate projects table

Revision ID: 3f2fd8922a40
Revises: 5b82cf9d1e0e
Create Date: 2025-09-12 22:18:56.644536

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "3f2fd8922a40"
down_revision: Union[str, Sequence[str], None] = "5b82cf9d1e0e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
