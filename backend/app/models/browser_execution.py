from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base
class BrowserExecution(Base):
    __tablename__="browser_executions"
    id:Mapped[int]=mapped_column(Integer,primary_key=True)
    session_id:Mapped[int]=mapped_column(ForeignKey("autofill_sessions.id"),index=True,nullable=False)
    state:Mapped[str]=mapped_column(String(30),default="created",index=True,nullable=False)
    mode:Mapped[str]=mapped_column(String(20),default="dry_run",nullable=False)
    page_url:Mapped[str|None]=mapped_column(Text)
    page_fingerprint:Mapped[str|None]=mapped_column(String(128))
    commands_json:Mapped[str]=mapped_column(Text,default="[]",nullable=False)
    results_json:Mapped[str]=mapped_column(Text,default="[]",nullable=False)
    error_json:Mapped[str]=mapped_column(Text,default="[]",nullable=False)
    created_at:Mapped[datetime]=mapped_column(DateTime,default=datetime.utcnow,nullable=False)
    updated_at:Mapped[datetime]=mapped_column(DateTime,default=datetime.utcnow,onupdate=datetime.utcnow,nullable=False)
class BrowserExecutionStep(Base):
    __tablename__="browser_execution_steps"
    id:Mapped[int]=mapped_column(Integer,primary_key=True)
    execution_id:Mapped[int]=mapped_column(ForeignKey("browser_executions.id"),index=True,nullable=False)
    action_id:Mapped[int|None]=mapped_column(ForeignKey("autofill_actions.id"),index=True)
    sequence:Mapped[int]=mapped_column(Integer,nullable=False)
    selector_strategy:Mapped[str]=mapped_column(String(40),nullable=False)
    selector:Mapped[str]=mapped_column(Text,nullable=False)
    field_name:Mapped[str]=mapped_column(String(200),nullable=False)
    value_json:Mapped[str|None]=mapped_column(Text)
    state:Mapped[str]=mapped_column(String(30),default="planned",nullable=False)
    error:Mapped[str|None]=mapped_column(Text)
    created_at:Mapped[datetime]=mapped_column(DateTime,default=datetime.utcnow,nullable=False)
