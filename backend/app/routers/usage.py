"""
Usage tracking endpoints for token usage analytics.
"""

from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.models.user import User
from app.services.token_tracker import TokenTracker
from app.utils.dependencies import get_db, get_current_user

router = APIRouter(prefix="/api/usage", tags=["usage"])


@router.get("/conversation/{conversation_id}")
async def get_conversation_usage(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get token usage for a specific conversation.
    
    Returns total tokens used across all messages in the conversation.
    """
    tracker = TokenTracker(db)
    
    try:
        usage = tracker.get_conversation_usage(conversation_id)
        return usage
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summary")
async def get_usage_summary(
    time_range: str = Query(default="all", regex="^(day|week|month|all)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user's overall usage summary.
    
    Args:
        time_range: Time range for summary (day, week, month, all)
        
    Returns summary grouped by provider and model.
    """
    tracker = TokenTracker(db)
    
    try:
        summary = tracker.get_user_usage_summary(current_user.id, time_range)
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
async def get_usage_stats(
    start_date: Optional[str] = Query(default=None),
    end_date: Optional[str] = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed usage statistics with date filters.
    
    Args:
        start_date: Start date in ISO format (optional)
        end_date: End date in ISO format (optional)
        
    Returns list of usage records.
    """
    tracker = TokenTracker(db)
    
    # Parse dates if provided
    start = None
    end = None
    
    try:
        if start_date:
            start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        if end_date:
            end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {str(e)}")
    
    try:
        stats = tracker.get_usage_stats(current_user.id, start, end)
        return {"stats": stats, "count": len(stats)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
