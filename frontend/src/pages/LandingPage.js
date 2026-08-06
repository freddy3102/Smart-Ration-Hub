import { useNavigate } from "react-router-dom";
import "../styles/LandingPage.css";

function LandingPage() {

    const navigate = useNavigate();

    return (
        <div className="landing-container">

            <div className="landing-card">

                <div className="logo">
                    🏛️
                </div>

                <h1>Smart Ration Hub</h1>

                <p className="description">
                    Digital Public Distribution Management System
                </p>

                <div className="portal-buttons">

                    <button
                        className="admin-btn"
                        onClick={() => navigate("/admin-login")}
                    >
                        👨‍💼 Admin Portal
                    </button>

                    <button
        className="warehouse-btn"
        onClick={() => navigate("/warehouse-login")}
    >
        📦 Warehouse Manager Portal
    </button>
                

                    <button
                        className="beneficiary-btn"
                        onClick={() => navigate("/beneficiary-login")}
                    >
                        👨‍👩‍👧 Beneficiary Portal
                    </button>

                </div>

            </div>

        </div>
    );
}

export default LandingPage;