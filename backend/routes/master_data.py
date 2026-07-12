from flask import Blueprint, request, jsonify
from marshmallow import ValidationError
from werkzeug.security import generate_password_hash
from sqlalchemy import or_

from database import db
from utils.auth import admin_required, role_required
from models import (
    Department,
    Employee,
    Category,
    EmissionFactor,
    EnvironmentalGoal,
    ProductESGProfile,
    Policy,
    Badge,
    Reward
)
from schemas import (
    DepartmentSchema,
    CategorySchema,
    EmissionFactorSchema,
    EnvironmentalGoalSchema,
    ProductESGProfileSchema,
    PolicySchema,
    BadgeSchema,
    RewardSchema,
    EmployeeSchema
)

master_bp = Blueprint('master', __name__, url_prefix='/api')

# Helper function to paginate and search queries
def paginate_and_search(query, model, search_fields=None):
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    search_query = request.args.get('search', '', type=str)

    if search_query and search_fields:
        filters = []
        for field in search_fields:
            col = getattr(model, field, None)
            if col is not None:
                filters.append(col.ilike(f"%{search_query}%"))
        if filters:
            query = query.filter(or_(*filters))

    sort_by = request.args.get('sort_by', 'id', type=str)
    sort_dir = request.args.get('sort_dir', 'asc', type=str)
    col = getattr(model, sort_by, None)
    if col is not None:
        if sort_dir == 'desc':
            query = query.order_by(col.desc())
        else:
            query = query.order_by(col.asc())

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    return {
        "items": [item.to_dict() for item in pagination.items],
        "total": pagination.total,
        "page": pagination.page,
        "per_page": pagination.per_page,
        "pages": pagination.pages
    }

# ==========================================
# 1. Department CRUD
# ==========================================
@master_bp.route('/departments', methods=['GET'])
@role_required(['Admin', 'Employee'])
def get_departments():
    return jsonify(paginate_and_search(Department.query, Department, ['name', 'description'])), 200

@master_bp.route('/departments', methods=['POST'])
@admin_required()
def create_department():
    try:
        data = DepartmentSchema().load(request.get_json())
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    if not isinstance(data, dict):
        return jsonify({"message": "Invalid request body"}), 400

    if Department.query.filter_by(name=data['name']).first():
        return jsonify({"message": "Department name already exists"}), 400

    new_dept = Department(**data)
    db.session.add(new_dept)
    db.session.commit()
    return jsonify(new_dept.to_dict()), 201

@master_bp.route('/departments/<int:id>', methods=['PUT'])
@admin_required()
def update_department(id):
    dept = Department.query.get_or_404(id)
    try:
        data = DepartmentSchema().load(request.get_json())
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    if not isinstance(data, dict):
        return jsonify({"message": "Invalid request body"}), 400

    existing = Department.query.filter_by(name=data['name']).first()
    if existing and existing.id != id:
        return jsonify({"message": "Department name already exists"}), 400

    for key, value in data.items():
        setattr(dept, key, value)
    db.session.commit()
    return jsonify(dept.to_dict()), 200

@master_bp.route('/departments/<int:id>', methods=['DELETE'])
@admin_required()
def delete_department(id):
    dept = Department.query.get_or_404(id)
    db.session.delete(dept)
    db.session.commit()
    return jsonify({"message": "Department deleted successfully"}), 200


# ==========================================
# 2. Category CRUD
# ==========================================
@master_bp.route('/categories', methods=['GET'])
@role_required(['Admin', 'Employee'])
def get_categories():
    return jsonify(paginate_and_search(Category.query, Category, ['name', 'description'])), 200

@master_bp.route('/categories', methods=['POST'])
@admin_required()
def create_category():
    try:
        data = CategorySchema().load(request.get_json())
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    if not isinstance(data, dict):
        return jsonify({"message": "Invalid request body"}), 400

    if Category.query.filter_by(name=data['name']).first():
        return jsonify({"message": "Category name already exists"}), 400

    new_cat = Category(**data)
    db.session.add(new_cat)
    db.session.commit()
    return jsonify(new_cat.to_dict()), 201

@master_bp.route('/categories/<int:id>', methods=['PUT'])
@admin_required()
def update_category(id):
    cat = Category.query.get_or_404(id)
    try:
        data = CategorySchema().load(request.get_json())
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    if not isinstance(data, dict):
        return jsonify({"message": "Invalid request body"}), 400

    existing = Category.query.filter_by(name=data['name']).first()
    if existing and existing.id != id:
        return jsonify({"message": "Category name already exists"}), 400

    for key, value in data.items():
        setattr(cat, key, value)
    db.session.commit()
    return jsonify(cat.to_dict()), 200

@master_bp.route('/categories/<int:id>', methods=['DELETE'])
@admin_required()
def delete_category(id):
    cat = Category.query.get_or_404(id)
    db.session.delete(cat)
    db.session.commit()
    return jsonify({"message": "Category deleted successfully"}), 200


# ==========================================
# 3. Emission Factor CRUD
# ==========================================
@master_bp.route('/emission-factors', methods=['GET'])
@role_required(['Admin', 'Employee'])
def get_emission_factors():
    return jsonify(paginate_and_search(EmissionFactor.query, EmissionFactor, ['name', 'unit'])), 200

@master_bp.route('/emission-factors', methods=['POST'])
@admin_required()
def create_emission_factor():
    try:
        data = EmissionFactorSchema().load(request.get_json())
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    if not isinstance(data, dict):
        return jsonify({"message": "Invalid request body"}), 400

    # Verify category exists
    Category.query.get_or_404(data['category_id'])

    new_ef = EmissionFactor(**data)
    db.session.add(new_ef)
    db.session.commit()
    return jsonify(new_ef.to_dict()), 201

@master_bp.route('/emission-factors/<int:id>', methods=['PUT'])
@admin_required()
def update_emission_factor(id):
    ef = EmissionFactor.query.get_or_404(id)
    try:
        data = EmissionFactorSchema().load(request.get_json())
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    if not isinstance(data, dict):
        return jsonify({"message": "Invalid request body"}), 400

    Category.query.get_or_404(data['category_id'])

    for key, value in data.items():
        setattr(ef, key, value)
    db.session.commit()
    return jsonify(ef.to_dict()), 200

@master_bp.route('/emission-factors/<int:id>', methods=['DELETE'])
@admin_required()
def delete_emission_factor(id):
    ef = EmissionFactor.query.get_or_404(id)
    # Check if there are referencing carbon transactions
    if ef.carbon_transactions:
        return jsonify({"message": "Cannot delete: Emission factor is in use by carbon transactions."}), 400
    db.session.delete(ef)
    db.session.commit()
    return jsonify({"message": "Emission factor deleted successfully"}), 200


# ==========================================
# 4. Environmental Goals CRUD
# ==========================================
@master_bp.route('/environmental-goals', methods=['GET'])
@role_required(['Admin', 'Employee'])
def get_environmental_goals():
    return jsonify(paginate_and_search(EnvironmentalGoal.query, EnvironmentalGoal, ['name', 'unit'])), 200

@master_bp.route('/environmental-goals', methods=['POST'])
@admin_required()
def create_environmental_goal():
    try:
        data = EnvironmentalGoalSchema().load(request.get_json())
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    if not isinstance(data, dict):
        return jsonify({"message": "Invalid request body"}), 400

    Category.query.get_or_404(data['category_id'])
    if data.get('department_id'):
        Department.query.get_or_404(data['department_id'])

    new_goal = EnvironmentalGoal(**data)
    db.session.add(new_goal)
    db.session.commit()
    return jsonify(new_goal.to_dict()), 201

@master_bp.route('/environmental-goals/<int:id>', methods=['PUT'])
@admin_required()
def update_environmental_goal(id):
    goal = EnvironmentalGoal.query.get_or_404(id)
    try:
        data = EnvironmentalGoalSchema().load(request.get_json())
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    if not isinstance(data, dict):
        return jsonify({"message": "Invalid request body"}), 400

    Category.query.get_or_404(data['category_id'])
    if data.get('department_id'):
        Department.query.get_or_404(data['department_id'])

    for key, value in data.items():
        setattr(goal, key, value)
    db.session.commit()
    return jsonify(goal.to_dict()), 200

@master_bp.route('/environmental-goals/<int:id>', methods=['DELETE'])
@admin_required()
def delete_environmental_goal(id):
    goal = EnvironmentalGoal.query.get_or_404(id)
    db.session.delete(goal)
    db.session.commit()
    return jsonify({"message": "Environmental goal deleted successfully"}), 200


# ==========================================
# 5. Product ESG Profile CRUD
# ==========================================
@master_bp.route('/product-esg-profiles', methods=['GET'])
@role_required(['Admin', 'Employee'])
def get_product_esg_profiles():
    return jsonify(paginate_and_search(ProductESGProfile.query, ProductESGProfile, ['name'])), 200

@master_bp.route('/product-esg-profiles', methods=['POST'])
@admin_required()
def create_product_esg_profile():
    try:
        data = ProductESGProfileSchema().load(request.get_json())
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    if not isinstance(data, dict):
        return jsonify({"message": "Invalid request body"}), 400

    if ProductESGProfile.query.filter_by(name=data['name']).first():
        return jsonify({"message": "Product ESG profile name already exists"}), 400

    new_profile = ProductESGProfile(**data)
    db.session.add(new_profile)
    db.session.commit()
    return jsonify(new_profile.to_dict()), 201

@master_bp.route('/product-esg-profiles/<int:id>', methods=['PUT'])
@admin_required()
def update_product_esg_profile(id):
    profile = ProductESGProfile.query.get_or_404(id)
    try:
        data = ProductESGProfileSchema().load(request.get_json())
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    if not isinstance(data, dict):
        return jsonify({"message": "Invalid request body"}), 400

    existing = ProductESGProfile.query.filter_by(name=data['name']).first()
    if existing and existing.id != id:
        return jsonify({"message": "Product ESG profile name already exists"}), 400

    for key, value in data.items():
        setattr(profile, key, value)
    db.session.commit()
    return jsonify(profile.to_dict()), 200

@master_bp.route('/product-esg-profiles/<int:id>', methods=['DELETE'])
@admin_required()
def delete_product_esg_profile(id):
    profile = ProductESGProfile.query.get_or_404(id)
    db.session.delete(profile)
    db.session.commit()
    return jsonify({"message": "Product ESG profile deleted successfully"}), 200


# ==========================================
# 6. Policy CRUD
# ==========================================
@master_bp.route('/policies', methods=['GET'])
@role_required(['Admin', 'Employee'])
def get_policies():
    return jsonify(paginate_and_search(Policy.query, Policy, ['title', 'content'])), 200

@master_bp.route('/policies', methods=['POST'])
@admin_required()
def create_policy():
    try:
        data = PolicySchema().load(request.get_json())
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    if not isinstance(data, dict):
        return jsonify({"message": "Invalid request body"}), 400

    new_policy = Policy(**data)
    db.session.add(new_policy)
    db.session.commit()
    return jsonify(new_policy.to_dict()), 201

@master_bp.route('/policies/<int:id>', methods=['PUT'])
@admin_required()
def update_policy(id):
    policy = Policy.query.get_or_404(id)
    try:
        data = PolicySchema().load(request.get_json())
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    if not isinstance(data, dict):
        return jsonify({"message": "Invalid request body"}), 400

    for key, value in data.items():
        setattr(policy, key, value)
    db.session.commit()
    return jsonify(policy.to_dict()), 200

@master_bp.route('/policies/<int:id>', methods=['DELETE'])
@admin_required()
def delete_policy(id):
    policy = Policy.query.get_or_404(id)
    db.session.delete(policy)
    db.session.commit()
    return jsonify({"message": "Policy deleted successfully"}), 200


# ==========================================
# 7. Reward CRUD
# ==========================================
@master_bp.route('/rewards', methods=['GET'])
@role_required(['Admin', 'Employee'])
def get_rewards():
    return jsonify(paginate_and_search(Reward.query, Reward, ['name', 'description'])), 200

@master_bp.route('/rewards', methods=['POST'])
@admin_required()
def create_reward():
    try:
        data = RewardSchema().load(request.get_json())
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    if not isinstance(data, dict):
        return jsonify({"message": "Invalid request body"}), 400

    if Reward.query.filter_by(name=data['name']).first():
        return jsonify({"message": "Reward name already exists"}), 400

    new_reward = Reward(**data)
    db.session.add(new_reward)
    db.session.commit()
    return jsonify(new_reward.to_dict()), 201

@master_bp.route('/rewards/<int:id>', methods=['PUT'])
@admin_required()
def update_reward(id):
    reward = Reward.query.get_or_404(id)
    try:
        data = RewardSchema().load(request.get_json())
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    if not isinstance(data, dict):
        return jsonify({"message": "Invalid request body"}), 400

    existing = Reward.query.filter_by(name=data['name']).first()
    if existing and existing.id != id:
        return jsonify({"message": "Reward name already exists"}), 400

    for key, value in data.items():
        setattr(reward, key, value)
    db.session.commit()
    return jsonify(reward.to_dict()), 200

@master_bp.route('/rewards/<int:id>', methods=['DELETE'])
@admin_required()
def delete_reward(id):
    reward = Reward.query.get_or_404(id)
    db.session.delete(reward)
    db.session.commit()
    return jsonify({"message": "Reward deleted successfully"}), 200


# ==========================================
# 8. Badge CRUD
# ==========================================
@master_bp.route('/badges', methods=['GET'])
@role_required(['Admin', 'Employee'])
def get_badges():
    return jsonify(paginate_and_search(Badge.query, Badge, ['name', 'description'])), 200

@master_bp.route('/badges', methods=['POST'])
@admin_required()
def create_badge():
    try:
        data = BadgeSchema().load(request.get_json())
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    if not isinstance(data, dict):
        return jsonify({"message": "Invalid request body"}), 400

    if Badge.query.filter_by(name=data['name']).first():
        return jsonify({"message": "Badge name already exists"}), 400

    new_badge = Badge(**data)
    db.session.add(new_badge)
    db.session.commit()
    return jsonify(new_badge.to_dict()), 201

@master_bp.route('/badges/<int:id>', methods=['PUT'])
@admin_required()
def update_badge(id):
    badge = Badge.query.get_or_404(id)
    try:
        data = BadgeSchema().load(request.get_json())
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    if not isinstance(data, dict):
        return jsonify({"message": "Invalid request body"}), 400

    existing = Badge.query.filter_by(name=data['name']).first()
    if existing and existing.id != id:
        return jsonify({"message": "Badge name already exists"}), 400

    for key, value in data.items():
        setattr(badge, key, value)
    db.session.commit()
    return jsonify(badge.to_dict()), 200

@master_bp.route('/badges/<int:id>', methods=['DELETE'])
@admin_required()
def delete_badge(id):
    badge = Badge.query.get_or_404(id)
    db.session.delete(badge)
    db.session.commit()
    return jsonify({"message": "Badge deleted successfully"}), 200


# ==========================================
# 9. Employee CRUD
# ==========================================
@master_bp.route('/employees', methods=['GET'])
@role_required(['Admin', 'Employee'])
def get_employees():
    return jsonify(paginate_and_search(Employee.query, Employee, ['name', 'email'])), 200

@master_bp.route('/employees', methods=['POST'])
@admin_required()
def create_employee():
    try:
        data = EmployeeSchema().load(request.get_json())
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    if not isinstance(data, dict):
        return jsonify({"message": "Invalid request body"}), 400

    if Employee.query.filter_by(email=data['email']).first():
        return jsonify({"message": "Email already registered"}), 400

    if not data.get('password'):
        return jsonify({"errors": {"password": ["Password is required for registration"]}}), 400

    if data.get('department_id'):
        Department.query.get_or_404(data['department_id'])

    password = data.pop('password')
    data['password_hash'] = generate_password_hash(password)

    new_emp = Employee(**data)
    db.session.add(new_emp)
    db.session.commit()
    return jsonify(new_emp.to_dict()), 201

@master_bp.route('/employees/<int:id>', methods=['PUT'])
@admin_required()
def update_employee(id):
    emp = Employee.query.get_or_404(id)
    try:
        data = EmployeeSchema().load(request.get_json())
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    if not isinstance(data, dict):
        return jsonify({"message": "Invalid request body"}), 400

    existing = Employee.query.filter_by(email=data['email']).first()
    if existing and existing.id != id:
        return jsonify({"message": "Email already in use"}), 400

    if data.get('department_id'):
        Department.query.get_or_404(data['department_id'])

    password = data.pop('password', None)
    if password:
        data['password_hash'] = generate_password_hash(password)

    for key, value in data.items():
        setattr(emp, key, value)
    db.session.commit()
    return jsonify(emp.to_dict()), 200

@master_bp.route('/employees/<int:id>', methods=['DELETE'])
@admin_required()
def delete_employee(id):
    emp = Employee.query.get_or_404(id)
    db.session.delete(emp)
    db.session.commit()
    return jsonify({"message": "Employee profile deleted successfully"}), 200


# ==========================================
# 10. Global Search Endpoint
# ==========================================
@master_bp.route('/search/global', methods=['GET'])
@role_required(['Admin', 'Employee'])
def global_search():
    search = request.args.get('search', '', type=str)
    if not search:
        return jsonify({
            "employees": [],
            "policies": [],
            "rewards": []
        }), 200
        
    employees = Employee.query.filter(or_(Employee.name.ilike(f"%{search}%"), Employee.email.ilike(f"%{search}%"))).limit(5).all()
    policies = Policy.query.filter(or_(Policy.title.ilike(f"%{search}%"), Policy.content.ilike(f"%{search}%"))).limit(5).all()
    rewards = Reward.query.filter(or_(Reward.name.ilike(f"%{search}%"), Reward.description.ilike(f"%{search}%"))).limit(5).all()
    
    return jsonify({
        "employees": [e.to_dict() for e in employees],
        "policies": [p.to_dict() for p in policies],
        "rewards": [r.to_dict() for r in rewards]
    }), 200
