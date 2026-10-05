import { Navigate, Outlet, useLocation } from 'react-router'
import useAuth from '../hooks/useAuth'

const ProtectedRoute = ({ allowedRoles }) => {
    const { auth } = useAuth()
    const location = useLocation()

    if (!auth?.accessToken) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    const userRole = auth?.role?.trim().toLowerCase()
    const isAuthorized = !allowedRoles || allowedRoles.some(r => r.trim().toLowerCase() === userRole)

    if (!isAuthorized) {
        return <Navigate to="/" replace />
    }

    return <Outlet />
}

export default ProtectedRoute