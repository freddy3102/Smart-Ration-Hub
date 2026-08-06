from flask import Blueprint, request, jsonify
from db import get_connection

warehouse_login_bp = Blueprint(
    "warehouse_login",
    __name__
)


@warehouse_login_bp.route(
    "/warehouse-login",
    methods=["POST"]
)
def warehouse_login():

    data = request.get_json()

    username = data["username"]
    password = data["password"]

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""

        SELECT *

        FROM warehouse_managers

        WHERE username=%s
        AND password=%s
        AND status='Active'

    """, (

        username,
        password

    ))

    manager = cursor.fetchone()

    cursor.close()
    conn.close()

    if manager:

        return jsonify({

            "message": "Login Successful",

            "manager_id": manager["manager_id"],

            "full_name": manager["full_name"]

        }), 200

    return jsonify({

        "message": "Invalid username or password."

    }), 401