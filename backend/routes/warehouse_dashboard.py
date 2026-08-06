from flask import Blueprint, jsonify, request
from db import get_connection

warehouse_dashboard_bp = Blueprint(
    "warehouse_dashboard",
    __name__
)


@warehouse_dashboard_bp.route(
    "/warehouse-dashboard",
    methods=["GET"]
)
def warehouse_dashboard():

    month = request.args.get("month", type=int)
    year = request.args.get("year", type=int)

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # Total unclaimed quantity
    cursor.execute(
        """
        SELECT
            IFNULL(SUM(unclaimed_quantity),0) AS total_unclaimed
        FROM unclaimed_audit
        WHERE month=%s
        AND year=%s
        """,
        (month, year)
    )

    total_unclaimed = cursor.fetchone()["total_unclaimed"]

    # Total warehouse returned quantity
    cursor.execute(
        """
        SELECT
            IFNULL(SUM(warehouse_returned_quantity),0)
            AS total_returned
        FROM unclaimed_audit
        WHERE month=%s
        AND year=%s
        """,
        (month, year)
    )

    total_returned = cursor.fetchone()["total_returned"]

    difference = float(total_unclaimed) - float(total_returned)

    if difference == 0:
        status = "READY FOR VERIFICATION"
    else:
        status = "MISMATCH"

    cursor.close()
    conn.close()

    return jsonify({

        "month": month,
        "year": year,

        "total_unclaimed": float(total_unclaimed),

        "total_returned": float(total_returned),

        "difference": difference,

        "status": status

    })