import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import "../styles/DistributionCycle.css";

function DistributionCycle() {

    const [businessDate, setBusinessDate] =
        useState("");

    const [cycleStatus, setCycleStatus] =
        useState("");

    const [currentMonth, setCurrentMonth] =
        useState("");


    useEffect(() => {

        loadBusinessDate();
        loadCycleStatus();

    }, []);


    // ---------------------------------
    // Load Business Date
    // ---------------------------------

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

            setCurrentMonth(
                date.toLocaleString(
                    "default",
                    {
                        month: "long",
                        year: "numeric"
                    }
                )
            );

        } catch (err) {

            console.log(err);

        }

    };


    // ---------------------------------
    // Load Distribution Cycle Status
    // ---------------------------------

    const loadCycleStatus = async () => {

        try {

            const res = await axios.get(
                "http://127.0.0.1:5000/cycle-status"
            );

            setCycleStatus(
                res.data.status
            );

        } catch (err) {

            console.log(err);

        }

    };


    // ---------------------------------
    // Save Business Date
    // ---------------------------------

    const saveBusinessDate = async () => {

        try {

            await axios.put(
                "http://127.0.0.1:5000/business-date",
                {
                    business_date:
                        businessDate
                }
            );

            alert(
                "Business date updated successfully."
            );

            await loadBusinessDate();
            await loadCycleStatus();

        } catch (err) {

            alert(
                err.response?.data?.message ||
                "Unable to update business date."
            );

            await loadBusinessDate();
            await loadCycleStatus();

        }

    };


    // ---------------------------------
    // Close Distribution Cycle
    // ---------------------------------

    const closeMonth = async () => {

        const confirmClose =
            window.confirm(
                "Close the current distribution cycle?\n\n" +
                "This action will generate audit records " +
                "and lock further distributions for this month."
            );

        if (!confirmClose) {
            return;
        }


        try {

            const res = await axios.post(
                "http://127.0.0.1:5000/close-month"
            );

            alert(
                res.data.message
            );

            await loadBusinessDate();
            await loadCycleStatus();

        } catch (err) {

            alert(
                err.response?.data?.message ||
                "Unable to close distribution cycle."
            );

            await loadBusinessDate();
            await loadCycleStatus();

        }

    };


    return (

        <Layout>

            <div className="cycle-container">

                {/* ---------------------------------
                    Page Header
                --------------------------------- */}

                <h1>
                    Distribution Cycle
                </h1>

                <p className="cycle-subtitle">

                    Manage the business date and
                    control the monthly distribution
                    cycle before warehouse auditing.

                </p>


                {/* ---------------------------------
                    Business Date
                --------------------------------- */}

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
                        onClick={
                            saveBusinessDate
                        }
                    >

                        💾 Save Date

                    </button>

                </div>


                {/* ---------------------------------
                    Current Distribution Cycle
                --------------------------------- */}

                <div className="cycle-card">

                    <h2>
                        Current Distribution Cycle
                    </h2>


                    {/* Current Business Date */}

                    <p>
                        Current Business Date
                    </p>

                    <h3>
                        {businessDate}
                    </h3>


                    {/* Current Distribution Month */}

                    <p>
                        Current Distribution Month
                    </p>

                    <h3>
                        {currentMonth}
                    </h3>


                    {/* Cycle Status */}

                    <p className="status-title">
                        Cycle Status
                    </p>


                    <div className="status-row">

                        <div
                            className={
                                cycleStatus === "OPEN"
                                    ? "status-open"
                                    : "status-closed"
                            }
                        >
                            {cycleStatus}
                        </div>


                        <button
                            className="close-btn"
                            onClick={closeMonth}
                            disabled={
                                cycleStatus === "CLOSED"
                            }
                        >

                            {
                                cycleStatus === "CLOSED"
                                    ?
                                    "✔ Cycle Closed"
                                    :
                                    "📦 Close Distribution Cycle"
                            }

                        </button>

                    </div>


                    {/* Status Description */}

                    <p className="cycle-description">

                        {
                            cycleStatus === "OPEN"

                                ?

                                "Distribution is currently active. Beneficiaries can collect their entitled ration. Warehouse returns are disabled until the cycle is closed."

                                :

                                "Distribution cycle has been closed. Distribution is locked and warehouse return of unclaimed stock is now enabled."
                        }

                    </p>

                </div>

            </div>

        </Layout>

    );

}

export default DistributionCycle;