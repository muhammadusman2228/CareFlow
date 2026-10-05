import { useEffect } from 'react'
import { axiosPrivate } from '../api/axios'
import useAuth from './useAuth'

const useAxiosPrivate = () => {
    const { auth, setAuth } = useAuth()

    useEffect(() => {
        const requestIntercept = axiosPrivate.interceptors.request.use(
            config => {
                if (!config.headers['Authorization']) {
                    config.headers['Authorization'] = `Bearer ${auth?.accessToken}`
                }
                return config
            },
            error => Promise.reject(error)
        )

        const responseIntercept = axiosPrivate.interceptors.response.use(
            response => response,
            async error => {
                const prevRequest = error?.config
                if (error?.response?.status === 401 && !prevRequest?.sent) {
                    prevRequest.sent = true
                    try {
                        const refreshResponse = await axiosPrivate.post('/auth/refresh-token')
                        const newAccessToken = refreshResponse.data.accessToken

                        setAuth(prev => ({
                            ...prev,
                            role: refreshResponse.data?.role || prev?.role,
                            accessToken: newAccessToken
                        }))

                        prevRequest.headers['Authorization'] = `Bearer ${newAccessToken}`
                        return axiosPrivate(prevRequest)
                    } catch (refreshError) {
                        return Promise.reject(refreshError)
                    }
                }
                return Promise.reject(error)
            }
        )

        return () => {
            axiosPrivate.interceptors.request.eject(requestIntercept)
            axiosPrivate.interceptors.response.eject(responseIntercept)
        }
    }, [auth, setAuth])

    return axiosPrivate
}

export default useAxiosPrivate