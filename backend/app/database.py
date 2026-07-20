from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# PostgreSQL database used by the application.
DATABASE_URL = "postgresql+psycopg://postgres:Mahesh%40123@localhost:5432/creatoriq"

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    from . import models  # Ensure model metadata is registered before table creation.

    Base.metadata.create_all(bind=engine)

    # create_all does not add columns to tables that already exist. Keep this
    # lightweight migration so databases created before `language` was added
    # remain compatible with the User model.
    with engine.begin() as connection:
        connection.exec_driver_sql(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS language VARCHAR(50) DEFAULT 'English'"
        )
        connection.exec_driver_sql(
            "UPDATE users SET language = 'English' WHERE language IS NULL"
        )