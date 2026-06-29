from flask import request, jsonify
from config.db import get_db_connection
from utils.helpers import success_response, error_response
from datetime import date

def get_attendance():
    try:
        employee_id = request.args.get('employee_id', '')
        month = request.args.get('month', '')
        year = request.args.get('year', '')
        att_date = request.args.get('date', '')

        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                conditions = []
                params = []

                if employee_id:
                    conditions.append("a.employee_id = %s")
                    params.append(employee_id)
                if month:
                    conditions.append("MONTH(a.date) = %s")
                    params.append(month)
                if year:
                    conditions.append("YEAR(a.date) = %s")
                    params.append(year)
                if att_date:
                    conditions.append("a.date = %s")
                    params.append(att_date)

                where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""

                cursor.execute(
                    f"""SELECT a.*, e.full_name, e.email, e.profile_image, d.department_name
                        FROM attendance a
                        JOIN employees e ON a.employee_id = e.id
                        LEFT JOIN departments d ON e.department_id = d.id
                        {where_clause}
                        ORDER BY a.date DESC, e.full_name""",
                    params
                )
                records = cursor.fetchall()
                for r in records:
                    if r.get('date'):
                        r['date'] = str(r['date'])
                    if r.get('created_at'):
                        r['created_at'] = str(r['created_at'])
                    if r.get('check_in'):
                        r['check_in'] = str(r['check_in'])
                    if r.get('check_out'):
                        r['check_out'] = str(r['check_out'])
        finally:
            conn.close()

        return jsonify(success_response(records)[0]), 200
    except Exception as e:
        return jsonify(error_response(str(e), 500)[0]), 500


def mark_attendance():
    try:
        data = request.get_json()
        employee_id = data.get('employee_id')
        att_date = data.get('date', str(date.today()))
        status = data.get('status', 'present')
        check_in = data.get('check_in')
        check_out = data.get('check_out')
        notes = data.get('notes', '')

        if not employee_id:
            return jsonify(error_response("Employee ID is required")[0]), 400

        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute("SELECT id FROM employees WHERE id = %s", (employee_id,))
                if not cursor.fetchone():
                    return jsonify(error_response("Employee not found", 404)[0]), 404

                cursor.execute(
                    "SELECT id FROM attendance WHERE employee_id = %s AND date = %s",
                    (employee_id, att_date)
                )
                existing = cursor.fetchone()

                if existing:
                    cursor.execute(
                        """UPDATE attendance SET status = %s, check_in = %s, check_out = %s, notes = %s
                           WHERE employee_id = %s AND date = %s""",
                        (status, check_in, check_out, notes, employee_id, att_date)
                    )
                    msg = "Attendance updated"
                else:
                    cursor.execute(
                        """INSERT INTO attendance (employee_id, date, status, check_in, check_out, notes)
                           VALUES (%s, %s, %s, %s, %s, %s)""",
                        (employee_id, att_date, status, check_in, check_out, notes)
                    )
                    msg = "Attendance marked"

                conn.commit()
        finally:
            conn.close()

        return jsonify(success_response(message=msg)[0]), 200
    except Exception as e:
        return jsonify(error_response(str(e), 500)[0]), 500


def bulk_attendance():
    """Mark attendance for multiple employees at once."""
    try:
        data = request.get_json()
        records = data.get('records', [])
        att_date = data.get('date', str(date.today()))

        if not records:
            return jsonify(error_response("No attendance records provided")[0]), 400

        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                for record in records:
                    emp_id = record.get('employee_id')
                    status = record.get('status', 'present')
                    check_in = record.get('check_in')
                    check_out = record.get('check_out')

                    cursor.execute(
                        "SELECT id FROM attendance WHERE employee_id = %s AND date = %s",
                        (emp_id, att_date)
                    )
                    existing = cursor.fetchone()

                    if existing:
                        cursor.execute(
                            "UPDATE attendance SET status = %s, check_in = %s, check_out = %s WHERE employee_id = %s AND date = %s",
                            (status, check_in, check_out, emp_id, att_date)
                        )
                    else:
                        cursor.execute(
                            "INSERT INTO attendance (employee_id, date, status, check_in, check_out) VALUES (%s, %s, %s, %s, %s)",
                            (emp_id, att_date, status, check_in, check_out)
                        )
                conn.commit()
        finally:
            conn.close()

        return jsonify(success_response(message="Bulk attendance marked successfully")[0]), 200
    except Exception as e:
        return jsonify(error_response(str(e), 500)[0]), 500


def get_monthly_report():
    try:
        month = request.args.get('month', date.today().month)
        year = request.args.get('year', date.today().year)

        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute(
                    """SELECT e.id, e.full_name, e.position, d.department_name,
                        SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_days,
                        SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent_days,
                        SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) as late_days,
                        SUM(CASE WHEN a.status = 'half-day' THEN 1 ELSE 0 END) as half_days,
                        COUNT(a.id) as total_days
                       FROM employees e
                       LEFT JOIN attendance a ON e.id = a.employee_id
                           AND MONTH(a.date) = %s AND YEAR(a.date) = %s
                       LEFT JOIN departments d ON e.department_id = d.id
                       WHERE e.status = 'active'
                       GROUP BY e.id, e.full_name, e.position, d.department_name
                       ORDER BY e.full_name""",
                    (month, year)
                )
                report = cursor.fetchall()
        finally:
            conn.close()

        return jsonify(success_response(report)[0]), 200
    except Exception as e:
        return jsonify(error_response(str(e), 500)[0]), 500
