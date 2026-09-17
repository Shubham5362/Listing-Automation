"""add full AI diagnostics and safe auto-fix tables

Revision ID: 0025_ai_diagnostics
Revises: 0024_listing_intelligence
"""
from alembic import op
import sqlalchemy as sa

revision = "0025_ai_diagnostics"
down_revision = "0024_listing_intelligence"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table("diagnostics",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("seller_account_id", sa.Integer(), sa.ForeignKey("seller_accounts.id"), nullable=False),
        sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id")),
        sa.Column("listing_id", sa.Integer(), sa.ForeignKey("listings.id")),
        sa.Column("marketplace_account_id", sa.Integer(), sa.ForeignKey("marketplace_accounts.id")),
        sa.Column("code", sa.String(100), nullable=False),
        sa.Column("category", sa.String(50), nullable=False),
        sa.Column("severity", sa.String(20), nullable=False, server_default="medium"),
        sa.Column("status", sa.String(30), nullable=False, server_default="open"),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("root_cause", sa.Text(), nullable=False),
        sa.Column("impact_json", sa.Text(), nullable=False, server_default="{}"),
        sa.Column("proposed_fix_json", sa.Text(), nullable=False, server_default="{}"),
        sa.Column("confidence", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("fix_risk", sa.String(20), nullable=False, server_default="medium"),
        sa.Column("auto_fixable", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False))
    for col in ("seller_account_id", "product_id", "listing_id", "marketplace_account_id", "code", "severity", "status"):
        op.create_index("ix_diagnostics_" + col, "diagnostics", [col])
    op.create_table("diagnostic_fixes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("diagnostic_id", sa.Integer(), sa.ForeignKey("diagnostics.id"), nullable=False),
        sa.Column("mode", sa.String(20), nullable=False, server_default="dry_run"),
        sa.Column("before_json", sa.Text(), nullable=False, server_default="{}"),
        sa.Column("after_json", sa.Text(), nullable=False, server_default="{}"),
        sa.Column("change_set_json", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("approved_by", sa.Integer(), sa.ForeignKey("users.id")),
        sa.Column("executed", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("verification_status", sa.String(30), nullable=False, server_default="not_verified"),
        sa.Column("verification_message", sa.Text()),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("executed_at", sa.DateTime()))
    op.create_index("ix_diagnostic_fixes_diagnostic", "diagnostic_fixes", ["diagnostic_id"])
    op.create_table("diagnostic_verifications",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("diagnostic_id", sa.Integer(), sa.ForeignKey("diagnostics.id"), nullable=False),
        sa.Column("fix_id", sa.Integer(), sa.ForeignKey("diagnostic_fixes.id")),
        sa.Column("passed", sa.Boolean(), nullable=False),
        sa.Column("checks_json", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False))
    op.create_index("ix_diagnostic_verifications_diagnostic", "diagnostic_verifications", ["diagnostic_id"])
    op.create_index("ix_diagnostic_verifications_fix", "diagnostic_verifications", ["fix_id"])


def downgrade() -> None:
    op.drop_index("ix_diagnostic_verifications_fix", table_name="diagnostic_verifications")
    op.drop_index("ix_diagnostic_verifications_diagnostic", table_name="diagnostic_verifications")
    op.drop_table("diagnostic_verifications")
    op.drop_index("ix_diagnostic_fixes_diagnostic", table_name="diagnostic_fixes")
    op.drop_table("diagnostic_fixes")
    for col in ("status", "severity", "code", "marketplace_account_id", "listing_id", "product_id", "seller_account_id"):
        op.drop_index("ix_diagnostics_" + col, table_name="diagnostics")
    op.drop_table("diagnostics")
