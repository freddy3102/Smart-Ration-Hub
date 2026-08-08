from flask import Blueprint, jsonify, request
from db import get_connection
from business_date import get_business_date


audit_bp = Blueprint("audit", __name__)


@audit_bp.route("/audit", methods=["GET"])
def get_audit():

    conn = None
    cursor = None

    try:

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
        #
        # Only:
        #   1. Rice
        #   2. Wheat
        #
        # Also exclude records where
        # unclaimed quantity is zero.
        # ---------------------------------

        cursor.execute("""

            SELECT

                ua.audit_id,

                ua.beneficiary_id,

                b.full_name,

                ua.item_id,

                ri.item_name,

                ua.month,
                ua.year,

                ua.entitled_quantity,

                ua.claimed_quantity,

                ua.unclaimed_quantity,

                ua.warehouse_returned_quantity,

                ua.returned_to_warehouse,

                ua.audit_status

            FROM unclaimed_audit ua

            JOIN beneficiaries b
                ON ua.beneficiary_id = b.beneficiary_id

            JOIN ration_items ri
                ON ua.item_id = ri.item_id

            WHERE

                ua.month = %s

                AND ua.year = %s

                AND ua.unclaimed_quantity > 0

                AND LOWER(ri.item_name) IN (
                    'rice',
                    'wheat'
                )

            ORDER BY

                ri.item_name,

                ua.unclaimed_quantity DESC,

                b.full_name

        """, (

            month,
            year

        ))

        data = cursor.fetchall()

        return jsonify(data), 200

    except Exception as e:

        print("AUDIT API ERROR:")
        print(e)

        return jsonify({

            "message": "Unable to load audit records.",
            "error": str(e)

        }), 500

    finally:

        if cursor:
            cursor.close()

        if conn:
            conn.close()