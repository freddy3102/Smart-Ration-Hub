import { NavLink, useNavigate } from "react-router-dom";
import "../styles/BeneficiaryLayout.css";

function BeneficiaryLayout({ children }) {

    const navigate = useNavigate();

    const logout = () => {

        localStorage.removeItem("beneficiary_id");

        navigate("/beneficiary-login");

    };

    return (

        <div className="beneficiary-app">

            {/* =================================
                SIDEBAR
            ================================= */}

            <aside className="beneficiary-sidebar">

                <div className="beneficiary-brand">

                    <h2>
                        Smart Ration Hub
                    </h2>

                    <p>
                        Beneficiary Portal
                    </p>

                </div>


                <nav className="beneficiary-nav">

                    <NavLink
                        to="/beneficiary-dashboard"
                        className={({ isActive }) =>
                            isActive
                                ? "beneficiary-nav-link active"
                                : "beneficiary-nav-link"
                        }
                    >
                        🏠 Dashboard
                    </NavLink>


                    <NavLink
                        to="/beneficiary-stock"
                        className={({ isActive }) =>
                            isActive
                                ? "beneficiary-nav-link active"
                                : "beneficiary-nav-link"
                        }
                    >
                        📦 Live Stock
                    </NavLink>


                    <NavLink
                        to="/beneficiary-history"
                        className={({ isActive }) =>
                            isActive
                                ? "beneficiary-nav-link active"
                                : "beneficiary-nav-link"
                        }
                    >
                        📅 Monthly History
                    </NavLink>


                    <NavLink
                        to="/beneficiary-reports"
                        className={({ isActive }) =>
                            isActive
                                ? "beneficiary-nav-link active"
                                : "beneficiary-nav-link"
                        }
                    >
                        📊 Reports
                    </NavLink>

                </nav>


                <button
                    className="beneficiary-logout"
                    onClick={logout}
                >
                    🚪 Logout
                </button>

            </aside>


            {/* =================================
                MAIN CONTENT
            ================================= */}

            <main className="beneficiary-main">

                {children}

            </main>

        </div>

    );

}

export default BeneficiaryLayout;