from pydantic import BaseModel
import datetime

class PostBase(BaseModel):
    content: str
    title: str

    class Config:
        from_attributes = True


class CreatePost(PostBase):
    class Config:
        from_attributes = True


class UserConvosBase(BaseModel):
    uid: str
    rag: str
    prompt: str
    sources: list
    response: str
    system_prompt: str

    class Config:
        from_attributes = True


class CreateUserConvo(UserConvosBase):
    class Config:
        from_attributes = True


class UserConvoHistoryBase(BaseModel):
    rag: str
    prompt: str
    sources: list
    response: str
    system_prompt: str
    created_at: str

    class Config:
        from_attributes = True


class CreateUserConvoHistoryBase(UserConvosBase):
    class Config:
        from_attributes = True



class UserRagConfigsBase(BaseModel):
    # rag: str
    system_prompt: str
    class Config:
        from_attributes = True

class CreateUserRagConfigs(UserRagConfigsBase):
    class Config:
        from_attributes = True