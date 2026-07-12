from datetime import datetime, timezone
from database import db

def get_utc_now():
    """Helper function to return timezone-naive UTC datetime, avoiding deprecation warnings."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


# Many-to-many relationship helper table for Employee Badges
employee_badges = db.Table('employee_badges',
    db.Column('employee_id', db.Integer, db.ForeignKey('employees.id', ondelete='CASCADE'), primary_key=True),
    db.Column('badge_id', db.Integer, db.ForeignKey('badges.id', ondelete='CASCADE'), primary_key=True)
)

class BaseModel(db.Model):
    """Abstract base model that exposes a type-safe constructor to Pyright."""
    __abstract__ = True
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)


class Department(BaseModel):
    __tablename__ = 'departments'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)
    
    # Explicit relations mapping with back_populates
    employees = db.relationship('Employee', back_populates='department', cascade='all, delete-orphan', passive_deletes=True)
    carbon_transactions = db.relationship('CarbonTransaction', back_populates='department', cascade='all, delete-orphan', passive_deletes=True)
    scores = db.relationship('DepartmentScore', back_populates='department', cascade='all, delete-orphan', passive_deletes=True)
    goals = db.relationship('EnvironmentalGoal', back_populates='department', cascade='all, delete-orphan', passive_deletes=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description
        }


class Employee(BaseModel):
    __tablename__ = 'employees'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='Employee', nullable=False)
    points = db.Column(db.Integer, default=0, nullable=False)
    xp = db.Column(db.Integer, default=0, nullable=False)
    
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id', ondelete='SET NULL'), nullable=True)
    
    # Relationships
    department = db.relationship('Department', back_populates='employees')
    badges = db.relationship('Badge', secondary=employee_badges, back_populates='employees')
    
    participations = db.relationship('EmployeeParticipation', back_populates='employee', cascade='all, delete-orphan', passive_deletes=True)
    challenge_participations = db.relationship('ChallengeParticipation', back_populates='employee', cascade='all, delete-orphan', passive_deletes=True)
    acknowledgements = db.relationship('PolicyAcknowledgement', back_populates='employee', cascade='all, delete-orphan', passive_deletes=True)
    redemptions = db.relationship('RewardRedemption', back_populates='employee', cascade='all, delete-orphan', passive_deletes=True)
    notifications = db.relationship('Notification', back_populates='employee', cascade='all, delete-orphan', passive_deletes=True)
    
    audits_owned = db.relationship('Audit', back_populates='lead_auditor', cascade='all, delete-orphan', passive_deletes=True)
    compliance_issues_owned = db.relationship('ComplianceIssue', back_populates='owner', cascade='all, delete-orphan', passive_deletes=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "points": self.points,
            "xp": self.xp,
            "department_id": self.department_id,
            "department_name": self.department.name if self.department else None
        }


class Category(BaseModel):
    __tablename__ = 'categories'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)
    
    # Relations
    emission_factors = db.relationship('EmissionFactor', back_populates='category', cascade='all, delete-orphan', passive_deletes=True)
    goals = db.relationship('EnvironmentalGoal', back_populates='category', cascade='all, delete-orphan', passive_deletes=True)
    carbon_transactions = db.relationship('CarbonTransaction', back_populates='category', cascade='all, delete-orphan', passive_deletes=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description
        }


class EmissionFactor(BaseModel):
    __tablename__ = 'emission_factors'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    factor = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(30), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id', ondelete='CASCADE'), nullable=False)
    
    # Relations
    category = db.relationship('Category', back_populates='emission_factors')
    carbon_transactions = db.relationship('CarbonTransaction', back_populates='emission_factor')

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "factor": self.factor,
            "unit": self.unit,
            "category_id": self.category_id,
            "category_name": self.category.name if self.category else None
        }


class EnvironmentalGoal(BaseModel):
    __tablename__ = 'environmental_goals'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    target_value = db.Column(db.Float, nullable=False)
    current_value = db.Column(db.Float, default=0.0, nullable=False)
    unit = db.Column(db.String(30), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    target_date = db.Column(db.Date, nullable=False)
    
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id', ondelete='CASCADE'), nullable=False)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id', ondelete='CASCADE'), nullable=True)
    
    # Relations
    category = db.relationship('Category', back_populates='goals')
    department = db.relationship('Department', back_populates='goals')

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "target_value": self.target_value,
            "current_value": self.current_value,
            "unit": self.unit,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "target_date": self.target_date.isoformat() if self.target_date else None,
            "category_id": self.category_id,
            "category_name": self.category.name if self.category else None,
            "department_id": self.department_id,
            "department_name": self.department.name if self.department else "Corporate Wide"
        }


class ProductESGProfile(BaseModel):
    __tablename__ = 'product_esg_profiles'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False, index=True)
    carbon_footprint = db.Column(db.Float, default=0.0, nullable=False)
    social_score = db.Column(db.Float, default=0.0, nullable=False)
    governance_score = db.Column(db.Float, default=0.0, nullable=False)
    overall_esg_score = db.Column(db.Float, default=0.0, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "carbon_footprint": self.carbon_footprint,
            "social_score": self.social_score,
            "governance_score": self.governance_score,
            "overall_esg_score": self.overall_esg_score
        }


class Policy(BaseModel):
    __tablename__ = 'policies'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    content = db.Column(db.Text, nullable=False)
    version = db.Column(db.String(10), default='1.0', nullable=False)
    effective_date = db.Column(db.Date, nullable=False)
    
    # Relations
    acknowledgements = db.relationship('PolicyAcknowledgement', back_populates='policy', cascade='all, delete-orphan', passive_deletes=True)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "content": self.content,
            "version": self.version,
            "effective_date": self.effective_date.isoformat() if self.effective_date else None
        }


class Badge(BaseModel):
    __tablename__ = 'badges'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False, index=True)
    description = db.Column(db.String(255), nullable=True)
    icon_name = db.Column(db.String(50), nullable=False)
    xp_required = db.Column(db.Integer, default=0, nullable=False)
    
    # Relations
    employees = db.relationship('Employee', secondary=employee_badges, back_populates='badges')

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "icon_name": self.icon_name,
            "xp_required": self.xp_required
        }


class Reward(BaseModel):
    __tablename__ = 'rewards'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)
    points_cost = db.Column(db.Integer, nullable=False)
    stock = db.Column(db.Integer, default=100, nullable=False)
    
    # Relations
    redemptions = db.relationship('RewardRedemption', back_populates='reward', cascade='all, delete-orphan', passive_deletes=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "points_cost": self.points_cost,
            "stock": self.stock
        }


class CarbonTransaction(BaseModel):
    __tablename__ = 'carbon_transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    activity_name = db.Column(db.String(150), nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    calculated_emissions = db.Column(db.Float, nullable=False)
    date = db.Column(db.Date, nullable=False, index=True)
    
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id', ondelete='CASCADE'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id', ondelete='CASCADE'), nullable=False)
    emission_factor_id = db.Column(db.Integer, db.ForeignKey('emission_factors.id', ondelete='RESTRICT'), nullable=False)
    
    # Relations
    department = db.relationship('Department', back_populates='carbon_transactions')
    category = db.relationship('Category', back_populates='carbon_transactions')
    emission_factor = db.relationship('EmissionFactor', back_populates='carbon_transactions')

    def to_dict(self):
        return {
            "id": self.id,
            "activity_name": self.activity_name,
            "quantity": self.quantity,
            "calculated_emissions": self.calculated_emissions,
            "date": self.date.isoformat() if self.date else None,
            "department_id": self.department_id,
            "department_name": self.department.name if self.department else None,
            "category_id": self.category_id,
            "category_name": self.category.name if self.category else None,
            "emission_factor_id": self.emission_factor_id,
            "emission_factor_name": self.emission_factor.name if self.emission_factor else None
        }


class CSRActivity(BaseModel):
    __tablename__ = 'csr_activities'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=False)
    date = db.Column(db.Date, nullable=False, index=True)
    location = db.Column(db.String(100), nullable=True)
    points_reward = db.Column(db.Integer, default=0, nullable=False)
    xp_reward = db.Column(db.Integer, default=0, nullable=False)
    max_participants = db.Column(db.Integer, nullable=True)
    
    # Relations
    participations = db.relationship('EmployeeParticipation', back_populates='csr_activity', cascade='all, delete-orphan', passive_deletes=True)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "date": self.date.isoformat() if self.date else None,
            "location": self.location,
            "points_reward": self.points_reward,
            "xp_reward": self.xp_reward,
            "max_participants": self.max_participants
        }


class EmployeeParticipation(BaseModel):
    __tablename__ = 'employee_participations'
    
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id', ondelete='CASCADE'), nullable=False)
    csr_activity_id = db.Column(db.Integer, db.ForeignKey('csr_activities.id', ondelete='CASCADE'), nullable=False)
    status = db.Column(db.String(30), default='Registered', nullable=False, index=True)
    proof_url = db.Column(db.String(255), nullable=True)
    submitted_at = db.Column(db.DateTime, default=get_utc_now, nullable=False)
    approved_at = db.Column(db.DateTime, nullable=True)
    
    # Relations
    employee = db.relationship('Employee', back_populates='participations')
    csr_activity = db.relationship('CSRActivity', back_populates='participations')

    def to_dict(self):
        return {
            "id": self.id,
            "employee_id": self.employee_id,
            "employee_name": self.employee.name if self.employee else None,
            "csr_activity_id": self.csr_activity_id,
            "csr_activity_title": self.csr_activity.title if self.csr_activity else None,
            "status": self.status,
            "proof_url": self.proof_url,
            "submitted_at": self.submitted_at.isoformat() if self.submitted_at else None,
            "approved_at": self.approved_at.isoformat() if self.approved_at else None
        }


class Challenge(BaseModel):
    __tablename__ = 'challenges'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=True)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(30), default='Draft', nullable=False, index=True)
    points_reward = db.Column(db.Integer, default=0, nullable=False)
    xp_reward = db.Column(db.Integer, default=0, nullable=False)
    
    # Relations
    participations = db.relationship('ChallengeParticipation', back_populates='challenge', cascade='all, delete-orphan', passive_deletes=True)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "status": self.status,
            "points_reward": self.points_reward,
            "xp_reward": self.xp_reward
        }


class ChallengeParticipation(BaseModel):
    __tablename__ = 'challenge_participations'
    
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id', ondelete='CASCADE'), nullable=False)
    challenge_id = db.Column(db.Integer, db.ForeignKey('challenges.id', ondelete='CASCADE'), nullable=False)
    progress = db.Column(db.Float, default=0.0, nullable=False)
    status = db.Column(db.String(30), default='Joined', nullable=False, index=True)
    
    # Relations
    employee = db.relationship('Employee', back_populates='challenge_participations')
    challenge = db.relationship('Challenge', back_populates='participations')

    def to_dict(self):
        return {
            "id": self.id,
            "employee_id": self.employee_id,
            "employee_name": self.employee.name if self.employee else None,
            "challenge_id": self.challenge_id,
            "challenge_title": self.challenge.title if self.challenge else None,
            "progress": self.progress,
            "status": self.status
        }


class PolicyAcknowledgement(BaseModel):
    __tablename__ = 'policy_acknowledgements'
    
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id', ondelete='CASCADE'), nullable=False)
    policy_id = db.Column(db.Integer, db.ForeignKey('policies.id', ondelete='CASCADE'), nullable=False)
    acknowledged_at = db.Column(db.DateTime, default=get_utc_now, nullable=False)
    
    # Relations
    employee = db.relationship('Employee', back_populates='acknowledgements')
    policy = db.relationship('Policy', back_populates='acknowledgements')

    def to_dict(self):
        return {
            "id": self.id,
            "employee_id": self.employee_id,
            "employee_name": self.employee.name if self.employee else None,
            "policy_id": self.policy_id,
            "policy_title": self.policy.title if self.policy else None,
            "acknowledged_at": self.acknowledged_at.isoformat() if self.acknowledged_at else None
        }


class Audit(BaseModel):
    __tablename__ = 'audits'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=True)
    audit_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(30), default='Scheduled', nullable=False)
    
    lead_auditor_id = db.Column(db.Integer, db.ForeignKey('employees.id', ondelete='CASCADE'), nullable=False)
    
    # Relations
    lead_auditor = db.relationship('Employee', back_populates='audits_owned')
    compliance_issues = db.relationship('ComplianceIssue', back_populates='audit', cascade='all, delete-orphan', passive_deletes=True)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "audit_date": self.audit_date.isoformat() if self.audit_date else None,
            "status": self.status,
            "lead_auditor_id": self.lead_auditor_id,
            "lead_auditor_name": self.lead_auditor.name if self.lead_auditor else None
        }


class ComplianceIssue(BaseModel):
    __tablename__ = 'compliance_issues'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(30), default='Open', nullable=False, index=True)
    severity = db.Column(db.String(20), default='Medium', nullable=False)
    due_date = db.Column(db.Date, nullable=False, index=True)
    resolved_at = db.Column(db.DateTime, nullable=True)
    
    owner_id = db.Column(db.Integer, db.ForeignKey('employees.id', ondelete='CASCADE'), nullable=False)
    audit_id = db.Column(db.Integer, db.ForeignKey('audits.id', ondelete='SET NULL'), nullable=True)
    
    # Relations
    owner = db.relationship('Employee', back_populates='compliance_issues_owned')
    audit = db.relationship('Audit', back_populates='compliance_issues')

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "status": self.status,
            "severity": self.severity,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
            "owner_id": self.owner_id,
            "owner_name": self.owner.name if self.owner else None,
            "audit_id": self.audit_id,
            "audit_title": self.audit.title if self.audit else None
        }


class DepartmentScore(BaseModel):
    __tablename__ = 'department_scores'
    
    id = db.Column(db.Integer, primary_key=True)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id', ondelete='CASCADE'), nullable=False)
    environmental_score = db.Column(db.Float, default=0.0, nullable=False)
    social_score = db.Column(db.Float, default=0.0, nullable=False)
    governance_score = db.Column(db.Float, default=0.0, nullable=False)
    overall_score = db.Column(db.Float, default=0.0, nullable=False)
    month = db.Column(db.String(7), nullable=False, index=True)
    
    # Relations
    department = db.relationship('Department', back_populates='scores')

    def to_dict(self):
        return {
            "id": self.id,
            "department_id": self.department_id,
            "department_name": self.department.name if self.department else None,
            "environmental_score": self.environmental_score,
            "social_score": self.social_score,
            "governance_score": self.governance_score,
            "overall_score": self.overall_score,
            "month": self.month
        }


class Notification(BaseModel):
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(30), nullable=False)
    read = db.Column(db.Boolean, default=False, nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=get_utc_now, nullable=False, index=True)
    
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id', ondelete='CASCADE'), nullable=False)
    
    # Relations
    employee = db.relationship('Employee', back_populates='notifications')

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "type": self.type,
            "read": self.read,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "employee_id": self.employee_id
        }


class RewardRedemption(BaseModel):
    __tablename__ = 'reward_redemptions'
    
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id', ondelete='CASCADE'), nullable=False)
    reward_id = db.Column(db.Integer, db.ForeignKey('rewards.id', ondelete='CASCADE'), nullable=False)
    redeemed_at = db.Column(db.DateTime, default=get_utc_now, nullable=False)
    points_spent = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(30), default='Pending', nullable=False)
    
    # Relations
    employee = db.relationship('Employee', back_populates='redemptions')
    reward = db.relationship('Reward', back_populates='redemptions')

    def to_dict(self):
        return {
            "id": self.id,
            "employee_id": self.employee_id,
            "employee_name": self.employee.name if self.employee else None,
            "reward_id": self.reward_id,
            "reward_name": self.reward.name if self.reward else None,
            "redeemed_at": self.redeemed_at.isoformat() if self.redeemed_at else None,
            "points_spent": self.points_spent,
            "status": self.status
        }
