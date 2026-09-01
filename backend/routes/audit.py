from flask import Blueprint, jsonify, request
from db import get_connection
from business_date import get_business_date


audit_bp = Blueprint(
    "audit",
    __name__
)


# ==================================================
# Helper: Quarter
# ==================================================

def get_quarter(month):

    if month in (1, 2, 3):
        return 1

    if month in (4, 5, 6):
        return 2

    if month in (7, 8, 9):
        return 3

    return 4


# ==================================================
# GET AUDIT
# ==================================================

@audit_bp.route(
    "/audit",
    methods=["GET"]
)
def get_audit():

    conn = None
    cursor = None

    try:

        conn = get_connection()

        cursor = conn.cursor(
            dictionary=True
        )

        # ==================================================
        # BUSINESS DATE
        # ==================================================

        business_date = (
            get_business_date()
        )

        default_month = (
            business_date.month
        )

        default_year = (
            business_date.year
        )

        # ==================================================
        # FILTERS
        # ==================================================

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

        if month < 1 or month > 12:

            return jsonify({

                "message":
                    "Invalid month."

            }), 400

        quarter = get_quarter(
            month
        )

        # ==================================================
        # LOAD AUDIT
        # ==================================================

        cursor.execute("""
            SELECT

                ua.audit_id,

                ua.beneficiary_id,

                b.full_name,

                b.ration_card_no,

                c.category_name,

                ua.item_id,

                ri.item_name,

                ri.unit,

                ua.month,
                ua.year,

                ua.entitled_quantity,

                ua.claimed_quantity,

                ua.unclaimed_quantity,

                ua.warehouse_returned_quantity,

                ua.returned_to_warehouse,

                ua.audit_status,

                ua.processed_by,

                ua.processed_on,

                CASE

                    WHEN LOWER(ri.item_name)
                        IN ('sugar', 'kerosene')

                    THEN 'QUARTERLY'

                    ELSE 'MONTHLY'

                END AS audit_period

            FROM unclaimed_audit ua

            JOIN beneficiaries b
                ON ua.beneficiary_id =
                   b.beneficiary_id

            JOIN card_categories c
                ON b.category_id =
                   c.category_id

            JOIN ration_items ri
                ON ua.item_id =
                   ri.item_id

            WHERE ua.month = %s

            AND ua.year = %s

            AND ua.unclaimed_quantity > 0

            AND LOWER(ri.item_name) IN (

                'rice',
                'wheat',
                'sugar',
                'kerosene'

            )

            ORDER BY

                CASE

                    WHEN LOWER(ri.item_name)
                        IN ('sugar', 'kerosene')

                    THEN 2

                    ELSE 1

                END,

                ri.item_name,

                b.full_name

        """, (
            month,
            year
        ))

        records = cursor.fetchall()

        # ==================================================
        # ADD EXTRA INFORMATION
        # ==================================================

        for record in records:

            if record["audit_period"] == "QUARTERLY":

                record["quarter"] = (
                    f"Q{quarter}"
                )

                record[
                    "return_allowed"
                ] = month in (
                    3,
                    6,
                    9,
                    12
                )

            else:

                record["quarter"] = None

                record[
                    "return_allowed"
                ] = True

        return jsonify(
            records
        ), 200

    except Exception as e:

        print(
            "AUDIT API ERROR:"
        )

        print(e)

        return jsonify({

            "message":
                "Unable to load audit records.",

            "error":
                str(e)

        }), 500

    finally:

        if cursor:

            cursor.close()

        if conn:

            conn.close()