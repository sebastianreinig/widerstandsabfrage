from typing import List, Optional
from pydantic import BaseModel
import uuid

class OptionSchema(BaseModel):
    text: str

class RoundCreate(BaseModel):
    title: str
    description: Optional[str] = None
    options: List[OptionSchema]

class RoundRead(BaseModel):
    id: uuid.UUID
    title: str
    description: Optional[str]
    options: List["OptionRead"]

class OptionRead(BaseModel):
    id: int
    text: str

class VoteCast(BaseModel):
    option_id: int
    value: int # 0-10
    user_identifier: Optional[str] = None
    user_name: str

class VoteUpdate(BaseModel):
    option_id: int
    value: int 

class VoteRead(BaseModel):
    id: int
    option_id: int
    value: int
    user_name: Optional[str]
    user_identifier: Optional[str]

class OptionResult(BaseModel):
    id: int
    text: str
    total_resistance: int
    average_resistance: float

class ResultsRead(BaseModel):
    options: List[OptionResult]
    total_participants: int
    decision_made: bool # Resistance < N
    votes: List[VoteRead] # All votes for detailed view
