"""merge final inventory and notification migration heads

Revision ID: 0018_merge_final_heads
Revises: 0017_inventory_intelligence, 0017_notification_center_2
"""

revision = "0018_merge_final_heads"
down_revision = ("0017_inventory_intelligence", "0017_notification_center_2")
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
