from app.db.session import engine
from app.db.base import Base

# Import models so SQLAlchemy registers them
from app import models  # noqa: F401


def init_db():
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    init_db()
