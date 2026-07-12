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
    DepartmentScore,
    PolicyAcknowledgement
)

social_bp = Blueprint('social', __name__, url_prefix='/api')

def get_utc_now():
    """Returns a timezone-naive UTC timestamp."""
    return datetime.now(timezone.utc).replace(tzinfo=None)

def evaluate_badge_rule(employee, rule_str):
    if not rule_str:
        return employee.xp >= 300
        
    try:
        rule = rule_str.strip().lower()
        
        # Count challenges completed
        if 'challenges' in rule:
            count = db.session.query(db.func.count(ChallengeParticipation.id)).filter(
                ChallengeParticipation.employee_id == employee.id,
                ChallengeParticipation.status == 'Completed'
            ).scalar() or 0
            val = int(''.join(filter(str.isdigit, rule)))
            return count >= val
            
        # Count policies acknowledged
        elif 'policies' in rule:
            count = db.session.query(db.func.count(PolicyAcknowledgement.id)).filter(
                PolicyAcknowledgement.employee_id == employee.id
            ).scalar() or 0
            val = int(''.join(filter(str.isdigit, rule)))
            return count >= val
            
        # Count carbon logs
        elif 'carbon' in rule or 'emissions' in rule:
            from models import CarbonTransaction
            count = db.session.query(db.func.count(CarbonTransaction.id)).filter(
                CarbonTransaction.department_id == employee.department_id
            ).scalar() or 0
            val = int(''.join(filter(str.isdigit, rule)))
            return count >= val
            
        # XP comparison
        elif 'xp' in rule:
            val = int(''.join(filter(str.isdigit, rule)))
            return employee.xp >= val
            
    except Exception as e:
        print("Badge rule parse error:", e)
        
    return employee.xp >= 300

def check_and_award_badges(employee):
    """Checks employee achievements and XP against badges and awards missing badges dynamically."""
    unlocked_badges = employee.badges
    all_badges = Badge.query.all()
    
    for badge in all_badges:
        if badge not in unlocked_badges:
            if evaluate_badge_rule(employee, badge.unlock_rule):
                employee.badges.append(badge)
                # Log notification
                notif = Notification(
                    title="New Badge Unlocked!",
                    description=f"Congratulations! You've unlocked the '{badge.name}' badge! {badge.description}",
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
# ==========================================
# 2. Challenge Arena & Progress Logs
# ==========================================
@social_bp.route('/challenges', methods=['GET'])
@role_required(['Admin', 'Employee'])
def get_challenges():
    search_query = request.args.get('search', '', type=str)
    status_filter = request.args.get('status', '', type=str)
    category_filter = request.args.get('category_id', type=int)
    difficulty_filter = request.args.get('difficulty', '', type=str)
    
    query = Challenge.query
    if search_query:
        query = query.filter(Challenge.title.ilike(f"%{search_query}%"))
    if status_filter:
        query = query.filter(Challenge.status == status_filter)
    if category_filter:
        query = query.filter(Challenge.category_id == category_filter)
    if difficulty_filter:
        query = query.filter(Challenge.difficulty == difficulty_filter)
        
    challenges = query.order_by(Challenge.end_date.desc()).all()
    return jsonify([c.to_dict() for c in challenges]), 200

@social_bp.route('/challenges', methods=['POST'])
@admin_required()
def create_challenge():
    from marshmallow import ValidationError
    from schemas import ChallengeSchema
    try:
        data = ChallengeSchema().load(request.get_json())
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    if not isinstance(data, dict):
        return jsonify({"message": "Invalid request body"}), 400

    # Handle alias mapping
    if 'deadline' in data:
        data['end_date'] = data.pop('deadline')
    if 'xp' in data:
        data['xp_reward'] = data.pop('xp')
    else:
        data['xp_reward'] = data.get('xp_reward', 0)
        
    new_challenge = Challenge(**data)
    db.session.add(new_challenge)
    db.session.commit()
    return jsonify(new_challenge.to_dict()), 201

@social_bp.route('/challenges/<int:id>', methods=['PUT'])
@admin_required()
def update_challenge(id):
    from marshmallow import ValidationError
    from schemas import ChallengeSchema
    challenge = Challenge.query.get_or_404(id)
    try:
        data = ChallengeSchema().load(request.get_json(), partial=True)
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    if not isinstance(data, dict):
        return jsonify({"message": "Invalid request body"}), 400

    if 'deadline' in data:
        data['end_date'] = data.pop('deadline')
    if 'xp' in data:
        data['xp_reward'] = data.pop('xp')

    for key, value in data.items():
        setattr(challenge, key, value)
        
    db.session.commit()
    return jsonify(challenge.to_dict()), 200

@social_bp.route('/challenges/<int:id>', methods=['DELETE'])
@admin_required()
def delete_challenge(id):
    challenge = Challenge.query.get_or_404(id)
    db.session.delete(challenge)
    db.session.commit()
    return jsonify({"message": "Challenge deleted successfully"}), 200

@social_bp.route('/challenges/<int:id>/join', methods=['POST'])
@jwt_required()
def join_challenge(id):
    current_user_email = get_jwt_identity()
    employee = Employee.query.filter_by(email=current_user_email).first()
    if not employee:
        return jsonify({"message": "Employee not found"}), 404

    challenge = Challenge.query.get_or_404(id)
    if challenge.status != 'Active':
        return jsonify({"message": "You can only join active challenges."}), 400
        
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
        status="Joined",
        approval="Pending",
        completion=False
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

    employee_id_filter = request.args.get('employee_id', type=int)
    status_filter = request.args.get('status', type=str)
    
    if employee.role == 'Admin':
        query = ChallengeParticipation.query
        if employee_id_filter:
            query = query.filter(ChallengeParticipation.employee_id == employee_id_filter)
    else:
        query = ChallengeParticipation.query.filter_by(employee_id=employee.id)
        
    if status_filter:
        query = query.filter(ChallengeParticipation.status == status_filter)
        
    participations = query.all()
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
    challenge = participation.challenge

    if participation.progress >= 100.0:
        if challenge.evidence_required:
            proof_val = data.get('proof') or data.get('proof_url')
            if not proof_val:
                return jsonify({"message": "Evidence proof URL is required to complete this challenge"}), 400
            participation.proof = proof_val
            participation.status = "Under Review"
            participation.approval = "Pending"
        else:
            if participation.status != "Completed":
                participation.status = "Completed"
                participation.approval = "Approved"
                participation.completion = True
                participation.completed_at = get_utc_now()
                participation.xp_awarded = challenge.xp_reward
                
                employee.points += challenge.points_reward
                employee.xp += challenge.xp_reward
                check_and_award_badges(employee)
                
                notif = Notification(
                    title="Challenge Completed!",
                    description=f"Congratulations! You completed '{challenge.title}' and earned {challenge.points_reward} points and {challenge.xp_reward} XP.",
                    type="challenge",
                    read=False,
                    created_at=get_utc_now(),
                    employee_id=employee.id
                )
                db.session.add(notif)
                
                if employee.department_id:
                    increment_department_social(employee.department_id, 2.5)
    else:
        if participation.status == "Completed":
            employee.xp = max(0, employee.xp - participation.xp_awarded)
            employee.points = max(0, employee.points - challenge.points_reward)
        participation.status = "Joined"
        participation.completion = False
        participation.completed_at = None
        participation.xp_awarded = 0
        participation.proof = None

    db.session.commit()
    return jsonify(participation.to_dict()), 200

@social_bp.route('/challenge-participations/<int:id>/approve', methods=['POST'])
@admin_required()
def approve_challenge_participation(id):
    participation = ChallengeParticipation.query.get_or_404(id)
    if participation.status == "Completed":
        return jsonify({"message": "Challenge participation is already approved"}), 400

    challenge = participation.challenge
    employee = participation.employee

    participation.status = "Completed"
    participation.approval = "Approved"
    participation.completion = True
    participation.completed_at = get_utc_now()
    participation.xp_awarded = challenge.xp_reward

    employee.points += challenge.points_reward
    employee.xp += challenge.xp_reward
    check_and_award_badges(employee)

    notif = Notification(
        title="Challenge Approved!",
        description=f"Your proof for challenge '{challenge.title}' was approved! Earned {challenge.points_reward} points and {challenge.xp_reward} XP.",
        type="challenge",
        read=False,
        created_at=get_utc_now(),
        employee_id=employee.id
    )
    db.session.add(notif)

    if employee.department_id:
        increment_department_social(employee.department_id, 2.5)

    db.session.commit()
    return jsonify(participation.to_dict()), 200

@social_bp.route('/challenge-participations/<int:id>/reject', methods=['POST'])
@admin_required()
def reject_challenge_participation(id):
    participation = ChallengeParticipation.query.get_or_404(id)
    if participation.status == "Completed":
        return jsonify({"message": "Cannot reject: challenge participation is already completed"}), 400

    challenge = participation.challenge

    participation.status = "Joined"
    participation.approval = "Rejected"
    participation.progress = 0.0
    participation.proof = None

    notif = Notification(
        title="Challenge Proof Rejected",
        description=f"Your proof for challenge '{challenge.title}' was rejected by the administrator. Please try again.",
        type="challenge",
        read=False,
        created_at=get_utc_now(),
        employee_id=participation.employee_id
    )
    db.session.add(notif)

    db.session.commit()
    return jsonify(participation.to_dict()), 200


# ==========================================
# 3. Rewards Store & Redemptions
# ==========================================
@social_bp.route('/rewards/<int:id>/redeem', methods=['POST'])
@jwt_required()
def redeem_reward(id):
    import uuid
    current_user_email = get_jwt_identity()
    employee = Employee.query.filter_by(email=current_user_email).first()
    if not employee:
        return jsonify({"message": "Employee not found"}), 404

    reward = Reward.query.get_or_404(id)
    if reward.stock <= 0:
        return jsonify({"message": "Reward item is currently out of stock"}), 400

    # XP Deduction first, fallback to Points
    cost = reward.xp_required if reward.xp_required > 0 else reward.points_cost
    if reward.xp_required > 0:
        if employee.xp < reward.xp_required:
            return jsonify({"message": f"Insufficient XP balance. Requires {reward.xp_required} XP."}), 400
        employee.xp -= reward.xp_required
    else:
        if employee.points < reward.points_cost:
            return jsonify({"message": f"Insufficient points balance. Requires {reward.points_cost} points."}), 400
        employee.points -= reward.points_cost

    reward.stock -= 1

    # Generate a unique green voucher promo code
    voucher = f"ECO-{reward.name[:3].upper().replace(' ', '')}-{uuid.uuid4().hex[:6].upper()}"

    redemption = RewardRedemption(
        employee_id=employee.id,
        reward_id=reward.id,
        redeemed_at=get_utc_now(),
        points_spent=reward.points_cost,
        status="Fulfilled",
        voucher_code=voucher
    )
    db.session.add(redemption)
    
    # Notify employee
    notif = Notification(
        title="Reward Redeemed!",
        description=f"Successfully redeemed '{reward.name}' for {cost} {'XP' if reward.xp_required > 0 else 'points'}. Code: {voucher}",
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
        "employee_xp": employee.xp,
        "reward_stock": reward.stock
    }), 200

@social_bp.route('/employees/me/redemptions', methods=['GET'])
@jwt_required()
def get_my_redemptions():
    current_user_email = get_jwt_identity()
    employee = Employee.query.filter_by(email=current_user_email).first()
    if not employee:
        return jsonify({"message": "Employee not found"}), 404
        
    redemptions = RewardRedemption.query.filter_by(employee_id=employee.id).order_by(RewardRedemption.redeemed_at.desc()).all()
    return jsonify([r.to_dict() for r in redemptions]), 200


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
    try:
        period = request.args.get('period', 'all', type=str)
        scope = request.args.get('scope', 'global', type=str)
        dept_id = request.args.get('department_id', type=int)
        
        query = Employee.query
        if scope == 'department' and dept_id:
            query = query.filter(Employee.department_id == dept_id)
            
        employees = query.all()
        
        if period in ['monthly', 'yearly']:
            import calendar
            today = datetime.now()
            year = today.year
            
            if period == 'monthly':
                month = today.month
                start_date = datetime(year, month, 1, 0, 0, 0)
                last_day = calendar.monthrange(year, month)[1]
                end_date = datetime(year, month, last_day, 23, 59, 59)
            else:
                start_date = datetime(year, 1, 1, 0, 0, 0)
                end_date = datetime(year, 12, 31, 23, 59, 59)
                
            leaderboard_data = []
            for emp in employees:
                csr_xp = db.session.query(db.func.sum(CSRActivity.xp_reward))\
                    .join(EmployeeParticipation)\
                    .filter(
                        EmployeeParticipation.employee_id == emp.id,
                        EmployeeParticipation.status == 'Approved',
                        EmployeeParticipation.approved_at >= start_date,
                        EmployeeParticipation.approved_at <= end_date
                    ).scalar() or 0
                    
                policy_acks_count = db.session.query(db.func.count(PolicyAcknowledgement.id))\
                    .filter(
                        PolicyAcknowledgement.employee_id == emp.id,
                        PolicyAcknowledgement.acknowledged_at >= start_date,
                        PolicyAcknowledgement.acknowledged_at <= end_date
                    ).scalar() or 0
                policy_xp = policy_acks_count * 150
                
                challenge_xp = db.session.query(db.func.sum(Challenge.xp_reward))\
                    .join(ChallengeParticipation)\
                    .filter(
                        ChallengeParticipation.employee_id == emp.id,
                        ChallengeParticipation.status == 'Completed',
                        ChallengeParticipation.completed_at >= start_date,
                        ChallengeParticipation.completed_at <= end_date
                    ).scalar() or 0
                    
                total_period_xp = int(csr_xp + policy_xp + challenge_xp)
                
                emp_dict = emp.to_dict()
                emp_dict['xp'] = total_period_xp
                leaderboard_data.append(emp_dict)
                
            leaderboard_data.sort(key=lambda x: x['xp'], reverse=True)
            return jsonify(leaderboard_data[:10]), 200
        else:
            employees.sort(key=lambda x: x.xp, reverse=True)
            return jsonify([e.to_dict() for e in employees[:10]]), 200
    except Exception as ex:
        import traceback
        print("LEADERBOARD ERROR:", str(ex))
        traceback.print_exc()
        return jsonify({"message": str(ex), "traceback": traceback.format_exc()}), 500

@social_bp.route('/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    current_user_email = get_jwt_identity()
    employee = Employee.query.filter_by(email=current_user_email).first()
    if not employee:
        return jsonify({"message": "Employee not found"}), 404
        
    notifications = Notification.query.filter_by(employee_id=employee.id).order_by(Notification.created_at.desc()).limit(15).all()
    return jsonify([n.to_dict() for n in notifications]), 200

@social_bp.route('/notifications/<int:id>/read', methods=['POST'])
@jwt_required()
def mark_notification_read(id):
    current_user_email = get_jwt_identity()
    employee = Employee.query.filter_by(email=current_user_email).first()
    if not employee:
        return jsonify({"message": "Employee not found"}), 404
        
    notification = Notification.query.filter_by(id=id, employee_id=employee.id).first_or_404()
    notification.read = True
    db.session.commit()
    return jsonify(notification.to_dict()), 200
