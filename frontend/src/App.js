import { Routes, Route } from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import BeneficiaryLogin from "./pages/BeneficiaryLogin";
import BeneficiaryDashboard from "./pages/BeneficiaryDashboard";
import Dashboard from "./pages/Dashboard";
import Beneficiaries from "./pages/Beneficiaries";
import RationItems from "./pages/RationItems";
import Inventory from "./pages/Inventory";
import Distribution from "./pages/Distribution";
import Audit from "./pages/Audit";
import DistributionCycle from "./pages/DistributionCycle";
import Reports from "./pages/Reports";
import WarehouseLogin from "./pages/WarehouseLogin";
import WarehouseDashboard from "./pages/WarehouseDashboard";
import WarehouseVerification from "./pages/WarehouseVerification";
import BeneficiaryStock from "./pages/BeneficiaryStock";
import BeneficiaryHistory from "./pages/BeneficiaryHistory";
import BeneficiaryReports from "./pages/BeneficiaryReports";

import "./App.css";

function App() {

    return (

        <Routes>

            {/* Landing Page */}

            <Route
                path="/"
                element={<LandingPage />}
            />

            {/* Admin Login */}

            <Route
                path="/admin-login"
                element={<Login />}
            />

            {/* Beneficiary Login */}

            <Route
                path="/beneficiary-login"
                element={<BeneficiaryLogin />}
            />

            {/* Beneficiary Dashboard */}

            <Route
                path="/beneficiary-dashboard"
                element={<BeneficiaryDashboard />}
            />

            {/* Admin Dashboard */}

            <Route
                path="/dashboard"
                element={<Dashboard />}
            />

            {/* Beneficiaries */}

            <Route
                path="/beneficiaries"
                element={<Beneficiaries />}
            />

            {/* Ration Items */}

            <Route
                path="/ration-items"
                element={<RationItems />}
            />

            {/* Inventory */}

            <Route
                path="/inventory"
                element={<Inventory />}
            />

            {/* Distribution */}

            <Route
                path="/distribution"
                element={<Distribution />}
            />

            {/* Warehouse Audit */}

            <Route
                path="/audit"
                element={<Audit />}
            />

            {/* Distribution Cycle */}

            <Route
                path="/distribution-cycle"
                element={<DistributionCycle />}
            />

            {/* Reports */}

            <Route
                path="/reports"
                element={<Reports />}
            />

            {/* Warehouse Login */}

            <Route
                path="/warehouse-login"
                element={<WarehouseLogin />}
            />

            {/* Warehouse Dashboard */}

            <Route
                path="/warehouse-dashboard"
                element={<WarehouseDashboard />}
            />

            {/* Warehouse Verification */}

            <Route
                path="/warehouse-verification"
                element={<WarehouseVerification />}
            />

            <Route
    path="/beneficiary-stock"
    element={<BeneficiaryStock />}
/>

<Route
    path="/beneficiary-history"
    element={<BeneficiaryHistory />}
/>

<Route
    path="/beneficiary-reports"
    element={<BeneficiaryReports />}
/>

        </Routes>

    );

}

export default App;