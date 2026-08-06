from flask import Blueprint, jsonify, request
from db import get_connection

warehouse_verification_bp = Blueprint(
    "warehouse_verification",
    __name__
)


# ==================================================
# Warehouse Verification Summary
# ==================================================

@warehouse_verification_bp.route(
    "/warehouse-verification",
    methods=["GET"]
)
def warehouse_verification():

    # ---------------------------------
    # Month & Year
    # ---------------------------------

    month = request.args.get("month", type=int)
    year = request.args.get("year", type=int)

    if month is None or year is None:

        return jsonify({

            "message":
            "Month and Year are required."

        }), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # ---------------------------------
    # Total Unclaimed Quantity
    # ---------------------------------

    cursor.execute("""

        SELECT

            IFNULL(
                SUM(unclaimed_quantity),
                0
            ) AS total_unclaimed

        FROM unclaimed_audit

        WHERE month=%s
        AND year=%s

    """, (

        month,
        year

    ))

    total_unclaimed = float(

        cursor.fetchone()["total_unclaimed"]

    )

    # ---------------------------------
    # Total Returned Quantity
    # ---------------------------------

    cursor.execute("""

        SELECT

            IFNULL(
                SUM(warehouse_returned_quantity),
                0
            ) AS total_returned

        FROM unclaimed_audit

        WHERE month=%s
        AND year=%s

    """, (

        month,
        year

    ))

    total_returned = float(

        cursor.fetchone()["total_returned"]

    )

    # ---------------------------------
    # Difference
    # ---------------------------------

    difference = total_unclaimed - total_returned

    # ---------------------------------
    # Verification Status
    # ---------------------------------

    cursor.execute("""

        SELECT verified

        FROM monthly_closure

        WHERE month=%s
        AND year=%s

    """, (

        month,
        year

    ))

    closure = cursor.fetchone()

    # Month not closed

    if not closure:

        status = "MONTH NOT CLOSED"

    # Already verified

    elif closure["verified"]:

        status = "VERIFIED"

    # Nothing to verify

    elif total_unclaimed == 0:

        status = "NO UNCLAIMED STOCK"

    # Stock mismatch

    elif difference != 0:

        status = "MISMATCH"

    # Ready

    else:

        status = "READY FOR VERIFICATION"

    cursor.close()
    conn.close()

    return jsonify({

        "month": month,

        "year": year,

        "total_unclaimed": total_unclaimed,

        "total_returned": total_returned,

        "difference": difference,

        "status": status

    })


# ==================================================
# Warehouse Verification
# ==================================================

@warehouse_verification_bp.route(
    "/warehouse-verification",
    methods=["POST"]
)
def verify_warehouse():

    data = request.get_json()

    month = data.get("month")
    year = data.get("year")
    manager_id = data.get("manager_id")

    if not month or not year or not manager_id:

        return jsonify({

            "message":
            "Month, Year and Manager ID are required."

        }), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # ---------------------------------
    # Monthly Closure Exists?
    # ---------------------------------

    cursor.execute("""

        SELECT verified

        FROM monthly_closure

        WHERE month=%s
        AND year=%s

    """, (

        month,
        year

    ))

    closure = cursor.fetchone()

    if not closure:

        cursor.close()
        conn.close()

        return jsonify({

            "message":
            "Monthly closure not found."

        }), 404

    # ---------------------------------
    # Already Verified?
    # ---------------------------------

    if closure["verified"]:

        cursor.close()
        conn.close()

        return jsonify({

            "message":
            "This month has already been verified."

        }), 400

    # ---------------------------------
    # Total Unclaimed
    # ---------------------------------

    cursor.execute("""

        SELECT

            IFNULL(
                SUM(unclaimed_quantity),
                0
            ) AS total_unclaimed

        FROM unclaimed_audit

        WHERE month=%s
        AND year=%s

    """, (

        month,
        year

    ))

    total_unclaimed = float(

        cursor.fetchone()["total_unclaimed"]

    )

    # ---------------------------------
    # Total Returned
    # ---------------------------------

    cursor.execute("""

        SELECT

            IFNULL(
                SUM(warehouse_returned_quantity),
                0
            ) AS total_returned

        FROM unclaimed_audit

        WHERE month=%s
        AND year=%s

    """, (

        month,
        year

    ))

    total_returned = float(

        cursor.fetchone()["total_returned"]

    )

    # ---------------------------------
    # No Unclaimed Stock
    # ---------------------------------

    if total_unclaimed == 0:

        cursor.close()
        conn.close()

        return jsonify({

            "message":
            "No unclaimed stock available for verification."

        }), 400

    # ---------------------------------
    # Verify Totals
    # ---------------------------------

    if total_unclaimed != total_returned:

        cursor.close()
        conn.close()

        return jsonify({

            "message":
            "Verification failed. Total returned quantity does not match total unclaimed quantity."

        }), 400

    # ---------------------------------
    # Update Monthly Closure
    # ---------------------------------

    cursor.execute("""

        UPDATE monthly_closure

        SET

            verified = TRUE,
            verified_by = %s,
            verified_at = NOW()

        WHERE month=%s
        AND year=%s

    """, (

        manager_id,
        month,
        year

    ))

    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({

        "message":
        "Warehouse verification completed successfully."

    }), 200