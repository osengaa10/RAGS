from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# SQLALCHEMY_DATABASE_URL = 'postgresql://postgres:Heybob!23@localhost/rags'
load_dotenv()
os.environ['SQLALCHEMY_DATABASE_URL']
api_key = os.environ["SQLALCHEMY_DATABASE_URL"]

engine = create_engine(api_key)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


