from flask import Blueprint
from controllers.attendance_controller import (
    get_attendance, mark_attendance, bulk_attendance, get_monthly_report
)
from middleware.auth import admin_required

attendance_bp = Blueprint('attendance', __name__)

attendance_bp.route('/', methods=['GET'])(admin_required(get_attendance))
attendance_bp.route('/', methods=['POST'])(admin_required(mark_attendance))
attendance_bp.route('/bulk', methods=['POST'])(admin_required(bulk_attendance))
attendance_bp.route('/monthly-report', methods=['GET'])(admin_required(get_monthly_report))
