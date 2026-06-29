from flask import request, jsonify
from flask_jwt_extended import create_access_token, get_jwt_identity
from config.db import get_db_connection
from utils.helpers import check_password, hash_password, success_response, error_response


# ── helpers ────────────────────────────────────────────────────────────────

def _admin_id():
    """Extract integer admin id from JWT identity 'admin:<id>'."""
    return int(get_jwt_identity().replace("admin:", ""))


def _employee_id():
    """Extract integer employee id from JWT identity 'employee:<id>'."""
    return int(get_jwt_identity().replace("employee:", ""))


# ── Admin auth ─────────────────────────────────────────────────────────────

def login():
    """Admin login — returns JWT + admin data."""
    try:
        data = request.get_json()
        if not data:
            return jsonify(error_response("Request body is required")[0]), 400

        username = data.get('username', '').strip()
        password = data.get('password', '').strip()

        if not username or not password:
            return jsonify(error_response("Username and password are required")[0]), 400

        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT id, username, password, full_name, email, profile_image "
                    "FROM admins WHERE username = %s",
                    (username,)
                )
                admin = cursor.fetchone()
        finally:
            conn.close()

        if not admin or not check_password(password, admin['password']):
            return jsonify(error_response("Invalid username or password", 401)[0]), 401

        token = create_access_token(identity=f"admin:{admin['id']}")
        return jsonify({
            "success": True,
            "message": "Login successful",
            "token": token,
            "admin": {
                "id":            admin['id'],
                "username":      admin['username'],
                "full_name":     admin['full_name'],
                "email":         admin['email'],
                "profile_image": admin['profile_image'],
            }
        }), 200

    except Exception as e:
        return jsonify(error_response(f"Login failed: {str(e)}", 500)[0]), 500


def register():
    """Register a new admin account."""
    try:
        data = request.get_json()
        if not data:
            return jsonify(error_response("Request body is required")[0]), 400

        username  = data.get('username', '').strip()
        password  = data.get('password', '').strip()
        full_name = data.get('full_name', '').strip()
        email     = data.get('email', '').strip()

        if not username or not password or not full_name or not email:
            return jsonify(error_response("All fields are required")[0]), 400
        if len(password) < 6:
            return jsonify(error_response("Password must be at least 6 characters")[0]), 400

        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT id FROM admins WHERE username = %s OR email = %s",
                    (username, email)
                )
                if cursor.fetchone():
                    return jsonify(error_response("Username or email already exists")[0]), 409

                hashed = hash_password(password)
                cursor.execute(
                    "INSERT INTO admins (username, password, full_name, email) VALUES (%s,%s,%s,%s)",
                    (username, hashed, full_name, email)
                )
                conn.commit()
                new_id = cursor.lastrowid
        finally:
            conn.close()

        token = create_access_token(identity=f"admin:{new_id}")
        return jsonify({
            "success": True,
            "message": "Account created successfully",
            "token": token,
            "admin": {
                "id": new_id, "username": username,
                "full_name": full_name, "email": email, "profile_image": None,
            }
        }), 201

    except Exception as e:
        return jsonify(error_response(f"Registration failed: {str(e)}", 500)[0]), 500


def get_profile():
    """Get admin profile."""
    try:
        admin_id = _admin_id()
        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT id, username, full_name, email, profile_image, created_at "
                    "FROM admins WHERE id = %s",
                    (admin_id,)
                )
                admin = cursor.fetchone()
        finally:
            conn.close()

        if not admin:
            return jsonify(error_response("Admin not found", 404)[0]), 404

        if admin.get('created_at'):
            admin['created_at'] = str(admin['created_at'])

        return jsonify(success_response(admin)[0]), 200

    except Exception as e:
        return jsonify(error_response(str(e), 500)[0]), 500


def update_profile():
    """Update admin profile."""
    try:
        admin_id = _admin_id()
        data = request.get_json() or {}

        full_name = data.get('full_name', '').strip()
        email     = data.get('email', '').strip()

        if not full_name or not email:
            return jsonify(error_response("full_name and email are required")[0]), 400

        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute(
                    "UPDATE admins SET full_name = %s, email = %s WHERE id = %s",
                    (full_name, email, admin_id)
                )
                conn.commit()
        finally:
            conn.close()

        return jsonify(success_response(message="Profile updated successfully")[0]), 200

    except Exception as e:
        return jsonify(error_response(str(e), 500)[0]), 500


def change_password():
    """Change admin password."""
    try:
        admin_id = _admin_id()
        data = request.get_json() or {}

        current_password = data.get('current_password', '')
        new_password     = data.get('new_password', '')

        if not current_password or not new_password:
            return jsonify(error_response("Both current and new password are required")[0]), 400
        if len(new_password) < 6:
            return jsonify(error_response("New password must be at least 6 characters")[0]), 400

        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute("SELECT password FROM admins WHERE id = %s", (admin_id,))
                admin = cursor.fetchone()

                if not admin or not check_password(current_password, admin['password']):
                    return jsonify(error_response("Current password is incorrect", 401)[0]), 401

                cursor.execute(
                    "UPDATE admins SET password = %s WHERE id = %s",
                    (hash_password(new_password), admin_id)
                )
                conn.commit()
        finally:
            conn.close()

        return jsonify(success_response(message="Password changed successfully")[0]), 200

    except Exception as e:
        return jsonify(error_response(str(e), 500)[0]), 500


# ── Employee auth ──────────────────────────────────────────────────────────

def employee_login():
    """Employee login using email and password."""
    try:
        data = request.get_json()
        if not data:
            return jsonify(error_response("Request body is required")[0]), 400

        email    = data.get('email', '').strip()
        password = data.get('password', '').strip()

        if not email or not password:
            return jsonify(error_response("Email and password are required")[0]), 400

        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute(
                    """SELECT e.id, e.full_name, e.email, e.phone, e.position,
                              e.department_id, e.joining_date, e.salary, e.profile_image,
                              e.status, e.password, d.department_name
                       FROM employees e
                       LEFT JOIN departments d ON e.department_id = d.id
                       WHERE e.email = %s""",
                    (email,)
                )
                employee = cursor.fetchone()
        finally:
            conn.close()

        if not employee:
            return jsonify(error_response("Invalid email or password", 401)[0]), 401

        emp_password = employee.get('password')
        if not emp_password or not check_password(password, emp_password):
            return jsonify(error_response("Invalid email or password", 401)[0]), 401

        if employee['status'] != 'active':
            return jsonify(error_response("Your account is inactive. Contact admin.", 403)[0]), 403

        token = create_access_token(identity=f"employee:{employee['id']}")
        return jsonify({
            "success": True,
            "message": "Login successful",
            "token": token,
            "employee": {
                "id":              employee['id'],
                "full_name":       employee['full_name'],
                "email":           employee['email'],
                "phone":           employee['phone'],
                "position":        employee['position'],
                "department_id":   employee['department_id'],
                "department_name": employee['department_name'],
                "joining_date":    str(employee['joining_date']) if employee.get('joining_date') else None,
                "salary":          float(employee['salary']) if employee.get('salary') else None,
                "profile_image":   employee['profile_image'],
                "status":          employee['status'],
            },
            "role": "employee"
        }), 200

    except Exception as e:
        return jsonify(error_response(f"Login failed: {str(e)}", 500)[0]), 500


def get_employee_profile():
    """Get logged-in employee's own profile."""
    try:
        employee_id = _employee_id()
        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute(
                    """SELECT e.id, e.full_name, e.email, e.phone, e.position,
                              e.department_id, e.joining_date, e.salary, e.profile_image,
                              e.status, e.address, e.created_at, d.department_name
                       FROM employees e
                       LEFT JOIN departments d ON e.department_id = d.id
                       WHERE e.id = %s""",
                    (employee_id,)
                )
                emp = cursor.fetchone()
        finally:
            conn.close()

        if not emp:
            return jsonify(error_response("Employee not found", 404)[0]), 404

        if emp.get('joining_date'): emp['joining_date'] = str(emp['joining_date'])
        if emp.get('created_at'):   emp['created_at']   = str(emp['created_at'])
        if emp.get('salary'):       emp['salary']        = float(emp['salary'])

        return jsonify(success_response(emp)[0]), 200

    except Exception as e:
        return jsonify(error_response(str(e), 500)[0]), 500


def employee_change_password():
    """Employee changes their own password."""
    try:
        employee_id = _employee_id()
        data = request.get_json() or {}

        current_password = data.get('current_password', '')
        new_password     = data.get('new_password', '')

        if not current_password or not new_password:
            return jsonify(error_response("Both fields required")[0]), 400
        if len(new_password) < 6:
            return jsonify(error_response("New password must be at least 6 characters")[0]), 400

        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute("SELECT password FROM employees WHERE id = %s", (employee_id,))
                emp = cursor.fetchone()

                if not emp or not emp.get('password'):
                    return jsonify(error_response("No password set. Contact admin.", 400)[0]), 400

                if not check_password(current_password, emp['password']):
                    return jsonify(error_response("Current password is incorrect", 401)[0]), 401

                cursor.execute(
                    "UPDATE employees SET password = %s WHERE id = %s",
                    (hash_password(new_password), employee_id)
                )
                conn.commit()
        finally:
            conn.close()

        return jsonify(success_response(message="Password changed successfully")[0]), 200

    except Exception as e:
        return jsonify(error_response(str(e), 500)[0]), 500


# ── Password reset ─────────────────────────────────────────────────────────

def forgot_password():
    """Generate a JWT reset token for the given email and return it directly (demo mode)."""
    try:
        data  = request.get_json() or {}
        email = data.get('email', '').strip()

        if not email:
            return jsonify(error_response("Email is required")[0]), 400

        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute("SELECT id, full_name FROM admins WHERE email = %s", (email,))
                user = cursor.fetchone()
                user_type = 'admin' if user else None

                if not user:
                    cursor.execute("SELECT id, full_name FROM employees WHERE email = %s", (email,))
                    user = cursor.fetchone()
                    user_type = 'employee' if user else None
        finally:
            conn.close()

        # Always return 200 so we don't leak whether an email exists
        if not user:
            return jsonify({
                "success": True,
                "message": "If this email is registered, a reset link has been sent."
            }), 200

        identity    = f"{user_type}:{user['id']}"
        reset_token = create_access_token(
            identity=identity,
            additional_claims={"reset": True}
        )

        return jsonify({
            "success":     True,
            "message":     "Reset token generated. Use it to set a new password.",
            "reset_token": reset_token,
            "user_type":   user_type,
        }), 200

    except Exception as e:
        return jsonify(error_response(str(e), 500)[0]), 500


def reset_password():
    """Reset password using the JWT reset token."""
    try:
        data         = request.get_json() or {}
        token        = data.get('token', '')
        new_password = data.get('new_password', '')

        if not token or not new_password:
            return jsonify(error_response("Token and new_password are required")[0]), 400
        if len(new_password) < 6:
            return jsonify(error_response("Password must be at least 6 characters")[0]), 400

        from flask_jwt_extended import decode_token
        try:
            decoded = decode_token(token)
        except Exception:
            return jsonify(error_response("Invalid or expired reset token")[0]), 400

        identity = decoded.get('sub', '')
        hashed   = hash_password(new_password)

        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                if identity.startswith('admin:'):
                    uid = int(identity.replace('admin:', ''))
                    cursor.execute("UPDATE admins SET password = %s WHERE id = %s", (hashed, uid))
                elif identity.startswith('employee:'):
                    uid = int(identity.replace('employee:', ''))
                    cursor.execute("UPDATE employees SET password = %s WHERE id = %s", (hashed, uid))
                else:
                    return jsonify(error_response("Invalid token identity")[0]), 400

                if cursor.rowcount == 0:
                    return jsonify(error_response("User not found")[0]), 404

                conn.commit()
        finally:
            conn.close()

        return jsonify(success_response(message="Password reset successfully")[0]), 200

    except Exception as e:
        return jsonify(error_response(str(e), 500)[0]), 500
