from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timezone
from sqlalchemy import or_

from database import db
from utils.auth import admin_required, role_required
from models import (
    Employee,
    CSRActivity,
    EmployeeParticipation,
    Challenge,
    ChallengeParticipation,
    Reward,
    RewardRedemption,
    Badge,
    Notification,
    DepartmentScore
)

social_bp = Blueprint('social', __name__, url_prefix='/api')

def get_utc_now():
    """Returns a timezone-naive UTC timestamp."""
    return datetime.now(timezone.utc).replace(tzinfo=None)

def check_and_award_badges(employee):
    """Checks employee XP against all badges and awards missing badges dynamically."""
    unlocked_badges = employee.badges
    all_badges = Badge.query.all()
    
    for badge in all_badges:
        if badge not in unlocked_badges and employee.xp >= badge.xp_required:
            employee.badges.append(badge)
            # Log notification
            notif = Notification(
                title="New Badge Unlocked!",
                description=f"Congratulations! You've unlocked the '{badge.name}' badge by crossing {badge.xp_required} XP.",
                type="badge",
                read=False,
                created_at=get_utc_now(),
                employee_id=employee.id
            )
            db.session.add(notif)
    db.session.commit()

def increment_department_social(department_id, increment=5.0):
    """Finds or creates a DepartmentScore for the current month and increments social score."""
    current_month = datetime.now().strftime("%Y-%m")
    score = DepartmentScore.query.filter_by(department_id=department_id, month=current_month).first()
    if not score:
        score = DepartmentScore(
            department_id=department_id,
            environmental_score=75.0,
            social_score=75.0,
            governance_score=78.0,
            overall_score=75.9,
            month=current_month
        )
        db.session.add(score)
    
    score.social_score = min(score.social_score + increment, 100.0)
    score.overall_score = (score.environmental_score * 0.4) + (score.social_score * 0.3) + (score.governance_score * 0.3)
    db.session.commit()

# ==========================================
# 1. CSR Activity Registrations & Approvals
# ==========================================
@social_bp.route('/csr-activities', methods=['GET'])
@role_required(['Admin', 'Employee'])
def get_csr_activities():
    search = request.args.get('search', '', type=str)
    query = CSRActivity.query
    if search:
        query = query.filter(or_(CSRActivity.title.ilike(f"%{search}%"), CSRActivity.description.ilike(f"%{search}%")))
    
    # Order by date desc
    query = query.order_by(CSRActivity.date.desc())
    activities = query.all()
    return jsonify([a.to_dict() for a in activities]), 200

@social_bp.route('/csr-activities/<int:id>/register', methods=['POST'])
@jwt_required()
def register_csr_activity(id):
    current_user_email = get_jwt_identity()
    employee = Employee.query.filter_by(email=current_user_email).first()
    if not employee:
        return jsonify({"message": "Employee not found"}), 404
        
    activity = CSRActivity.query.get_or_404(id)
    
    # Check duplicate
    existing = EmployeeParticipation.query.filter_by(
        employee_id=employee.id,
        csr_activity_id=activity.id
    ).first()
    if existing:
        return jsonify({"message": "You are already registered for this activity"}), 400

    participation = EmployeeParticipation(
        employee_id=employee.id,
        csr_activity_id=activity.id,
        status="Registered",
        submitted_at=get_utc_now()
    )
    db.session.add(participation)
    db.session.commit()
    return jsonify(participation.to_dict()), 201

@social_bp.route('/employee-participations', methods=['GET'])
@role_required(['Admin', 'Employee'])
def get_participations():
    # Admin sees all, employee sees only their own
    current_user_email = get_jwt_identity()
    employee = Employee.query.filter_by(email=current_user_email).first()
    if not employee:
        return jsonify({"message": "Employee not found"}), 404

    if employee.role == 'Admin':
        participations = EmployeeParticipation.query.order_by(EmployeeParticipation.submitted_at.desc()).all()
    else:
        participations = EmployeeParticipation.query.filter_by(employee_id=employee.id).order_by(EmployeeParticipation.submitted_at.desc()).all()
        
    return jsonify([p.to_dict() for p in participations]), 200

@social_bp.route('/employee-participations/<int:id>/submit-proof', methods=['POST'])
@jwt_required()
def submit_participation_proof(id):
    current_user_email = get_jwt_identity()
    employee = Employee.query.filter_by(email=current_user_email).first()
    if not employee:
        return jsonify({"message": "Employee not found"}), 404

    participation = EmployeeParticipation.query.get_or_404(id)
    if participation.employee_id != employee.id and employee.role != 'Admin':
        return jsonify({"message": "Unauthorized access"}), 403

    data = request.get_json()
    if not data or not data.get('proof_url'):
        return jsonify({"message": "Missing proof details"}), 400

    participation.proof_url = data['proof_url']
    participation.status = "Submitted"
    participation.submitted_at = get_utc_now()
    db.session.commit()

    return jsonify(participation.to_dict()), 200

@social_bp.route('/employee-participations/<int:id>/approve', methods=['POST'])
@admin_required()
def approve_participation(id):
    participation = EmployeeParticipation.query.get_or_404(id)
    if participation.status == "Approved":
        return jsonify({"message": "Participation is already approved"}), 400

    participation.status = "Approved"
    participation.approved_at = get_utc_now()
    
    # Reward Employee
    employee = participation.employee
    activity = participation.csr_activity
    if employee and activity:
        employee.points += activity.points_reward
        employee.xp += activity.xp_reward
        
        # Award badge locks if qualified
        check_and_award_badges(employee)
        
        # Increment department ESG social score
        if employee.department_id:
            increment_department_social(employee.department_id, 3.5)

        # Notify Employee
        notif = Notification(
            title="CSR Activity Approved!",
            description=f"Your proof for '{activity.title}' was approved. Awarded {activity.points_reward} points and {activity.xp_reward} XP.",
            type="csr",
            read=False,
            created_at=get_utc_now(),
            employee_id=employee.id
        )
        db.session.add(notif)

    db.session.commit()
    return jsonify(participation.to_dict()), 200


# ==========================================
# 2. Challenge Arena & Progress Logs
# ==========================================
@social_bp.route('/challenges', methods=['GET'])
@role_required(['Admin', 'Employee'])
def get_challenges():
    challenges = Challenge.query.order_by(Challenge.start_date.desc()).all()
    return jsonify([c.to_dict() for c in challenges]), 200

@social_bp.route('/challenges/<int:id>/join', methods=['POST'])
@jwt_required()
def join_challenge(id):
    current_user_email = get_jwt_identity()
    employee = Employee.query.filter_by(email=current_user_email).first()
    if not employee:
        return jsonify({"message": "Employee not found"}), 404

    challenge = Challenge.query.get_or_404(id)
    
    existing = ChallengeParticipation.query.filter_by(
        employee_id=employee.id,
        challenge_id=challenge.id
    ).first()
    if existing:
        return jsonify({"message": "You have already joined this challenge"}), 400

    participation = ChallengeParticipation(
        employee_id=employee.id,
        challenge_id=challenge.id,
        progress=0.0,
        status="Joined"
    )
    db.session.add(participation)
    db.session.commit()
    return jsonify(participation.to_dict()), 201

@social_bp.route('/challenge-participations', methods=['GET'])
@jwt_required()
def get_challenge_participations():
    current_user_email = get_jwt_identity()
    employee = Employee.query.filter_by(email=current_user_email).first()
    if not employee:
        return jsonify({"message": "Employee not found"}), 404

    participations = ChallengeParticipation.query.filter_by(employee_id=employee.id).all()
    return jsonify([p.to_dict() for p in participations]), 200

@social_bp.route('/challenge-participations/<int:id>/progress', methods=['POST'])
@jwt_required()
def update_challenge_progress(id):
    current_user_email = get_jwt_identity()
    employee = Employee.query.filter_by(email=current_user_email).first()
    if not employee:
        return jsonify({"message": "Employee not found"}), 404

    participation = ChallengeParticipation.query.get_or_404(id)
    if participation.employee_id != employee.id and employee.role != 'Admin':
        return jsonify({"message": "Unauthorized"}), 403

    data = request.get_json()
    if not data or 'progress' not in data:
        return jsonify({"message": "Missing progress value"}), 400

    try:
        new_progress = float(data['progress'])
    except ValueError:
        return jsonify({"message": "Progress must be a numeric value"}), 400

    participation.progress = min(max(new_progress, 0.0), 100.0)
    
    # Check completed
    if participation.progress >= 100.0 and participation.status != "Completed":
        participation.status = "Completed"
        challenge = participation.challenge
        if challenge:
            employee.points += challenge.points_reward
            employee.xp += challenge.xp_reward
            check_and_award_badges(employee)
            
            # Create completed notification
            notif = Notification(
                title="Challenge Completed!",
                description=f"Congratulations! You completed '{challenge.title}' and earned {challenge.points_reward} points and {challenge.xp_reward} XP.",
                type="challenge",
                read=False,
                created_at=get_utc_now(),
                employee_id=employee.id
            )
            db.session.add(notif)
            
            # Increment department social score
            if employee.department_id:
                increment_department_social(employee.department_id, 2.5)

    db.session.commit()
    return jsonify(participation.to_dict()), 200


# ==========================================
# 3. Rewards Store & Redemptions
# ==========================================
@social_bp.route('/rewards/<int:id>/redeem', methods=['POST'])
@jwt_required()
def redeem_reward(id):
    current_user_email = get_jwt_identity()
    employee = Employee.query.filter_by(email=current_user_email).first()
    if not employee:
        return jsonify({"message": "Employee not found"}), 404

    reward = Reward.query.get_or_404(id)
    if reward.stock <= 0:
        return jsonify({"message": "Reward item is currently out of stock"}), 400

    if employee.points < reward.points_cost:
        return jsonify({"message": f"Insufficient points balance. Requires {reward.points_cost} points."}), 400

    # Deduct points & stock
    employee.points -= reward.points_cost
    reward.stock -= 1

    redemption = RewardRedemption(
        employee_id=employee.id,
        reward_id=reward.id,
        redeemed_at=get_utc_now(),
        points_spent=reward.points_cost,
        status="Fulfilled"
    )
    db.session.add(redemption)
    
    # Notify employee
    notif = Notification(
        title="Reward Redeemed!",
        description=f"Successfully redeemed '{reward.name}' for {reward.points_cost} points.",
        type="reward",
        read=False,
        created_at=get_utc_now(),
        employee_id=employee.id
    )
    db.session.add(notif)
    
    db.session.commit()
    return jsonify({
        "redemption": redemption.to_dict(),
        "employee_points": employee.points,
        "reward_stock": reward.stock
    }), 200


# ==========================================
# 4. Badges locker & global leaderboard
# ==========================================
@social_bp.route('/employees/me/badges', methods=['GET'])
@jwt_required()
def get_my_badges():
    current_user_email = get_jwt_identity()
    employee = Employee.query.filter_by(email=current_user_email).first()
    if not employee:
        return jsonify({"message": "Employee not found"}), 404
        
    return jsonify([b.to_dict() for b in employee.badges]), 200

@social_bp.route('/leaderboard', methods=['GET'])
@role_required(['Admin', 'Employee'])
def get_leaderboard():
    # Query top employees sorted by XP descending
    top_employees = Employee.query.order_by(Employee.xp.desc()).limit(10).all()
    return jsonify([e.to_dict() for e in top_employees]), 200
