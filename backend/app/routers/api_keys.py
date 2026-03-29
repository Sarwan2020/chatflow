"""
API Keys Router - API endpoints for managing user API keys
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.user import User
from app.models.api_key import APIKey
from app.utils.dependencies import get_current_user
from app.utils.security import encrypt_api_key, decrypt_api_key
from app.schemas.chat import APIKeyCreate, APIKeyUpdate, APIKeyResponse

router = APIRouter(prefix="/api/keys", tags=["api-keys"])


def mask_api_key(key: str) -> str:
    """Mask API key for display (show first 8 and last 4 characters)"""
    if len(key) <= 12:
        return "*" * len(key)
    return f"{key[:8]}...{key[-4:]}"


@router.get("", response_model=List[APIKeyResponse])
async def list_api_keys(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all API keys for the current user (with masked values)"""
    api_keys = db.query(APIKey).filter(
        APIKey.user_id == current_user.id
    ).all()
    
    result = []
    for key in api_keys:
        # Decrypt to get preview
        decrypted = decrypt_api_key(key.api_key)
        
        result.append(APIKeyResponse(
            id=key.id,
            user_id=key.user_id,
            provider=key.provider,
            name=key.provider,  # Use provider as name since name field doesn't exist
            key_preview=mask_api_key(decrypted),
            is_active=key.is_active,
            created_at=key.created_at,
            updated_at=key.created_at  # Use created_at since updated_at doesn't exist
        ))
    
    return result


@router.post("", response_model=APIKeyResponse, status_code=status.HTTP_201_CREATED)
async def create_api_key(
    api_key_data: APIKeyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a new API key for a provider"""
    
    # Check if user already has a key for this provider
    existing_key = db.query(APIKey).filter(
        APIKey.user_id == current_user.id,
        APIKey.provider == api_key_data.provider
    ).first()
    
    if existing_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"API key for provider '{api_key_data.provider}' already exists. Delete the existing key first."
        )
    
    # Encrypt the API key
    encrypted_key = encrypt_api_key(api_key_data.key_value)
    
    # Create new API key
    new_key = APIKey(
        user_id=current_user.id,
        provider=api_key_data.provider,
        api_key=encrypted_key,
        is_active=True
    )
    
    db.add(new_key)
    db.commit()
    db.refresh(new_key)
    
    return APIKeyResponse(
        id=new_key.id,
        user_id=new_key.user_id,
        provider=new_key.provider,
        name=new_key.provider,  # Use provider as name
        key_preview=mask_api_key(api_key_data.key_value),
        is_active=new_key.is_active,
        created_at=new_key.created_at,
        updated_at=new_key.created_at  # Use created_at
    )


@router.patch("/{key_id}", response_model=APIKeyResponse)
async def update_api_key(
    key_id: int,
    update_data: APIKeyUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an API key (toggle active status or change name)"""
    
    api_key = db.query(APIKey).filter(
        APIKey.id == key_id,
        APIKey.user_id == current_user.id
    ).first()
    
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found"
        )
    
    # Update fields
    if update_data.is_active is not None:
        api_key.is_active = update_data.is_active
    
    if update_data.name is not None:
        api_key.name = update_data.name
    
    db.commit()
    db.refresh(api_key)
    
    # Decrypt for preview
    decrypted = decrypt_api_key(api_key.encrypted_key)
    
    return APIKeyResponse(
        id=api_key.id,
        user_id=api_key.user_id,
        provider=api_key.provider,
        name=api_key.name,
        key_preview=mask_api_key(decrypted),
        is_active=api_key.is_active,
        created_at=api_key.created_at,
        updated_at=api_key.updated_at
    )


@router.delete("/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_api_key(
    key_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an API key"""
    
    api_key = db.query(APIKey).filter(
        APIKey.id == key_id,
        APIKey.user_id == current_user.id
    ).first()
    
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found"
        )
    
    db.delete(api_key)
    db.commit()
    
    return None
