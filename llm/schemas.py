from pydantic import BaseModel


class PostBase(BaseModel):
    content: str
    title: str

    class Config:
        orm_mode = True


class CreatePost(PostBase):
    class Config:
        orm_mode = True


class UserConvosBase(BaseModel):
    uid: str
    rag: str
    prompt: str
    sources: list
    response: str

    class Config:
        orm_mode = True


class CreateUserConvo(UserConvosBase):
    class Config:
        orm_mode = True