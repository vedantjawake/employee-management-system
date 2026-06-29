from flask import Blueprint
from controllers.auth_controller import (
    login, employee_login, register,
    get_profile, update_profile, change_password,
    get_employee_profile, employee_change_password,
    forgot_password, reset_password,
)
from middleware.auth import admin_required, employee_required

auth_bp = Blueprint('auth', __name__)

# Admin auth
auth_bp.route('/login',           methods=['POST'])(login)
auth_bp.route('/register',        methods=['POST'])(register)
auth_bp.route('/forgot-password', methods=['POST'])(forgot_password)
auth_bp.route('/reset-password',  methods=['POST'])(reset_password)
auth_bp.route('/profile',         methods=['GET'])(admin_required(get_profile))
auth_bp.route('/profile',         methods=['PUT'])(admin_required(update_profile))
auth_bp.route('/change-password', methods=['POST'])(admin_required(change_password))

# Employee auth
auth_bp.route('/employee/login',           methods=['POST'])(employee_login)
auth_bp.route('/employee/profile',         methods=['GET'])(employee_required(get_employee_profile))
auth_bp.route('/employee/change-password', methods=['POST'])(employee_required(employee_change_password))
