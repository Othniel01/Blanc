"""added is_default for project stages

Revision ID: 022013fe2108
Revises: e20e8343cdb6
Create Date: 2025-09-11 12:47:05.621037

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "022013fe2108"
down_revision: Union[str, Sequence[str], None] = "e20e8343cdb6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.add_column(
        "stages",
        sa.Column("is_default", sa.Boolean(), nullable=False, server_default="false"),
    )


def downgrade():
    op.drop_column("stages", "is_default")
