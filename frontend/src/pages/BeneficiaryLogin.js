import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import "../styles/BeneficiaryLogin.css";

function BeneficiaryLogin() {

    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const login = async () => {

        try {

            const res = await axios.post(
                "http://localhost:5000/beneficiary-login",
                {
                    username,
                    password
                }
            );

            localStorage.setItem(
                "beneficiary_id",
                res.data.beneficiary.beneficiary_id
            );

            localStorage.setItem(
                "beneficiary_name",
                res.data.beneficiary.full_name
            );

            navigate("/beneficiary-dashboard");

        } catch (err) {

            alert(
                err.response?.data?.message ||
                "Login Failed"
            );

        }

    };

    return (

        <div className="beneficiary-login-page">

            {/* Background decorations */}

            <div className="beneficiary-login-circle beneficiary-login-circle-one"></div>
            <div className="beneficiary-login-circle beneficiary-login-circle-two"></div>
            <div className="beneficiary-login-circle beneficiary-login-circle-three"></div>
            <div className="beneficiary-login-circle beneficiary-login-circle-four"></div>


            {/* =====================================================
                TOP BAR
            ===================================================== */}

            <div className="beneficiary-login-topbar">

                <button
                    className="beneficiary-login-home-btn"
                    onClick={() => navigate("/")}
                >

                    <span className="beneficiary-login-home-arrow">
                        ←
                    </span>

                    Back to Home

                </button>


                {/* BRAND */}

                <div className="beneficiary-login-brand">

                    <div className="beneficiary-login-brand-icon">
                        🏛️
                    </div>

                    <div className="beneficiary-login-brand-text">

                        <h2>
                            Smart Ration Hub
                        </h2>

                        <p>
                            Digital Public Distribution Management System
                        </p>

                    </div>

                </div>


                {/* TOP RIGHT */}

                <div className="beneficiary-login-top-right">

                    <span>People</span>

                    <span>|</span>

                    <span>Food Security</span>

                    <span>|</span>

                    <span>Better Tomorrow</span>

                    <span className="beneficiary-login-leaf">
                        🌿
                    </span>

                </div>

            </div>


            {/* =====================================================
                LEFT MESSAGE
            ===================================================== */}

            <div className="beneficiary-login-message">

                <div className="beneficiary-login-message-icon">
                    🌱
                </div>

                <h3>
                    Nourishing
                    <br />
                    Communities
                </h3>

                <p>
                    Ensuring food security
                    <br />
                    for a brighter tomorrow.
                </p>

            </div>


            {/* =====================================================
                RICE VISUAL
            ===================================================== */}

            <div className="beneficiary-login-rice-visual">

                <div className="beneficiary-login-rice-glow"></div>

                <div className="beneficiary-login-rice-sack">

                    <div className="beneficiary-login-rice-grains">

                        {Array.from(
                            { length: 35 },
                            (_, index) => (
                                <span key={index}></span>
                            )
                        )}

                    </div>

                </div>

                <div className="beneficiary-login-rice-message">

                    Ration
                    <br />
                    for a better
                    <br />
                    tomorrow

                    <span className="beneficiary-login-underline"></span>

                </div>

            </div>


            {/* =====================================================
                LOGIN CARD
            ===================================================== */}

            <div className="beneficiary-login-card">

                <div className="beneficiary-login-user-icon">
                    👥
                </div>


                <h1>
                    Beneficiary Login
                </h1>

                <p className="beneficiary-login-subtitle">
                    Access your ration details and distribution history
                </p>


                {/* Username */}

                <div className="beneficiary-login-input-wrapper">

                    <span className="beneficiary-login-input-icon">
                        👤
                    </span>

                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) =>
                            setUsername(e.target.value)
                        }
                    />

                </div>


                {/* Password */}

                <div className="beneficiary-login-input-wrapper">

                    <span className="beneficiary-login-input-icon">
                        🔒
                    </span>

                    <input
                        type={
                            showPassword
                                ? "text"
                                : "password"
                        }
                        placeholder="Password"
                        value={password}
                        onChange={(e) =>
                            setPassword(e.target.value)
                        }
                    />

                    <button
                        type="button"
                        className="beneficiary-login-password-toggle"
                        onClick={() =>
                            setShowPassword(!showPassword)
                        }
                    >

                        {showPassword ? "◉" : "◌"}

                    </button>

                </div>


                {/* Login */}

                <button
                    className="beneficiary-login-btn"
                    onClick={login}
                >

                    <span className="beneficiary-login-arrow">
                        →
                    </span>

                    Login

                </button>


                {/* Footer */}

                <div className="beneficiary-login-footer">

                    Unclaimed Entitlement Tracking System

                </div>

            </div>


            {/* =====================================================
                BOTTOM FEATURES
            ===================================================== */}

            <div className="beneficiary-login-bottom">

                <div className="beneficiary-login-bottom-item">

                    <span className="beneficiary-login-bottom-icon">
                        👥
                    </span>

                    Transparent Distribution

                </div>


                <span className="beneficiary-login-bottom-divider">
                    |
                </span>


                <div className="beneficiary-login-bottom-item">

                    <span className="beneficiary-login-bottom-icon">
                        🛡️
                    </span>

                    People's Right

                </div>


                <span className="beneficiary-login-bottom-divider">
                    |
                </span>


                <div className="beneficiary-login-bottom-item">

                    <span className="beneficiary-login-bottom-icon">
                        🌿
                    </span>

                    Our Commitment

                </div>

            </div>

        </div>

    );

}

export default BeneficiaryLogin;