from alembic import op
import sqlalchemy as sa

revision = "0042_shipping_fulfillment"
down_revision = "0041_browser_execution"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "shipments",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("seller_account_id", sa.Integer(), sa.ForeignKey("seller_accounts.id"), nullable=False),
        sa.Column("order_id", sa.Integer(), sa.ForeignKey("orders.id"), nullable=False),
        sa.Column("marketplace_account_id", sa.Integer(), sa.ForeignKey("marketplace_accounts.id"), nullable=False),
        sa.Column("mode", sa.String(30), nullable=False, server_default="seller_ship"),
        sa.Column("status", sa.String(40), nullable=False, server_default="ready"),
        sa.Column("provider", sa.String(100)),
        sa.Column("awb", sa.String(200)),
        sa.Column("tracking_url", sa.Text()),
        sa.Column("label_url", sa.Text()),
        sa.Column("pickup_at", sa.DateTime()),
        sa.Column("shipped_at", sa.DateTime()),
        sa.Column("delivered_at", sa.DateTime()),
        sa.Column("last_synced_at", sa.DateTime()),
        sa.Column("metadata_json", sa.Text()),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("seller_account_id", "order_id", name="uq_shipments_seller_order"),
    )
    op.create_index("ix_shipments_seller_account_id", "shipments", ["seller_account_id"])
    op.create_index("ix_shipments_order_id", "shipments", ["order_id"])
    op.create_index("ix_shipments_marketplace_account_id", "shipments", ["marketplace_account_id"])
    op.create_index("ix_shipments_status", "shipments", ["status"])
    op.create_index("ix_shipments_awb", "shipments", ["awb"])
    op.create_table(
        "shipment_events",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("shipment_id", sa.Integer(), sa.ForeignKey("shipments.id"), nullable=False),
        sa.Column("status", sa.String(40), nullable=False),
        sa.Column("message", sa.Text()),
        sa.Column("occurred_at", sa.DateTime(), nullable=False),
        sa.Column("source", sa.String(50), nullable=False, server_default="system"),
    )
    op.create_index("ix_shipment_events_shipment_id", "shipment_events", ["shipment_id"])


def downgrade():
    op.drop_index("ix_shipment_events_shipment_id", table_name="shipment_events")
    op.drop_table("shipment_events")
    op.drop_index("ix_shipments_awb", table_name="shipments")
    op.drop_index("ix_shipments_status", table_name="shipments")
    op.drop_index("ix_shipments_marketplace_account_id", table_name="shipments")
    op.drop_index("ix_shipments_order_id", table_name="shipments")
    op.drop_index("ix_shipments_seller_account_id", table_name="shipments")
    op.drop_table("shipments")
