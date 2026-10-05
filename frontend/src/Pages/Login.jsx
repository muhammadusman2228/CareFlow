
import { Link, useNavigate, useLocation } from 'react-router'
import LoginImage from '../assets/LoginImage.png'
import AppLogo from '../components/Home/AppLogo.Home'
import { EyeOff ,Eye} from 'lucide-react'
import { useState } from 'react'
import useAuth from '../hooks/useAuth'
import axios from '../api/axios'


const Login=()=>{
    const {setAuth}=useAuth()
    const navigate=useNavigate()
    const location = useLocation()
    const initialForm={
        email:"",
        password:""
    }
    const [formData,setFormData]=useState(initialForm)
    const [showPassword,setShowPassword]=useState(false)
    const [errorMsg,setErrorMsg]=useState("")
    const [loading,setLoading]=useState(false)
     const handleChange=(e)=>{
         const {name,value}=e.target
        setFormData(prev=>({...prev,[name]:value}))
     }
    const handleSubmit=async(e)=>{
        e.preventDefault()
        setErrorMsg("")
        setLoading(true)
        try{
 const response = await axios.post('/auth/login',formData)
 const {name,role,accessToken}=response.data

 setAuth({
    user:name,
    role:role,
    accessToken:accessToken
 })
 
 const userRole = role?.trim().toLowerCase()
 const from = location.state?.from?.pathname

 const isFromAllowed = from && (
     (userRole === 'admin' && from.startsWith('/admin')) ||
     (userRole === 'doctor' && from.startsWith('/doctor')) ||
     (userRole === 'patient' && from.startsWith('/patient'))
 )

 if (isFromAllowed) {
     navigate(from, { replace: true })
 } else if (userRole === 'admin') {
     navigate('/admin/dashboard', { replace: true })
 } else if (userRole === 'doctor') {
     navigate('/doctor/dashboard', { replace: true })
 } else {
     navigate('/patient/dashboard', { replace: true })
 }
        }
        catch(err){
           if(!err?.response){
            setErrorMsg("Try Again after someTime")
           }
           else if(err?.response?.status===401 || err?.response?.status===400)
           { setErrorMsg("Invalid Credentails. Please register with correct Credentials")}
           else{
             setErrorMsg("Try again later")
           }
        }

        finally{
            setLoading(false)
            setFormData(initialForm)
        }
        
       
    }
    return(
        <div className="div grid grid-cols-1 lg:grid-cols-12 h-screen w-full bg-slate-50 overflow-hidden">
            <div className="hidden lg:flex lg:relative col-span-6 justify-center items-center w-full h-full bg-slate-100 overflow-hidden">
                <img className="w-full h-full object-cover object-center" src={LoginImage} alt="CareFlow Clinical Portal" />
            </div>
            <div className="col-span-1 lg:col-span-6 w-full h-full flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden">
                <div className="group relative w-full max-w-110 p-0.5 rounded-2xl overflow-hidden transition-all duration-300 ease-out hover:scale-[1.015] hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-sky-500/15">
                    <div className="absolute -inset-full bg-[conic-gradient(from_0deg,transparent_0_300deg,#38bdf8_360deg)] animate-[spin_4s_linear_infinite] opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="loginCenter relative w-full bg-white rounded-[14px] p-6 sm:p-7 flex flex-col gap-4 sm:gap-5 shadow-xl shadow-slate-900/5">
                        <div className="logo flex justify-center mb-1">
                            <AppLogo/>
                        </div>
                        {errorMsg && (
    <div className="w-full py-2 px-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs sm:text-sm font-medium text-center">
        {errorMsg}
    </div>
)}

                        <form className="flex flex-col gap-3.5 sm:gap-4 w-full"
                        onSubmit={(e)=>handleSubmit(e)}>
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="email" className="text-sm font-semibold text-slate-800">
                                    Email Address
                                </label>
                                <input 
                                value={formData.email}
                                onChange={handleChange
                                }
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="Enter your email"
                                    className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="password" className="text-sm font-semibold text-slate-800">
                                    Password
                                </label>
                                <div className="relative w-full">
                                    <input 
                                    
                                    value={formData.password}
                                    onChange={handleChange}
                                        id="password"
                                        name="password"
                                        type={showPassword?"text":"password"}
                                        placeholder="Enter your password"
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
                            <div className="flex justify-end text-sm">
                                <Link to="/forgotPassword" className="font-medium text-sky-600 hover:text-sky-700 ">
                                    Forgot Password?
                                </Link>
                            </div>
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full mt-1 py-3 px-4 rounded-xl bg-linear-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white font-semibold text-sm sm:text-base shadow-md shadow-sky-600/20 hover:shadow-lg hover:shadow-sky-600/30 transition-all cursor-pointer"
                            >
                               {loading?"Signing in..":" Sign In to CareFlow"}
                            </button>
                        </form>
                        <p className="text-center text-sm text-slate-600 mt-1">
                            New patient?{' '}
                            <Link to="/register" className="font-semibold text-sky-600 hover:text-sky-700 ">
                                Register your health profile here
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
export default Login