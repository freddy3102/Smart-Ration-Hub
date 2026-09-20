import { NavLink, useNavigate } from "react-router-dom";
import "../styles/BeneficiaryLayout.css";

function BeneficiaryLayout({ children }) {

    const navigate = useNavigate();

    const logout = () => {
        localStorage.removeItem("beneficiary_id");

        navigate("/beneficiary-login", {
            replace: true
        });
    };

    return (
        <div className="beneficiary-app">

            {/* ================================
                LEFT SIDEBAR
            ================================= */}

            <aside className="beneficiary-sidebar">

                <div className="beneficiary-brand">
                    <h2>BENEFICIARY PORTAL</h2>
                </div>

                <nav className="beneficiary-nav">

                    <NavLink
                        to="/beneficiary-dashboard"
                        className={({ isActive }) =>
                            `beneficiary-nav-link ${
                                isActive ? "active" : ""
                            }`
                        }
                    >
                        <span className="nav-icon">🏠</span>
                        <span>Dashboard</span>
                    </NavLink>

                    <NavLink
                        to="/beneficiary-stock"
                        className={({ isActive }) =>
                            `beneficiary-nav-link ${
                                isActive ? "active" : ""
                            }`
                        }
                    >
                        <span className="nav-icon">📦</span>
                        <span>Live Stock</span>
                    </NavLink>

                    <NavLink
                        to="/beneficiary-history"
                        className={({ isActive }) =>
                            `beneficiary-nav-link ${
                                isActive ? "active" : ""
                            }`
                        }
                    >
                        <span className="nav-icon">🗓️</span>
                        <span>Monthly History</span>
                    </NavLink>

                    <NavLink
                        to="/beneficiary-reports"
                        className={({ isActive }) =>
                            `beneficiary-nav-link ${
                                isActive ? "active" : ""
                            }`
                        }
                    >
                        <span className="nav-icon">📊</span>
                        <span>Reports</span>
                    </NavLink>

                </nav>

                <button
                    type="button"
                    className="beneficiary-logout"
                    onClick={logout}
                >
                    <span className="logout-icon">🚪</span>
                    <span>Logout</span>
                </button>

            </aside>


            {/* ================================
                MAIN CONTENT
            ================================= */}

            <main className="beneficiary-main">
                {children}
            </main>

        </div>
    );
}

export default BeneficiaryLayout;