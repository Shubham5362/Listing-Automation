"""autofill clarification human in the loop

Revision ID: 0040_autofill_clarifications
Revises: 0039_master_listing_teach
"""
from alembic import op
import sqlalchemy as sa

revision = "0040_autofill_clarifications"
down_revision = "0039_master_listing_teach"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "autofill_clarifications",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("session_id", sa.Integer(), sa.ForeignKey("autofill_sessions.id"), nullable=False),
        sa.Column("action_id", sa.Integer(), sa.ForeignKey("autofill_actions.id"), nullable=True),
        sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id"), nullable=False),
        sa.Column("marketplace", sa.String(length=50), nullable=False),
        sa.Column("category", sa.String(length=200), nullable=True),
        sa.Column("reason_code", sa.String(length=40), nullable=False),
        sa.Column("field_label", sa.String(length=200), nullable=False),
        sa.Column("marketplace_field", sa.String(length=200), nullable=False),
        sa.Column("canonical", sa.String(length=100), nullable=True),
        sa.Column("prompt", sa.Text(), nullable=False),
        sa.Column("context_json", sa.Text(), nullable=False, server_default="{}"),
        sa.Column("expected_input_type", sa.String(length=40), nullable=False, server_default="string"),
        sa.Column("unit", sa.String(length=40), nullable=True),
        sa.Column("options_json", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("required", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("confidence_before", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("answer", sa.Text(), nullable=True),
        sa.Column("normalized_answer", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("answered_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    for name, column in [
        ("ix_autofill_clarifications_session_id", "session_id"),
        ("ix_autofill_clarifications_action_id", "action_id"),
        ("ix_autofill_clarifications_product_id", "product_id"),
        ("ix_autofill_clarifications_status", "status"),
    ]:
        op.create_index(name, "autofill_clarifications", [column])


def downgrade() -> None:
    for name in [
        "ix_autofill_clarifications_status",
        "ix_autofill_clarifications_product_id",
        "ix_autofill_clarifications_action_id",
        "ix_autofill_clarifications_session_id",
    ]:
        op.drop_index(name, table_name="autofill_clarifications")
    op.drop_table("autofill_clarifications")
