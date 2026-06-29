from flask import Blueprint
from controllers.salary_controller import (
    get_salaries, create_salary, update_salary,
    delete_salary, get_salary_report
)
from middleware.auth import admin_required

salary_bp = Blueprint('salaries', __name__)

salary_bp.route('/', methods=['GET'])(admin_required(get_salaries))
salary_bp.route('/', methods=['POST'])(admin_required(create_salary))
salary_bp.route('/<int:salary_id>', methods=['PUT'])(admin_required(update_salary))
salary_bp.route('/<int:salary_id>', methods=['DELETE'])(admin_required(delete_salary))
salary_bp.route('/report', methods=['GET'])(admin_required(get_salary_report))
