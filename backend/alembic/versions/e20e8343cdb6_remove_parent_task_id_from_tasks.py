"""remove parent_task_id from tasks

Revision ID: e20e8343cdb6
Revises: 83032c496e84
Create Date: 2025-09-07 23:40:35.117834

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "e20e8343cdb6"
down_revision: Union[str, Sequence[str], None] = "83032c496e84"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # Use batch mode to safely drop parent_task_id
    with op.batch_alter_table("tasks") as batch_op:
        batch_op.drop_column("parent_task_id")


def downgrade():
    with op.batch_alter_table("tasks") as batch_op:
        batch_op.add_column(sa.Column("parent_task_id", sa.Integer(), nullable=True))
        batch_op.create_foreign_key(
            "tasks_parent_task_id_fkey", "tasks", ["parent_task_id"], ["id"]
        )
