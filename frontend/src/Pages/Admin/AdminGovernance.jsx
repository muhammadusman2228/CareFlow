import { useState, useEffect } from 'react'
import { 
    ShieldCheck, 
    UserPlus, 
    Search, 
    Mail, 
    Phone, 
    Lock, 
    KeyRound, 
    Loader2, 
    CheckCircle2, 
    AlertCircle, 
    X, 
    Eye, 
    EyeOff, 
    RefreshCw, 
    ShieldAlert, 
    Users, 
    Calendar,
    ArrowRight
} from 'lucide-react'
import useAxiosPrivate from '../../hooks/useAxiosPrivate'
import useAuth from '../../hooks/useAuth'
import Pagination from '../../components/common/Pagination'

const AdminGovernance = () => {
    const axiosPrivate = useAxiosPrivate()
    const { auth } = useAuth()
    const isSuperAdmin = auth?.role?.trim().toLowerCase() === 'superadmin'

    const [admins, setAdmins] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [page, setPage] = useState(1)
    const pageSize = 8

    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)
    const [isSubmittingRegister, setIsSubmittingRegister] = useState(false)
    const [registerError, setRegisterError] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    const initialRegisterForm = {
        name: '',
        email: '',
        password: '',
        phoneNumber: ''
    }
    const [registerForm, setRegisterForm] = useState(initialRegisterForm)

    const [isOtpModalOpen, setIsOtpModalOpen] = useState(false)
    const [otpEmail, setOtpEmail] = useState('')
    const [otpCode, setOtpCode] = useState('')
    const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
    const [otpError, setOtpError] = useState('')
    const [feedbackBanner, setFeedbackBanner] = useState({ type: '', message: '' })

    const fetchAdmins = async () => {
        setIsLoading(true)
        try {
            const response = await axiosPrivate.get('/Admin/admins-list')
            setAdmins(Array.isArray(response.data) ? response.data : [])
        } catch (err) {
            setAdmins([])
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (isSuperAdmin) {
            fetchAdmins()
        }
    }, [isSuperAdmin])

    useEffect(() => {
        setPage(1)
    }, [searchQuery])

    const handleRegisterSubmit = async (e) => {
        e.preventDefault()
        setRegisterError('')

        const trimmedName = registerForm.name.trim()
        if (!trimmedName || trimmedName.length < 2) {
            setRegisterError('Administrator name must be at least 2 characters.')
            return
        }

        const trimmedEmail = registerForm.email.trim()
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(trimmedEmail)) {
            setRegisterError('Please provide a valid official email address.')
            return
        }

        if (!registerForm.password || registerForm.password.length < 6) {
            setRegisterError('Password must contain at least 6 characters.')
            return
        }

        setIsSubmittingRegister(true)
        try {
            await axiosPrivate.post('/Admin/register-admin', {
                name: trimmedName,
                email: trimmedEmail,
                password: registerForm.password,
                phoneNumber: registerForm.phoneNumber.trim()
            })

            setIsRegisterModalOpen(false)
            setRegisterForm(initialRegisterForm)
            setOtpEmail(trimmedEmail)
            setOtpCode('')
            setOtpError('')
            setIsOtpModalOpen(true)
            setFeedbackBanner({
                type: 'success',
                message: `Admin registration submitted for ${trimmedEmail}. Enter the verification code sent to this email.`
            })
            await fetchAdmins()
        } catch (err) {
            const msg = err?.response?.data?.message || 'Failed to register administrator.'
            setRegisterError(msg)
        } finally {
            setIsSubmittingRegister(false)
        }
    }

    const handleVerifyOtpSubmit = async (e) => {
        e.preventDefault()
        setOtpError('')

        const cleanCode = otpCode.trim()
        if (!cleanCode || cleanCode.length !== 6) {
            setOtpError('Verification code must be exactly 6 digits.')
            return
        }

        setIsVerifyingOtp(true)
        try {
            const response = await axiosPrivate.post('/Admin/verify-admin-otp', {
                email: otpEmail,
                code: cleanCode
            })

            setIsOtpModalOpen(false)
            setOtpCode('')
            setFeedbackBanner({
                type: 'success',
                message: response.data?.message || 'Administrator verified successfully.'
            })
            await fetchAdmins()
        } catch (err) {
            const msg = err?.response?.data?.message || 'Invalid or expired verification code.'
            setOtpError(msg)
        } finally {
            setIsVerifyingOtp(false)
        }
    }

    const openVerifyModalForAdmin = (email) => {
        setOtpEmail(email)
        setOtpCode('')
        setOtpError('')
        setIsOtpModalOpen(true)
    }

    if (!isSuperAdmin) {
        return (
            <div className="max-w-4xl mx-auto py-12 px-4">
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
                        <ShieldAlert size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">SuperAdmin Clearance Required</h2>
                    <p className="text-slate-600 max-w-md">
                        The Administrator Governance module is restricted strictly to root SuperAdmin accounts. Standard administrators cannot provision or verify peer accounts.
                    </p>
                </div>
            </div>
        )
    }

    const filteredAdmins = admins.filter(a => {
        const query = searchQuery.trim().toLowerCase()
        if (!query) return true
        return (
            (a.name && a.name.toLowerCase().includes(query)) ||
            (a.email && a.email.toLowerCase().includes(query)) ||
            (a.role && a.role.toLowerCase().includes(query))
        )
    })

    const totalPages = Math.ceil(filteredAdmins.length / pageSize) || 1
    const paginatedAdmins = filteredAdmins.slice((page - 1) * pageSize, page * pageSize)

    const totalCount = admins.length
    const superAdminCount = admins.filter(a => a.role === 'SuperAdmin').length
    const verifiedAdminsCount = admins.filter(a => a.role === 'Admin' && a.isVerified).length
    const pendingAdminsCount = admins.filter(a => !a.isVerified).length

    if (!isSuperAdmin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 max-w-lg mx-auto text-center animate-in fade-in">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mb-4 shadow-xs">
                    <ShieldAlert size={32} />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
                <p className="text-sm text-slate-600 mt-2">
                    Admin Governance and administrative user provisioning is reserved exclusively for the SuperAdmin authority.
                </p>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                        <ShieldCheck size={22} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Admin Governance</h1>
                        <p className="text-sm text-slate-500 mt-0.5">
                            Provision, onboard, and verify authorized hospital administrators
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchAdmins}
                        disabled={isLoading}
                        className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                        title="Refresh List"
                    >
                        <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={() => {
                            setRegisterError('')
                            setRegisterForm(initialRegisterForm)
                            setIsRegisterModalOpen(true)
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors cursor-pointer"
                    >
                        <UserPlus size={16} />
                        <span>Register Administrator</span>
                    </button>
                </div>
            </div>

            {feedbackBanner.message && (
                <div className={`p-4 rounded-xl border flex items-center justify-between ${
                    feedbackBanner.type === 'success' 
                        ? 'bg-slate-50 border-slate-300 text-slate-900' 
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                    <div className="flex items-center gap-3">
                        {feedbackBanner.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                        <span className="text-sm font-medium">{feedbackBanner.message}</span>
                    </div>
                    <button
                        onClick={() => setFeedbackBanner({ type: '', message: '' })}
                        className="text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Accounts</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{totalCount}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                        <Users size={18} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">SuperAdmins</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{superAdminCount}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                        <ShieldCheck size={18} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Admins</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{verifiedAdminsCount}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                        <CheckCircle2 size={18} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pending OTP</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{pendingAdminsCount}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                        <AlertCircle size={18} />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search administrators by name or email..."
                            className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-slate-800 transition-colors"
                        />
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                        Showing {paginatedAdmins.length} of {filteredAdmins.length} administrators
                    </div>
                </div>

                <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse min-w-[950px]">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-600">
                                <th className="py-3.5 px-6">Administrator</th>
                                <th className="py-3.5 px-6">Assigned Role</th>
                                <th className="py-3.5 px-6">Verification Status</th>
                                <th className="py-3.5 px-6">Registered On</th>
                                <th className="py-3.5 px-6 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-slate-400">
                                        <Loader2 size={22} className="animate-spin mx-auto mb-2 text-slate-700" />
                                        Loading administrative accounts...
                                    </td>
                                </tr>
                            ) : paginatedAdmins.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-slate-500">
                                        No administrators found matching your search.
                                    </td>
                                </tr>
                            ) : (
                                paginatedAdmins.map((adm) => {
                                    return (
                                        <tr key={adm.id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-slate-900">{adm.name}</span>
                                                    <span className="text-xs text-slate-500">{adm.email}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-slate-800 text-sm font-medium">
                                                {adm.role}
                                            </td>
                                            <td className="py-4 px-6 text-slate-800 text-sm font-medium">
                                                {adm.isVerified ? 'Verified' : 'Pending OTP'}
                                            </td>
                                            <td className="py-4 px-6 text-slate-600 text-xs">
                                                {new Date(adm.createdAt).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    {!adm.isVerified && (
                                                        <button
                                                            onClick={() => openVerifyModalForAdmin(adm.email)}
                                                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
                                                        >
                                                            Verify OTP
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 border-t border-slate-100 flex items-center justify-between">
                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                    />
                </div>
            </div>

            {isRegisterModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                                    <UserPlus size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Register New Administrator</h3>
                                    <p className="text-xs text-slate-500">Create an authorized administrative profile</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsRegisterModalOpen(false)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleRegisterSubmit} className="p-6 space-y-4">
                            {registerError && (
                                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                                    <AlertCircle size={16} className="shrink-0" />
                                    <span>{registerError}</span>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                    Full Name <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={registerForm.name}
                                    onChange={(e) => setRegisterForm(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g. Dr. Hammad Rashid"
                                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                    Official Email Address <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="email"
                                        required
                                        value={registerForm.email}
                                        onChange={(e) => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
                                        placeholder="admin@careflow.com"
                                        className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                    Initial Password <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={registerForm.password}
                                        onChange={(e) => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                                        placeholder="Min. 6 characters"
                                        className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(p => !p)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                    Contact Phone Number
                                </label>
                                <div className="relative">
                                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="tel"
                                        value={registerForm.phoneNumber}
                                        onChange={(e) => setRegisterForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                                        placeholder="+92 300 1234567"
                                        className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="pt-2 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsRegisterModalOpen(false)}
                                    className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingRegister}
                                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                                >
                                    {isSubmittingRegister && <Loader2 size={16} className="animate-spin" />}
                                    <span>Submit & Send OTP</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isOtpModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                                    <KeyRound size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Verify Administrator OTP</h3>
                                    <p className="text-xs text-slate-500">Two-factor email verification</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOtpModalOpen(false)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleVerifyOtpSubmit} className="p-6 space-y-4">
                            {otpError && (
                                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                                    <AlertCircle size={16} className="shrink-0" />
                                    <span>{otpError}</span>
                                </div>
                            )}

                            <p className="text-xs text-slate-600">
                                Enter the 6-digit verification code sent to <span className="font-semibold text-slate-900">{otpEmail}</span>.
                            </p>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                    6-Digit Verification Code <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    maxLength={6}
                                    value={otpCode}
                                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                    placeholder="123456"
                                    className="w-full text-center text-2xl font-mono tracking-widest px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 transition-colors"
                                />
                            </div>

                            <div className="pt-2 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsOtpModalOpen(false)}
                                    className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isVerifyingOtp || otpCode.length !== 6}
                                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                                >
                                    {isVerifyingOtp && <Loader2 size={16} className="animate-spin" />}
                                    <span>Verify & Activate</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AdminGovernance
