from collections.abc import Generator

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.db.base import Base
from app.models import (  # noqa: F401
    action_control, advertising, ai_command, ai_listing, automation, autonomous, autonomous_execution, catalog, catalog_intelligence, core, diagnostic, finance, inventory, inventory_intelligence, learning, listing_intelligence, marketplace_sync, media, notifications, operations, orders, pricing, product_knowledge, production, returns, vision_analysis, listing_validation,
)


@pytest.fixture
def db_session() -> Generator[Session, None, None]:
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    session = sessionmaker(bind=engine, autoflush=False, autocommit=False)()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()
