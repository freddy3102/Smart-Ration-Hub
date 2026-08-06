import { Link, useLocation } from "react-router-dom";
import "../styles/Layout.css";

function Layout({ children }) {

    const location = useLocation();

    return (

        <div className="layout">

            <aside className="sidebar">

                <div className="logo-section">

                    <h2>🍚</h2>

                    <h1>Smart Ration Hub</h1>

                    <p>Admin Panel</p>

                </div>

                <hr />

                <nav className="menu">

                    <Link
                        to="/dashboard"
                        className={
                            location.pathname === "/dashboard"
                                ? "active"
                                : ""
                        }
                    >
                        📊 Dashboard
                    </Link>

                    <Link
                        to="/beneficiaries"
                        className={
                            location.pathname === "/beneficiaries"
                                ? "active"
                                : ""
                        }
                    >
                        👥 Beneficiaries
                    </Link>

                    <Link
                        to="/ration-items"
                        className={
                            location.pathname === "/ration-items"
                                ? "active"
                                : ""
                        }
                    >
                        🛒 Ration Items
                    </Link>

                    <Link
                        to="/inventory"
                        className={
                            location.pathname === "/inventory"
                                ? "active"
                                : ""
                        }
                    >
                        📦 Inventory
                    </Link>

                    <Link
                        to="/distribution"
                        className={
                            location.pathname === "/distribution"
                                ? "active"
                                : ""
                        }
                    >
                        🍚 Distribution
                    </Link>

                    {/* Distribution Cycle */}

                    <Link
                        to="/distribution-cycle"
                        className={
                            location.pathname === "/distribution-cycle"
                                ? "active"
                                : ""
                        }
                    >
                        📅 Distribution Cycle
                    </Link>

                    {/* Warehouse Audit */}

                    <Link
                        to="/audit"
                        className={
                            location.pathname === "/audit"
                                ? "active"
                                : ""
                        }
                    >
                        📋 Audit
                    </Link>

                    <Link

    to="/reports"

    className={

        location.pathname === "/reports"

        ?

        "active"

        :

        ""

    }

>

    📈 Reports

</Link>

                </nav>

                <div className="logout-section">

                    <Link to="/">
                        🚪 Logout
                    </Link>

                </div>

            </aside>

            <main className="main-content">

                {children}

            </main>

        </div>

    );

}

export default Layout;