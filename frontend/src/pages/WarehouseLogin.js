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

        }

        catch (error) {

            if (error.response) {

                alert(error.response.data.message);

            }

            else {

                alert("Unable to connect to server.");

            }

        }

    };

    return (

        <div className="warehouse-login-page">

            <div className="warehouse-login-card">

                <h1>Warehouse Manager Login</h1>

                <input

                    type="text"

                    placeholder="Username"

                    value={username}

                    onChange={(e) =>

                        setUsername(e.target.value)

                    }

                />

                <input

                    type="password"

                    placeholder="Password"

                    value={password}

                    onChange={(e) =>

                        setPassword(e.target.value)

                    }

                />

                <button

                    onClick={handleLogin}

                >

                    Login

                </button>

            </div>

        </div>

    );

}

export default WarehouseLogin;