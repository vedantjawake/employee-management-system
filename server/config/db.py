import pymysql
import pymysql.cursors
from dotenv import load_dotenv
import os

load_dotenv()

def get_db_connection():
    """Create and return a database connection."""
    try:
        connection = pymysql.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASSWORD', ''),
            database=os.getenv('DB_NAME', 'employee_management'),
            port=int(os.getenv('DB_PORT', 3306)),
            cursorclass=pymysql.cursors.DictCursor,
            charset='utf8mb4',
            autocommit=False
        )
        return connection
    except pymysql.Error as e:
        raise Exception(f"Database connection failed: {str(e)}")
