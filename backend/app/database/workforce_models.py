"""
Relational Data Models for Workforce Intelligence and Talent Management.
Strictly additive: does not alter or delete existing tables.
"""

from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, JSON, Index
from sqlalchemy.orm import relationship
from backend.app.database.session import Base

class WorkforceEmployeeModel(Base):
    __tablename__ = "workforce_employees"

    agent_id = Column(String(64), primary_key=True)
    name = Column(String(128), nullable=False)
    current_title = Column(String(128), nullable=False)
    department = Column(String(64), nullable=False)
    floor = Column(Integer, nullable=False, default=0)
    current_config_version = Column(Integer, nullable=False, default=1)
    lifecycle_state = Column(String(32), nullable=False, default="active")  # candidate, in_testing, active, in_retraining, suspended, terminated
    hire_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    last_state_change = Column(DateTime, nullable=False, default=datetime.utcnow)
    avatar_file = Column(String(128), nullable=False, default="default.png")
    shirt_color = Column(String(32), nullable=True)
    is_archived = Column(Boolean, nullable=False, default=False)
    archived_at = Column(DateTime, nullable=True)

    configs = relationship("WorkforceAgentConfigModel", back_populates="employee", cascade="all")

    __table_args__ = (
        Index("idx_emp_dept_state", "department", "lifecycle_state"),
    )


class WorkforceAgentConfigModel(Base):
    __tablename__ = "workforce_agent_configs"

    id = Column(String(64), primary_key=True)
    agent_id = Column(String(64), ForeignKey("workforce_employees.agent_id"), nullable=False)
    version_number = Column(Integer, nullable=False)
    title = Column(String(128), nullable=False)
    role = Column(String(128), nullable=False)
    department = Column(String(64), nullable=False)
    floor = Column(Integer, nullable=False, default=0)
    permission_level = Column(Integer, nullable=False, default=2)
    model_name = Column(String(128), nullable=False, default="nvidia/nemotron-3-ultra-550b-a55b")
    system_instructions = Column(Text, nullable=False)
    tools_whitelist = Column(JSON, nullable=False, default=list)
    permission_scopes = Column(JSON, nullable=False, default=list)
    memory_configuration = Column(JSON, nullable=False, default=dict)
    evaluation_criteria = Column(JSON, nullable=False, default=dict)
    change_reason = Column(Text, nullable=False, default="Initial version")
    authorized_by_principal = Column(String(64), nullable=False, default="arjun_ceo")
    linked_approval_id = Column(String(64), nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    employee = relationship("WorkforceEmployeeModel", back_populates="configs")

    __table_args__ = (
        Index("idx_config_agent_ver", "agent_id", "version_number"),
    )


class WorkforceTaskTelemetryModel(Base):
    __tablename__ = "workforce_task_telemetry"

    id = Column(String(64), primary_key=True)
    task_id = Column(String(64), nullable=False, unique=True)
    project_id = Column(String(64), nullable=True)
    agent_id = Column(String(64), nullable=False)
    department = Column(String(64), nullable=False)
    started_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    approval_wait_seconds = Column(Float, nullable=False, default=0.0)
    execution_duration_seconds = Column(Float, nullable=True)
    model_name = Column(String(128), nullable=True)
    prompt_tokens = Column(Integer, nullable=False, default=0)
    completion_tokens = Column(Integer, nullable=False, default=0)
    cost_usd = Column(Float, nullable=False, default=0.0)
    status = Column(String(32), nullable=False, default="completed")  # completed, failed, cancelled
    retry_count = Column(Integer, nullable=False, default=0)
    failure_category = Column(String(64), nullable=True)  # agent_error, tool_timeout, rate_limit, quality_reject
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    __table_args__ = (
        Index("idx_telemetry_agent_date", "agent_id", "created_at"),
        Index("idx_telemetry_dept_date", "department", "created_at"),
    )


class WorkforceTaskEvaluationModel(Base):
    __tablename__ = "workforce_task_evaluations"

    id = Column(String(64), primary_key=True)
    task_id = Column(String(64), nullable=False)
    agent_id = Column(String(64), nullable=False)
    evaluator_type = Column(String(32), nullable=False, default="automated_qa")  # automated_qa, rubric_inspector, ceo_review
    quality_score = Column(Float, nullable=False, default=100.0)  # 0.0 to 100.0
    accuracy_score = Column(Float, nullable=False, default=100.0)  # 0.0 to 100.0
    defects_count = Column(Integer, nullable=False, default=0)
    rubric_breakdown = Column(JSON, nullable=False, default=dict)
    evaluation_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    __table_args__ = (
        Index("idx_eval_agent_date", "agent_id", "created_at"),
        Index("idx_eval_task", "task_id"),
    )


class WorkforceRecruitmentTestModel(Base):
    __tablename__ = "workforce_recruitment_tests"

    id = Column(String(64), primary_key=True)
    candidate_id = Column(String(64), nullable=False)
    test_suite_id = Column(String(64), nullable=False)
    test_task_title = Column(String(255), nullable=False)
    input_payload = Column(JSON, nullable=False, default=dict)
    output_payload = Column(JSON, nullable=True)
    quality_score = Column(Float, nullable=True)
    pass_threshold = Column(Float, nullable=False, default=80.0)
    passed = Column(Boolean, nullable=False, default=False)
    duration_seconds = Column(Float, nullable=False, default=0.0)
    cost_usd = Column(Float, nullable=False, default=0.0)
    error_log = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    __table_args__ = (
        Index("idx_recruitment_candidate", "candidate_id"),
    )


class WorkforceRecommendationModel(Base):
    __tablename__ = "workforce_recommendations"

    id = Column(String(64), primary_key=True)
    rec_type = Column(String(64), nullable=False)  # underperformance, promotion, skill_gap, workload_imbalance, cost_optimization
    target_agent_id = Column(String(64), nullable=False)
    department = Column(String(64), nullable=False)
    title = Column(String(255), nullable=False)
    reasoning = Column(Text, nullable=False)
    evidence = Column(JSON, nullable=False, default=dict)  # Array of real record IDs & metrics
    confidence_score = Column(Float, nullable=False, default=0.0)  # 0.0 to 1.0
    sample_size = Column(Integer, nullable=False, default=0)
    data_window_days = Column(Integer, nullable=False, default=30)
    model_used = Column(String(128), nullable=False, default="nvidia/nemotron-3-ultra-550b-a55b")
    prompt_version = Column(String(32), nullable=False, default="v1.0")
    status = Column(String(32), nullable=False, default="pending")  # pending, accepted, dismissed, expired
    linked_approval_id = Column(String(64), nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    __table_args__ = (
        Index("idx_rec_status_dept", "status", "department"),
    )


class WorkforceAuditLogModel(Base):
    __tablename__ = "workforce_audit_log"

    id = Column(String(64), primary_key=True)
    actor_principal = Column(String(64), nullable=False)
    actor_role = Column(String(32), nullable=False)
    action = Column(String(64), nullable=False)  # hire, promote, retrain, reassign, suspend, terminate, reactivate, rollback
    target_agent_id = Column(String(64), nullable=False)
    target_agent_name = Column(String(128), nullable=False)
    before_state = Column(JSON, nullable=False, default=dict)
    after_state = Column(JSON, nullable=False, default=dict)
    reason = Column(Text, nullable=False)
    linked_approval_id = Column(String(64), nullable=False)
    linked_recommendation_id = Column(String(64), nullable=True)
    correlation_id = Column(String(64), nullable=False)
    ip_address = Column(String(45), nullable=True)
    timestamp = Column(DateTime, nullable=False, default=datetime.utcnow)

    __table_args__ = (
        Index("idx_audit_target_time", "target_agent_id", "timestamp"),
    )


class ModelPricingModel(Base):
    __tablename__ = "model_pricing"

    model_name = Column(String(128), primary_key=True)
    prompt_price_per_1k = Column(Float, nullable=False, default=0.0015)
    completion_price_per_1k = Column(Float, nullable=False, default=0.0020)
    active = Column(Boolean, nullable=False, default=True)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow)
