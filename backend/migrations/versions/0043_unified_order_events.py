from alembic import op
import sqlalchemy as sa

revision = "0043_unified_order_events"
down_revision = "0042_shipping_fulfillment"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "order_events",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("seller_account_id", sa.Integer(), sa.ForeignKey("seller_accounts.id"), nullable=False),
        sa.Column("order_id", sa.Integer(), sa.ForeignKey("orders.id"), nullable=False),
        sa.Column("marketplace_account_id", sa.Integer(), sa.ForeignKey("marketplace_accounts.id"), nullable=False),
        sa.Column("event_type", sa.String(50), nullable=False),
        sa.Column("status", sa.String(30)),
        sa.Column("source", sa.String(80), nullable=False, server_default="system"),
        sa.Column("external_event_id", sa.String(200)),
        sa.Column("payload_json", sa.Text()),
        sa.Column("occurred_at", sa.DateTime(), nullable=False),
    )
    for name, column in (
        ("seller_account_id", "seller_account_id"),
        ("order_id", "order_id"),
        ("marketplace_account_id", "marketplace_account_id"),
        ("event_type", "event_type"),
        ("status", "status"),
        ("external_event_id", "external_event_id"),
        ("occurred_at", "occurred_at"),
    ):
        op.create_index(f"ix_order_events_{name}", "order_events", [column])


def downgrade():
    for name in ("occurred_at", "external_event_id", "status", "event_type", "marketplace_account_id", "order_id", "seller_account_id"):
        op.drop_index(f"ix_order_events_{name}", table_name="order_events")
    op.drop_table("order_events")
