import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import "../styles/Login.css";

function Login() {

    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const login = async () => {

        try {

            const res = await axios.post(
                "http://localhost:5000/login",
                {
                    username,
                    password
                }
            );

            sessionStorage.setItem(
                "admin_authenticated",
                "true"
            );

            navigate("/dashboard");

        } catch (err) {

            alert(
                err.response?.data?.message ||
                "Login Failed"
            );

        }

    };

    return (

        <div className="admin-login-page">

            {/* Background decorations */}

            <div className="admin-circle admin-circle-one"></div>
            <div className="admin-circle admin-circle-two"></div>
            <div className="admin-circle admin-circle-three"></div>
            <div className="admin-circle admin-circle-four"></div>


            {/* Top Bar */}

            <div className="admin-topbar">

                <button
                    className="admin-home-btn"
                    onClick={() => navigate("/")}
                >
                    <span className="admin-home-arrow">
                        ←
                    </span>

                    Back to Home
                </button>


                <div className="admin-brand">

                    <div className="admin-brand-icon">
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


                <div className="admin-top-right">

                    <span>People</span>

                    <span>|</span>

                    <span>Food Security</span>

                    <span>|</span>

                    <span>Better Tomorrow</span>

                    <span className="admin-leaf">
                        🌿
                    </span>

                </div>

            </div>


            {/* Left Message */}

            <div className="admin-message">

                <div className="admin-message-icon">
                    🌱
                </div>

                <h3>
                    Empowering
                    <br />
                    Administration
                </h3>

                <p>
                    Efficient management
                    <br />
                    for a stronger society.
                </p>

            </div>


            {/* Rice Visual */}

            <div className="admin-rice-visual">

                <div className="admin-rice-glow"></div>

                <div className="admin-rice-sack">

                    <div className="admin-rice-grains">

                        {Array.from(
                            { length: 35 },
                            (_, index) => (
                                <span key={index}></span>
                            )
                        )}

                    </div>

                </div>

                <div className="admin-rice-message">

                    Ration
                    <br />
                    for a better
                    <br />
                    tomorrow

                    <span className="admin-underline"></span>

                </div>

            </div>


            {/* Login Card */}

            <div className="admin-login-card">

                <div className="admin-user-icon">
                    🏛️
                </div>


                <h1>
                    Administrator Login
                </h1>

                <p className="admin-login-subtitle">
                    Access the system and manage distribution efficiently
                </p>


                {/* Username */}

                <div className="admin-input-wrapper">

                    <span className="admin-input-icon">
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

                <div className="admin-input-wrapper">

                    <span className="admin-input-icon">
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
                        className="admin-password-toggle"
                        onClick={() =>
                            setShowPassword(!showPassword)
                        }
                    >
                        {showPassword ? "◉" : "◌"}
                    </button>

                </div>


                {/* Login */}

                <button
                    className="admin-login-btn"
                    onClick={login}
                >

                    <span className="admin-login-arrow">
                        →
                    </span>

                    Login

                </button>


                {/* Footer */}

                <div className="admin-login-footer">

                    Digital Public Distribution Management System

                </div>

            </div>


            {/* Bottom Features */}

            <div className="admin-bottom">

                <div className="admin-bottom-item">

                    <span className="admin-bottom-icon">
                        👥
                    </span>

                    Transparent Distribution

                </div>


                <span className="admin-bottom-divider">
                    |
                </span>


                <div className="admin-bottom-item">

                    <span className="admin-bottom-icon">
                        🛡️
                    </span>

                    People's Right

                </div>


                <span className="admin-bottom-divider">
                    |
                </span>


                <div className="admin-bottom-item">

                    <span className="admin-bottom-icon">
                        🌿
                    </span>

                    Our Commitment

                </div>

            </div>

        </div>

    );

}

export default Login;