from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from functools import wraps
from flask import jsonify

def admin_required(fn):
    """Only admins can access."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request()
            identity = get_jwt_identity()
            if not identity.startswith("admin:"):
                return jsonify({"success": False, "message": "Admin access required"}), 403
            return fn(*args, **kwargs)
        except Exception:
            return jsonify({"success": False, "message": "Authentication required. Please login."}), 401
    return wrapper


def employee_required(fn):
    """Only employees can access."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request()
            identity = get_jwt_identity()
            if not identity.startswith("employee:"):
                return jsonify({"success": False, "message": "Employee access required"}), 403
            return fn(*args, **kwargs)
        except Exception:
            return jsonify({"success": False, "message": "Authentication required. Please login."}), 401
    return wrapper


def login_required(fn):
    """Any authenticated user (admin or employee) can access."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request()
            return fn(*args, **kwargs)
        except Exception:
            return jsonify({"success": False, "message": "Authentication required. Please login."}), 401
    return wrapper
