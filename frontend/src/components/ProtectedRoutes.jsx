import { Navigate, Outlet, useLocation } from 'react-router'
import useAuth from '../hooks/useAuth'

const getDedicatedPortal = (role) => {
    const normalized = (role || '').trim().toLowerCase()
    if (normalized === 'admin' || normalized === 'superadmin') return '/admin/dashboard'
    if (normalized === 'doctor') return '/doctor/dashboard'
    if (normalized === 'assistant') return '/assistant/dashboard'
    if (normalized === 'cashier') return '/cashier/dashboard'
    return '/patient/dashboard'
}

const ProtectedRoute = ({ allowedRoles }) => {
    const { auth } = useAuth()
    const location = useLocation()

    if (!auth?.accessToken) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    const userRole = auth?.role?.trim().toLowerCase()
    const isAuthorized = !allowedRoles || allowedRoles.some(r => {
        const normalized = r.trim().toLowerCase()
        return normalized === userRole || (userRole === 'superadmin' && normalized === 'admin')
    })

    if (!isAuthorized) {
        return <Navigate to={getDedicatedPortal(userRole)} replace />
    }

    return <Outlet />
}

export default ProtectedRoute
