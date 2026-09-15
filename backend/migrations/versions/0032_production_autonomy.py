"""production autonomy hardening

Revision ID: 0032_production_autonomy
Revises: 0031_ai_business_autopilot
"""
from alembic import op
import sqlalchemy as sa

revision = "0032_production_autonomy"
down_revision = "0031_ai_business_autopilot"
branch_labels = None
depends_on = None

def upgrade():
    op.create_table("autonomous_workflow_runs",
        sa.Column("id", sa.Integer(), primary_key=True), sa.Column("seller_account_id", sa.Integer(), nullable=False),
        sa.Column("workflow_key", sa.String(120), nullable=False), sa.Column("status", sa.String(30), nullable=False, server_default="queued"),
        sa.Column("idempotency_key", sa.String(180), nullable=False, unique=True), sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("error", sa.Text()), sa.Column("started_at", sa.DateTime()), sa.Column("completed_at", sa.DateTime()), sa.Column("created_at", sa.DateTime(), nullable=False))
    op.create_index("ix_workflow_runs_seller", "autonomous_workflow_runs", ["seller_account_id"])
    op.create_index("ix_workflow_runs_key", "autonomous_workflow_runs", ["workflow_key"])
    op.create_table("autonomous_safety_policies",
        sa.Column("id", sa.Integer(), primary_key=True), sa.Column("seller_account_id", sa.Integer(), nullable=False),
        sa.Column("mode", sa.String(20), nullable=False, server_default="approval"), sa.Column("max_financial_impact", sa.Float(), nullable=False, server_default="5000"),
        sa.Column("max_auto_actions_per_day", sa.Integer(), nullable=False, server_default="50"), sa.Column("enabled", sa.Boolean(), nullable=False, server_default=sa.true()), sa.Column("updated_at", sa.DateTime(), nullable=False))
    op.create_index("ix_safety_policy_seller", "autonomous_safety_policies", ["seller_account_id"])
    op.create_table("system_health_snapshots",
        sa.Column("id", sa.Integer(), primary_key=True), sa.Column("seller_account_id", sa.Integer(), nullable=False), sa.Column("status", sa.String(20), nullable=False, server_default="healthy"),
        sa.Column("queue_depth", sa.Integer(), nullable=False, server_default="0"), sa.Column("failed_jobs", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("active_workflows", sa.Integer(), nullable=False, server_default="0"), sa.Column("autonomous_success_rate", sa.Float(), nullable=False, server_default="0"), sa.Column("created_at", sa.DateTime(), nullable=False))
    op.create_index("ix_health_snapshots_seller", "system_health_snapshots", ["seller_account_id"])

def downgrade():
    op.drop_table("system_health_snapshots")
    op.drop_table("autonomous_safety_policies")
    op.drop_table("autonomous_workflow_runs")
