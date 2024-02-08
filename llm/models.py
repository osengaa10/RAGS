from base import Base
from sqlalchemy import Column, Integer, ARRAY, String, TIMESTAMP, Boolean, text, UniqueConstraint

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
    system_prompt = Column(String,nullable=False)
    published = Column(Boolean, server_default='TRUE')
    created_at = Column(TIMESTAMP(timezone='UTC'), server_default=text('now()'))


class UserRagConfigs(Base):
    __tablename__ = 'user_rag_configs'
    uid = Column(String, primary_key=True)
    rag = Column(String, primary_key=True)
    system_prompt = Column(String)


class PrivateUsers(Base):
    __tablename__ = 'private_users'
    uid = Column(String, primary_key=True)

class RunningPipelines(Base):
    __tablename__ = 'running_pipelines'
    uid = Column(String, primary_key=True)
    rag = Column(String, primary_key=True)
    # created_at = Column(TIMESTAMP(timezone='UTC'), server_default=text('now()'))

class CompletedJobNotifications(Base):
    __tablename__ = 'completed_job_notifications'
    uid = Column(String, primary_key=True)
    rag = Column(String, primary_key=True)