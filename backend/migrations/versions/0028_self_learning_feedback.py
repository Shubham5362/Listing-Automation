"""add self learning feedback
Revision ID: 0028_self_learning_feedback
Revises: 0027_seller_operations
"""
from alembic import op
import sqlalchemy as sa
revision="0028_self_learning_feedback"; down_revision="0027_seller_operations"; branch_labels=None; depends_on=None

def upgrade():
    op.create_table("learning_events",sa.Column("id",sa.Integer(),primary_key=True),sa.Column("seller_account_id",sa.Integer(),sa.ForeignKey("seller_accounts.id"),nullable=False),sa.Column("source",sa.String(80),nullable=False),sa.Column("entity_type",sa.String(80),nullable=False),sa.Column("entity_id",sa.String(120)),sa.Column("action",sa.String(80),nullable=False),sa.Column("feedback",sa.String(40),nullable=False),sa.Column("confidence",sa.Float(),nullable=False,server_default="0.5"),sa.Column("correction_json",sa.Text()),sa.Column("metadata_json",sa.Text()),sa.Column("created_at",sa.DateTime(),nullable=False))
    op.create_table("seller_preferences",sa.Column("id",sa.Integer(),primary_key=True),sa.Column("seller_account_id",sa.Integer(),sa.ForeignKey("seller_accounts.id"),nullable=False),sa.Column("key",sa.String(120),nullable=False),sa.Column("value",sa.Text(),nullable=False),sa.Column("scope",sa.String(80),nullable=False,server_default="seller"),sa.Column("confidence",sa.Float(),nullable=False,server_default="0.5"),sa.Column("evidence_count",sa.Integer(),nullable=False,server_default="1"),sa.Column("status",sa.String(30),nullable=False,server_default="candidate"),sa.Column("enabled",sa.Boolean(),nullable=False,server_default=sa.true()),sa.Column("updated_at",sa.DateTime(),nullable=False))
    op.create_table("learning_rules",sa.Column("id",sa.Integer(),primary_key=True),sa.Column("seller_account_id",sa.Integer(),sa.ForeignKey("seller_accounts.id"),nullable=False),sa.Column("rule",sa.Text(),nullable=False),sa.Column("scope",sa.String(80),nullable=False,server_default="seller"),sa.Column("confidence",sa.Float(),nullable=False,server_default="0.5"),sa.Column("success_rate",sa.Float(),nullable=False,server_default="0"),sa.Column("evidence_count",sa.Integer(),nullable=False,server_default="1"),sa.Column("status",sa.String(30),nullable=False,server_default="candidate"),sa.Column("enabled",sa.Boolean(),nullable=False,server_default=sa.true()),sa.Column("updated_at",sa.DateTime(),nullable=False))
    op.create_table("learning_outcomes",sa.Column("id",sa.Integer(),primary_key=True),sa.Column("learning_event_id",sa.Integer(),sa.ForeignKey("learning_events.id"),nullable=False),sa.Column("seller_account_id",sa.Integer(),sa.ForeignKey("seller_accounts.id"),nullable=False),sa.Column("outcome",sa.String(80),nullable=False),sa.Column("success",sa.Boolean(),nullable=False,server_default=sa.false()),sa.Column("measured_at",sa.DateTime(),nullable=False))
    for table,col in (("learning_events","seller_account_id"),("seller_preferences","seller_account_id"),("learning_rules","seller_account_id"),("learning_outcomes","learning_event_id"),("learning_outcomes","seller_account_id")): op.create_index("ix_"+table+"_"+col,table,[col])

def downgrade():
    for table,col in (("learning_outcomes","seller_account_id"),("learning_outcomes","learning_event_id"),("learning_rules","seller_account_id"),("seller_preferences","seller_account_id"),("learning_events","seller_account_id")): op.drop_index("ix_"+table+"_"+col,table_name=table)
    for table in ("learning_outcomes","learning_rules","seller_preferences","learning_events"): op.drop_table(table)
