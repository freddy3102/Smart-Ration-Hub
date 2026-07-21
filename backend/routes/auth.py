from flask import Blueprint, request, jsonify
from db import get_connection

auth = Blueprint("auth", __name__)

@auth.route("/login", methods=["POST"])
def login():

    data = request.get_json()

    username = data.get("username")
    password = data.get("password")

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        """
        SELECT * FROM admins
        WHERE username=%s AND password=%s
        """,
        (username, password)
    )

    admin = cursor.fetchone()

    cursor.close()
    conn.close()

    if admin:
        return jsonify({
            "message": "Login successful",
            "admin": admin["full_name"]
        }), 200

    return jsonify({
        "message": "Invalid Username or Password"
    }), 401