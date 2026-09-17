"""merge product knowledge branch into the production migration head

Revision ID: 0020_merge_product_knowledge
Revises: 0019_action_control, 0011_product_knowledge
"""

revision = "0020_merge_product_knowledge"
down_revision = ("0019_action_control", "0011_product_knowledge")
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
