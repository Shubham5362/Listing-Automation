"""add automation rules and execution history

Revision ID: 0010_automation
Revises: 0009_merge_migration_heads
"""

from alembic import op
import sqlalchemy as sa

revision = "0010_automation"
down_revision = "0009_merge_migration_heads"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "automation_rules",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("seller_account_id", sa.Integer(), sa.ForeignKey("seller_accounts.id"), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("trigger_type", sa.String(length=32), nullable=False),
        sa.Column("trigger_config", sa.JSON(), nullable=False),
        sa.Column("conditions", sa.JSON(), nullable=False),
        sa.Column("actions", sa.JSON(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("enabled", sa.Boolean(), nullable=False),
        sa.Column("last_run_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_automation_rules_seller_account_id", "automation_rules", ["seller_account_id"])
    op.create_table(
        "automation_runs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("automation_rule_id", sa.Integer(), sa.ForeignKey("automation_rules.id"), nullable=False),
        sa.Column("seller_account_id", sa.Integer(), sa.ForeignKey("seller_accounts.id"), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("trigger_context", sa.JSON(), nullable=False),
        sa.Column("result", sa.JSON(), nullable=False),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_automation_runs_automation_rule_id", "automation_runs", ["automation_rule_id"])
    op.create_index("ix_automation_runs_seller_account_id", "automation_runs", ["seller_account_id"])


def downgrade() -> None:
    op.drop_index("ix_automation_runs_seller_account_id", table_name="automation_runs")
    op.drop_index("ix_automation_runs_automation_rule_id", table_name="automation_runs")
    op.drop_table("automation_runs")
    op.drop_index("ix_automation_rules_seller_account_id", table_name="automation_rules")
    op.drop_table("automation_rules")
