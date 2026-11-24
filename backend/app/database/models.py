"""
Relational Data Models for Project Autonomia.
"""

from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from backend.app.database.session import Base

class ProjectModel(Base):
    __tablename__ = "projects"

    id = Column(String(64), primary_key=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(32), default="pending")  # pending, in_progress, review, completed, failed
    target_platform = Column(String(64), default="youtube")  # youtube, instagram, email, internal
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    meta = Column(JSON, default=dict)

    tasks = relationship("TaskModel", back_populates="project", cascade="all, delete-orphan")


class TaskModel(Base):
    __tablename__ = "tasks"

    id = Column(String(64), primary_key=True)
    project_id = Column(String(64), ForeignKey("projects.id"), nullable=True)
    title = Column(String(255), nullable=False)
    department = Column(String(64), nullable=False)
    assigned_agent_id = Column(String(64), nullable=False)
    status = Column(String(32), default="pending")  # pending, in_progress, review, completed, failed
    permission_level = Column(Integer, default=2)   # 1=Read, 2=Create, 3=Execute (Requires CEO approval)
    dependencies = Column(JSON, default=list)       # list of task_ids that must complete first
    input_data = Column(JSON, default=dict)
    output_data = Column(JSON, default=dict)
    error_message = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    project = relationship("ProjectModel", back_populates="tasks")
    approvals = relationship("ApprovalModel", back_populates="task", cascade="all, delete-orphan")


class ApprovalModel(Base):
    __tablename__ = "approvals"

    id = Column(String(64), primary_key=True)
    task_id = Column(String(64), ForeignKey("tasks.id"), nullable=False)
    agent_id = Column(String(64), nullable=True)
    action_type = Column(String(64), nullable=False)  # publish_youtube, publish_instagram, send_bulk_email
    description = Column(Text, nullable=False)
    preview_url = Column(String(512), nullable=True)
    preview_data = Column(JSON, default=dict)
    status = Column(String(32), default="pending")  # pending, approved, rejected, revised
    ceo_feedback = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    task = relationship("TaskModel", back_populates="approvals")


class AgentStateModel(Base):
    __tablename__ = "agent_states"

    agent_id = Column(String(64), primary_key=True)
    name = Column(String(128), nullable=False)
    department = Column(String(64), nullable=False)
    role = Column(String(128), nullable=False)
    floor = Column(Integer, default=0)
    status = Column(String(32), default="idle")  # idle, working, reviewing, waiting_approval, error
    current_task_id = Column(String(64), nullable=True)
    current_task_title = Column(String(255), nullable=True)
    task_count = Column(Integer, default=0)
    error_count = Column(Integer, default=0)
    last_active = Column(DateTime, default=datetime.utcnow)


class CompanyMemoryModel(Base):
    __tablename__ = "company_memory"

    id = Column(String(64), primary_key=True)
    category = Column(String(64), nullable=False)  # brand, tone, templates, stats
    key = Column(String(128), nullable=False, unique=True)
    value = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class AgentMessageModel(Base):
    __tablename__ = "agent_messages"

    id = Column(String(64), primary_key=True)
    sender_id = Column(String(64), nullable=False)
    sender_name = Column(String(128), nullable=False)
    sender_floor = Column(Integer, default=0)
    recipient_id = Column(String(64), nullable=False)  # 'all', agent_id, or '#channel'
    recipient_name = Column(String(128), nullable=False)
    recipient_floor = Column(Integer, default=0)
    message_type = Column(String(32), default="task_brief")  # task_brief, handoff, inquiry, review_status, general_chat, cross_floor_visit
    content = Column(Text, nullable=False)
    project_id = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

