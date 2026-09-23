from alembic import op
import sqlalchemy as sa

revision = "0045_seller_intelligence"
down_revision = "0044_inventory_price_automation"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "seller_intelligence_snapshots",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("seller_account_id", sa.Integer(), sa.ForeignKey("seller_accounts.id"), nullable=False),
        sa.Column("health_score", sa.Integer(), nullable=False),
        sa.Column("health_status", sa.String(30), nullable=False),
        sa.Column("metrics_json", sa.Text(), nullable=False),
        sa.Column("generated_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_seller_intelligence_snapshots_seller", "seller_intelligence_snapshots", ["seller_account_id"])
    op.create_index("ix_seller_intelligence_snapshots_generated", "seller_intelligence_snapshots", ["generated_at"])
    op.create_table(
        "seller_intelligence_recommendations",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("seller_account_id", sa.Integer(), sa.ForeignKey("seller_accounts.id"), nullable=False),
        sa.Column("snapshot_id", sa.Integer(), sa.ForeignKey("seller_intelligence_snapshots.id"), nullable=False),
        sa.Column("category", sa.String(50), nullable=False),
        sa.Column("severity", sa.String(20), nullable=False),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("evidence", sa.Text(), nullable=False),
        sa.Column("recommendation", sa.Text(), nullable=False),
        sa.Column("status", sa.String(30), nullable=False, server_default="open"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("resolved_at", sa.DateTime()),
    )
    for name, column in (("seller", "seller_account_id"), ("snapshot", "snapshot_id"), ("category", "category"), ("severity", "severity"), ("status", "status")):
        op.create_index(f"ix_seller_intelligence_recommendations_{name}", "seller_intelligence_recommendations", [column])


def downgrade():
    for name in ("status", "severity", "category", "snapshot", "seller"):
        op.drop_index(f"ix_seller_intelligence_recommendations_{name}", table_name="seller_intelligence_recommendations")
    op.drop_table("seller_intelligence_recommendations")
    op.drop_index("ix_seller_intelligence_snapshots_generated", table_name="seller_intelligence_snapshots")
    op.drop_index("ix_seller_intelligence_snapshots_seller", table_name="seller_intelligence_snapshots")
    op.drop_table("seller_intelligence_snapshots")
