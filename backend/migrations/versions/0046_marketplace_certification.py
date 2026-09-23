from alembic import op
import sqlalchemy as sa

revision = "0046_marketplace_certification"
down_revision = "0045_seller_intelligence"
branch_labels = None
depends_on = None

def upgrade():
    op.create_table("marketplace_certification_runs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("seller_account_id", sa.Integer(), sa.ForeignKey("seller_accounts.id"), nullable=False),
        sa.Column("marketplace_account_id", sa.Integer(), sa.ForeignKey("marketplace_accounts.id"), nullable=False),
        sa.Column("marketplace", sa.String(80), nullable=False),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("checks_json", sa.Text(), nullable=False),
        sa.Column("started_at", sa.DateTime(), nullable=False),
        sa.Column("completed_at", sa.DateTime()))
    for name, column in (("seller","seller_account_id"),("account","marketplace_account_id"),("status","status")):
        op.create_index(f"ix_marketplace_certification_runs_{name}", "marketplace_certification_runs", [column])

def downgrade():
    for name in ("status","account","seller"):
        op.drop_index(f"ix_marketplace_certification_runs_{name}", table_name="marketplace_certification_runs")
    op.drop_table("marketplace_certification_runs")
