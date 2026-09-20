import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import "../styles/WarehouseLogin.css";

function WarehouseLogin() {

    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async () => {

        try {

            const response = await axios.post(
                "http://127.0.0.1:5000/warehouse-login",
                {
                    username,
                    password
                }
            );

            alert(response.data.message);

            localStorage.setItem(
                "warehouse_manager",
                JSON.stringify(response.data)
            );

            navigate("/warehouse-dashboard");

        } catch (error) {

            if (error.response) {

                alert(error.response.data.message);

            } else {

                alert("Unable to connect to server.");

            }

        }

    };

    return (

        <div className="warehouse-login-page">

            {/* Background decorations */}

            <div className="warehouse-circle warehouse-circle-one"></div>

            <div className="warehouse-circle warehouse-circle-two"></div>


            {/* =================================================
                TOP BAR
            ================================================= */}

            <div className="warehouse-topbar">

                {/* Back button */}

                <button
                    className="warehouse-home-btn"
                    onClick={() => navigate("/")}
                >
                    <span className="warehouse-home-arrow">
                        ←
                    </span>

                    Back to Home
                </button>


                {/* Brand */}

                <div className="warehouse-brand">

                    <div className="warehouse-brand-icon">
                        🏛️
                    </div>

                    <div>

                        <h2>
                            Smart Ration Hub
                        </h2>

                        <p>
                            Digital Public Distribution Management System
                        </p>

                    </div>

                </div>


                {/* Right links */}

                <div className="warehouse-top-right">

                    <span>People</span>

                    <span>|</span>

                    <span>Food Security</span>

                    <span>|</span>

                    <span>Better Tomorrow</span>

                    <span className="warehouse-leaf">
                        🌿
                    </span>

                </div>

            </div>


            {/* =================================================
                LEFT MESSAGE
            ================================================= */}

            <div className="warehouse-message">

                <div className="warehouse-message-icon">
                    🌿
                </div>

                <h3>
                    Efficient<br />
                    Warehouse<br />
                    Operations
                </h3>

                <p>
                    Managing ration returns,
                    verification and stock
                    reconciliation for a
                    transparent distribution system.
                </p>

            </div>


            {/* =================================================
                LOGIN CARD
            ================================================= */}

            <div className="warehouse-login-card">

                {/* Icon */}

                <div className="warehouse-icon">

                    📦

                </div>


                {/* Heading */}

                <h1>
                    Warehouse Manager Login
                </h1>

                <p className="warehouse-login-subtitle">
                    Access warehouse operations and verification
                </p>


                {/* Username */}

                <div className="warehouse-input-wrapper">

                    <span className="warehouse-input-icon">
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

                <div className="warehouse-input-wrapper">

                    <span className="warehouse-input-icon">
                        🔒
                    </span>

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) =>
                            setPassword(e.target.value)
                        }
                    />

                    <button
                        type="button"
                        className="warehouse-password-toggle"
                        onClick={() => {}}
                    >
                        ○
                    </button>

                </div>


                {/* Login button */}

                <button
                    className="warehouse-login-btn"
                    onClick={handleLogin}
                >

                    <span className="warehouse-login-arrow">
                        →
                    </span>

                    Login

                </button>


                {/* Card footer */}

                <div className="warehouse-login-footer">

                    Digital Public Distribution Management System

                </div>

            </div>


            {/* =================================================
                BOTTOM FEATURES
            ================================================= */}

            <div className="warehouse-bottom">

                <div className="warehouse-bottom-item">

                    <span className="warehouse-bottom-icon">
                        📦
                    </span>

                    <span>
                        Warehouse Operations
                    </span>

                </div>


                <span className="warehouse-bottom-divider">
                    |
                </span>


                <div className="warehouse-bottom-item">

                    <span className="warehouse-bottom-icon">
                        🛡️
                    </span>

                    <span>
                        Verification
                    </span>

                </div>


                <span className="warehouse-bottom-divider">
                    |
                </span>


                <div className="warehouse-bottom-item">

                    <span className="warehouse-bottom-icon">
                        🔒
                    </span>

                    <span>
                        Secure Access
                    </span>

                </div>

            </div>

        </div>

    );

}

export default WarehouseLogin;