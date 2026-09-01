from flask import Blueprint, jsonify
from db import get_connection
from business_date import get_business_date
import calendar
import traceback


monthly_closure_bp = Blueprint(
    "monthly_closure",
    __name__
)


# ==================================================
# Helper: Check Quarter End
# ==================================================

def is_quarter_end(month):

    return month in (
        3,
        6,
        9,
        12
    )


# ==================================================
# CLOSE MONTH
# ==================================================

@monthly_closure_bp.route(
    "/close-month",
    methods=["POST"]
)
def close_month():

    print("\n==============================")
    print("CLOSE MONTH API STARTED")
    print("==============================")

    conn = None
    cursor = None

    try:

        # ==================================================
        # BUSINESS DATE
        # ==================================================

        today = get_business_date()

        current_month = today.month
        current_year = today.year

        print(
            f"Business Date : {today}"
        )

        print(
            f"Month : {current_month}"
        )

        print(
            f"Year  : {current_year}"
        )

        # ==================================================
        # CHECK MONTH END
        # ==================================================

        last_day = calendar.monthrange(
            current_year,
            current_month
        )[1]

        if today.day != last_day:

            return jsonify({

                "message":
                    "Cannot close month. "
                    "Business month has not ended."

            }), 400

        # ==================================================
        # DATABASE
        # ==================================================

        conn = get_connection()

        cursor = conn.cursor(
            dictionary=True
        )

        # ==================================================
        # ALREADY CLOSED?
        # ==================================================

        cursor.execute("""
            SELECT
                closure_id
            FROM monthly_closure

            WHERE month = %s
            AND year = %s

            FOR UPDATE
        """, (
            current_month,
            current_year
        ))

        if cursor.fetchone():

            return jsonify({

                "message":
                    "This month has already been closed."

            }), 400

        # ==================================================
        # QUARTER STATUS
        # ==================================================

        quarter_end = is_quarter_end(
            current_month
        )

        print(
            f"Quarter End : {quarter_end}"
        )

        # ==================================================
        # LOAD ENTITLEMENTS
        # ==================================================

        cursor.execute("""
            SELECT

                b.beneficiary_id,
                b.full_name,
                b.family_members,

                r.item_id,
                ri.item_name,
                ri.unit,

                r.monthly_quantity,
                r.entitlement_type,
                r.entitlement_period

            FROM beneficiaries b

            JOIN entitlement_rules r
                ON b.category_id =
                   r.category_id

            JOIN ration_items ri
                ON r.item_id =
                   ri.item_id

            WHERE LOWER(ri.item_name) IN (
                'rice',
                'wheat',
                'sugar',
                'kerosene'
            )

            ORDER BY

                b.beneficiary_id,
                ri.item_name

        """)

        entitlement_data = (
            cursor.fetchall()
        )

        inserted = 0

        # ==================================================
        # PROCESS EACH BENEFICIARY + ITEM
        # ==================================================

        for row in entitlement_data:

            beneficiary_id = (
                row["beneficiary_id"]
            )

            item_id = row["item_id"]

            item_name = (
                row["item_name"] or ""
            ).strip()

            item_name_lower = (
                item_name.lower()
            )

            entitlement_period = (
                row["entitlement_period"]
                or "MONTHLY"
            ).upper()

            entitlement_type = (
                row["entitlement_type"]
                or "HOUSEHOLD"
            ).upper()

            base_quantity = float(
                row["monthly_quantity"]
                or 0
            )

            family_members = int(
                row["family_members"]
                or 1
            )

            # ==================================================
            # DETERMINE WHETHER THIS ITEM SHOULD BE AUDITED
            # ==================================================

            is_quarterly_item = (
                entitlement_period == "QUARTERLY"
                or
                item_name_lower in (
                    "sugar",
                    "kerosene"
                )
            )

            # ==================================================
            # QUARTERLY ITEMS
            #
            # Only create audit at quarter end.
            # ==================================================

            if is_quarterly_item:

                if not quarter_end:

                    print(
                        f"Skipping quarterly item "
                        f"{item_name} for "
                        f"{current_month}/{current_year}. "
                        f"Quarter has not ended."
                    )

                    continue

                # ---------------------------------------------
                # Quarterly entitlement
                # ---------------------------------------------

                if entitlement_type == "PERSON":

                    entitled = (
                        base_quantity *
                        family_members
                    )

                else:

                    entitled = base_quantity

                # ---------------------------------------------
                # Sum all distributions during the quarter
                # ---------------------------------------------

                if current_month in (3,):

                    quarter_start = 1

                elif current_month in (6,):

                    quarter_start = 4

                elif current_month in (9,):

                    quarter_start = 7

                else:

                    quarter_start = 10

                quarter_end = current_month

                cursor.execute("""
                    SELECT

                        IFNULL(
                            SUM(quantity_given),
                            0
                        ) AS claimed

                    FROM distributions

                    WHERE beneficiary_id = %s

                    AND item_id = %s

                    AND YEAR(distribution_date) = %s

                    AND MONTH(distribution_date)
                        BETWEEN %s AND %s

                """, (
                    beneficiary_id,
                    item_id,
                    current_year,
                    quarter_start,
                    quarter_end
                ))

                claimed_result = (
                    cursor.fetchone()
                )

                claimed = float(
                    claimed_result["claimed"]
                    or 0
                )

                unclaimed = (
                    entitled -
                    claimed
                )

                if unclaimed < 0:

                    unclaimed = 0

                print(
                    f"QUARTERLY | "
                    f"{item_name} | "
                    f"Entitled={entitled} | "
                    f"Claimed={claimed} | "
                    f"Unclaimed={unclaimed}"
                )

            # ==================================================
            # MONTHLY ITEMS
            #
            # Rice / Wheat
            # ==================================================

            else:

                # ---------------------------------------------
                # Calculate monthly entitlement
                # ---------------------------------------------

                if entitlement_type == "PERSON":

                    entitled = (
                        base_quantity *
                        family_members
                    )

                else:

                    entitled = base_quantity

                # ---------------------------------------------
                # Monthly claimed
                # ---------------------------------------------

                cursor.execute("""
                    SELECT

                        IFNULL(
                            SUM(quantity_given),
                            0
                        ) AS claimed

                    FROM distributions

                    WHERE beneficiary_id = %s

                    AND item_id = %s

                    AND MONTH(distribution_date) = %s

                    AND YEAR(distribution_date) = %s

                """, (
                    beneficiary_id,
                    item_id,
                    current_month,
                    current_year
                ))

                claimed_result = (
                    cursor.fetchone()
                )

                claimed = float(
                    claimed_result["claimed"]
                    or 0
                )

                unclaimed = (
                    entitled -
                    claimed
                )

                if unclaimed < 0:

                    unclaimed = 0

                print(
                    f"MONTHLY | "
                    f"{item_name} | "
                    f"Entitled={entitled} | "
                    f"Claimed={claimed} | "
                    f"Unclaimed={unclaimed}"
                )

            # ==================================================
            # FULLY CLAIMED
            # ==================================================

            if unclaimed <= 0:

                continue

            # ==================================================
            # CHECK EXISTING AUDIT
            # ==================================================

            cursor.execute("""
                SELECT
                    audit_id

                FROM unclaimed_audit

                WHERE beneficiary_id = %s

                AND item_id = %s

                AND month = %s

                AND year = %s

                LIMIT 1

            """, (
                beneficiary_id,
                item_id,
                current_month,
                current_year
            ))

            existing = (
                cursor.fetchone()
            )

            # ==================================================
            # UPDATE EXISTING AUDIT
            # ==================================================

            if existing:

                cursor.execute("""
                    UPDATE unclaimed_audit

                    SET

                        entitled_quantity = %s,

                        claimed_quantity = %s,

                        unclaimed_quantity = %s

                    WHERE audit_id = %s

                """, (
                    entitled,
                    claimed,
                    unclaimed,
                    existing["audit_id"]
                ))

                continue

            # ==================================================
            # INSERT AUDIT
            # ==================================================

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
                beneficiary_id,
                item_id,

                current_month,
                current_year,

                entitled,
                claimed,
                unclaimed
            ))

            inserted += 1

        # ==================================================
        # CREATE MONTHLY CLOSURE
        # ==================================================

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

        # ==================================================
        # COMMIT
        # ==================================================

        conn.commit()

        # ==================================================
        # RESPONSE
        # ==================================================

        return jsonify({

            "message":
                "Month closed successfully.",

            "month":
                current_month,

            "year":
                current_year,

            "quarter_end":
                quarter_end,

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