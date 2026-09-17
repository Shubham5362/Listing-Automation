"""scope seller accounts to users

Revision ID: 0005_seller_account_owner
Revises: 0004_inventory
"""
from alembic import op
import sqlalchemy as sa

revision = "0005_seller_account_owner"
down_revision = "0004_inventory"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("seller_accounts", sa.Column("user_id", sa.Integer(), nullable=True))
    op.create_index("ix_seller_accounts_user_id", "seller_accounts", ["user_id"])
    op.create_foreign_key("fk_seller_accounts_user_id", "seller_accounts", "users", ["user_id"], ["id"])


def downgrade() -> None:
    op.drop_constraint("fk_seller_accounts_user_id", "seller_accounts", type_="foreignkey")
    op.drop_index("ix_seller_accounts_user_id", table_name="seller_accounts")
    op.drop_column("seller_accounts", "user_id")
