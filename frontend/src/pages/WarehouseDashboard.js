import { useNavigate } from "react-router-dom";

import "../styles/WarehouseDashboard.css";

function WarehouseDashboard() {

    const navigate = useNavigate();

    const manager = JSON.parse(
        localStorage.getItem("warehouse_manager")
    );

    const logout = () => {

        localStorage.removeItem("warehouse_manager");

        navigate("/");

    };

    return (

        <div className="warehouse-dashboard">

            <div className="warehouse-card">

                <h1>Warehouse Manager Dashboard</h1>

                <h2>

                    Welcome

                    <br />

                    {manager?.full_name}

                </h2>

                <div className="dashboard-box">

                    <h3>Verification Summary</h3>

                    <p>

                        Verify monthly warehouse returns after
                        shop owner submits them.

                    </p>

                    <button

                        onClick={() =>
                            navigate("/warehouse-verification")
                        }

                    >

                        Open Verification

                    </button>

                </div>

                <button

                    className="logout-btn"

                    onClick={logout}

                >

                    Logout

                </button>

            </div>

        </div>

    );

}

export default WarehouseDashboard;