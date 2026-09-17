"""add notification center and channel preferences

Revision ID: 0011_notifications
Revises: 0010_automation
"""

from alembic import op
import sqlalchemy as sa

revision = "0011_notifications"
down_revision = "0010_automation"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "notifications",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("seller_account_id", sa.Integer(), sa.ForeignKey("seller_accounts.id"), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("category", sa.String(length=32), nullable=False),
        sa.Column("severity", sa.String(length=16), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("data", sa.JSON(), nullable=False),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_notifications_seller_account_id", "notifications", ["seller_account_id"])
    op.create_index("ix_notifications_user_id", "notifications", ["user_id"])
    op.create_index("ix_notifications_category", "notifications", ["category"])

    op.create_table(
        "notification_deliveries",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("notification_id", sa.Integer(), sa.ForeignKey("notifications.id"), nullable=False),
        sa.Column("channel", sa.String(length=32), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column("provider", sa.String(length=64), nullable=True),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("notification_id", "channel", name="uq_notification_delivery_channel"),
    )
    op.create_index("ix_notification_deliveries_notification_id", "notification_deliveries", ["notification_id"])

    op.create_table(
        "notification_preferences",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("seller_account_id", sa.Integer(), sa.ForeignKey("seller_accounts.id"), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("category", sa.String(length=32), nullable=False),
        sa.Column("in_app_enabled", sa.Boolean(), nullable=False),
        sa.Column("email_enabled", sa.Boolean(), nullable=False),
        sa.Column("whatsapp_enabled", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("seller_account_id", "user_id", "category", name="uq_notification_preference"),
    )
    op.create_index("ix_notification_preferences_seller_account_id", "notification_preferences", ["seller_account_id"])
    op.create_index("ix_notification_preferences_user_id", "notification_preferences", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_notification_preferences_user_id", table_name="notification_preferences")
    op.drop_index("ix_notification_preferences_seller_account_id", table_name="notification_preferences")
    op.drop_table("notification_preferences")
    op.drop_index("ix_notification_deliveries_notification_id", table_name="notification_deliveries")
    op.drop_table("notification_deliveries")
    op.drop_index("ix_notifications_category", table_name="notifications")
    op.drop_index("ix_notifications_user_id", table_name="notifications")
    op.drop_index("ix_notifications_seller_account_id", table_name="notifications")
    op.drop_table("notifications")
