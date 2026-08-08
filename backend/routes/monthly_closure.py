from flask import Blueprint, jsonify, request
from db import get_connection
from business_date import get_business_date
import calendar
import traceback


monthly_closure_bp = Blueprint("monthly_closure", __name__)


@monthly_closure_bp.route("/close-month", methods=["POST"])
def close_month():

    print("\n==============================")
    print("CLOSE MONTH API STARTED")
    print("==============================")

    conn = None
    cursor = None

    try:

        # ---------------------------------
        # Business Date
        # ---------------------------------

        today = get_business_date()

        current_month = today.month
        current_year = today.year

        print(f"Business Date : {today}")
        print(f"Month : {current_month}")
        print(f"Year  : {current_year}")

        # ---------------------------------
        # Check Month End
        # ---------------------------------

        last_day = calendar.monthrange(
            current_year,
            current_month
        )[1]

        if today.day != last_day:

            return jsonify({
                "message":
                "Cannot close month. Business month has not ended."
            }), 400

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        print("Database connected.")

        # ---------------------------------
        # Already Closed?
        # ---------------------------------

        cursor.execute("""
            SELECT closure_id
            FROM monthly_closure
            WHERE month=%s
            AND year=%s
        """, (
            current_month,
            current_year
        ))

        if cursor.fetchone():

            print("Month already closed.")

            return jsonify({
                "message":
                "This month has already been closed."
            }), 400

        print("Month not closed yet.")

        # ---------------------------------
        # Load Entitlements
        # ---------------------------------

        cursor.execute("""
            SELECT
                b.beneficiary_id,
                b.full_name,
                b.family_members,

                r.item_id,
                ri.item_name,

                r.monthly_quantity,
                r.entitlement_type

            FROM beneficiaries b

            JOIN entitlement_rules r
                ON b.category_id = r.category_id

            JOIN ration_items ri
                ON r.item_id = ri.item_id

            ORDER BY
                b.beneficiary_id,
                ri.item_name

        """)

        entitlement_data = cursor.fetchall()

        print(
            f"Entitlement Records : "
            f"{len(entitlement_data)}"
        )

        inserted = 0

        # ---------------------------------
        # Generate Audit Records
        # ---------------------------------

        for row in entitlement_data:

            print("--------------------------------")
            print(row)

            # ---------------------------------
            # Already Claimed
            # ---------------------------------

            cursor.execute("""
                SELECT
                    IFNULL(
                        SUM(quantity_given),
                        0
                    ) AS claimed

                FROM distributions

                WHERE beneficiary_id=%s
                AND item_id=%s
                AND MONTH(distribution_date)=%s
                AND YEAR(distribution_date)=%s

            """, (
                row["beneficiary_id"],
                row["item_id"],
                current_month,
                current_year
            ))

            claimed = float(
                cursor.fetchone()["claimed"]
            )

            # ---------------------------------
            # Calculate Actual Entitlement
            # ---------------------------------

            base_quantity = float(
                row["monthly_quantity"]
            )

            entitlement_type = row[
                "entitlement_type"
            ]

            family_members = int(
                row["family_members"] or 1
            )

            if entitlement_type == "PERSON":

                entitled = (
                    base_quantity *
                    family_members
                )

            else:

                # HOUSEHOLD entitlement
                entitled = base_quantity

            # ---------------------------------
            # Calculate Unclaimed
            # ---------------------------------

            unclaimed = entitled - claimed

            # Avoid negative value

            if unclaimed < 0:
                unclaimed = 0

            print(
                f"Type={entitlement_type}, "
                f"Base={base_quantity}, "
                f"Family Members={family_members}, "
                f"Entitled={entitled}, "
                f"Claimed={claimed}, "
                f"Unclaimed={unclaimed}"
            )

            # ---------------------------------
            # Skip Fully Claimed Beneficiaries
            # ---------------------------------

            if unclaimed <= 0:

                print(
                    "No unclaimed stock."
                )

                continue

            # ---------------------------------
            # Prevent Duplicate Audit Records
            # ---------------------------------

            cursor.execute("""
                SELECT audit_id

                FROM unclaimed_audit

                WHERE beneficiary_id=%s
                AND item_id=%s
                AND month=%s
                AND year=%s

            """, (
                row["beneficiary_id"],
                row["item_id"],
                current_month,
                current_year
            ))

            if cursor.fetchone():

                print(
                    "Audit record already exists. "
                    "Skipping..."
                )

                continue

            # ---------------------------------
            # Insert Audit Record
            # ---------------------------------

            cursor.execute("""
                INSERT INTO unclaimed_audit
                (
                    beneficiary_id,
                    item_id,

                    month,
                    year,

                    entitled_quantity,
                    claimed_quantity,
                    unclaimed_quantity,

                    warehouse_returned_quantity,
                    returned_to_warehouse,

                    processed_by,
                    audit_status,
                    remarks
                )

                VALUES
                (
                    %s,
                    %s,

                    %s,
                    %s,

                    %s,
                    %s,
                    %s,

                    0,
                    FALSE,

                    NULL,
                    'Pending',
                    NULL
                )

            """, (
                row["beneficiary_id"],
                row["item_id"],

                current_month,
                current_year,

                entitled,
                claimed,
                unclaimed
            ))

            inserted += 1

            print(
                "Audit row inserted."
            )

        print(
            f"Inserted {inserted} "
            f"audit records."
        )

        # ---------------------------------
        # Record Month Closure
        # ---------------------------------

        cursor.execute("""
            INSERT INTO monthly_closure
            (
                month,
                year,
                closed_by
            )

            VALUES
            (
                %s,
                %s,
                %s
            )

        """, (
            current_month,
            current_year,
            1
        ))

        print(
            "Monthly closure record inserted."
        )

        # ---------------------------------
        # Save Changes
        # ---------------------------------

        conn.commit()

        print("COMMIT SUCCESSFUL")

        # ---------------------------------
        # Response
        # ---------------------------------

        return jsonify({

            "message":
            "Month closed successfully.",

            "month":
            current_month,

            "year":
            current_year,

            "audit_records_created":
            inserted

        }), 200

    except Exception as e:

        if conn:
            conn.rollback()

        print(
            "\n******** ERROR OCCURRED ********"
        )

        traceback.print_exc()

        return jsonify({

            "message":
            "Month closure failed.",

            "error":
            str(e)

        }), 500

    finally:

        if cursor:
            cursor.close()

        if conn:
            conn.close()

        print(
            "Database connection closed."
        )