import { Navigate, Outlet } from 'react-router'
import useAuth from '../hooks/useAuth'

const GuestRoute = () => {
    const { auth } = useAuth()

    if (auth?.accessToken) {
        const role = auth?.role?.trim().toLowerCase()
        const destination = role === 'doctor' 
            ? '/doctor/dashboard' 
            : role === 'admin' 
            ? '/admin/dashboard' 
            : '/patient/dashboard'

        return <Navigate to={destination} replace />
    }

    return <Outlet />
}

export default GuestRoute
