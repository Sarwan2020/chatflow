from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, JSON, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base


class MemoryType(str, enum.Enum):
    EXPLICIT = "explicit"
    AUTOMATIC = "automatic"


class MemoryCategory(str, enum.Enum):
    PREFERENCE = "preference"
    FACT = "fact"
    INSTRUCTION = "instruction"
    CONTEXT = "context"


class Memory(Base):
    __tablename__ = "memories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    memory_type = Column(SQLEnum(MemoryType), nullable=False, index=True)
    category = Column(SQLEnum(MemoryCategory), nullable=False, index=True)
    importance = Column(Float, default=0.5)  # 0-1 score
    embedding = Column(JSON, nullable=True)  # Store as JSON array
    meta = Column(JSON, nullable=True)  # Additional metadata (renamed from metadata to avoid SQLAlchemy conflict)
    source_conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=True)
    source_message_id = Column(Integer, ForeignKey("messages.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="memories")
    source_conversation = relationship("Conversation", backref="memories")
    source_message = relationship("Message", backref="memories")
