"""add inventory intelligence

Revision ID: 0017_inventory_intelligence
Revises: 0016_product_media
"""
from alembic import op
import sqlalchemy as sa
revision = "0017_inventory_intelligence"
down_revision = "0016_product_media"
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.create_table("inventory_intelligence",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("seller_account_id", sa.Integer(), sa.ForeignKey("seller_accounts.id"), nullable=False),
        sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id"), nullable=False),
        sa.Column("warehouse", sa.String(100), nullable=False, server_default="default"),
        sa.Column("sales_velocity", sa.Numeric(12,4), nullable=False, server_default="0"),
        sa.Column("days_inventory", sa.Numeric(12,2), nullable=True),
        sa.Column("reorder_point", sa.Numeric(12,2), nullable=False, server_default="0"),
        sa.Column("demand_forecast", sa.Numeric(12,2), nullable=False, server_default="0"),
        sa.Column("stockout_risk", sa.String(20), nullable=False, server_default="low"),
        sa.Column("overstock", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("forecast_method", sa.String(40), nullable=False, server_default="moving_average"),
        sa.Column("calculated_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("seller_account_id", "product_id", "warehouse", name="uq_inventory_intelligence"))
    op.create_index("ix_inventory_intelligence_seller", "inventory_intelligence", ["seller_account_id"])
    op.create_index("ix_inventory_intelligence_product", "inventory_intelligence", ["product_id"])
    op.create_table("inventory_recommendations",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("seller_account_id", sa.Integer(), sa.ForeignKey("seller_accounts.id"), nullable=False),
        sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id"), nullable=False),
        sa.Column("recommendation_type", sa.String(40), nullable=False),
        sa.Column("suggested_quantity", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("reason", sa.String(500), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="open"),
        sa.Column("created_at", sa.DateTime(), nullable=False))
    op.create_index("ix_inventory_recommendations_seller", "inventory_recommendations", ["seller_account_id"])
    op.create_index("ix_inventory_recommendations_product", "inventory_recommendations", ["product_id"])

def downgrade() -> None:
    op.drop_index("ix_inventory_recommendations_product", table_name="inventory_recommendations")
    op.drop_index("ix_inventory_recommendations_seller", table_name="inventory_recommendations")
    op.drop_table("inventory_recommendations")
    op.drop_index("ix_inventory_intelligence_product", table_name="inventory_intelligence")
    op.drop_index("ix_inventory_intelligence_seller", table_name="inventory_intelligence")
    op.drop_table("inventory_intelligence")
