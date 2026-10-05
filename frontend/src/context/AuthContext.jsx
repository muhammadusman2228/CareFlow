import { createContext, useState, useEffect } from "react";
import axios from "../api/axios";

export const AuthContext = createContext({})

const parseJwt = (token) => {
    try {
        const base64Url = token.split('.')[1]
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        return JSON.parse(window.atob(base64))
    } catch {
        return {}
    }
}

const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState({})
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const verifySession = async () => {
            try {
                const response = await axios.post('/auth/refresh-token')
                const token = response.data?.accessToken
                const claims = token ? parseJwt(token) : {}
                const rawRole = response.data?.role || claims["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || claims["role"] || "Patient"
                const role = typeof rawRole === 'string' ? rawRole.trim() : rawRole
                const name = response.data?.name || claims["http://schemas.microsoft.com/ws/2008/06/identity/claims/name"] || claims["name"] || "User"

                setAuth({
                    user: name,
                    role: role,
                    accessToken: token
                })
            } catch (err) {
                setAuth({})
            } finally {
                setLoading(false)
            }
        }

        verifySession()
    }, [])

    return (
        <AuthContext.Provider value={{ auth, setAuth }}>
            {!loading ? children : (
                <div className="h-screen w-full flex items-center justify-center bg-slate-50">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm font-semibold text-slate-600">Restoring clinical session...</span>
                    </div>
                </div>
            )}
        </AuthContext.Provider>
    )
}

export default AuthProvider
