import uuid
from typing import List, Optional
from sqlmodel import Field, SQLModel, Relationship

class RoundBase(SQLModel):
    title: str
    description: Optional[str] = None

class Round(RoundBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    host_secret_key: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    options: List["Option"] = Relationship(back_populates="round")

class OptionBase(SQLModel):
    text: str

class Option(OptionBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    round_id: uuid.UUID = Field(foreign_key="round.id")
    
    round: Round = Relationship(back_populates="options")
    votes: List["Vote"] = Relationship(back_populates="option")

class VoteBase(SQLModel):
    value: int # 0-10
    user_identifier: Optional[str] = None # e.g. session ID
    user_name: Optional[str] = None

class Vote(VoteBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    option_id: int = Field(foreign_key="option.id")
    
    option: Option = Relationship(back_populates="votes")
