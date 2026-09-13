"""add inventory management

Revision ID: 0004_inventory
Revises: 0003_ai_listing_drafts
"""
from alembic import op
import sqlalchemy as sa

revision = "0004_inventory"
down_revision = "0003_ai_listing_drafts"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "inventory_items",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("seller_account_id", sa.Integer(), sa.ForeignKey("seller_accounts.id"), nullable=False),
        sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id"), nullable=False),
        sa.Column("warehouse", sa.String(100), nullable=False, server_default="default"),
        sa.Column("quantity", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("reserved_quantity", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("reorder_level", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("seller_account_id", "product_id", "warehouse", name="uq_inventory_item"),
    )
    op.create_index("ix_inventory_items_seller_account_id", "inventory_items", ["seller_account_id"])
    op.create_index("ix_inventory_items_product_id", "inventory_items", ["product_id"])
    op.create_table(
        "inventory_movements",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("inventory_item_id", sa.Integer(), sa.ForeignKey("inventory_items.id"), nullable=False),
        sa.Column("movement_type", sa.String(30), nullable=False),
        sa.Column("quantity_delta", sa.Integer(), nullable=False),
        sa.Column("quantity_after", sa.Integer(), nullable=False),
        sa.Column("reason", sa.String(300)),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_inventory_movements_inventory_item_id", "inventory_movements", ["inventory_item_id"])


def downgrade() -> None:
    op.drop_table("inventory_movements")
    op.drop_table("inventory_items")
