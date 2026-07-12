from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# Mock database users for authentication skeleton in Milestone 1
# In Milestone 2 and 3, these will be replaced with SQLite queries using SQLAlchemy models.
MOCK_USERS = {
    "admin@ecosphere.com": {
        "id": 1,
        "name": "Eco Admin",
        "email": "admin@ecosphere.com",
        "password": "admin123",
        "role": "Admin",
        "department": "Sustainability"
    },
    "employee@ecosphere.com": {
        "id": 2,
        "name": "Jane Employee",
        "email": "employee@ecosphere.com",
        "password": "employee123",
        "role": "Employee",
        "department": "Engineering"
    }
}

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

    user = MOCK_USERS.get(email)
    if not user or user['password'] != password:
        return jsonify({"message": "Bad email or password"}), 401

    # Create access token with identity (email) and additional claims (role, name, etc.)
    additional_claims = {
        "role": user["role"],
        "name": user["name"],
        "department": user["department"]
    }
    access_token = create_access_token(identity=user["email"], additional_claims=additional_claims)
    
    return jsonify({
        "token": access_token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
            "department": user["department"]
        }
    }), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    # Fetch user details based on current identity email
    current_user_email = get_jwt_identity()
    user = MOCK_USERS.get(current_user_email)
    if not user:
        return jsonify({"message": "User not found"}), 404
        
    return jsonify({
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
            "department": user["department"]
        }
    }), 200

@auth_bp.route('/logout', methods=['POST'])
def logout():
    # Since we are using stateless JWT, client-side will clear the token.
    # We return a simple confirmation response.
    return jsonify({"message": "Successfully logged out"}), 200
