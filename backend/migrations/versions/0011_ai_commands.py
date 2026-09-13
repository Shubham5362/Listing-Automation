"""add AI command center history

Revision ID: 0011_ai_commands
Revises: 0010_automation
"""

from alembic import op
import sqlalchemy as sa

revision = "0011_ai_commands"
down_revision = "0010_automation"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "ai_commands",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("seller_account_id", sa.Integer(), sa.ForeignKey("seller_accounts.id"), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("query", sa.Text(), nullable=False),
        sa.Column("intent", sa.String(length=64), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("response", sa.JSON(), nullable=False),
        sa.Column("trace_id", sa.String(length=64), nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_ai_commands_seller_account_id", "ai_commands", ["seller_account_id"])
    op.create_index("ix_ai_commands_user_id", "ai_commands", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_ai_commands_user_id", table_name="ai_commands")
    op.drop_index("ix_ai_commands_seller_account_id", table_name="ai_commands")
    op.drop_table("ai_commands")
