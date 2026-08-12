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
import WarehouseAudit from "./pages/WarehouseAudit";
import WarehouseVerification from "./pages/WarehouseVerification";

import BeneficiaryStock from "./pages/BeneficiaryStock";
import BeneficiaryHistory from "./pages/BeneficiaryHistory";
import BeneficiaryReports from "./pages/BeneficiaryReports";

import ProtectedRoute from "./components/ProtectedRoute";

import "./App.css";


function App() {

    return (

        <Routes>

            {/* =================================
                PUBLIC PAGES
            ================================= */}

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

            {/* Warehouse Login */}

            <Route
                path="/warehouse-login"
                element={<WarehouseLogin />}
            />


            {/* =================================
                PROTECTED PAGES
            ================================= */}

            <Route element={<ProtectedRoute />}>


                {/* =================================
                    ADMIN MODULES
                ================================= */}

                <Route
                    path="/dashboard"
                    element={<Dashboard />}
                />

                <Route
                    path="/beneficiaries"
                    element={<Beneficiaries />}
                />

                <Route
                    path="/ration-items"
                    element={<RationItems />}
                />

                <Route
                    path="/inventory"
                    element={<Inventory />}
                />

                <Route
                    path="/distribution"
                    element={<Distribution />}
                />

                <Route
                    path="/audit"
                    element={<Audit />}
                />

                <Route
                    path="/distribution-cycle"
                    element={<DistributionCycle />}
                />

                <Route
                    path="/reports"
                    element={<Reports />}
                />


                {/* =================================
                    WAREHOUSE MODULES
                ================================= */}

                <Route
                    path="/warehouse-dashboard"
                    element={<WarehouseDashboard />}
                />

                <Route
                    path="/warehouse-audit"
                    element={<WarehouseAudit />}
                />

                <Route
                    path="/warehouse-verification"
                    element={<WarehouseVerification />}
                />


                {/* =================================
                    BENEFICIARY MODULES
                ================================= */}

                <Route
                    path="/beneficiary-dashboard"
                    element={<BeneficiaryDashboard />}
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

            </Route>

        </Routes>

    );

}


export default App;