from flask import request, jsonify
from config.db import get_db_connection
from utils.helpers import success_response, error_response
from datetime import date

def get_salaries():
    try:
        employee_id = request.args.get('employee_id', '')
        month = request.args.get('month', '')
        year = request.args.get('year', '')
        status = request.args.get('status', '')

        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                conditions = []
                params = []

                if employee_id:
                    conditions.append("s.employee_id = %s")
                    params.append(employee_id)
                if month:
                    conditions.append("s.month = %s")
                    params.append(month)
                if year:
                    conditions.append("s.year = %s")
                    params.append(year)
                if status:
                    conditions.append("s.status = %s")
                    params.append(status)

                where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""

                cursor.execute(
                    f"""SELECT s.*, e.full_name, e.position, d.department_name
                        FROM salaries s
                        JOIN employees e ON s.employee_id = e.id
                        LEFT JOIN departments d ON e.department_id = d.id
                        {where_clause}
                        ORDER BY s.year DESC, s.month DESC, e.full_name""",
                    params
                )
                records = cursor.fetchall()
                for r in records:
                    if r.get('payment_date'):
                        r['payment_date'] = str(r['payment_date'])
                    if r.get('created_at'):
                        r['created_at'] = str(r['created_at'])
                    for f in ['basic_salary', 'bonus', 'deductions', 'net_salary']:
                        if r.get(f) is not None:
                            r[f] = float(r[f])
        finally:
            conn.close()

        return jsonify(success_response(records)[0]), 200
    except Exception as e:
        return jsonify(error_response(str(e), 500)[0]), 500


def create_salary():
    try:
        data = request.get_json()
        employee_id = data.get('employee_id')
        month = data.get('month')
        year = data.get('year')
        basic_salary = float(data.get('basic_salary', 0))
        bonus = float(data.get('bonus', 0))
        deductions = float(data.get('deductions', 0))
        net_salary = basic_salary + bonus - deductions
        payment_date = data.get('payment_date')
        status = data.get('status', 'pending')

        if not all([employee_id, month, year]):
            return jsonify(error_response("Employee ID, month, and year are required")[0]), 400

        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute("SELECT id FROM employees WHERE id = %s", (employee_id,))
                if not cursor.fetchone():
                    return jsonify(error_response("Employee not found", 404)[0]), 404

                cursor.execute(
                    "SELECT id FROM salaries WHERE employee_id = %s AND month = %s AND year = %s",
                    (employee_id, month, year)
                )
                if cursor.fetchone():
                    return jsonify(error_response("Salary record already exists for this period")[0]), 409

                cursor.execute(
                    """INSERT INTO salaries 
                       (employee_id, month, year, basic_salary, bonus, deductions, net_salary, payment_date, status)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                    (employee_id, month, year, basic_salary, bonus, deductions, net_salary, payment_date, status)
                )
                conn.commit()
                salary_id = cursor.lastrowid

                cursor.execute(
                    """SELECT s.*, e.full_name, e.position FROM salaries s
                       JOIN employees e ON s.employee_id = e.id
                       WHERE s.id = %s""",
                    (salary_id,)
                )
                new_record = cursor.fetchone()
                for f in ['basic_salary', 'bonus', 'deductions', 'net_salary']:
                    if new_record.get(f) is not None:
                        new_record[f] = float(new_record[f])
        finally:
            conn.close()

        return jsonify(success_response(new_record, "Salary record created", 201)[0]), 201
    except Exception as e:
        return jsonify(error_response(str(e), 500)[0]), 500


def update_salary(salary_id):
    try:
        data = request.get_json()
        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute("SELECT id FROM salaries WHERE id = %s", (salary_id,))
                if not cursor.fetchone():
                    return jsonify(error_response("Salary record not found", 404)[0]), 404

                basic_salary = float(data.get('basic_salary', 0))
                bonus = float(data.get('bonus', 0))
                deductions = float(data.get('deductions', 0))
                net_salary = basic_salary + bonus - deductions
                payment_date = data.get('payment_date')
                status = data.get('status', 'pending')

                cursor.execute(
                    """UPDATE salaries SET basic_salary = %s, bonus = %s, deductions = %s,
                       net_salary = %s, payment_date = %s, status = %s WHERE id = %s""",
                    (basic_salary, bonus, deductions, net_salary, payment_date, status, salary_id)
                )
                conn.commit()

                cursor.execute(
                    """SELECT s.*, e.full_name, e.position FROM salaries s
                       JOIN employees e ON s.employee_id = e.id WHERE s.id = %s""",
                    (salary_id,)
                )
                updated = cursor.fetchone()
                for f in ['basic_salary', 'bonus', 'deductions', 'net_salary']:
                    if updated.get(f) is not None:
                        updated[f] = float(updated[f])
        finally:
            conn.close()

        return jsonify(success_response(updated, "Salary updated")[0]), 200
    except Exception as e:
        return jsonify(error_response(str(e), 500)[0]), 500


def delete_salary(salary_id):
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute("SELECT id FROM salaries WHERE id = %s", (salary_id,))
                if not cursor.fetchone():
                    return jsonify(error_response("Salary record not found", 404)[0]), 404

                cursor.execute("DELETE FROM salaries WHERE id = %s", (salary_id,))
                conn.commit()
        finally:
            conn.close()

        return jsonify(success_response(message="Salary record deleted")[0]), 200
    except Exception as e:
        return jsonify(error_response(str(e), 500)[0]), 500


def get_salary_report():
    try:
        month = request.args.get('month', date.today().month)
        year = request.args.get('year', date.today().year)

        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute(
                    """SELECT d.department_name,
                        COUNT(s.id) as employee_count,
                        COALESCE(SUM(s.net_salary), 0) as total_salary,
                        COALESCE(AVG(s.net_salary), 0) as avg_salary
                       FROM departments d
                       LEFT JOIN employees e ON d.id = e.department_id
                       LEFT JOIN salaries s ON e.id = s.employee_id AND s.month = %s AND s.year = %s
                       GROUP BY d.id, d.department_name""",
                    (month, year)
                )
                dept_report = cursor.fetchall()
                for r in dept_report:
                    r['total_salary'] = float(r['total_salary'])
                    r['avg_salary'] = float(r['avg_salary'])

                cursor.execute(
                    """SELECT COALESCE(SUM(net_salary), 0) as total,
                        SUM(CASE WHEN status = 'paid' THEN net_salary ELSE 0 END) as paid,
                        SUM(CASE WHEN status = 'pending' THEN net_salary ELSE 0 END) as pending
                       FROM salaries WHERE month = %s AND year = %s""",
                    (month, year)
                )
                summary = cursor.fetchone()
                for k in summary:
                    if summary[k] is not None:
                        summary[k] = float(summary[k])
        finally:
            conn.close()

        return jsonify(success_response({
            "department_report": dept_report,
            "summary": summary
        })[0]), 200
    except Exception as e:
        return jsonify(error_response(str(e), 500)[0]), 500
