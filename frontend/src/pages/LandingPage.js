import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/LandingPage.css";

function LandingPage() {

    const navigate = useNavigate();

    const [portal, setPortal] = useState("admin");

    const portalDetails = {
        admin: {
            title: "Admin Portal",
            description:
                "Manage beneficiaries, ration items, inventory, distribution, audits and reports.",
            icon: "👨‍💼",
            color: "blue"
        },

        warehouse: {
            title: "Warehouse Manager Portal",
            description:
                "Manage warehouse returns, stock verification and monthly reconciliation.",
            icon: "📦",
            color: "orange"
        },

        beneficiary: {
            title: "Beneficiary Portal",
            description:
                "View entitlement, available ration stock and personal distribution history.",
            icon: "👨‍👩‍👧",
            color: "green"
        }
    };

    const handleLogin = () => {

        if (portal === "admin") {
            navigate("/admin-login");
        }

        else if (portal === "warehouse") {
            navigate("/warehouse-login");
        }

        else if (portal === "beneficiary") {
            navigate("/beneficiary-login");
        }

    };

    const selectedPortal = portalDetails[portal];

    return (

        <div className="landing-page">

            {/* ================= LEFT PANEL ================= */}

            <section className="landing-left">

                <div className="landing-overlay"></div>

                <div className="landing-left-content">

                    {/* Brand */}

                    <div className="landing-brand">

                        <div className="brand-icon">
                            🏛️
                        </div>

                        <div>
                            <h2>Smart Ration Hub</h2>

                            <p>
                                Digital Public Distribution
                                Management System
                            </p>
                        </div>

                    </div>


                    {/* Main heading */}

                    <div className="landing-intro">

                        <span className="landing-tag">
                            FAIR DISTRIBUTION • STRONGER COMMUNITIES
                        </span>

                        <h1>
                            Smart Ration
                            <span> Hub</span>
                        </h1>

                        <h3>
                            Digitising Public Distribution
                            for a Transparent Tomorrow
                        </h3>

                        <p>
                            A transparent and efficient digital system
                            for managing ration distribution, inventory,
                            beneficiary services and warehouse operations.
                        </p>

                    </div>


                    {/* Features */}

                    <div className="landing-features">

                        <div className="feature-item">

                            <div className="feature-icon blue">
                                👥
                            </div>

                            <div>
                                <h4>Beneficiary Management</h4>

                                <p>
                                    Secure and organised beneficiary
                                    record management
                                </p>
                            </div>

                        </div>


                        <div className="feature-item">

                            <div className="feature-icon orange">
                                📋
                            </div>

                            <div>
                                <h4>Transparent Distribution</h4>

                                <p>
                                    Entitlement-based ration allocation
                                    and tracking
                                </p>
                            </div>

                        </div>


                        <div className="feature-item">

                            <div className="feature-icon cyan">
                                📦
                            </div>

                            <div>
                                <h4>Inventory Tracking</h4>

                                <p>
                                    Monitor ration stock and
                                    distribution activity
                                </p>
                            </div>

                        </div>


                        <div className="feature-item">

                            <div className="feature-icon purple">
                                📊
                            </div>

                            <div>
                                <h4>Audit & Reporting</h4>

                                <p>
                                    Improve accountability through
                                    digital records
                                </p>
                            </div>

                        </div>

                    </div>


                    {/* Quote */}

                    <div className="landing-quote">

                        <p>
                            "Technology-driven distribution
                            for a more transparent ration system."
                        </p>

                        <span>
                            — Smart Ration Hub
                        </span>

                    </div>

                </div>

            </section>


            {/* ================= RIGHT PANEL ================= */}

            <section className="landing-right">

                <div className="top-message">
                    <span>Food Security</span>
                    <span>•</span>
                    <span>Transparency</span>
                    <span>•</span>
                    <span>Better Tomorrow</span>
                    <span className="leaf">🌿</span>
                </div>


                <div className="login-card">

                    {/* Login icon */}

                    <div className="login-icon">
                        🔐
                    </div>


                    <h2>
                        Welcome
                    </h2>

                    <p className="login-subtitle">
                        Select your portal to continue
                    </p>


                    {/* Portal selection */}

                    <div className="portal-form">

                        <label>
                            Select Portal
                        </label>

                        <div className="select-wrapper">

                            <select
                                value={portal}
                                onChange={(e) =>
                                    setPortal(e.target.value)
                                }
                            >

                                <option value="admin">
                                    👨‍💼  Admin Portal
                                </option>

                                <option value="warehouse">
                                    📦  Warehouse Manager Portal
                                </option>

                                <option value="beneficiary">
                                    👨‍👩‍👧  Beneficiary Portal
                                </option>

                            </select>

                        </div>


                        {/* Selected portal information */}

                        <div
                            className={`selected-portal ${selectedPortal.color}`}
                        >

                            <div className="selected-icon">
                                {selectedPortal.icon}
                            </div>

                            <div>

                                <strong>
                                    {selectedPortal.title}
                                </strong>

                                <p>
                                    {selectedPortal.description}
                                </p>

                            </div>

                        </div>


                        {/* Login button */}

                        <button
                            className={`landing-login-btn ${selectedPortal.color}`}
                            onClick={handleLogin}
                        >

                            <span>→</span>

                            Continue to Login

                        </button>

                    </div>


                    {/* Portal information */}

                    <div className="login-info">

                        <div>
                            <span className="info-dot blue-dot"></span>
                            Admin
                        </div>

                        <div>
                            <span className="info-dot orange-dot"></span>
                            Warehouse
                        </div>

                        <div>
                            <span className="info-dot green-dot"></span>
                            Beneficiary
                        </div>

                    </div>


                    <div className="login-footer">

                        <span>
                            Public Distribution
                        </span>

                        <span>•</span>

                        <span>
                            People's Right
                        </span>

                        <span>•</span>

                        <span>
                            Our Commitment
                        </span>

                    </div>

                </div>

            </section>

        </div>

    );
}

export default LandingPage;