from flask import Blueprint
from controllers.employee_controller import (
    get_all_employees, get_employee, create_employee,
    update_employee, delete_employee, get_dashboard_stats,
    public_register_employee,
)
from middleware.auth import admin_required

employee_bp = Blueprint('employees', __name__)

employee_bp.route('/dashboard', methods=['GET'])(admin_required(get_dashboard_stats))
employee_bp.route('/', methods=['GET'])(admin_required(get_all_employees))
employee_bp.route('/<int:employee_id>', methods=['GET'])(admin_required(get_employee))
employee_bp.route('/', methods=['POST'])(admin_required(create_employee))
employee_bp.route('/<int:employee_id>', methods=['PUT'])(admin_required(update_employee))
employee_bp.route('/<int:employee_id>', methods=['DELETE'])(admin_required(delete_employee))

# Public self-registration — no token required
employee_bp.route('/register', methods=['POST'])(public_register_employee)
