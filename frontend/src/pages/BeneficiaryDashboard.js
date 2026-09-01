import { useEffect, useState } from "react";
import axios from "axios";
import "../styles/BeneficiaryDashboard.css";
import BeneficiaryLayout from "../components/BeneficiaryLayout";


function BeneficiaryDashboard() {

    const [data, setData] = useState(null);

    const beneficiary_id =
        localStorage.getItem("beneficiary_id");


    // =====================================
    // Month Names
    // =====================================

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


    // =====================================
    // Automatically use current month/year
    // =====================================

    const today = new Date();

    const [selectedMonth, setSelectedMonth] =
        useState(today.getMonth() + 1);

    const [selectedYear, setSelectedYear] =
        useState(today.getFullYear());


    // =====================================
    // Load Dashboard
    // =====================================

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


    // =====================================
    // Load Dashboard On Page Load
    // And When Period Changes
    // =====================================

    useEffect(() => {

        loadDashboard();

    }, [
        beneficiary_id,
        selectedMonth,
        selectedYear
    ]);


    // =====================================
    // Loading
    // =====================================

    if (!data) {

        return (

            <BeneficiaryLayout>

                <div className="loading">
                    Loading...
                </div>

            </BeneficiaryLayout>

        );

    }


    // =====================================
    // Selected Month Name
    // =====================================

    const selectedMonthName =
        months.find(
            (month) =>
                month.value === selectedMonth
        )?.name;


    // =====================================
    // Category Ribbon
    //
    // PHH = Pink
    // AAY = Yellow
    // NPS = Blue
    // NP  = White
    // =====================================

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


                {/* =================================
                    HERO / WELCOME
                ================================= */}

                <div className="beneficiary-hero">

                    <div className="hero-content">

                        <p className="hero-small-text">
                            Beneficiary Portal
                        </p>

                        <h1 className="dashboard-title">

                            Welcome back,

                            <span>
                                {data.beneficiary.full_name}
                            </span>

                            <span className="wave">
                                👋
                            </span>

                        </h1>

                        <p className="hero-description">

                            Here's an overview of your
                            ration information.

                        </p>

                    </div>


                    {/* =================================
                        CURRENT PERIOD
                    ================================= */}

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


                {/* =================================
                    CATEGORY CARD
                ================================= */}

                <div
                    className={
                        `beneficiary-category-card ${categoryRibbonClass}`
                    }
                >

                    {/* Colored category ribbon */}

                    <div className="category-ribbon"></div>


                    {/* Category Icon */}

                    <div className="category-icon">

                        🪪

                    </div>


                    {/* Category Details */}

                    <div className="category-details">

                        <span className="category-label">
                            Ration Card Category
                        </span>

                        <strong className="category-value">
                            {data.beneficiary.category_name}
                        </strong>

                    </div>


                    {/* Active Status */}

                    <div className="category-badge">
                        Active
                    </div>

                </div>


                {/* =================================
                    QUICK STATUS
                ================================= */}

                <div className="beneficiary-status-grid">


                    {/* =================================
                        FAMILY MEMBERS
                    ================================= */}

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


                    {/* =================================
                        DISTRIBUTION CYCLE
                    ================================= */}

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


                    {/* =================================
                        SELECTED PERIOD
                    ================================= */}

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


                {/* =================================
                    INFORMATION BANNER
                ================================= */}

                <div className="beneficiary-info-banner">

                    <div className="info-banner-icon">
                        ℹ
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