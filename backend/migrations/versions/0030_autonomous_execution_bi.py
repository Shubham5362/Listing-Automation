"""autonomous execution and business opportunities

Revision ID: 0030_autonomous_execution_bi
Revises: 0029_autonomous_command_center
"""
from alembic import op
import sqlalchemy as sa

revision = "0030_autonomous_execution_bi"
down_revision = "0029_autonomous_command_center"
branch_labels = None
depends_on = None

def upgrade():
    op.create_table("autonomous_plans",
        sa.Column("id", sa.Integer(), primary_key=True), sa.Column("seller_account_id", sa.Integer(), nullable=False),
        sa.Column("intent", sa.String(120), nullable=False), sa.Column("status", sa.String(30), nullable=False, server_default="proposed"),
        sa.Column("risk", sa.String(20), nullable=False, server_default="medium"), sa.Column("confidence", sa.Float(), nullable=False, server_default="0"),
        sa.Column("approval_required", sa.Boolean(), nullable=False, server_default=sa.true()), sa.Column("summary_json", sa.Text()),
        sa.Column("created_at", sa.DateTime(), nullable=False), sa.Column("completed_at", sa.DateTime()))
    op.create_index("ix_autonomous_plans_seller", "autonomous_plans", ["seller_account_id"])
    op.create_table("autonomous_plan_items",
        sa.Column("id", sa.Integer(), primary_key=True), sa.Column("plan_id", sa.Integer(), nullable=False), sa.Column("seller_account_id", sa.Integer(), nullable=False),
        sa.Column("marketplace_account_id", sa.Integer()), sa.Column("sku", sa.String(200), nullable=False), sa.Column("operation", sa.String(80), nullable=False),
        sa.Column("payload_json", sa.Text()), sa.Column("status", sa.String(30), nullable=False, server_default="planned"), sa.Column("job_id", sa.Integer()))
    op.create_index("ix_autonomous_plan_items_plan", "autonomous_plan_items", ["plan_id"])
    op.create_index("ix_autonomous_plan_items_seller", "autonomous_plan_items", ["seller_account_id"])
    op.create_table("business_opportunities",
        sa.Column("id", sa.Integer(), primary_key=True), sa.Column("seller_account_id", sa.Integer(), nullable=False), sa.Column("area", sa.String(60), nullable=False),
        sa.Column("title", sa.String(200), nullable=False), sa.Column("priority", sa.String(20), nullable=False, server_default="medium"), sa.Column("score", sa.Float(), nullable=False, server_default="0"),
        sa.Column("reason", sa.Text()), sa.Column("status", sa.String(30), nullable=False, server_default="open"), sa.Column("created_at", sa.DateTime(), nullable=False))
    op.create_index("ix_business_opportunities_seller", "business_opportunities", ["seller_account_id"])

def downgrade():
    op.drop_table("business_opportunities"); op.drop_table("autonomous_plan_items"); op.drop_table("autonomous_plans")
