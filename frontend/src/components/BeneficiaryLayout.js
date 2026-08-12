import {
    NavLink,
    useNavigate
} from "react-router-dom";

import "../styles/BeneficiaryLayout.css";


function BeneficiaryLayout({ children }) {

    const navigate = useNavigate();


    // ---------------------------------
    // Beneficiary Logout
    // ---------------------------------

    const logout = () => {

        localStorage.removeItem(
            "beneficiary_id"
        );

        localStorage.removeItem(
            "beneficiary_name"
        );

        sessionStorage.clear();


        navigate(
            "/beneficiary-login",
            {
                replace: true
            }
        );

    };


    return (

        <div className="beneficiary-app">


            {/* =================================
                SIDEBAR
            ================================= */}

            <aside className="beneficiary-sidebar">


                {/* Brand */}

                <div className="beneficiary-brand">

                    <h2>
                        Smart Ration Hub
                    </h2>

                    <p>
                        Beneficiary Portal
                    </p>

                </div>


                {/* Navigation */}

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


                {/* Logout */}

                <button
                    type="button"
                    className="beneficiary-logout"
                    onClick={logout}
                >
                    🚪 Logout
                </button>

            </aside>


            {/* =================================
                MAIN
            ================================= */}

            <main className="beneficiary-main">

                {children}

            </main>

        </div>

    );

}


export default BeneficiaryLayout;