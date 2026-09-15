"""Enterprise reliability and security controls."""
from alembic import op
import sqlalchemy as sa

revision = "0035_enterprise_reliability_security"
down_revision = "0034_advanced_business_intelligence"
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.create_table("reliability_metrics",
        sa.Column("id", sa.Integer(), primary_key=True), sa.Column("seller_account_id", sa.Integer(), nullable=True),
        sa.Column("component", sa.String(80), nullable=False), sa.Column("metric", sa.String(80), nullable=False),
        sa.Column("value", sa.Float(), nullable=False, server_default="0"), sa.Column("status", sa.String(30), nullable=False, server_default="healthy"),
        sa.Column("recorded_at", sa.DateTime(), nullable=False))
    op.create_index("ix_reliability_metrics_seller_account_id", "reliability_metrics", ["seller_account_id"])
    op.create_index("ix_reliability_metrics_component", "reliability_metrics", ["component"])
    op.create_index("ix_reliability_metrics_recorded_at", "reliability_metrics", ["recorded_at"])
    op.create_table("dependency_health",
        sa.Column("id", sa.Integer(), primary_key=True), sa.Column("dependency", sa.String(80), nullable=False, unique=True),
        sa.Column("status", sa.String(30), nullable=False, server_default="unknown"), sa.Column("latency_ms", sa.Float(), nullable=False, server_default="0"),
        sa.Column("last_error", sa.Text(), nullable=False, server_default=""), sa.Column("checked_at", sa.DateTime(), nullable=False))
    op.create_index("ix_dependency_health_checked_at", "dependency_health", ["checked_at"])
    op.create_table("dead_letter_jobs",
        sa.Column("id", sa.Integer(), primary_key=True), sa.Column("seller_account_id", sa.Integer(), nullable=True),
        sa.Column("job_key", sa.String(160), nullable=False, unique=True), sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("reason", sa.Text(), nullable=False, server_default=""), sa.Column("payload", sa.JSON(), nullable=False), sa.Column("created_at", sa.DateTime(), nullable=False))
    op.create_index("ix_dead_letter_jobs_seller_account_id", "dead_letter_jobs", ["seller_account_id"])
    op.create_index("ix_dead_letter_jobs_created_at", "dead_letter_jobs", ["created_at"])
    op.create_table("autonomous_kill_switches",
        sa.Column("id", sa.Integer(), primary_key=True), sa.Column("seller_account_id", sa.Integer(), nullable=False, unique=True),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default=sa.false()), sa.Column("reason", sa.Text(), nullable=False, server_default=""),
        sa.Column("updated_at", sa.DateTime(), nullable=False))
    op.create_index("ix_autonomous_kill_switches_seller_account_id", "autonomous_kill_switches", ["seller_account_id"])

def downgrade() -> None:
    op.drop_table("autonomous_kill_switches")
    op.drop_table("dead_letter_jobs")
    op.drop_table("dependency_health")
    op.drop_table("reliability_metrics")
