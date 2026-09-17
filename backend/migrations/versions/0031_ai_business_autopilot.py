"""AI business autopilot and predictive seller intelligence

Revision ID: 0031_ai_business_autopilot
Revises: 0030_autonomous_execution_bi
"""
from alembic import op
import sqlalchemy as sa

revision = "0031_ai_business_autopilot"
down_revision = "0030_autonomous_execution_bi"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "business_predictions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("seller_account_id", sa.Integer(), nullable=False),
        sa.Column("prediction_type", sa.String(60), nullable=False),
        sa.Column("horizon_days", sa.Integer(), nullable=False),
        sa.Column("score", sa.Float(), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("reason", sa.Text()),
        sa.Column("recommended_action", sa.Text()),
        sa.Column("status", sa.String(30), nullable=False, server_default="open"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_business_predictions_seller", "business_predictions", ["seller_account_id"])
    op.create_index("ix_business_predictions_type", "business_predictions", ["prediction_type"])

    op.create_table(
        "autopilot_runs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("seller_account_id", sa.Integer(), nullable=False),
        sa.Column("mode", sa.String(20), nullable=False, server_default="recommend"),
        sa.Column("status", sa.String(30), nullable=False, server_default="completed"),
        sa.Column("decision_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("auto_action_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("approval_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_autopilot_runs_seller", "autopilot_runs", ["seller_account_id"])


def downgrade():
    op.drop_table("autopilot_runs")
    op.drop_table("business_predictions")
