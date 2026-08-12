import {
    NavLink,
    useLocation,
    useNavigate
} from "react-router-dom";

import "../styles/Layout.css";


function Layout({ children }) {

    const location = useLocation();

    const navigate = useNavigate();


    const menuItems = [

        {
            path: "/dashboard",
            icon: "📊",
            label: "Dashboard"
        },

        {
            path: "/beneficiaries",
            icon: "👥",
            label: "Beneficiaries"
        },

        {
            path: "/ration-items",
            icon: "🛒",
            label: "Ration Items"
        },

        {
            path: "/inventory",
            icon: "📦",
            label: "Inventory"
        },

        {
            path: "/distribution",
            icon: "🍚",
            label: "Distribution"
        },

        {
            path: "/distribution-cycle",
            icon: "📅",
            label: "Distribution Cycle"
        },

        {
            path: "/audit",
            icon: "📋",
            label: "Audit"
        },

        {
            path: "/reports",
            icon: "📈",
            label: "Reports"
        }

    ];


    // ---------------------------------
    // Admin Logout
    // ---------------------------------

    const logout = () => {

        sessionStorage.removeItem(
            "admin_authenticated"
        );

        sessionStorage.clear();


        navigate(
            "/admin-login",
            {
                replace: true
            }
        );

    };


    return (

        <div className="layout">


            {/* =================================
                SIDEBAR
            ================================= */}

            <aside className="sidebar">


                {/* Brand */}

                <div className="logo-section">

                    <div className="brand-icon">
                        🍚
                    </div>

                    <div className="brand-text">

                        <h1>
                            Smart Ration Hub
                        </h1>

                        <p>
                            Admin Panel
                        </p>

                    </div>

                </div>


                {/* Navigation */}

                <nav className="menu">

                    <div className="menu-label">
                        MAIN MENU
                    </div>


                    {menuItems.map(
                        (item) => (

                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    isActive
                                        ? "menu-link active"
                                        : "menu-link"
                                }
                            >

                                <span className="menu-icon">
                                    {item.icon}
                                </span>

                                <span className="menu-text">
                                    {item.label}
                                </span>

                                <span className="menu-arrow">
                                    →
                                </span>

                            </NavLink>

                        )
                    )}

                </nav>


                {/* Sidebar Bottom */}

                <div className="sidebar-bottom">

                    <div className="sidebar-divider" />


                    <div className="system-status">

                        <span className="status-dot" />

                        <div>

                            <strong>
                                System Active
                            </strong>

                            <small>
                                Smart Ration Hub
                            </small>

                        </div>

                    </div>


                    <button
                        type="button"
                        className="logout-link"
                        onClick={logout}
                    >

                        <span className="menu-icon">
                            🚪
                        </span>

                        <span>
                            Logout
                        </span>

                    </button>

                </div>

            </aside>


            {/* =================================
                MAIN CONTENT
            ================================= */}

            <main className="main-content">


                {/* Top Bar */}

                <header className="topbar">

                    <div className="breadcrumb">

                        <span>
                            Smart Ration Hub
                        </span>

                        <span className="breadcrumb-separator">
                            /
                        </span>

                        <strong>

                            {
                                menuItems.find(
                                    (item) =>
                                        location.pathname ===
                                        item.path
                                )?.label ||
                                "Dashboard"
                            }

                        </strong>

                    </div>

                </header>


                {/* Content */}

                <div className="content-area">

                    {children}

                </div>

            </main>

        </div>

    );

}


export default Layout;