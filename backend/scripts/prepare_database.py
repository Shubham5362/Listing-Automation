import os

from sqlalchemy import create_engine, inspect, text


url = os.getenv("DATABASE_URL", "sqlite:///./seller_hub.db")
engine = create_engine(url)
try:
    inspector = inspect(engine)
    if "alembic_version" in inspector.get_table_names():
        version_column = next((column for column in inspector.get_columns("alembic_version") if column["name"] == "version_num"), None)
        if version_column and engine.dialect.name == "postgresql":
            with engine.begin() as connection:
                connection.execute(text("ALTER TABLE alembic_version ALTER COLUMN version_num TYPE VARCHAR(128)"))
finally:
    engine.dispose()
