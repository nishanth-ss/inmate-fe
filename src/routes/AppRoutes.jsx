import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import PublicRoute from './PublicRoute';
import ProtectedRoute from './ProtectedRoute';

import FinancialManagement from '../pages/FinancialManagement/FinancialManagement';
import InMateManageMent from '../pages/InMateManageMent/InMateManageMent';
import DashBoard from '../pages/DashBoard/DashBoard';
import TuckShopPos from '../pages/TuckShopPos/TuckShopPos';
import Reports from '../pages/Reports/Reports';
import MainSection from '../pages/MainSection';
import AuditTrails from '../pages/AuditTrails/AuditTrails';
import TransactionHistory from '../pages/TransactionHistory/TransactionHistory';
import UserManagement from '../pages/UserManagement/UserManagement';
import BulkOperations from '../pages/BulkOperations/BulkOperations';
import Department from '../pages/Department/Department';
import InmateProfile from '../pages/InMateManageMent/InmateProfile';
import InmateTransaction from '../pages/InMateManageMent/InmateTransaction';
import Inventory from '../pages/Inventory/inventory';
import RayzorPayPayment from '../pages/RayzorPayPayment';

export default function AppRoutes() {

    return (
        <Routes>
            {/* Public routes */}
            <Route path="/" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

            {/* Admin routes */}
            <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
                <Route element={<MainSection />}>
                    <Route path="/dashboard" element={<DashBoard />} />
                    <Route path="/inmate-management" element={<InMateManageMent />} />
                    <Route path="/financial-management" element={<FinancialManagement />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/transaction-history" element={<TransactionHistory />} />
                    <Route path="/audit-trails" element={<AuditTrails />} />
                    <Route path="/user-management" element={<UserManagement />} />
                    <Route path="/bulk-operations" element={<BulkOperations />} />
                    <Route path="/department" element={<Department />} />
                    <Route path="/inventory" element={<Inventory />} />
                    <Route path="/rayzorpay-payment" element={<RayzorPayPayment />} />
                </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={[ "ADMIN","POS"]} />}>
                <Route element={<MainSection />}>
                    <Route path="/tuck-shop-pos" element={<TuckShopPos />} />
                </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={[ "INMATE"]} />}>
                <Route element={<MainSection />}>
                    <Route path="/inmate-profile" element={<InmateProfile />} />
                    <Route path="/inmate-transaction" element={<InmateTransaction />} />
                </Route>
            </Route>

            <Route path="*" element={<div className="p-4 text-center text-red-500">404 - Page Not Found</div>} />
        </Routes>
    );
}

