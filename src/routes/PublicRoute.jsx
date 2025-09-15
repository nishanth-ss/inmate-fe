import { Navigate } from 'react-router-dom';

export default function PublicRoute({ children }) {
  const token = localStorage.getItem('authToken');

  const userRole = localStorage.getItem('role');

  const navigatePath = userRole === "ADMIN" ? "/dashboard" : userRole === "POS" ? "/tuck-shop-pos" : "/inmate-profile";

  if (token) {
    return <Navigate to={navigatePath} replace />;
  }

  return children;
}
