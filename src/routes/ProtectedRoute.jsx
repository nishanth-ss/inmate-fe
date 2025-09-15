import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoutes = ({ allowedRoles }) => {
    
  const userRole = localStorage.getItem('role')
    if (!userRole) {
        return <Navigate to="/login" replace />;
    }

    if (userRole && allowedRoles.includes(userRole)) {
        return <Outlet />
    }
}

export default ProtectedRoutes;