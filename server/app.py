import os
import sys
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
from datetime import timedelta

load_dotenv()

app = Flask(__name__)

# ── Configuration ──────────────────────────────────────────────────
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'ems_secret_key_2024')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(seconds=int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 86400)))
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024   # 16 MB

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# ── Extensions ─────────────────────────────────────────────────────
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)
jwt = JWTManager(app)

# ── JWT error handlers ─────────────────────────────────────────────
@jwt.unauthorized_loader
def unauthorized_callback(error):
    return jsonify({"success": False, "message": "Authentication required"}), 401

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({"success": False, "message": "Token has expired. Please login again."}), 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify({"success": False, "message": "Invalid token"}), 422

# ── Blueprints ─────────────────────────────────────────────────────
from routes.auth_routes       import auth_bp
from routes.employee_routes   import employee_bp
from routes.department_routes import department_bp
from routes.attendance_routes import attendance_bp
from routes.salary_routes     import salary_bp

app.register_blueprint(auth_bp,        url_prefix='/api/auth')
app.register_blueprint(employee_bp,    url_prefix='/api/employees')
app.register_blueprint(department_bp,  url_prefix='/api/departments')
app.register_blueprint(attendance_bp,  url_prefix='/api/attendance')
app.register_blueprint(salary_bp,      url_prefix='/api/salaries')

# ── Serve uploaded files ────────────────────────────────────────────
@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# ── Health check ───────────────────────────────────────────────────
@app.route('/api/health')
def health():
    return jsonify({"status": "ok", "message": "EMS API is running"}), 200

# ── Global error handlers ──────────────────────────────────────────
@app.errorhandler(404)
def not_found(e):
    return jsonify({"success": False, "message": "Route not found"}), 404

@app.errorhandler(405)
def method_not_allowed(e):
    return jsonify({"success": False, "message": "Method not allowed"}), 405

@app.errorhandler(500)
def server_error(e):
    return jsonify({"success": False, "message": "Internal server error"}), 500

@app.errorhandler(413)
def too_large(e):
    return jsonify({"success": False, "message": "File too large. Max 16MB allowed."}), 413

# ── Run ────────────────────────────────────────────────────────────
if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    print(f"\n🚀  EMS Backend running at http://localhost:{port}")
    print(f"📋  API Docs: http://localhost:{port}/api/health\n")
    app.run(debug=True, host='0.0.0.0', port=port)
