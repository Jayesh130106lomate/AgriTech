import sqlite3
import os
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import uuid

class UserManager:
    def __init__(self, db_path='users.db'):
        self.db_path = db_path
        self.init_db()

    def init_db(self):
        """Initialize the database and create users table if it doesn't exist"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    email TEXT UNIQUE,
                    password_hash TEXT NOT NULL,
                    is_verified BOOLEAN DEFAULT FALSE,
                    verification_token TEXT,
                    reset_token TEXT,
                    reset_token_expires DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    last_login DATETIME,
                    is_active BOOLEAN DEFAULT TRUE
                )
            ''')
            conn.commit()

    def create_user(self, username, password, email=None):
        """Create a new user account"""
        try:
            password_hash = generate_password_hash(password)
            verification_token = str(uuid.uuid4())

            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.execute('''
                    INSERT INTO users (username, email, password_hash, verification_token)
                    VALUES (?, ?, ?, ?)
                ''', (username, email, password_hash, verification_token))
                conn.commit()
                return cursor.lastrowid
        except sqlite3.IntegrityError:
            return None  # Username or email already exists

    def verify_user(self, user_id):
        """Mark user as verified"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute('''
                UPDATE users SET is_verified = TRUE, verification_token = NULL
                WHERE id = ?
            ''', (user_id,))
            conn.commit()

    def authenticate_user(self, username, password):
        """Authenticate user credentials"""
        with sqlite3.connect(self.db_path) as conn:
            user = conn.execute('''
                SELECT id, username, password_hash, is_verified, is_active
                FROM users WHERE username = ? OR email = ?
            ''', (username, username)).fetchone()

            if user and check_password_hash(user[2], password):
                if not user[4]:  # is_active
                    return None, "Account is deactivated"

                # Update last login
                conn.execute('UPDATE users SET last_login = ? WHERE id = ?',
                           (datetime.now(), user[0]))
                conn.commit()

                return {
                    'id': user[0],
                    'username': user[1],
                    'is_verified': user[3]
                }, None
            return None, "Invalid credentials"

    def get_user_by_id(self, user_id):
        """Get user by ID"""
        with sqlite3.connect(self.db_path) as conn:
            user = conn.execute('''
                SELECT id, username, email, is_verified, created_at, last_login
                FROM users WHERE id = ?
            ''', (user_id,)).fetchone()

            if user:
                return {
                    'id': user[0],
                    'username': user[1],
                    'email': user[2],
                    'is_verified': user[3],
                    'created_at': user[4],
                    'last_login': user[5]
                }
            return None

    def get_user_by_verification_token(self, token):
        """Get user by verification token"""
        with sqlite3.connect(self.db_path) as conn:
            user = conn.execute('''
                SELECT id, username, email FROM users
                WHERE verification_token = ? AND is_verified = FALSE
            ''', (token,)).fetchone()
            return user

    def create_password_reset_token(self, email):
        """Create password reset token for user"""
        reset_token = str(uuid.uuid4())
        expires = datetime.now() + timedelta(hours=24)

        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute('''
                UPDATE users SET reset_token = ?, reset_token_expires = ?
                WHERE email = ?
            ''', (reset_token, expires, email))
            return cursor.rowcount > 0, reset_token

    def reset_password(self, token, new_password):
        """Reset password using reset token"""
        with sqlite3.connect(self.db_path) as conn:
            user = conn.execute('''
                SELECT id FROM users
                WHERE reset_token = ? AND reset_token_expires > ?
            ''', (token, datetime.now())).fetchone()

            if user:
                password_hash = generate_password_hash(new_password)
                conn.execute('''
                    UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL
                    WHERE id = ?
                ''', (password_hash, user[0]))
                conn.commit()
                return True
            return False

    def update_user_profile(self, user_id, updates):
        """Update user profile information"""
        allowed_fields = ['email', 'username']
        update_fields = {k: v for k, v in updates.items() if k in allowed_fields}

        if not update_fields:
            return False

        set_clause = ', '.join(f'{field} = ?' for field in update_fields.keys())
        values = list(update_fields.values()) + [user_id]

        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute(f'UPDATE users SET {set_clause} WHERE id = ?', values)
            conn.commit()
            return cursor.rowcount > 0