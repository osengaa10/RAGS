from database import Base
from sqlalchemy import Column, Integer, ARRAY, String, TIMESTAMP, Boolean, text


class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer,primary_key=True,nullable=False)
    title = Column(String,nullable=False)
    content = Column(String,nullable=False)
    published = Column(Boolean, server_default='TRUE')
    created_at = Column(TIMESTAMP(timezone='UTC'), server_default=text('now()'))


class UserConvos(Base):
    __tablename__ = "user_convos"

    id = Column(Integer,primary_key=True,nullable=False)
    uid = Column(String,nullable=False)
    rag = Column(String,nullable=False)
    prompt = Column(String,nullable=False)
    response = Column(String,nullable=False)
    sources = Column(ARRAY(String),nullable=False)
    published = Column(Boolean, server_default='TRUE')
    created_at = Column(TIMESTAMP(timezone='UTC'), server_default=text('now()'))