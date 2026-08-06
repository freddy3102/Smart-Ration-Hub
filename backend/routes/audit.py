from flask import Blueprint, jsonify, request
from db import get_connection
from business_date import get_business_date

audit_bp = Blueprint("audit", __name__)


@audit_bp.route("/audit", methods=["GET"])
def get_audit():

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # ---------------------------------
    # Current Business Date
    # ---------------------------------

    business_date = get_business_date()

    default_month = business_date.month
    default_year = business_date.year

    # ---------------------------------
    # Optional Filters
    # ---------------------------------

    month = request.args.get(
        "month",
        default_month,
        type=int
    )

    year = request.args.get(
        "year",
        default_year,
        type=int
    )

    # ---------------------------------
    # Load Audit Records
    # ---------------------------------

    cursor.execute("""

        SELECT

            ua.audit_id,

            b.full_name,

            ri.item_name,

            ua.month,
            ua.year,

            ua.entitled_quantity,

            ua.claimed_quantity,

            ua.unclaimed_quantity,

            ua.warehouse_returned_quantity,

            ua.audit_status

        FROM unclaimed_audit ua

        JOIN beneficiaries b
            ON ua.beneficiary_id = b.beneficiary_id

        JOIN ration_items ri
            ON ua.item_id = ri.item_id

        WHERE
            ua.month=%s
            AND ua.year=%s

        ORDER BY
            ua.audit_id

    """, (

        month,
        year

    ))

    data = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(data)