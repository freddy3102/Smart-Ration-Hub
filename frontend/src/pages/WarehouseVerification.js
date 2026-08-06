import { useEffect, useState } from "react";
import axios from "axios";
import "./../styles/WarehouseVerification.css";

function WarehouseVerification() {

    const currentYear = new Date().getFullYear();

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

    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(currentYear);

    const [summary, setSummary] = useState(null);

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

            alert("Unable to load verification data.");

        }

    };

    useEffect(() => {

        loadSummary();

    }, [month, year]);

    const verifyMonth = async () => {

        try {

            await axios.post(
                "http://127.0.0.1:5000/warehouse-verification",
                {
                    month,
                    year,
                    manager_id: 1
                }
            );

            alert("Month Verified Successfully");

            loadSummary();

        } catch (err) {

            alert(
                err.response?.data?.message ||
                "Verification Failed"
            );

        }

    };

    return (

        <div className="verification-page">

            <div className="verification-card">

                <h1>Warehouse Verification</h1>

                <div className="selectors">

                    <div>

                        <label>Month</label>

                        <select
                            value={month}
                            onChange={(e) =>
                                setMonth(Number(e.target.value))
                            }
                        >

                            {months.map((m) => (

                                <option
                                    key={m.value}
                                    value={m.value}
                                >

                                    {m.name}

                                </option>

                            ))}

                        </select>

                    </div>

                    <div>

                        <label>Year</label>

                        <select
                            value={year}
                            onChange={(e) =>
                                setYear(Number(e.target.value))
                            }
                        >

                            {[2025, 2026, 2027, 2028].map((y) => (

                                <option
                                    key={y}
                                    value={y}
                                >

                                    {y}

                                </option>

                            ))}

                        </select>

                    </div>

                </div>

                {summary && (

                    <>

                        <div className="summary-box">

                            <p>

                                <strong>Total Unclaimed :</strong>

                                {summary.total_unclaimed}

                            </p>

                            <p>

                                <strong>Total Returned :</strong>

                                {summary.total_returned}

                            </p>

                            <p>

                                <strong>Difference :</strong>

                                {summary.difference}

                            </p>

                            <p>

                                <strong>Status :</strong>

                                <span className="status">

                                    {summary.status}

                                </span>

                            </p>

                        </div>

                        <button

                            className="verify-btn"

                            disabled={
                                summary.status !==
                                "READY FOR VERIFICATION"
                            }

                            onClick={verifyMonth}

                        >

                            Verify Month

                        </button>

                    </>

                )}

            </div>

        </div>

    );

}

export default WarehouseVerification;