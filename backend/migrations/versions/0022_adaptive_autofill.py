"""add adaptive autofill sessions and action audit tables

Revision ID: 0022_adaptive_autofill
Revises: 0021_marketplace_adapter
"""
from alembic import op
import sqlalchemy as sa

revision = "0022_adaptive_autofill"
down_revision = "0021_marketplace_adapter"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "autofill_sessions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("seller_account_id", sa.Integer(), sa.ForeignKey("seller_accounts.id"), nullable=False),
        sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id"), nullable=False),
        sa.Column("marketplace", sa.String(50), nullable=False),
        sa.Column("mode", sa.String(20), nullable=False, server_default="review"),
        sa.Column("state", sa.String(30), nullable=False, server_default="created"),
        sa.Column("page_context_json", sa.Text(), nullable=False, server_default="{}"),
        sa.Column("summary_json", sa.Text(), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_autofill_sessions_seller", "autofill_sessions", ["seller_account_id"])
    op.create_index("ix_autofill_sessions_product", "autofill_sessions", ["product_id"])
    op.create_index("ix_autofill_sessions_marketplace", "autofill_sessions", ["marketplace"])
    op.create_index("ix_autofill_sessions_state", "autofill_sessions", ["state"])

    op.create_table(
        "autofill_actions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("session_id", sa.Integer(), sa.ForeignKey("autofill_sessions.id"), nullable=False),
        sa.Column("field_name", sa.String(200), nullable=False),
        sa.Column("canonical", sa.String(100), nullable=False),
        sa.Column("action", sa.String(30), nullable=False),
        sa.Column("proposed_value", sa.Text()),
        sa.Column("confidence", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("status", sa.String(30), nullable=False, server_default="planned"),
        sa.Column("verification_status", sa.String(30), nullable=False, server_default="not_verified"),
        sa.Column("reason", sa.Text()),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_autofill_actions_session", "autofill_actions", ["session_id"])
    op.create_index("ix_autofill_actions_status", "autofill_actions", ["status"])

    op.create_table(
        "autofill_errors",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("session_id", sa.Integer(), sa.ForeignKey("autofill_sessions.id"), nullable=False),
        sa.Column("code", sa.String(80), nullable=False),
        sa.Column("field_name", sa.String(200)),
        sa.Column("severity", sa.String(20), nullable=False, server_default="error"),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("recoverable", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_autofill_errors_session", "autofill_errors", ["session_id"])


def downgrade() -> None:
    op.drop_index("ix_autofill_errors_session", table_name="autofill_errors")
    op.drop_table("autofill_errors")
    op.drop_index("ix_autofill_actions_status", table_name="autofill_actions")
    op.drop_index("ix_autofill_actions_session", table_name="autofill_actions")
    op.drop_table("autofill_actions")
    op.drop_index("ix_autofill_sessions_state", table_name="autofill_sessions")
    op.drop_index("ix_autofill_sessions_marketplace", table_name="autofill_sessions")
    op.drop_index("ix_autofill_sessions_product", table_name="autofill_sessions")
    op.drop_index("ix_autofill_sessions_seller", table_name="autofill_sessions")
    op.drop_table("autofill_sessions")
