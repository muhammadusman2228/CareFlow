

import { Link, useNavigate, useLocation } from 'react-router'
import img from '../assets/verifyEmail.png'
import AppLogo from '../components/Home/AppLogo.Home'
import { useState } from 'react'
import axios from '../api/axios'
import { Eye, EyeOff } from 'lucide-react'

const ResetPassword=()=>{
    const location = useLocation()
    const initialForm = {
        email: location.state?.email || "",
        code: "",
        newPassword: ""
    }
    const [formData, setFormData] = useState(initialForm)
    const [loading, setLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const navigate = useNavigate()

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setErrorMsg("")
        try {
            await axios.post("/auth/reset-password", formData)
            navigate('/login')
        } catch (error) {
            if (!error?.response) {
                setErrorMsg("Maintenance is going on. Try again after some time")
            } else if (error?.response?.status === 400 || error?.response?.status === 401) {
                setErrorMsg(error.response?.data?.message || "Invalid or expired reset code")
            } else {
                setErrorMsg("Try again later")
            }
        } finally {
            setFormData(initialForm)
            setLoading(false)
        }
    }

    return(
<div className="parent grid grid-cols-1 lg:grid-cols-12 w-full h-screen bg-slate-50 overflow-hidden">
    <div className="pic hidden lg:flex lg:col-span-5 relative w-full h-full bg-slate-100 overflow-hidden items-center justify-center">
        <img className="w-full h-full object-cover object-center" src={img} alt="Reset Password Image" />
    </div>
   <div className="main col-span-1 lg:col-span-7 w-full h-full flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden">
     <div className="group relative w-full max-w-110 p-0.5 rounded-2xl overflow-hidden shadow-2xl shadow-slate-900/15 transition-all duration-300 ease-out hover:scale-[1.015] hover:-translate-y-1 hover:shadow-sky-500/20">
        <div className="absolute -inset-full bg-[conic-gradient(from_0deg,transparent_0_300deg,#38bdf8_360deg)] animate-[spin_4s_linear_infinite] opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="form relative w-full bg-white rounded-[14px] p-6 sm:p-8 flex flex-col gap-4 shadow-2xl shadow-slate-900/10">
            <div className="logo flex justify-center mb-1">
                <AppLogo/>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight text-center">
                Reset Password
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 text-center -mt-2 mb-2">
                Enter your code and choose a new password
            </p>
             {errorMsg && (
    <div className="w-full py-2 px-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs sm:text-sm font-medium text-center">
        {errorMsg}
    </div>
)}
            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 w-full">
                <div className="div flex flex-col gap-1.5 w-full">
                    <label htmlFor="email" className="text-xs sm:text-sm font-semibold text-slate-800">Email Address</label>
                    <input 
                        type="email" 
                        placeholder="Enter your email" 
                        id="email" 
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all placeholder:text-slate-400" 
                    />
                </div>
                <div className="div flex flex-col gap-1.5 w-full">
                    <label htmlFor="code" className="text-xs sm:text-sm font-semibold text-slate-800">Verification Code</label>
                    <input 
                        type="text" 
                        placeholder="6-digit reset code" 
                        id="code" 
                        name="code"
                        maxLength="6"
                        value={formData.code}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm tracking-widest text-center font-semibold focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all placeholder:tracking-normal placeholder:font-normal placeholder:text-slate-400" 
                    />
                </div>
                 <div className="flex flex-col gap-1.5">
                    <label htmlFor="newPassword" className="text-sm font-semibold text-slate-800">
                       New Password
                    </label>
                    <div className="relative w-full">
                        <input 
                            value={formData.newPassword}
                            onChange={handleChange}
                            id="newPassword"
                            name="newPassword"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your new password"
                            className="w-full pl-3.5 pr-10 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all"
                        />
                        <button 
                            type="button" 
                            onClick={() => setShowPassword(prev => !prev)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                            {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                        </button>
                    </div>
                </div>
                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full mt-2 py-3 px-4 rounded-xl bg-linear-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white font-semibold text-sm shadow-md shadow-sky-600/20 hover:shadow-lg transition-all cursor-pointer"
                >
                    {loading ? "Resetting Password..." : "Reset Password"}
                </button>
            </form>
            <div className="flex justify-between items-center text-xs sm:text-sm text-slate-500 mt-2 pt-2 border-t border-slate-100">
                <span>Didn't receive code? <Link to="/forgotPassword" className="text-sky-600 font-semibold hover:underline">Resend</Link></span>
                <Link to="/login" className="text-sky-600 font-semibold hover:underline">Back to Login</Link>
            </div>
        </div>
     </div>
   </div>
</div>
    )
}

export default ResetPassword