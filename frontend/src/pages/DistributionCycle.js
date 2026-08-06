import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import "../styles/DistributionCycle.css";

function DistributionCycle() {

    const [businessDate, setBusinessDate] = useState("");
    const [cycleStatus, setCycleStatus] = useState("");
    const [currentMonth, setCurrentMonth] = useState("");

    useEffect(() => {

        loadBusinessDate();
        loadCycleStatus();

    }, []);

    // -----------------------------
    // Load Business Date
    // -----------------------------

    const loadBusinessDate = () => {

        axios
            .get("http://127.0.0.1:5000/business-date")
            .then((res) => {

                setBusinessDate(
                    res.data.business_date
                );

                const date = new Date(
                    res.data.business_date
                );

                setCurrentMonth(

                    date.toLocaleString(

                        "default",

                        {

                            month: "long",

                            year: "numeric"

                        }

                    )

                );

            })
            .catch((err) => {

                console.log(err);

            });

    };

    // -----------------------------
    // Load Distribution Cycle Status
    // -----------------------------

    const loadCycleStatus = () => {

        axios
            .get("http://127.0.0.1:5000/cycle-status")
            .then((res) => {

                setCycleStatus(
                    res.data.status
                );

            })
            .catch((err) => {

                console.log(err);

            });

    };

    // -----------------------------
    // Save Business Date
    // -----------------------------

    const saveBusinessDate = async () => {

        try {

            await axios.put(

                "http://127.0.0.1:5000/business-date",

                {

                    business_date: businessDate

                }

            );

            alert(
                "Business date updated successfully."
            );

            loadBusinessDate();
            loadCycleStatus();

        }

        catch (err) {

    alert(

        err.response?.data?.message ||

        "Unable to update business date."

    );

    // Reload the actual saved business date
    loadBusinessDate();

    // Reload cycle status
    loadCycleStatus();

}

    };

    // -----------------------------
    // Close Distribution Cycle
    // -----------------------------

    const closeMonth = async () => {

        const confirmClose = window.confirm(

            "Close the current distribution cycle?\n\nThis action will generate audit records and lock further distributions for this month."

        );

        if (!confirmClose) return;

        try {

            const res = await axios.post(

                "http://127.0.0.1:5000/close-month"

            );

            alert(res.data.message);

            loadBusinessDate();
            loadCycleStatus();

        }

        catch (err) {

    alert(

        err.response?.data?.message ||

        "Unable to update business date."

    );

    // Reload the saved business date
    loadBusinessDate();

}
    };

        return (

        <Layout>

            <div className="cycle-container">

                <h1>

                    Distribution Cycle

                </h1>

                <p className="cycle-subtitle">

                    Manage the business date and control the monthly
                    distribution cycle before warehouse auditing.

                </p>

                {/* Business Date */}

                <div className="cycle-card">

                    <h2>

                        Business Date

                    </h2>

                    <input

                        type="date"

                        value={businessDate}

                        onChange={(e) =>

                            setBusinessDate(

                                e.target.value

                            )

                        }

                    />

                    <button

                        className="save-btn"

                        onClick={saveBusinessDate}

                    >

                        💾 Save Date

                    </button>

                </div>

                {/* Cycle Status */}

                <div className="cycle-card">

                    <h2>

                        Current Distribution Cycle

                    </h2>

                    <p>

                        Current Business Date

                    </p>

                    <h3>

                        {businessDate}

                    </h3>

                    <p>

                        Current Distribution Month

                    </p>

                    <h3>

                        {currentMonth}

                    </h3>

                    <p className="status-title">

                        Cycle Status

                    </p>

                    <div

                        className={

                            cycleStatus === "OPEN"

                                ? "status-open"

                                : "status-closed"

                        }

                    >

                        {cycleStatus}

                    </div>

                    <p
                        style={{
                            marginTop: "15px",
                            color: "#64748b",
                            fontSize: "15px",
                            lineHeight: "1.6"
                        }}
                    >

                        {

                            cycleStatus === "OPEN"

                                ?

                                "Distribution is currently active. Beneficiaries can collect their entitled ration. Warehouse returns are disabled until the cycle is closed."

                                :

                                "Distribution cycle has been closed. Distribution is locked and warehouse return of unclaimed stock is now enabled."

                        }

                    </p>

                    <button

                        className="close-btn"

                        onClick={closeMonth}

                        disabled={cycleStatus === "CLOSED"}

                    >

                        {

                            cycleStatus === "CLOSED"

                                ?

                                "✔ Distribution Cycle Closed"

                                :

                                "📦 Close Distribution Cycle"

                        }

                    </button>

                </div>

            </div>

        </Layout>

    );

}

export default DistributionCycle;