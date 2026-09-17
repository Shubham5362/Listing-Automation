"""autonomous command center

Revision ID: 0029_autonomous_command_center
Revises: 0028_self_learning_feedback
"""
from alembic import op
import sqlalchemy as sa

revision = "0029_autonomous_command_center"
down_revision = "0028_self_learning_feedback"
branch_labels = None
depends_on = None

def upgrade():
    op.create_table("autonomous_incidents",
        sa.Column("id", sa.Integer(), primary_key=True), sa.Column("seller_account_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(200), nullable=False), sa.Column("severity", sa.String(20), nullable=False, server_default="info"),
        sa.Column("status", sa.String(30), nullable=False, server_default="detected"), sa.Column("source", sa.String(80), nullable=False),
        sa.Column("root_cause", sa.Text()), sa.Column("impact_json", sa.Text()), sa.Column("created_at", sa.DateTime(), nullable=False), sa.Column("updated_at", sa.DateTime(), nullable=False))
    op.create_index("ix_autonomous_incidents_seller", "autonomous_incidents", ["seller_account_id"])
    op.create_table("autonomous_actions",
        sa.Column("id", sa.Integer(), primary_key=True), sa.Column("seller_account_id", sa.Integer(), nullable=False), sa.Column("incident_id", sa.Integer()),
        sa.Column("action", sa.String(120), nullable=False), sa.Column("risk", sa.String(20), nullable=False, server_default="low"), sa.Column("confidence", sa.Float(), nullable=False, server_default="0"),
        sa.Column("approval_required", sa.Boolean(), nullable=False, server_default=sa.false()), sa.Column("status", sa.String(30), nullable=False, server_default="proposed"),
        sa.Column("verification_status", sa.String(30), nullable=False, server_default="pending"), sa.Column("reason", sa.Text()), sa.Column("created_at", sa.DateTime(), nullable=False), sa.Column("completed_at", sa.DateTime()))
    op.create_index("ix_autonomous_actions_seller", "autonomous_actions", ["seller_account_id"])
    op.create_index("ix_autonomous_actions_incident", "autonomous_actions", ["incident_id"])
    op.create_table("autonomous_audits",
        sa.Column("id", sa.Integer(), primary_key=True), sa.Column("seller_account_id", sa.Integer(), nullable=False), sa.Column("action_id", sa.Integer()),
        sa.Column("event", sa.String(80), nullable=False), sa.Column("details_json", sa.Text()), sa.Column("created_at", sa.DateTime(), nullable=False))
    op.create_index("ix_autonomous_audits_seller", "autonomous_audits", ["seller_account_id"])
    op.create_index("ix_autonomous_audits_action", "autonomous_audits", ["action_id"])

def downgrade():
    op.drop_table("autonomous_audits"); op.drop_table("autonomous_actions"); op.drop_table("autonomous_incidents")
