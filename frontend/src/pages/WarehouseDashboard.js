import { useNavigate } from "react-router-dom";

import "../styles/WarehouseDashboard.css";

function WarehouseDashboard() {

    const navigate = useNavigate();

    const manager = JSON.parse(
        localStorage.getItem(
            "warehouse_manager"
        )
    );

    const logout = () => {

        localStorage.removeItem(
            "warehouse_manager"
        );

        navigate("/");

    };

    return (

        <div className="warehouse-dashboard">

            <div className="warehouse-card">

                <h1>
                    Warehouse Manager Dashboard
                </h1>

                <h2>

                    Welcome

                    <br />

                    {manager?.full_name}

                </h2>

                {/* Warehouse Return Audit */}

                <div className="dashboard-box">

                    <h3>
                        Warehouse Return Audit
                    </h3>

                    <p>

                        View unclaimed ration stock
                        and record stock returned
                        by the ration shop.

                    </p>

                    <button
                        onClick={() =>
                            navigate("/audit")
                        }
                    >

                        Open Return Audit

                    </button>

                </div>

                {/* Verification */}

                <div className="dashboard-box">

                    <h3>
                        Verification Summary
                    </h3>

                    <p>

                        Verify monthly warehouse
                        returns after all unclaimed
                        stock has been returned.

                    </p>

                    <button
                        onClick={() =>
                            navigate(
                                "/warehouse-verification"
                            )
                        }
                    >

                        Open Verification

                    </button>

                </div>

                {/* Logout */}

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