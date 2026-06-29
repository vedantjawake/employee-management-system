from flask import Blueprint
from controllers.department_controller import (
    get_all_departments, get_department, create_department,
    update_department, delete_department
)
from middleware.auth import admin_required

department_bp = Blueprint('departments', __name__)

department_bp.route('/', methods=['GET'])(admin_required(get_all_departments))
department_bp.route('/<int:dept_id>', methods=['GET'])(admin_required(get_department))
department_bp.route('/', methods=['POST'])(admin_required(create_department))
department_bp.route('/<int:dept_id>', methods=['PUT'])(admin_required(update_department))
department_bp.route('/<int:dept_id>', methods=['DELETE'])(admin_required(delete_department))
