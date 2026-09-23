from alembic import op
import sqlalchemy as sa

revision = "0044_inventory_price_automation"
down_revision = "0043_unified_order_events"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "inventory_price_plans",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("seller_account_id", sa.Integer(), sa.ForeignKey("seller_accounts.id"), nullable=False),
        sa.Column("marketplace_account_id", sa.Integer(), sa.ForeignKey("marketplace_accounts.id"), nullable=False),
        sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id"), nullable=False),
        sa.Column("listing_id", sa.Integer(), sa.ForeignKey("listings.id"), nullable=True),
        sa.Column("action_type", sa.String(30), nullable=False),
        sa.Column("sku", sa.String(100), nullable=False),
        sa.Column("current_value", sa.Numeric(14, 2)),
        sa.Column("proposed_value", sa.Numeric(14, 2), nullable=False),
        sa.Column("floor_value", sa.Numeric(14, 2)),
        sa.Column("ceiling_value", sa.Numeric(14, 2)),
        sa.Column("reason", sa.String(1000), nullable=False),
        sa.Column("status", sa.String(30), nullable=False, server_default="pending"),
        sa.Column("verification_json", sa.Text()),
        sa.Column("error", sa.String(1000)),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("executed_at", sa.DateTime()),
    )
    for name, column in (
        ("seller", "seller_account_id"), ("marketplace", "marketplace_account_id"), ("product", "product_id"),
        ("listing", "listing_id"), ("action", "action_type"), ("sku", "sku"), ("status", "status"),
    ):
        op.create_index(f"ix_inventory_price_plans_{name}", "inventory_price_plans", [column])


def downgrade():
    for name in ("status", "sku", "action", "listing", "product", "marketplace", "seller"):
        op.drop_index(f"ix_inventory_price_plans_{name}", table_name="inventory_price_plans")
    op.drop_table("inventory_price_plans")
