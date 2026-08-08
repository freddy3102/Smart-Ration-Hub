import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import "../styles/BeneficiaryLogin.css";

function BeneficiaryLogin() {

    const navigate = useNavigate();

    const [username,setUsername] = useState("");

    const [password,setPassword] = useState("");

    const login = async () => {

        try{

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

        }

        catch(err){

            alert(

                err.response?.data?.message ||

                "Login Failed"

            );

        }

    };

    return(

        <div className="beneficiary-login-page">

            <div className="beneficiary-login-card">

                <h1>

                    Beneficiary Login

                </h1>

                <input

                    type="text"

                    placeholder="Username"

                    value={username}

                    onChange={(e)=>setUsername(e.target.value)}

                />

                <input

                    type="password"

                    placeholder="Password"

                    value={password}

                    onChange={(e)=>setPassword(e.target.value)}

                />

                <button

                    className="beneficiary-login-btn"

                    onClick={login}

                >

                    Login

                </button>

                <div className="login-footer">

                    Unclaimed Entitlement Tracking System

                </div>

            </div>

        </div>

    );

}

export default BeneficiaryLogin;