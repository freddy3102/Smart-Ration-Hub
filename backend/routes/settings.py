from flask import Blueprint, jsonify, request
from db import get_connection
from datetime import datetime

settings_bp = Blueprint("settings", __name__)


# -----------------------------
# Get Business Date
# -----------------------------
@settings_bp.route("/business-date", methods=["GET"])
def get_business_date_route():

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""

        SELECT business_date

        FROM system_settings

        WHERE setting_id = 1

    """)

    data = cursor.fetchone()

    cursor.close()
    conn.close()

    return jsonify({

        "business_date":
        data["business_date"].strftime("%Y-%m-%d")

    })


# -----------------------------
# Update Business Date
# -----------------------------
@settings_bp.route("/business-date", methods=["PUT"])
def update_business_date():

    data = request.get_json()

    business_date = data["business_date"]

    # ---------------------------------
    # Prevent Future Business Date
    # ---------------------------------

    selected_date = datetime.strptime(

        business_date,

        "%Y-%m-%d"

    ).date()

    today = datetime.now().date()

    if selected_date > today:

        return jsonify({

            "message":
            "Business date cannot be set beyond today's date."

        }), 400

    # ---------------------------------
    # Update Business Date
    # ---------------------------------

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""

        UPDATE system_settings

        SET business_date=%s

        WHERE setting_id=1

    """, (business_date,))

    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({

        "message": "Business date updated successfully."

    })


# -----------------------------
# Distribution Cycle Status
# -----------------------------
@settings_bp.route("/cycle-status", methods=["GET"])
def cycle_status():

    # Get month/year from query parameters if provided

    month = request.args.get("month", type=int)
    year = request.args.get("year", type=int)

    # If not provided, use current business date

    if month is None or year is None:

        from business_date import get_business_date

        today = get_business_date()

        month = today.month
        year = today.year

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""

        SELECT closure_id

        FROM monthly_closure

        WHERE month=%s
        AND year=%s

    """, (

        month,
        year

    ))

    closed = cursor.fetchone()

    cursor.close()
    conn.close()

    return jsonify({

        "status":

            "CLOSED"

            if closed

            else

            "OPEN"

    })