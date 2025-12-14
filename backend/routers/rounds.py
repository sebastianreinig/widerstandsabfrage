from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlmodel import select, Session
from typing import List, Optional
import uuid

from database import get_session
from models import Round, Option, Vote
from schemas import RoundCreate, RoundRead, VoteCast, ResultsRead, OptionResult, OptionRead, VoteRead

router = APIRouter(prefix="/rounds", tags=["rounds"])
ADMIN_KEY = "supersecret"

@router.get("/admin/all", response_model=List[RoundRead])
async def get_all_rounds_admin(x_admin_key: str = Header(None), session: Session = Depends(get_session)):
    if x_admin_key != ADMIN_KEY:
        raise HTTPException(status_code=403, detail="Invalid Admin Key")
    
    stmt = select(Round)
    rounds = (await session.execute(stmt)).scalars().all()
    
    return [
        RoundRead(
            id=r.id, 
            title=r.title, 
            description=r.description,
            options=[] # Optimization: don't load options for list view
        ) for r in rounds
    ]

@router.delete("/admin/{round_id}")
async def delete_round_admin(round_id: uuid.UUID, x_admin_key: str = Header(None), session: Session = Depends(get_session)):
    if x_admin_key != ADMIN_KEY:
        raise HTTPException(status_code=403, detail="Invalid Admin Key")
        
    stmt = select(Round).where(Round.id == round_id)
    res = await session.execute(stmt)
    db_round = res.scalars().first()
    
    if not db_round:
        raise HTTPException(status_code=404, detail="Round not found")

    # Manual cleanup
    opts_stmt = select(Option).where(Option.round_id == round_id)
    opts = (await session.execute(opts_stmt)).scalars().all()
    
    for opt in opts:
        votes_stmt = select(Vote).where(Vote.option_id == opt.id)
        votes = (await session.execute(votes_stmt)).scalars().all()
        for v in votes:
            await session.delete(v)
        await session.delete(opt)
    
    await session.delete(db_round)
    await session.commit()
    
    return {"status": "deleted"}

@router.post("/", response_model=dict)
async def create_round(round_data: RoundCreate, session: Session = Depends(get_session)):
    db_round = Round(title=round_data.title, description=round_data.description)
    session.add(db_round)
    await session.commit()
    await session.refresh(db_round)
    
    for opt in round_data.options:
        db_option = Option(text=opt.text, round_id=db_round.id)
        session.add(db_option)
    
    await session.commit()
    
    return {
        "round_id": db_round.id,
        "host_secret_key": db_round.host_secret_key,
        "participant_link": f"/rounds/{db_round.id}",
        "host_link": f"/rounds/{db_round.id}/results?key={db_round.host_secret_key}"
    }

@router.get("/{round_id}", response_model=RoundRead)
async def get_round(round_id: uuid.UUID, session: Session = Depends(get_session)):
    statement = select(Round).where(Round.id == round_id)
    result = await session.execute(statement)
    db_round = result.scalars().first()
    if not db_round:
        raise HTTPException(status_code=404, detail="Round not found")
    
    # Manually fetch options to ensure they are loaded
    # SQLModel relationships with AsyncSession require explicit loading or joinedload if not lazy='selectin'
    # For simplicity let's just query options
    opts_stmt = select(Option).where(Option.round_id == round_id)
    opts_res = await session.execute(opts_stmt)
    options = opts_res.scalars().all()
    
    return RoundRead(
        id=db_round.id, 
        title=db_round.title, 
        description=db_round.description,
        options=[OptionRead(id=o.id, text=o.text) for o in options]
    )

@router.post("/{round_id}/vote")
async def vote(round_id: uuid.UUID, votes: List[VoteCast], session: Session = Depends(get_session)):
    # Verify round exists
    statement = select(Round).where(Round.id == round_id)
    result = await session.execute(statement)
    if not result.scalars().first():
         raise HTTPException(status_code=404, detail="Round not found")

    for v in votes:
        db_vote = Vote(
            option_id=v.option_id, 
            value=v.value, 
            user_identifier=v.user_identifier,
            user_name=v.user_name
        )
        session.add(db_vote)
    
    await session.commit()
    return {"status": "success"}

@router.get("/{round_id}/results", response_model=ResultsRead)
async def get_results(round_id: uuid.UUID, key: str, session: Session = Depends(get_session)):
    # Verify host key
    stmt = select(Round).where(Round.id == round_id)
    res = await session.execute(stmt)
    db_round = res.scalars().first()
    if not db_round:
        raise HTTPException(status_code=404, detail="Round not found")
    
    if db_round.host_secret_key != key:
        raise HTTPException(status_code=403, detail="Invalid Host Key")
    
    # Calculate results
    # Get all options
    opts_stmt = select(Option).where(Option.round_id == round_id)
    opts = (await session.execute(opts_stmt)).scalars().all()
    
    results = []
    all_votes_details = []
    total_participants_set = set()
    
    for opt in opts:
        votes_stmt = select(Vote).where(Vote.option_id == opt.id)
        votes = (await session.execute(votes_stmt)).scalars().all()
        
        sum_resistance = sum(v.value for v in votes)
        count = len(votes)
        avg = sum_resistance / count if count > 0 else 0
        
        results.append(OptionResult(
            id=opt.id,
            text=opt.text,
            total_resistance=sum_resistance,
            average_resistance=avg
        ))
        
        for v in votes:
            if v.user_identifier:
                total_participants_set.add(v.user_identifier)
            # Fallback if no identifier (legacy), use name or just count uniqueness roughly (not perfect)
            # Actually, let's just use identifier or name
            elif v.user_name:
                 total_participants_set.add(v.user_name)
                 
            all_votes_details.append(VoteRead(
                id=v.id,
                option_id=v.option_id,
                value=v.value,
                user_name=v.user_name,
                user_identifier=v.user_identifier
            ))

    decision_made = False
    num_people = len(total_participants_set) if total_participants_set else 0

    if results:
        for r in results:
            if num_people > 0 and r.total_resistance < num_people:
                decision_made = True
                break

    return ResultsRead(
        options=results,
        total_participants=num_people,
        decision_made=decision_made,
        votes=all_votes_details
    )

@router.put("/{round_id}/votes/{vote_id}")
async def update_vote(round_id: uuid.UUID, vote_id: int, value: int, key: str, session: Session = Depends(get_session)):
    # Host update
    stmt = select(Round).where(Round.id == round_id)
    res = await session.execute(stmt)
    db_round = res.scalars().first()
    if not db_round or db_round.host_secret_key != key:
        raise HTTPException(status_code=403, detail="Forbidden")

    vote_stmt = select(Vote).where(Vote.id == vote_id)
    vote_res = await session.execute(vote_stmt)
    db_vote = vote_res.scalars().first()
    
    if not db_vote:
        raise HTTPException(status_code=404, detail="Vote not found")
        
    db_vote.value = value
    session.add(db_vote)
    await session.commit()
    
    return {"status": "updated"}

@router.delete("/{round_id}")
async def delete_round(round_id: uuid.UUID, key: str, session: Session = Depends(get_session)):
    # Verify host key
    stmt = select(Round).where(Round.id == round_id)
    res = await session.execute(stmt)
    db_round = res.scalars().first()
    if not db_round:
        raise HTTPException(status_code=404, detail="Round not found")
    
    if db_round.host_secret_key != key:
        raise HTTPException(status_code=403, detail="Invalid Host Key")
    
    # Cascade delete (ignoring manual cascade logic if DB handles it, but let's be safe and rely on sqlmodel cascade or manual)
    # SQLModel doesn't always cascade by default depending on setup.
    # Manual cleanup for safety
    opts_stmt = select(Option).where(Option.round_id == round_id)
    opts = (await session.execute(opts_stmt)).scalars().all()
    
    for opt in opts:
        # Delete votes
        votes_stmt = select(Vote).where(Vote.option_id == opt.id)
        votes = (await session.execute(votes_stmt)).scalars().all()
        for v in votes:
            await session.delete(v)
        await session.delete(opt)
    
    await session.delete(db_round)
    await session.commit()
    
    return {"status": "deleted"}
