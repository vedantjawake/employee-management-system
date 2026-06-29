from flask import request, jsonify
from config.db import get_db_connection
from utils.helpers import success_response, error_response

def get_all_departments():
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute(
                    """SELECT d.*, COUNT(e.id) as employee_count
                       FROM departments d
                       LEFT JOIN employees e ON d.id = e.department_id AND e.status = 'active'
                       GROUP BY d.id ORDER BY d.department_name"""
                )
                departments = cursor.fetchall()
                for dept in departments:
                    if dept.get('created_at'):
                        dept['created_at'] = str(dept['created_at'])
        finally:
            conn.close()

        return jsonify(success_response(departments)[0]), 200
    except Exception as e:
        return jsonify(error_response(str(e), 500)[0]), 500


def get_department(dept_id):
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute(
                    """SELECT d.*, COUNT(e.id) as employee_count
                       FROM departments d
                       LEFT JOIN employees e ON d.id = e.department_id
                       WHERE d.id = %s GROUP BY d.id""",
                    (dept_id,)
                )
                dept = cursor.fetchone()
        finally:
            conn.close()

        if not dept:
            return jsonify(error_response("Department not found", 404)[0]), 404

        if dept.get('created_at'):
            dept['created_at'] = str(dept['created_at'])

        return jsonify(success_response(dept)[0]), 200
    except Exception as e:
        return jsonify(error_response(str(e), 500)[0]), 500


def create_department():
    try:
        data = request.get_json()
        name = data.get('department_name', '').strip()
        description = data.get('description', '').strip()

        if not name:
            return jsonify(error_response("Department name is required")[0]), 400

        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute("SELECT id FROM departments WHERE department_name = %s", (name,))
                if cursor.fetchone():
                    return jsonify(error_response("Department already exists")[0]), 409

                cursor.execute(
                    "INSERT INTO departments (department_name, description) VALUES (%s, %s)",
                    (name, description)
                )
                conn.commit()
                dept_id = cursor.lastrowid

                cursor.execute("SELECT * FROM departments WHERE id = %s", (dept_id,))
                new_dept = cursor.fetchone()
                if new_dept.get('created_at'):
                    new_dept['created_at'] = str(new_dept['created_at'])
        finally:
            conn.close()

        return jsonify(success_response(new_dept, "Department created successfully", 201)[0]), 201
    except Exception as e:
        return jsonify(error_response(str(e), 500)[0]), 500


def update_department(dept_id):
    try:
        data = request.get_json()

        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute("SELECT id FROM departments WHERE id = %s", (dept_id,))
                if not cursor.fetchone():
                    return jsonify(error_response("Department not found", 404)[0]), 404

                name = data.get('department_name', '').strip()
                description = data.get('description', '').strip()

                if name:
                    cursor.execute(
                        "SELECT id FROM departments WHERE department_name = %s AND id != %s",
                        (name, dept_id)
                    )
                    if cursor.fetchone():
                        return jsonify(error_response("Department name already exists")[0]), 409

                cursor.execute(
                    "UPDATE departments SET department_name = %s, description = %s WHERE id = %s",
                    (name, description, dept_id)
                )
                conn.commit()

                cursor.execute("SELECT * FROM departments WHERE id = %s", (dept_id,))
                updated = cursor.fetchone()
                if updated.get('created_at'):
                    updated['created_at'] = str(updated['created_at'])
        finally:
            conn.close()

        return jsonify(success_response(updated, "Department updated")[0]), 200
    except Exception as e:
        return jsonify(error_response(str(e), 500)[0]), 500


def delete_department(dept_id):
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute("SELECT id FROM departments WHERE id = %s", (dept_id,))
                if not cursor.fetchone():
                    return jsonify(error_response("Department not found", 404)[0]), 404

                cursor.execute(
                    "SELECT COUNT(*) as count FROM employees WHERE department_id = %s",
                    (dept_id,)
                )
                if cursor.fetchone()['count'] > 0:
                    return jsonify(error_response(
                        "Cannot delete department with employees. Reassign employees first.", 409
                    )[0]), 409

                cursor.execute("DELETE FROM departments WHERE id = %s", (dept_id,))
                conn.commit()
        finally:
            conn.close()

        return jsonify(success_response(message="Department deleted")[0]), 200
    except Exception as e:
        return jsonify(error_response(str(e), 500)[0]), 500
