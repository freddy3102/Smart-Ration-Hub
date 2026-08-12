import { useNavigate } from "react-router-dom";

import "../styles/WarehouseDashboard.css";


function WarehouseDashboard() {

    const navigate = useNavigate();


    const manager = JSON.parse(
        localStorage.getItem(
            "warehouse_manager"
        )
    );


    // ---------------------------------
    // Logout
    // ---------------------------------

    const logout = () => {

        localStorage.removeItem(
            "warehouse_manager"
        );

        sessionStorage.clear();


        navigate(
            "/warehouse-login",
            {
                replace: true
            }
        );

    };


    return (

        <div className="warehouse-dashboard">

            <div className="warehouse-container">


                {/* =================================
                    HEADER
                ================================= */}

                <div className="warehouse-header">

                    <div>

                        <span className="warehouse-label">
                            SMART RATION HUB
                        </span>

                        <h1>
                            Warehouse Manager
                        </h1>

                        <p>
                            Manage warehouse returns and
                            monthly verification.
                        </p>

                    </div>


                    <div className="manager-profile">

                        <div className="manager-avatar">

                            {
                                manager?.full_name
                                    ?.charAt(0)
                                    ?.toUpperCase() ||
                                "W"
                            }

                        </div>


                        <div>

                            <span>
                                Welcome
                            </span>

                            <strong>
                                {
                                    manager?.full_name ||
                                    "Manager"
                                }
                            </strong>

                        </div>

                    </div>

                </div>


                {/* =================================
                    DASHBOARD CONTENT
                ================================= */}

                <div className="warehouse-content">


                    <div className="section-heading">

                        <h2>
                            Warehouse Operations
                        </h2>

                        <p>
                            Select an operation to continue.
                        </p>

                    </div>


                    {/* =================================
                        OPERATION CARDS
                    ================================= */}

                    <div className="warehouse-actions">


                        {/* =================================
                            RETURN AUDIT
                        ================================= */}

                        <div className="warehouse-action-card">

                            <div className="action-icon audit-icon">
                                📋
                            </div>


                            <div className="action-content">

                                <span className="action-number">
                                    01
                                </span>

                                <h3>
                                    Warehouse Return Audit
                                </h3>

                                <p>
                                    View unclaimed ration stock
                                    reported by ration shops and
                                    record the quantity returned
                                    to the warehouse.
                                </p>


                                <button
                                    className="action-btn"
                                    onClick={() =>
                                        navigate(
                                            "/warehouse-audit"
                                        )
                                    }
                                >

                                    Open Return Audit

                                    <span>
                                        →
                                    </span>

                                </button>

                            </div>

                        </div>


                        {/* =================================
                            VERIFICATION
                        ================================= */}

                        <div className="warehouse-action-card">

                            <div className="action-icon verification-icon">
                                ✓
                            </div>


                            <div className="action-content">

                                <span className="action-number">
                                    02
                                </span>

                                <h3>
                                    Warehouse Verification
                                </h3>

                                <p>
                                    Verify monthly warehouse
                                    returns after all unclaimed
                                    ration stock has been
                                    returned by the ration shop.
                                </p>


                                <button
                                    className="action-btn"
                                    onClick={() =>
                                        navigate(
                                            "/warehouse-verification"
                                        )
                                    }
                                >

                                    Open Verification

                                    <span>
                                        →
                                    </span>

                                </button>

                            </div>

                        </div>


                    </div>

                </div>


                {/* =================================
                    FOOTER
                ================================= */}

                <div className="warehouse-footer">

                    <div>

                        <span>
                            Warehouse Manager Portal
                        </span>

                        <small>
                            Smart Ration Hub
                        </small>

                    </div>


                    <button
                        type="button"
                        className="warehouse-logout"
                        onClick={logout}
                    >
                        Logout
                    </button>

                </div>


            </div>

        </div>

    );

}


export default WarehouseDashboard;