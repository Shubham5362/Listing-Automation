from sqlalchemy import create_engine, inspect, text

from app.core.config import get_settings


settings = get_settings()
engine = create_engine(settings.database_url)
try:
    inspector = inspect(engine)
    if "alembic_version" in inspector.get_table_names():
        columns = {column["name"]: column for column in inspector.get_columns("alembic_version")}
        version_column = columns.get("version_num")
        if version_column and engine.dialect.name == "postgresql":
            with engine.begin() as connection:
                connection.execute(text("ALTER TABLE alembic_version ALTER COLUMN version_num TYPE VARCHAR(128)"))
finally:
    engine.dispose()
