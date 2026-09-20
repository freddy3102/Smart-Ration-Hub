import { useEffect, useState } from "react";
import axios from "axios";
import "../styles/BeneficiaryDashboard.css";
import BeneficiaryLayout from "../components/BeneficiaryLayout";

function BeneficiaryDashboard() {

    const [data, setData] = useState(null);

    const beneficiary_id =
        localStorage.getItem("beneficiary_id");

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

    const today = new Date();

    const [selectedMonth, setSelectedMonth] =
        useState(today.getMonth() + 1);

    const [selectedYear, setSelectedYear] =
        useState(today.getFullYear());

    const loadDashboard = () => {

        if (!beneficiary_id) {
            console.log("Beneficiary ID not found.");
            return;
        }

        axios.get(
            "http://localhost:5000/beneficiary-dashboard",
            {
                params: {
                    beneficiary_id: beneficiary_id,
                    month: selectedMonth,
                    year: selectedYear
                }
            }
        )
        .then((res) => {
            setData(res.data);
        })
        .catch((err) => {
            console.log(
                "Unable to load beneficiary dashboard:",
                err
            );
        });
    };

    useEffect(() => {
        loadDashboard();
    }, [
        beneficiary_id,
        selectedMonth,
        selectedYear
    ]);

    if (!data) {

        return (
            <BeneficiaryLayout>
                <div className="loading">
                    Loading...
                </div>
            </BeneficiaryLayout>
        );

    }

    const selectedMonthName =
        months.find(
            (month) =>
                month.value === selectedMonth
        )?.name;

    const categoryName =
        (
            data.beneficiary.category_name || ""
        )
        .trim()
        .toUpperCase();

    let categoryRibbonClass =
        "category-ribbon-default";

    if (categoryName === "PHH") {
        categoryRibbonClass =
            "category-ribbon-phh";
    }
    else if (categoryName === "AAY") {
        categoryRibbonClass =
            "category-ribbon-aay";
    }
    else if (categoryName === "NPS") {
        categoryRibbonClass =
            "category-ribbon-nps";
    }
    else if (categoryName === "NP") {
        categoryRibbonClass =
            "category-ribbon-np";
    }

    return (

        <BeneficiaryLayout>

            <div className="beneficiary-dashboard">

                {/* =====================================
                    HERO
                ===================================== */}

                <div className="beneficiary-hero">

                    <div className="hero-content">

                        <p className="hero-small-text">
                            BENEFICIARY PORTAL
                        </p>

                        <h1 className="dashboard-title">
                            Welcome back,
                            <span>
                                {data.beneficiary.full_name}
                            </span>
                        </h1>

                        <span className="wave">
                            👋
                        </span>

                        <p className="hero-description">
                            Here's an overview of your ration information.
                        </p>

                    </div>

                    {/* Current Period */}

                    <div className="hero-date">

                        <span className="hero-date-icon">
                            📅
                        </span>

                        <div>

                            <small>
                                Current Period
                            </small>

                            <strong>
                                {selectedMonthName} {selectedYear}
                            </strong>

                        </div>

                    </div>

                </div>


                {/* =====================================
                    CATEGORY CARD
                ===================================== */}

                <div
                    className={
                        `beneficiary-category-card ${categoryRibbonClass}`
                    }
                >

                    <div className="category-ribbon"></div>

                    <div className="category-icon">
                        🪪
                    </div>

                    <div className="category-details">

                        <span className="category-label">
                            Ration Card Category
                        </span>

                        <strong className="category-value">
                            {data.beneficiary.category_name}
                        </strong>

                    </div>

                    <div className="category-badge">
                        Active
                    </div>

                </div>


                {/* =====================================
                    STATUS CARDS
                ===================================== */}

                <div className="beneficiary-status-grid">

                    {/* Family Members */}

                    <div className="beneficiary-status-card">

                        <div className="status-card-icon blue">
                            👨‍👩‍👧
                        </div>

                        <div>

                            <span>
                                Family Members
                            </span>

                            <strong>
                                {data.beneficiary.family_members}
                            </strong>

                        </div>

                    </div>


                    {/* Distribution Cycle */}

                    <div className="beneficiary-status-card">

                        <div className="status-card-icon green">
                            📅
                        </div>

                        <div>

                            <span>
                                Distribution Cycle
                            </span>

                            <strong
                                className={
                                    data.distribution_cycle === "OPEN"
                                        ? "cycle-open"
                                        : "cycle-closed"
                                }
                            >
                                {data.distribution_cycle}
                            </strong>

                        </div>

                    </div>


                    {/* Selected Period */}

                    <div className="beneficiary-status-card">

                        <div className="status-card-icon yellow">
                            🗓️
                        </div>

                        <div>

                            <span>
                                Selected Period
                            </span>

                            <strong>
                                {selectedMonthName}
                            </strong>

                        </div>

                    </div>

                </div>


                {/* =====================================
                    INFORMATION
                ===================================== */}

                <div className="beneficiary-info-banner">

                    <div className="info-banner-icon">
                        i
                    </div>

                    <div>

                        <strong>
                            Important Information
                        </strong>

                        <p>
                            Please collect your ration within
                            the given distribution period.
                            You can check current stock from
                            the Live Stock section.
                        </p>

                    </div>

                </div>

            </div>

        </BeneficiaryLayout>
    );
}

export default BeneficiaryDashboard;