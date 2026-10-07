import { Link } from 'react-router'
import useAuth from '../../hooks/useAuth'

const LoginButton = () => {
    const { auth } = useAuth()

    const targetUrl = auth?.accessToken
        ? (auth.role === 'Admin' ? '/admin/dashboard' : auth.role === 'Doctor' ? '/doctor/dashboard' : '/patient/dashboard')
        : '/login'

    return (
        <Link
            to={targetUrl}
            className="login-btn inline-flex items-center cursor-pointer bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs sm:text-sm px-4 sm:px-5 py-2.5 rounded-xl shadow-xs hover:shadow transition-all"
        >
            {auth?.accessToken ? 'Portal Dashboard' : 'Patient Portal/Login'}
        </Link>
    )
}

export default LoginButton