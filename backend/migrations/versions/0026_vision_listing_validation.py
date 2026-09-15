"""add vision analysis and listing validation
Revision ID: 0026_vision_listing_validation
Revises: 0025_ai_diagnostics
"""
from alembic import op
import sqlalchemy as sa
revision="0026_vision_listing_validation"; down_revision="0025_ai_diagnostics"; branch_labels=None; depends_on=None

def upgrade():
    op.create_table("vision_analyses",sa.Column("id",sa.Integer(),primary_key=True),sa.Column("seller_account_id",sa.Integer(),sa.ForeignKey("seller_accounts.id"),nullable=False),sa.Column("product_id",sa.Integer(),sa.ForeignKey("products.id"),nullable=False),sa.Column("media_id",sa.Integer(),sa.ForeignKey("product_media.id")),sa.Column("image_hash",sa.String(128),nullable=False),sa.Column("image_url",sa.Text(),nullable=False),sa.Column("width",sa.Integer()),sa.Column("height",sa.Integer()),sa.Column("quality_score",sa.Numeric(5,2),nullable=False,server_default="0"),sa.Column("blur_score",sa.Numeric(8,3),nullable=False,server_default="0"),sa.Column("findings_json",sa.Text(),nullable=False,server_default="[]"),sa.Column("attributes_json",sa.Text(),nullable=False,server_default="{}"),sa.Column("confidence",sa.Integer(),nullable=False,server_default="0"),sa.Column("provider",sa.String(30),nullable=False,server_default="deterministic"),sa.Column("created_at",sa.DateTime(),nullable=False),sa.Column("updated_at",sa.DateTime(),nullable=False),sa.UniqueConstraint("seller_account_id","product_id","image_hash",name="uq_vision_seller_product_hash"))
    for c in ("seller_account_id","product_id","media_id"): op.create_index("ix_vision_analyses_"+c,"vision_analyses",[c])
    op.create_table("listing_validations",sa.Column("id",sa.Integer(),primary_key=True),sa.Column("seller_account_id",sa.Integer(),sa.ForeignKey("seller_accounts.id"),nullable=False),sa.Column("product_id",sa.Integer(),sa.ForeignKey("products.id"),nullable=False),sa.Column("marketplace_account_id",sa.Integer(),sa.ForeignKey("marketplace_accounts.id")),sa.Column("status",sa.String(20),nullable=False,server_default="healthy"),* [sa.Column(x,sa.Numeric(5,2),nullable=False,server_default="0") for x in ("content_score","seo_score","attributes_score","compliance_score","image_score","variation_score","health_score")],sa.Column("findings_json",sa.Text(),nullable=False,server_default="[]"),sa.Column("recommendations_json",sa.Text(),nullable=False,server_default="[]"),sa.Column("created_at",sa.DateTime(),nullable=False),sa.Column("updated_at",sa.DateTime(),nullable=False),sa.UniqueConstraint("seller_account_id","product_id","marketplace_account_id",name="uq_listing_validation_scope"))
    for c in ("seller_account_id","product_id","marketplace_account_id","status"): op.create_index("ix_listing_validations_"+c,"listing_validations",[c])

def downgrade():
    for c in ("status","marketplace_account_id","product_id","seller_account_id"): op.drop_index("ix_listing_validations_"+c,table_name="listing_validations")
    op.drop_table("listing_validations")
    for c in ("media_id","product_id","seller_account_id"): op.drop_index("ix_vision_analyses_"+c,table_name="vision_analyses")
    op.drop_table("vision_analyses")
