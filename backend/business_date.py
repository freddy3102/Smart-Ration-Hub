from db import get_connection


def get_business_date():

    conn = get_connection()

    cursor = conn.cursor(dictionary=True)

    cursor.execute("""

        SELECT business_date

        FROM system_settings

        WHERE setting_id = 1

    """)

    row = cursor.fetchone()

    cursor.close()
    conn.close()

    return row["business_date"]