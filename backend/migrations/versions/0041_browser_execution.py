from alembic import op
import sqlalchemy as sa
revision="0041_browser_execution"
down_revision="0040_autofill_clarifications"
branch_labels=None
depends_on=None
def upgrade():
    op.create_table("browser_executions",sa.Column("id",sa.Integer(),primary_key=True),sa.Column("session_id",sa.Integer(),sa.ForeignKey("autofill_sessions.id"),nullable=False),sa.Column("state",sa.String(30),nullable=False,server_default="created"),sa.Column("mode",sa.String(20),nullable=False,server_default="dry_run"),sa.Column("page_url",sa.Text()),sa.Column("page_fingerprint",sa.String(128)),sa.Column("commands_json",sa.Text(),nullable=False,server_default="[]"),sa.Column("results_json",sa.Text(),nullable=False,server_default="[]"),sa.Column("error_json",sa.Text(),nullable=False,server_default="[]"),sa.Column("created_at",sa.DateTime(),nullable=False),sa.Column("updated_at",sa.DateTime(),nullable=False))
    op.create_index("ix_browser_executions_session_id","browser_executions",["session_id"]); op.create_index("ix_browser_executions_state","browser_executions",["state"])
    op.create_table("browser_execution_steps",sa.Column("id",sa.Integer(),primary_key=True),sa.Column("execution_id",sa.Integer(),sa.ForeignKey("browser_executions.id"),nullable=False),sa.Column("action_id",sa.Integer(),sa.ForeignKey("autofill_actions.id")),sa.Column("sequence",sa.Integer(),nullable=False),sa.Column("selector_strategy",sa.String(40),nullable=False),sa.Column("selector",sa.Text(),nullable=False),sa.Column("field_name",sa.String(200),nullable=False),sa.Column("value_json",sa.Text()),sa.Column("state",sa.String(30),nullable=False,server_default="planned"),sa.Column("error",sa.Text()),sa.Column("created_at",sa.DateTime(),nullable=False))
    op.create_index("ix_browser_execution_steps_execution_id","browser_execution_steps",["execution_id"]); op.create_index("ix_browser_execution_steps_action_id","browser_execution_steps",["action_id"])
def downgrade():
    op.drop_index("ix_browser_execution_steps_action_id",table_name="browser_execution_steps"); op.drop_index("ix_browser_execution_steps_execution_id",table_name="browser_execution_steps"); op.drop_table("browser_execution_steps")
    op.drop_index("ix_browser_executions_state",table_name="browser_executions"); op.drop_index("ix_browser_executions_session_id",table_name="browser_executions"); op.drop_table("browser_executions")
