from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date

from database import db
from utils.auth import admin_required, role_required
from models import (
    Employee,
    Policy,
    PolicyAcknowledgement,
    Audit,
    ComplianceIssue,
    Notification,
    DepartmentScore,
    Department
)
from routes.social_gamification import check_and_award_badges, get_utc_now

gov_bp = Blueprint('governance', __name__, url_prefix='/api')

def increment_department_governance(department_id, increment=4.0):
    """Finds or creates a DepartmentScore for the current month and increments governance score."""
    current_month = datetime.now().strftime("%Y-%m")
    score = DepartmentScore.query.filter_by(department_id=department_id, month=current_month).first()
    if not score:
        score = DepartmentScore(
            department_id=department_id,
            environmental_score=75.0,
            social_score=75.0,
            governance_score=75.0,
            overall_score=75.0,
            month=current_month
        )
        db.session.add(score)
    
    score.governance_score = min(score.governance_score + increment, 100.0)
    score.overall_score = (score.environmental_score * 0.4) + (score.social_score * 0.3) + (score.governance_score * 0.3)
    db.session.commit()

# ==========================================
# 1. Policy Acknowledgements & Signatures
# ==========================================
@gov_bp.route('/policies/me/status', methods=['GET'])
@jwt_required()
def get_policy_acknowledgement_status():
    current_user_email = get_jwt_identity()
    employee = Employee.query.filter_by(email=current_user_email).first()
    if not employee:
        return jsonify({"message": "Employee not found"}), 404
        
    acks = PolicyAcknowledgement.query.filter_by(employee_id=employee.id).all()
    acknowledged_ids = [ack.policy_id for ack in acks]
    return jsonify(acknowledged_ids), 200

@gov_bp.route('/policies/<int:id>/acknowledge', methods=['POST'])
@jwt_required()
def acknowledge_policy(id):
    current_user_email = get_jwt_identity()
    employee = Employee.query.filter_by(email=current_user_email).first()
    if not employee:
        return jsonify({"message": "Employee not found"}), 404
        
    policy = Policy.query.get_or_404(id)
    
    # Check duplicate
    existing = PolicyAcknowledgement.query.filter_by(
        employee_id=employee.id,
        policy_id=policy.id
    ).first()
    if existing:
        return jsonify({"message": "You have already acknowledged this policy"}), 400

    ack = PolicyAcknowledgement(
        employee_id=employee.id,
        policy_id=policy.id,
        acknowledged_at=get_utc_now()
    )
    db.session.add(ack)
    
    # Reward Employee
    employee.points += 50
    employee.xp += 150
    check_and_award_badges(employee)
    
    # Send Notification
    notif = Notification(
        title="Policy Signed!",
        description=f"You successfully signed the '{policy.title}' guidelines policy. Earned 50 points and 150 XP.",
        type="policy",
        read=False,
        created_at=get_utc_now(),
        employee_id=employee.id
    )
    db.session.add(notif)
    
    # Increment department G score
    if employee.department_id:
        increment_department_governance(employee.department_id, 2.0)

    db.session.commit()
    return jsonify(ack.to_dict()), 201


# ==========================================
# 2. Audits timeline log
# ==========================================
@gov_bp.route('/audits', methods=['GET'])
@role_required(['Admin', 'Employee'])
def get_audits():
    audits = Audit.query.order_by(Audit.audit_date.desc()).all()
    return jsonify([a.to_dict() for a in audits]), 200

@gov_bp.route('/audits', methods=['POST'])
@admin_required()
def create_audit():
    data = request.get_json()
    if not data or not data.get('title') or not data.get('audit_date') or not data.get('lead_auditor_id'):
        return jsonify({"message": "Missing required fields"}), 400
        
    try:
        audit_date = datetime.strptime(data['audit_date'], "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"message": "Invalid date format. Use YYYY-MM-DD"}), 400

    # Verify auditor
    Employee.query.get_or_404(data['lead_auditor_id'])

    new_audit = Audit(
        title=data['title'],
        description=data.get('description'),
        audit_date=audit_date,
        status=data.get('status', 'Scheduled'),
        lead_auditor_id=data['lead_auditor_id']
    )
    db.session.add(new_audit)
    db.session.commit()
    return jsonify(new_audit.to_dict()), 201


# ==========================================
# 3. Compliance Issues Kanban Tracking
# ==========================================
@gov_bp.route('/compliance-issues', methods=['GET'])
@role_required(['Admin', 'Employee'])
def get_compliance_issues():
    # Supports status and assignee filter
    status_filter = request.args.get('status', type=str)
    owner_filter = request.args.get('owner_id', type=int)
    
    query = ComplianceIssue.query
    if status_filter:
        query = query.filter(ComplianceIssue.status == status_filter)
    if owner_filter:
        query = query.filter(ComplianceIssue.owner_id == owner_filter)
        
    issues = query.order_by(ComplianceIssue.due_date.asc()).all()
    
    # Process Overdue items
    today = date.today()
    updated = False
    for issue in issues:
        if issue.status != 'Resolved' and issue.status != 'Overdue' and issue.due_date < today:
            issue.status = 'Overdue'
            updated = True
            
    if updated:
        db.session.commit()
        
    return jsonify([i.to_dict() for i in issues]), 200

@gov_bp.route('/compliance-issues', methods=['POST'])
@admin_required()
def create_compliance_issue():
    data = request.get_json()
    if not data or not data.get('title') or not data.get('description') or not data.get('due_date') or not data.get('owner_id'):
        return jsonify({"message": "Missing required fields"}), 400
        
    try:
        due_date = datetime.strptime(data['due_date'], "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"message": "Invalid date format. Use YYYY-MM-DD"}), 400

    # Verify assignee
    Employee.query.get_or_404(data['owner_id'])
    
    # Verify optional audit link
    if data.get('audit_id'):
        Audit.query.get_or_404(data['audit_id'])

    new_issue = ComplianceIssue(
        title=data['title'],
        description=data['description'],
        severity=data.get('severity', 'Medium'),
        status=data.get('status', 'Open'),
        due_date=due_date,
        owner_id=data['owner_id'],
        audit_id=data.get('audit_id')
    )
    
    db.session.add(new_issue)
    
    # Notify assignee
    notif = Notification(
        title="New Compliance Issue Assigned",
        description=f"You have been assigned the compliance issue: '{new_issue.title}' (Severity: {new_issue.severity}). Due by {due_date.isoformat()}.",
        type="compliance",
        read=False,
        created_at=get_utc_now(),
        employee_id=new_issue.owner_id
    )
    db.session.add(notif)
    
    db.session.commit()
    return jsonify(new_issue.to_dict()), 201

@gov_bp.route('/compliance-issues/<int:id>', methods=['PUT'])
@jwt_required()
def update_compliance_issue(id):
    current_user_email = get_jwt_identity()
    employee = Employee.query.filter_by(email=current_user_email).first()
    if not employee:
        return jsonify({"message": "Employee not found"}), 404
        
    issue = ComplianceIssue.query.get_or_404(id)
    
    # Restrict editing: non-admin can only update status if they are the owner
    if employee.role != 'Admin' and issue.owner_id != employee.id:
        return jsonify({"message": "Unauthorized: You do not own this compliance issue."}), 403

    data = request.get_json()
    if not data:
        return jsonify({"message": "Missing input data"}), 400

    # Fields that everyone (assignee & admin) can update
    status = data.get('status')
    if status:
        if status not in ['Open', 'In Progress', 'Resolved', 'Overdue']:
            return jsonify({"message": "Invalid status value"}), 400
        
        # If transitioning to Resolved, calculate rewards & G score boost
        if status == 'Resolved' and issue.status != 'Resolved':
            issue.resolved_at = get_utc_now()
            
            # Boost score
            owner_emp = issue.owner
            if owner_emp and owner_emp.department_id:
                increment_department_governance(owner_emp.department_id, 4.0)
                
            # Notify owner
            notif = Notification(
                title="Compliance Issue Resolved",
                description=f"Compliance issue: '{issue.title}' resolved. Operations Governance department score boosted.",
                type="compliance",
                read=False,
                created_at=get_utc_now(),
                employee_id=issue.owner_id
            )
            db.session.add(notif)
        elif status != 'Resolved':
            issue.resolved_at = None
            
        issue.status = status

    # Admin only updates (owner re-assignment, severity changes, due date modification)
    if employee.role == 'Admin':
        if 'title' in data:
            issue.title = data['title']
        if 'description' in data:
            issue.description = data['description']
        if 'severity' in data:
            issue.severity = data['severity']
        if 'owner_id' in data:
            # Verify owner
            Employee.query.get_or_404(data['owner_id'])
            issue.owner_id = data['owner_id']
        if 'due_date' in data:
            try:
                issue.due_date = datetime.strptime(data['due_date'], "%Y-%m-%d").date()
            except ValueError:
                return jsonify({"message": "Invalid date format. Use YYYY-MM-DD"}), 400

    db.session.commit()
    return jsonify(issue.to_dict()), 200
