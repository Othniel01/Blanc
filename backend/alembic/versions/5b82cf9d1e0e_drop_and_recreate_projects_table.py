"""Drop and recreate projects table

Revision ID: 5b82cf9d1e0e
Revises: 022013fe2108
Create Date: 2025-09-12 22:12:28.729035

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "5b82cf9d1e0e"
down_revision: Union[str, Sequence[str], None] = "022013fe2108"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # Drop the existing table
    op.drop_table("projects")

    # Recreate the table with the new schema (no UNIQUE on name)
    op.create_table(
        "projects",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("name", sa.String, nullable=False, index=True),
        sa.Column("description", sa.Text),
        sa.Column("owner_id", sa.Integer),
        sa.Column("end_date", sa.Date),
        sa.Column("allow_milestones", sa.Boolean, default=False),
        sa.Column("allow_timesheets", sa.Boolean, default=False),
        sa.Column("status", sa.String),
        sa.Column("active", sa.Boolean, default=True),
        sa.Column("is_favourite", sa.Boolean, default=False),
        sa.Column("updated_at", sa.DateTime),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
        sa.Column("start_date", sa.DateTime),
    )


def downgrade():
    # Optional: drop table if downgrading
    op.drop_table("projects")
