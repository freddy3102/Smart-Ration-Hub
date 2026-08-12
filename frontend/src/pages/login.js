import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import "../styles/Login.css";


function Login({ setLoggedIn }) {

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const navigate = useNavigate();


    const handleLogin = async () => {

        try {

            const response = await axios.post(
                "http://127.0.0.1:5000/login",
                {
                    username,
                    password
                }
            );


            if (
                response.data.message ===
                "Login successful"
            ) {

                if (setLoggedIn) {

                    setLoggedIn(true);

                }


                // ---------------------------------
                // Create Admin Session
                // ---------------------------------

                sessionStorage.setItem(
                    "admin_authenticated",
                    "true"
                );


                // ---------------------------------
                // Navigate to Dashboard
                // ---------------------------------

                navigate(
                    "/dashboard",
                    {
                        replace: true
                    }
                );

            }

            else {

                alert(
                    response.data.message
                );

            }

        }

        catch (error) {

            if (error.response) {

                alert(
                    error.response.data.message
                );

            }

            else {

                alert(
                    "Unable to connect to server"
                );

            }

        }

    };


    return (

        <div className="login-container">

            <div className="login-card">

                <h1>
                    🏛️ Smart Ration Hub
                </h1>

                <p>
                    Administrator Login
                </p>


                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) =>
                        setUsername(
                            e.target.value
                        )
                    }
                />


                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) =>
                        setPassword(
                            e.target.value
                        )
                    }
                />


                <button
                    className="login-btn"
                    onClick={handleLogin}
                >
                    Login
                </button>


                <button
                    className="back-btn"
                    onClick={() =>
                        navigate("/")
                    }
                >
                    ← Back
                </button>

            </div>

        </div>

    );

}


export default Login;