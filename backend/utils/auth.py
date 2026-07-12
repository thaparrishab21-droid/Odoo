from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt

def admin_required():
    """Decorator to restrict access to Admin users only."""
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            if claims.get("role") != "Admin":
                return jsonify({"message": "Forbidden: Admin access required"}), 403
            return fn(*args, **kwargs)
        return decorator
    return wrapper

def role_required(allowed_roles):
    """Decorator to restrict access to specified roles (e.g. ['Admin', 'Employee'])."""
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            user_role = claims.get("role")
            if user_role not in allowed_roles:
                return jsonify({
                    "message": f"Forbidden: Access restricted. Allowed roles: {', '.join(allowed_roles)}"
                }), 403
            return fn(*args, **kwargs)
        return decorator
    return wrapper
