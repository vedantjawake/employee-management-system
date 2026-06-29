from flask import request, jsonify
from config.db import get_db_connection
from utils.helpers import success_response, error_response
import pymysql

def get_all_employees():
    """Get all employees with optional search and filter."""
    try:
        search = request.args.get('search', '').strip()
        department_id = request.args.get('department_id', '')
        status = request.args.get('status', '')
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        offset = (page - 1) * per_page

        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                conditions = []
                params = []

                if search:
                    conditions.append("(e.full_name LIKE %s OR e.email LIKE %s OR e.position LIKE %s)")
                    params.extend([f'%{search}%', f'%{search}%', f'%{search}%'])

                if department_id:
                    conditions.append("e.department_id = %s")
                    params.append(department_id)

                if status:
                    conditions.append("e.status = %s")
                    params.append(status)

                where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""

                # Count total
                cursor.execute(
                    f"SELECT COUNT(*) as total FROM employees e {where_clause}",
                    params
                )
                total = cursor.fetchone()['total']

                # Fetch employees
                cursor.execute(
                    f"""SELECT e.id, e.full_name, e.email, e.phone, e.position,
                        e.joining_date, e.salary, e.address, e.profile_image, e.status,
                        e.created_at, d.department_name, e.department_id
                        FROM employees e
                        LEFT JOIN departments d ON e.department_id = d.id
                        {where_clause}
                        ORDER BY e.created_at DESC
                        LIMIT %s OFFSET %s""",
                    params + [per_page, offset]
                )
                employees = cursor.fetchall()

                # Format dates
                for emp in employees:
                    if emp.get('joining_date'):
                        emp['joining_date'] = str(emp['joining_date'])
                    if emp.get('created_at'):
                        emp['created_at'] = str(emp['created_at'])

        finally:
            conn.close()

        return jsonify({
            "success": True,
            "data": employees,
            "pagination": {
                "total": total,
                "page": page,
                "per_page": per_page,
                "total_pages": (total + per_page - 1) // per_page
            }
        }), 200

    except Exception as e:
        return jsonify(error_response(str(e), 500)[0]), 500


def get_employee(employee_id):
    """Get a single employee by ID."""
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute(
                    """SELECT e.*, d.department_name FROM employees e
                       LEFT JOIN departments d ON e.department_id = d.id
                       WHERE e.id = %s""",
                    (employee_id,)
                )
                employee = cursor.fetchone()
        finally:
            conn.close()

        if not employee:
            return jsonify(error_response("Employee not found", 404)[0]), 404

        if employee.get('joining_date'):
            employee['joining_date'] = str(employee['joining_date'])
        if employee.get('created_at'):
            employee['created_at'] = str(employee['created_at'])

        return jsonify(success_response(employee)[0]), 200

    except Exception as e:
        return jsonify(error_response(str(e), 500)[0]), 500


def create_employee():
    """Create a new employee."""
    try:
        data = request.get_json()

        required_fields = ['full_name', 'email']
        for field in required_fields:
            if not data.get(field):
                return jsonify(error_response(f"{field} is required")[0]), 400

        full_name = data.get('full_name', '').strip()
        email = data.get('email', '').strip()
        phone = data.get('phone', '').strip()
        department_id = data.get('department_id') or None
        position = data.get('position', '').strip()
        joining_date = data.get('joining_date') or None
        salary = data.get('salary') or None
        address = data.get('address', '').strip()
        status = data.get('status', 'active')

        # Hash default password emp123 for new employee
        import bcrypt as _bcrypt
        default_pw = _bcrypt.hashpw(b'emp123', _bcrypt.gensalt()).decode()

        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                # Check email uniqueness
                cursor.execute("SELECT id FROM employees WHERE email = %s", (email,))
                if cursor.fetchone():
                    return jsonify(error_response("Email already exists")[0]), 409

                cursor.execute(
                    """INSERT INTO employees 
                       (full_name, email, phone, department_id, position, joining_date, salary, address, status)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                    (full_name, email, phone, department_id, position, joining_date, salary, address, status)
                )
                conn.commit()
                employee_id = cursor.lastrowid

                cursor.execute(
                    """SELECT e.*, d.department_name FROM employees e
                       LEFT JOIN departments d ON e.department_id = d.id
                       WHERE e.id = %s""",
                    (employee_id,)
                )
                new_employee = cursor.fetchone()
                if new_employee.get('joining_date'):
                    new_employee['joining_date'] = str(new_employee['joining_date'])
                if new_employee.get('created_at'):
                    new_employee['created_at'] = str(new_employee['created_at'])
        finally:
            conn.close()

        return jsonify(success_response(new_employee, "Employee created successfully", 201)[0]), 201

    except Exception as e:
        return jsonify(error_response(str(e), 500)[0]), 500


def update_employee(employee_id):
    """Update an existing employee."""
    try:
        data = request.get_json()

        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute("SELECT id FROM employees WHERE id = %s", (employee_id,))
                if not cursor.fetchone():
                    return jsonify(error_response("Employee not found", 404)[0]), 404

                # Check email uniqueness if changing
                if data.get('email'):
                    cursor.execute(
                        "SELECT id FROM employees WHERE email = %s AND id != %s",
                        (data['email'], employee_id)
                    )
                    if cursor.fetchone():
                        return jsonify(error_response("Email already exists")[0]), 409

                fields = []
                params = []
                allowed = ['full_name', 'email', 'phone', 'department_id', 'position',
                           'joining_date', 'salary', 'address', 'status']

                for field in allowed:
                    if field in data:
                        fields.append(f"{field} = %s")
                        params.append(data[field] if data[field] != '' else None)

                if not fields:
                    return jsonify(error_response("No fields to update")[0]), 400

                params.append(employee_id)
                cursor.execute(
                    f"UPDATE employees SET {', '.join(fields)} WHERE id = %s",
                    params
                )
                conn.commit()

                cursor.execute(
                    """SELECT e.*, d.department_name FROM employees e
                       LEFT JOIN departments d ON e.department_id = d.id
                       WHERE e.id = %s""",
                    (employee_id,)
                )
                updated = cursor.fetchone()
                if updated.get('joining_date'):
                    updated['joining_date'] = str(updated['joining_date'])
                if updated.get('created_at'):
                    updated['created_at'] = str(updated['created_at'])
        finally:
            conn.close()

        return jsonify(success_response(updated, "Employee updated successfully")[0]), 200

    except Exception as e:
        return jsonify(error_response(str(e), 500)[0]), 500


def delete_employee(employee_id):
    """Delete an employee."""
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute("SELECT id FROM employees WHERE id = %s", (employee_id,))
                if not cursor.fetchone():
                    return jsonify(error_response("Employee not found", 404)[0]), 404

                cursor.execute("DELETE FROM employees WHERE id = %s", (employee_id,))
                conn.commit()
        finally:
            conn.close()

        return jsonify(success_response(message="Employee deleted successfully")[0]), 200

    except Exception as e:
        return jsonify(error_response(str(e), 500)[0]), 500


def get_dashboard_stats():
    """Get dashboard statistics."""
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute("SELECT COUNT(*) as total FROM employees WHERE status = 'active'")
                total_employees = cursor.fetchone()['total']

                cursor.execute("SELECT COUNT(*) as total FROM departments")
                total_departments = cursor.fetchone()['total']

                from datetime import date
                today = date.today()
                cursor.execute(
                    "SELECT COUNT(*) as present FROM attendance WHERE date = %s AND status = 'present'",
                    (today,)
                )
                present_today = cursor.fetchone()['present']

                cursor.execute(
                    """SELECT COALESCE(SUM(net_salary), 0) as total 
                       FROM salaries WHERE month = %s AND year = %s AND status = 'paid'""",
                    (today.month, today.year)
                )
                monthly_salary = cursor.fetchone()['total']

                cursor.execute(
                    """SELECT e.full_name, e.email, e.position, d.department_name, e.joining_date, e.profile_image
                       FROM employees e
                       LEFT JOIN departments d ON e.department_id = d.id
                       ORDER BY e.created_at DESC LIMIT 5"""
                )
                recent_employees = cursor.fetchall()
                for emp in recent_employees:
                    if emp.get('joining_date'):
                        emp['joining_date'] = str(emp['joining_date'])

                cursor.execute(
                    """SELECT d.department_name, COUNT(e.id) as count
                       FROM departments d
                       LEFT JOIN employees e ON d.id = e.department_id AND e.status = 'active'
                       GROUP BY d.id, d.department_name"""
                )
                dept_stats = cursor.fetchall()

        finally:
            conn.close()

        return jsonify(success_response({
            "total_employees": total_employees,
            "total_departments": total_departments,
            "present_today": present_today,
            "monthly_salary": float(monthly_salary),
            "recent_employees": recent_employees,
            "department_stats": dept_stats
        })[0]), 200

    except Exception as e:
        return jsonify(error_response(str(e), 500)[0]), 500


def public_register_employee():
    """
    Public self-registration endpoint — no admin token required.
    Creates the employee record AND saves their chosen password so they
    can log in immediately via /api/auth/employee/login.
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify(error_response("Request body is required")[0]), 400

        full_name = data.get('full_name', '').strip()
        email     = data.get('email', '').strip()
        password  = data.get('password', '').strip()
        phone     = data.get('phone', '').strip()
        position  = data.get('position', '').strip()

        if not full_name or not email or not password:
            return jsonify(error_response("full_name, email and password are required")[0]), 400
        if len(password) < 6:
            return jsonify(error_response("Password must be at least 6 characters")[0]), 400

        import bcrypt as _bcrypt
        hashed_pw = _bcrypt.hashpw(password.encode('utf-8'), _bcrypt.gensalt()).decode('utf-8')

        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                # Check email uniqueness
                cursor.execute("SELECT id FROM employees WHERE email = %s", (email,))
                if cursor.fetchone():
                    return jsonify(error_response("An account with this email already exists")[0]), 409

                cursor.execute(
                    """INSERT INTO employees
                       (full_name, email, phone, position, password, status)
                       VALUES (%s, %s, %s, %s, %s, 'active')""",
                    (full_name, email, phone, position, hashed_pw)
                )
                conn.commit()
                new_id = cursor.lastrowid

                cursor.execute(
                    """SELECT e.id, e.full_name, e.email, e.phone, e.position,
                              e.status, e.created_at
                       FROM employees e WHERE e.id = %s""",
                    (new_id,)
                )
                new_emp = cursor.fetchone()
                if new_emp and new_emp.get('created_at'):
                    new_emp['created_at'] = str(new_emp['created_at'])
        finally:
            conn.close()

        return jsonify({
            "success": True,
            "message": "Account created successfully. You can now log in.",
            "data": new_emp,
        }), 201

    except Exception as e:
        return jsonify(error_response(f"Registration failed: {str(e)}", 500)[0]), 500
