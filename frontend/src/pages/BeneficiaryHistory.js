import { useEffect, useState } from "react";
import axios from "axios";
import BeneficiaryLayout from "../components/BeneficiaryLayout";
import "../styles/BeneficiaryHistory.css";

function BeneficiaryHistory() {

    const [history, setHistory] = useState([]);

    const [loading, setLoading] = useState(true);

    const beneficiary_id =
        localStorage.getItem("beneficiary_id");


    // ---------------------------------
    // Month & Year
    // ---------------------------------

    const months = [
        { value: 1, name: "January" },
        { value: 2, name: "February" },
        { value: 3, name: "March" },
        { value: 4, name: "April" },
        { value: 5, name: "May" },
        { value: 6, name: "June" },
        { value: 7, name: "July" },
        { value: 8, name: "August" },
        { value: 9, name: "September" },
        { value: 10, name: "October" },
        { value: 11, name: "November" },
        { value: 12, name: "December" }
    ];


    // Default: August 2026

    const [selectedMonth, setSelectedMonth] =
        useState(8);

    const [selectedYear, setSelectedYear] =
        useState(2026);


    // ---------------------------------
    // Load History
    // ---------------------------------

    useEffect(() => {

        setLoading(true);

        axios.get(
            "http://localhost:5000/beneficiary-history",
            {
                params: {
                    beneficiary_id,
                    month: selectedMonth,
                    year: selectedYear
                }
            }
        )
        .then((res) => {

            setHistory(
                res.data || []
            );

        })
        .catch((err) => {

            console.log(err);

            setHistory([]);

        })
        .finally(() => {

            setLoading(false);

        });

    }, [
        beneficiary_id,
        selectedMonth,
        selectedYear
    ]);


    // ---------------------------------
    // Selected Month Name
    // ---------------------------------

    const selectedMonthName =
        months.find(
            (m) => m.value === selectedMonth
        )?.name;


    return (

        <BeneficiaryLayout>

            <div className="beneficiary-history-page">

                {/* =================================
                    PAGE TITLE
                ================================= */}

                <h1>
                    Monthly Entitlement History
                </h1>


                <p className="page-subtitle">

                    View your Rice and Wheat
                    entitlement and distribution
                    history.

                </p>


                {/* =================================
                    MONTH / YEAR FILTER
                ================================= */}

                <div className="history-filters">

                    <div className="history-filter-group">

                        <label>
                            Month
                        </label>

                        <select
                            value={selectedMonth}
                            onChange={(e) =>
                                setSelectedMonth(
                                    Number(
                                        e.target.value
                                    )
                                )
                            }
                        >

                            {months.map(
                                (month) => (

                                    <option
                                        key={
                                            month.value
                                        }
                                        value={
                                            month.value
                                        }
                                    >

                                        {month.name}

                                    </option>

                                )
                            )}

                        </select>

                    </div>


                    <div className="history-filter-group">

                        <label>
                            Year
                        </label>

                        <select
                            value={selectedYear}
                            onChange={(e) =>
                                setSelectedYear(
                                    Number(
                                        e.target.value
                                    )
                                )
                            }
                        >

                            {Array.from(
                                {
                                    length: 11
                                },
                                (_, i) =>
                                    2020 + i
                            ).map(
                                (year) => (

                                    <option
                                        key={year}
                                        value={year}
                                    >

                                        {year}

                                    </option>

                                )
                            )}

                        </select>

                    </div>

                </div>


                {/* =================================
                    SELECTED PERIOD
                ================================= */}

                <div className="selected-history-period">

                    Showing history for{" "}

                    <strong>
                        {selectedMonthName}{" "}
                        {selectedYear}
                    </strong>

                </div>


                {/* =================================
                    HISTORY TABLE
                ================================= */}

                {loading ? (

                    <div className="history-loading">

                        Loading history...

                    </div>

                ) : (

                    <div className="history-table-container">

                        <table>

                            <thead>

                                <tr>

                                    <th>
                                        Item
                                    </th>

                                    <th>
                                        Entitled
                                    </th>

                                    <th>
                                        Claimed
                                    </th>

                                    <th>
                                        Unclaimed
                                    </th>

                                    <th>
                                        Returned
                                    </th>

                                    <th>
                                        Verification
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {history.length > 0

                                    ?

                                    history.map(
                                        (row, index) => (

                                            <tr
                                                key={
                                                    row.audit_id ||
                                                    index
                                                }
                                            >

                                                {/* ITEM */}

                                                <td>

                                                    <strong>

                                                        {
                                                            row.item_name
                                                        }

                                                    </strong>

                                                </td>


                                                {/* ENTITLED */}

                                                <td>

                                                    {
                                                        Number(
                                                            row.entitled_quantity
                                                        ).toFixed(2)
                                                    } kg

                                                </td>


                                                {/* CLAIMED */}

                                                <td>

                                                    {
                                                        Number(
                                                            row.claimed_quantity
                                                        ).toFixed(2)
                                                    } kg

                                                </td>


                                                {/* UNCLAIMED */}

                                                <td>

                                                    {
                                                        Number(
                                                            row.unclaimed_quantity
                                                        ).toFixed(2)
                                                    } kg

                                                </td>


                                                {/* RETURNED */}

                                                <td>

                                                    {
                                                        Number(
                                                            row.warehouse_returned_quantity
                                                        ).toFixed(2)
                                                    } kg

                                                </td>


                                                {/* VERIFICATION */}

                                                <td>

                                                    <span
                                                        className={
                                                            row.verification_status ===
                                                            "VERIFIED"

                                                                ?

                                                                "history-status verified"

                                                                :

                                                                "history-status not-verified"
                                                        }
                                                    >

                                                        {
                                                            row.verification_status
                                                        }

                                                    </span>

                                                </td>

                                            </tr>

                                        )
                                    )

                                    :

                                    <tr>

                                        <td
                                            colSpan="6"
                                            className="no-history"
                                        >

                                            No entitlement
                                            record found for{" "}

                                            <strong>
                                                {selectedMonthName}{" "}
                                                {selectedYear}
                                            </strong>.

                                        </td>

                                    </tr>

                                }

                            </tbody>

                        </table>

                    </div>

                )}

            </div>

        </BeneficiaryLayout>

    );

}

export default BeneficiaryHistory;