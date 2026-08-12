import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/WarehouseVerification.css";

function WarehouseVerification() {

    const navigate = useNavigate();

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

    const [businessDate, setBusinessDate] = useState("");
    const [month, setMonth] = useState(null);
    const [year, setYear] = useState(null);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);


    // ---------------------------------
    // Load Business Date
    // ---------------------------------

    useEffect(() => {

        loadBusinessDate();

    }, []);


    const loadBusinessDate = async () => {

        try {

            const res = await axios.get(
                "http://127.0.0.1:5000/business-date"
            );

            const savedDate =
                res.data.business_date;

            setBusinessDate(savedDate);

            const date = new Date(
                `${savedDate}T00:00:00`
            );

            setMonth(
                date.getMonth() + 1
            );

            setYear(
                date.getFullYear()
            );

        } catch (err) {

            console.log(err);

            alert(
                "Unable to load business date."
            );

        } finally {

            setLoading(false);

        }

    };


    // ---------------------------------
    // Load Verification Summary
    // ---------------------------------

    useEffect(() => {

        if (
            month === null ||
            year === null
        ) {
            return;
        }

        loadSummary();

    }, [month, year]);


    const loadSummary = async () => {

        try {

            const res = await axios.get(
                "http://127.0.0.1:5000/warehouse-verification",
                {
                    params: {
                        month,
                        year
                    }
                }
            );

            setSummary(res.data);

        } catch (err) {

            console.log(err);

            setSummary(null);

            alert(
                err.response?.data?.message ||
                "Unable to load verification data."
            );

        }

    };


    // ---------------------------------
    // Verify Month
    // ---------------------------------

    const verifyMonth = async () => {

        if (!summary) {
            return;
        }

        if (
            summary.status !==
            "READY FOR VERIFICATION"
        ) {

            alert(
                "The month is not ready for verification."
            );

            return;

        }

        const selectedMonthName =
            months.find(
                (m) => m.value === month
            )?.name;

        const confirmed =
            window.confirm(
                `Verify warehouse returns for ${selectedMonthName} ${year}?\n\n` +
                "Verified returned stock will be added back to inventory."
            );

        if (!confirmed) {
            return;
        }

        try {

            setVerifying(true);

            const res = await axios.post(
                "http://127.0.0.1:5000/warehouse-verification",
                {
                    month,
                    year,
                    manager_id: 1
                }
            );

            alert(
                res.data.message ||
                "Warehouse verification completed successfully."
            );

            await loadSummary();

        } catch (err) {

            console.log(
                "WAREHOUSE VERIFICATION ERROR:",
                err.response?.data
            );

            alert(
                err.response?.data?.error ||
                err.response?.data?.message ||
                "Verification Failed"
            );

        } finally {

            setVerifying(false);

        }

    };


    // ---------------------------------
    // Loading
    // ---------------------------------

    if (loading) {

        return (

            <div className="verification-page">

                <div className="verification-card">

                    <h1>
                        Warehouse Verification
                    </h1>

                    <p>
                        Loading business date...
                    </p>

                </div>

            </div>

        );

    }


    // ---------------------------------
    // Main Page
    // ---------------------------------

    return (

        <div className="verification-page">

            <div className="verification-card">

                {/* Back to Warehouse Dashboard */}

                <button
                    type="button"
                    className="back-dashboard-btn"
                    onClick={() =>
                        navigate(
                            "/warehouse-dashboard"
                        )
                    }
                >
                    ← Warehouse Dashboard
                </button>


                <h1>
                    Warehouse Verification
                </h1>


                <p>
                    Business Date:{" "}
                    <strong>
                        {businessDate}
                    </strong>
                </p>


                {/* Month / Year */}

                <div className="selectors">

                    <div>

                        <label>
                            Month
                        </label>

                        <select
                            value={month || ""}
                            onChange={(e) =>
                                setMonth(
                                    Number(
                                        e.target.value
                                    )
                                )
                            }
                        >

                            {months.map(
                                (m) => (

                                    <option
                                        key={m.value}
                                        value={m.value}
                                    >
                                        {m.name}
                                    </option>

                                )
                            )}

                        </select>

                    </div>


                    <div>

                        <label>
                            Year
                        </label>

                        <select
                            value={year || ""}
                            onChange={(e) =>
                                setYear(
                                    Number(
                                        e.target.value
                                    )
                                )
                            }
                        >

                            {Array.from(
                                {
                                    length: 9
                                },
                                (_, i) =>
                                    2020 + i
                            ).map(
                                (y) => (

                                    <option
                                        key={y}
                                        value={y}
                                    >
                                        {y}
                                    </option>

                                )
                            )}

                        </select>

                    </div>

                </div>


                {/* Verification Summary */}

                {summary && (

                    <>

                        <div className="summary-box">

                            <p>

                                <strong>
                                    Total Unclaimed :
                                </strong>{" "}

                                {Number(
                                    summary.total_unclaimed
                                ).toFixed(2)} kg

                            </p>


                            <p>

                                <strong>
                                    Total Returned :
                                </strong>{" "}

                                {Number(
                                    summary.total_returned
                                ).toFixed(2)} kg

                            </p>


                            <p>

                                <strong>
                                    Difference :
                                </strong>{" "}

                                {Number(
                                    summary.difference
                                ).toFixed(2)} kg

                            </p>


                            <p>

                                <strong>
                                    Status :
                                </strong>{" "}

                                <span
                                    className={
                                        summary.status ===
                                        "VERIFIED"
                                            ? "status verified"

                                            : summary.status ===
                                              "READY FOR VERIFICATION"
                                                ? "status ready"

                                                : summary.status ===
                                                  "MISMATCH"
                                                    ? "status mismatch"

                                                    : "status"
                                    }
                                >

                                    {summary.status}

                                </span>

                            </p>

                        </div>


                        {/* Verify Button */}

                        <button
                            type="button"
                            className="verify-btn"
                            disabled={
                                summary.status !==
                                "READY FOR VERIFICATION" ||
                                verifying
                            }
                            onClick={
                                verifyMonth
                            }
                        >

                            {verifying
                                ? "Verifying..."
                                : "Verify Month"
                            }

                        </button>

                    </>

                )}

            </div>

        </div>

    );

}


// IMPORTANT: This must be present
export default WarehouseVerification;