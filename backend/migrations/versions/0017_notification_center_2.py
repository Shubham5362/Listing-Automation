"""upgrade notification center for Telegram and report preferences

Revision ID: 0017_notification_center_2
Revises: 0016_product_media
"""

from alembic import op
import sqlalchemy as sa

revision = "0017_notification_center_2"
down_revision = "0016_product_media"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("notification_preferences", sa.Column("telegram_enabled", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("notification_preferences", sa.Column("daily_summary_enabled", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("notification_preferences", sa.Column("weekly_report_enabled", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("notification_preferences", sa.Column("summary_channels", sa.JSON(), nullable=False, server_default='["in_app"]'))


def downgrade() -> None:
    op.drop_column("notification_preferences", "summary_channels")
    op.drop_column("notification_preferences", "weekly_report_enabled")
    op.drop_column("notification_preferences", "daily_summary_enabled")
    op.drop_column("notification_preferences", "telegram_enabled")
