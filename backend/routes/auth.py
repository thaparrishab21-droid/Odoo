from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import check_password_hash

from models import Employee

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/login', methods=['POST'])
def login():
    if not request.is_json:
        return jsonify({"message": "Missing JSON in request"}), 400

    data = request.get_json()
    if not data:
        return jsonify({"message": "Missing JSON in request"}), 400

    email = data.get('email', None)
    password = data.get('password', None)

    if not email or not password:
        return jsonify({"message": "Missing email or password"}), 400

    # Query the real SQLite database for the employee
    employee = Employee.query.filter_by(email=email).first()
    if not employee or not check_password_hash(employee.password_hash, password):
        return jsonify({"message": "Bad email or password"}), 401

    # Inject additional claims for roles and departments
    additional_claims = {
        "role": employee.role,
        "name": employee.name,
        "department": employee.department.name if employee.department else None
    }
    access_token = create_access_token(identity=employee.email, additional_claims=additional_claims)
    
    return jsonify({
        "token": access_token,
        "user": employee.to_dict()
    }), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    current_user_email = get_jwt_identity()
    employee = Employee.query.filter_by(email=current_user_email).first()
    if not employee:
        return jsonify({"message": "User not found"}), 404
        
    return jsonify({
        "user": employee.to_dict()
    }), 200

@auth_bp.route('/logout', methods=['POST'])
def logout():
    # Stateless token clearing is handled on client side
    return jsonify({"message": "Successfully logged out"}), 200
