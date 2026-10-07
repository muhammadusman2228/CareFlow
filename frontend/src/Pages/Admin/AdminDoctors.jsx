import { useState, useEffect } from 'react'
import { 
    UserPlus, 
    Search, 
    Stethoscope, 
    Award, 
    Mail, 
    FileText, 
    Loader2, 
    CheckCircle2, 
    AlertCircle, 
    X, 
    ShieldCheck, 
    ArrowLeft, 
    Eye, 
    EyeOff, 
    Clock, 
    DollarSign, 
    Info, 
    Check, 
    Building2, 
    Phone, 
    Calendar
} from 'lucide-react'
import useAxiosPrivate from '../../hooks/useAxiosPrivate'

const AdminDoctors = () => {
    const axiosPrivate = useAxiosPrivate()

    const [viewMode, setViewMode] = useState('list')
    const [doctors, setDoctors] = useState([])
    const [departments, setDepartments] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedDepartmentId, setSelectedDepartmentId] = useState('ALL')

    const [showPassword, setShowPassword] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const [successDoctor, setSuccessDoctor] = useState(null)

    const [verificationCode, setVerificationCode] = useState('')
    const [isVerifying, setIsVerifying] = useState(false)
    const [verifyError, setVerifyError] = useState('')
    const [isVerifiedSuccess, setIsVerifiedSuccess] = useState(false)
    const [isResendingOtp, setIsResendingOtp] = useState(false)
    const [resendSuccessMessage, setResendSuccessMessage] = useState('')

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        departmentId: '',
        specialization: '',
        qualifications: '',
        licenseNumber: '',
        experienceYears: '',
        consultationFee: '',
        shiftDay: 'Monday',
        shiftStart: '09:00',
        shiftEnd: '17:00',
        slotDuration: '20 min'
    })

    const fetchData = async () => {
        setIsLoading(true)
        try {
            const [docsRes, deptsRes] = await Promise.all([
                axiosPrivate.get('/Admin/admin').catch(() => ({ data: [] })),
                axiosPrivate.get('/Department').catch(() => ({ data: [] }))
            ])

            if (Array.isArray(docsRes.data)) {
                setDoctors(docsRes.data)
            } else {
                setDoctors([])
            }

            if (Array.isArray(deptsRes.data)) {
                setDepartments(deptsRes.data)
                if (deptsRes.data.length > 0 && !formData.departmentId) {
                    setFormData(prev => ({ ...prev, departmentId: deptsRes.data[0].id.toString() }))
                }
            } else {
                setDepartments([])
            }
        } catch {
            setDoctors([])
            setDepartments([])
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        if (errorMessage) setErrorMessage('')
    }

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            password: '',
            phone: '',
            departmentId: departments.length > 0 ? departments[0].id.toString() : '',
            specialization: '',
            qualifications: '',
            licenseNumber: '',
            experienceYears: '',
            consultationFee: '',
            shiftDay: 'Monday',
            shiftStart: '09:00',
            shiftEnd: '17:00',
            slotDuration: '20 min'
        })
        setErrorMessage('')
        setSuccessDoctor(null)
        setVerificationCode('')
        setVerifyError('')
        setIsVerifiedSuccess(false)
        setResendSuccessMessage('')
    }

    const handleCreateDoctor = async (e) => {
        e.preventDefault()
        setErrorMessage('')

        if (!formData.name.trim()) {
            setErrorMessage('Doctor name is required.')
            return
        }

        if (!formData.email.trim()) {
            setErrorMessage('Official email is required.')
            return
        }

        if (!formData.password || formData.password.length < 8) {
            setErrorMessage('Password must be at least 8 characters long.')
            return
        }

        if (!formData.departmentId) {
            setErrorMessage('Please select a clinical department.')
            return
        }

        if (!formData.specialization.trim()) {
            setErrorMessage('Specialization field is required.')
            return
        }

        if (!formData.qualifications.trim()) {
            setErrorMessage('Medical qualifications field is required.')
            return
        }

        if (!formData.licenseNumber.trim()) {
            setErrorMessage('Medical license number is required.')
            return
        }

        const exp = parseInt(formData.experienceYears, 10)
        if (isNaN(exp) || exp < 0) {
            setErrorMessage('Please enter valid experience years.')
            return
        }

        const fee = parseFloat(formData.consultationFee)
        if (isNaN(fee) || fee < 0) {
            setErrorMessage('Please enter a valid consultation fee.')
            return
        }

        setIsSubmitting(true)
        try {
            const formattedName = formData.name.trim().startsWith('Dr.') 
                ? formData.name.trim() 
                : `Dr. ${formData.name.trim()}`

            const payload = {
                name: formattedName,
                email: formData.email.trim(),
                password: formData.password,
                departmentId: parseInt(formData.departmentId, 10),
                specialization: formData.specialization.trim(),
                qualifications: formData.qualifications.trim(),
                licenseNumber: formData.licenseNumber.trim(),
                experienceYears: exp,
                consultationFee: fee
            }

            const response = await axiosPrivate.post('/Admin', payload)
            setSuccessDoctor(response.data)
            fetchData()
        } catch (err) {
            const serverMsg = err?.response?.data?.message || 'Failed to register doctor. Please try again.'
            setErrorMessage(serverMsg)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleVerifyDoctor = async (e) => {
        e.preventDefault()
        setVerifyError('')

        if (!verificationCode || verificationCode.length !== 6) {
            setVerifyError('Please enter a valid 6-digit verification code.')
            return
        }

        setIsVerifying(true)
        try {
            await axiosPrivate.post('/Auth/patient/verify-email', {
                email: successDoctor.email,
                code: verificationCode.trim()
            })
            setIsVerifiedSuccess(true)
            fetchData()
        } catch (err) {
            const serverMsg = err?.response?.data?.message || 'Invalid or expired verification code.'
            setVerifyError(serverMsg)
        } finally {
            setIsVerifying(false)
        }
    }

    const handleResendOtp = async () => {
        if (!successDoctor?.email) return
        setIsResendingOtp(true)
        setVerifyError('')
        setResendSuccessMessage('')
        try {
            await axiosPrivate.post('/Auth/resend-otp', {
                email: successDoctor.email
            })
            setResendSuccessMessage('A fresh verification code has been dispatched to physician email.')
        } catch (err) {
            const serverMsg = err?.response?.data?.message || 'Could not resend OTP. Try again.'
            setVerifyError(serverMsg)
        } finally {
            setIsResendingOtp(false)
        }
    }

    const filteredDoctors = doctors.filter(doc => {
        const matchesDept = selectedDepartmentId === 'ALL' || doc.departmentId?.toString() === selectedDepartmentId.toString()
        const q = searchQuery.toLowerCase()
        const matchesSearch = 
            (doc.name || '').toLowerCase().includes(q) ||
            (doc.specialization || '').toLowerCase().includes(q) ||
            (doc.departmentName || '').toLowerCase().includes(q) ||
            (doc.email || '').toLowerCase().includes(q) ||
            (doc.licenseNumber || '').toLowerCase().includes(q)
        return matchesDept && matchesSearch
    })

    if (viewMode === 'add') {
        return (
            <div className="add-doctor-page flex flex-col gap-6 max-w-4xl mx-auto pb-12 animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b border-slate-200/90 pb-4">
                    <button
                        onClick={() => {
                            resetForm()
                            setViewMode('list')
                        }}
                        className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-sky-600 transition-colors"
                    >
                        <ArrowLeft size={16} />
                        Back to Doctors
                    </button>
                    <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                        Add New Medical Specialist
                    </h1>
                    <div className="w-20"></div>
                </div>

                {successDoctor ? (
                    <div className="bg-white rounded-xl border border-slate-200/90 p-6 sm:p-8 shadow-xs flex flex-col gap-5">
                        <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
                            <div className={`w-12 h-12 rounded-xl ${isVerifiedSuccess ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-sky-50 text-sky-600 border border-sky-100'} flex items-center justify-center shrink-0`}>
                                {isVerifiedSuccess ? <CheckCircle2 size={26} /> : <ShieldCheck size={26} />}
                            </div>
                            <div className="flex flex-col">
                                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                                    {isVerifiedSuccess ? 'Doctor Verified Successfully!' : 'Enter 6-Digit Verification Code'}
                                </h3>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">
                                    {isVerifiedSuccess 
                                        ? 'Physician account is now fully active in clinical registry.' 
                                        : 'A secure 6-digit OTP code has been dispatched to the physician official email.'}
                                </p>
                            </div>
                        </div>

                        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                            <div className="flex flex-col gap-0.5">
                                <span className="font-bold text-slate-800 text-sm">{successDoctor.name}</span>
                                <span className="text-slate-500 font-medium capitalize">{successDoctor.departmentName} &bull; {successDoctor.specialization}</span>
                            </div>
                            <span className="font-mono text-xs font-semibold text-slate-700 bg-white px-3 py-1 rounded-lg border border-slate-200">
                                {successDoctor.email}
                            </span>
                        </div>

                        {isVerifiedSuccess ? (
                            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200/90 flex items-center gap-3">
                                <CheckCircle2 size={22} className="text-emerald-600 shrink-0" />
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-emerald-900">Credentials Active & Published</span>
                                    <span className="text-[11px] text-emerald-700 mt-0.5 leading-relaxed">
                                        This doctor is now eligible for patient appointments, prescriptions, and schedule management.
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleVerifyDoctor} className="flex flex-col gap-4">
                                {verifyError && (
                                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                                        <AlertCircle size={16} className="shrink-0" />
                                        <span>{verifyError}</span>
                                    </div>
                                )}

                                {resendSuccessMessage && (
                                    <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-xs font-semibold flex items-center gap-2">
                                        <CheckCircle2 size={16} className="shrink-0" />
                                        <span>{resendSuccessMessage}</span>
                                    </div>
                                )}

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-700">
                                        6-Digit Verification Code (OTP) <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        maxLength={6}
                                        value={verificationCode}
                                        onChange={(e) => {
                                            setVerificationCode(e.target.value.replace(/\D/g, ''))
                                            if (verifyError) setVerifyError('')
                                        }}
                                        placeholder="000000"
                                        autoFocus
                                        disabled={isVerifying}
                                        className="px-4 py-3 rounded-xl border border-slate-300 text-2xl font-mono font-bold tracking-widest text-center text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-sky-500 focus:ring-3 focus:ring-sky-500/10 shadow-xs"
                                    />
                                </div>

                                <div className="flex items-center justify-between text-xs pt-1">
                                    <button
                                        type="button"
                                        onClick={handleResendOtp}
                                        disabled={isResendingOtp}
                                        className="font-semibold text-sky-600 hover:text-sky-700 transition-colors"
                                    >
                                        {isResendingOtp ? 'Resending code...' : "Didn't receive code? Resend"}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isVerifying || verificationCode.length !== 6}
                                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 transition-all shadow-xs"
                                    >
                                        {isVerifying ? (
                                            <>
                                                <Loader2 size={14} className="animate-spin" />
                                                Verifying...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 size={14} />
                                                Activate Doctor Profile
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}

                        <div className="pt-4 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => {
                                    resetForm()
                                    setViewMode('list')
                                }}
                                className="px-5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                            >
                                Done & Return to List
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleCreateDoctor} className="bg-white rounded-xl border border-slate-200/90 p-6 sm:p-8 shadow-xs flex flex-col gap-7">
                        {errorMessage && (
                            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2.5">
                                <AlertCircle size={16} className="shrink-0" />
                                <span>{errorMessage}</span>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="flex flex-col gap-4">
                                <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
                                    Account Details
                                </h2>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-700">
                                        Official Email <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="e.g., doctor@careflow.com"
                                        required
                                        className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-3 focus:ring-sky-500/10 shadow-xs"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-700">
                                        Temporary Password <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            placeholder="••••••••••"
                                            required
                                            className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-3 focus:ring-sky-500/10 shadow-xs"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(prev => !prev)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    <span className="text-[11px] text-slate-400">
                                        Minimum 8 characters, includes uppercase, number & symbol.
                                    </span>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-700">
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        placeholder="e.g. 03124122906"
                                        className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-3 focus:ring-sky-500/10 shadow-xs"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-4">
                                <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
                                    Professional Information
                                </h2>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-700">
                                        Full Name (Dr. prefix) <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="flex items-center rounded-xl border border-slate-300 shadow-xs overflow-hidden focus-within:border-sky-500 focus-within:ring-3 focus-within:ring-sky-500/10">
                                        <div className="px-3 py-2.5 bg-slate-50 border-r border-slate-200 text-xs font-semibold text-slate-600 shrink-0">
                                            Dr.
                                        </div>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            placeholder="Full Name"
                                            required
                                            className="w-full px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-700">
                                        Department <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        name="departmentId"
                                        value={formData.departmentId}
                                        onChange={handleInputChange}
                                        required
                                        className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:border-sky-500 focus:ring-3 focus:ring-sky-500/10 shadow-xs"
                                    >
                                        <option value="" disabled>Select Department</option>
                                        {departments.map(dept => (
                                            <option key={dept.id} value={dept.id}>
                                                {dept.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-slate-700">
                                            Specialization <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="specialization"
                                            value={formData.specialization}
                                            onChange={handleInputChange}
                                            placeholder="e.g., Cardiology"
                                            required
                                            className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 shadow-xs"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-slate-700">
                                            Qualifications <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="qualifications"
                                            value={formData.qualifications}
                                            onChange={handleInputChange}
                                            placeholder="e.g., MBBS, MD"
                                            required
                                            className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 shadow-xs"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-700">
                                        Medical License Number <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="licenseNumber"
                                        value={formData.licenseNumber}
                                        onChange={handleInputChange}
                                        placeholder="e.g., ML-123456"
                                        required
                                        className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 shadow-xs"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-slate-700">
                                            Experience (Years) <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="60"
                                            name="experienceYears"
                                            value={formData.experienceYears}
                                            onChange={handleInputChange}
                                            placeholder="5"
                                            required
                                            className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 shadow-xs"
                                        />
                                        <span className="text-[10px] text-slate-400">
                                            Years in clinical practice.
                                        </span>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-slate-700">
                                            Fee per Consultation <span className="text-rose-500">*</span>
                                        </label>
                                        <div className="flex items-center rounded-xl border border-slate-300 shadow-xs overflow-hidden focus-within:border-sky-500">
                                            <div className="px-3 py-2.5 bg-slate-50 border-r border-slate-200 text-xs font-semibold text-slate-600 shrink-0">
                                                $
                                            </div>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                name="consultationFee"
                                                value={formData.consultationFee}
                                                onChange={handleInputChange}
                                                placeholder="250.00"
                                                required
                                                className="w-full px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 pt-4 border-t border-slate-100">
                            <h2 className="text-sm font-bold text-slate-900">
                                Assign Initial Working Shift
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-700">
                                        Day
                                    </label>
                                    <select
                                        name="shiftDay"
                                        value={formData.shiftDay}
                                        onChange={handleInputChange}
                                        className="px-3 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:border-sky-500 shadow-xs"
                                    >
                                        <option value="Monday">Monday</option>
                                        <option value="Tuesday">Tuesday</option>
                                        <option value="Wednesday">Wednesday</option>
                                        <option value="Thursday">Thursday</option>
                                        <option value="Friday">Friday</option>
                                        <option value="Saturday">Saturday</option>
                                        <option value="Sunday">Sunday</option>
                                    </select>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-700">
                                        Start Time
                                    </label>
                                    <input
                                        type="time"
                                        name="shiftStart"
                                        value={formData.shiftStart}
                                        onChange={handleInputChange}
                                        className="px-3 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-sky-500 shadow-xs"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-700">
                                        End Time
                                    </label>
                                    <input
                                        type="time"
                                        name="shiftEnd"
                                        value={formData.shiftEnd}
                                        onChange={handleInputChange}
                                        className="px-3 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-sky-500 shadow-xs"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-700">
                                        Slot Duration
                                    </label>
                                    <input
                                        type="text"
                                        name="slotDuration"
                                        value={formData.slotDuration}
                                        readOnly
                                        className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-600 shadow-xs cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-100 flex items-center gap-2.5 text-xs text-sky-800">
                                <Info size={16} className="text-sky-600 shrink-0" />
                                <span>Doctor will receive credentials and initial schedule details via their official email upon profile creation.</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => {
                                    resetForm()
                                    setViewMode('list')
                                }}
                                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 transition-all shadow-xs disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={15} className="animate-spin" />
                                        Creating Profile...
                                    </>
                                ) : (
                                    <>
                                        <Check size={15} />
                                        Create Doctor Profile
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        )
    }

    return (
        <div className="doctors-page flex flex-col gap-6 max-w-7xl mx-auto pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-col">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                        Doctors Management
                    </h1>
                    <p className="text-sm text-slate-600 font-medium mt-0.5">
                        Manage doctor credentials, clinical availability, and department assignments.
                    </p>
                </div>
                <button
                    onClick={() => {
                        resetForm()
                        setViewMode('add')
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 transition-all shadow-sm shrink-0"
                >
                    <UserPlus size={16} />
                    Add Medical Specialist
                </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                    <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search doctor by name, email, license number, specialization..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 placeholder:text-slate-500 bg-white focus:outline-none focus:border-sky-500 shadow-sm"
                    />
                </div>

                <select
                    value={selectedDepartmentId}
                    onChange={(e) => setSelectedDepartmentId(e.target.value)}
                    className="w-full sm:w-56 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium text-slate-800 bg-white focus:outline-none focus:border-sky-500 shadow-sm shrink-0"
                >
                    <option value="ALL">All Departments</option>
                    {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>
                            {dept.name}
                        </option>
                    ))}
                </select>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
                    <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
                    <p className="text-sm font-semibold text-slate-600">Loading doctor directory...</p>
                </div>
            ) : filteredDoctors.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center flex flex-col items-center justify-center gap-3 shadow-sm">
                    <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-700">
                        <Stethoscope size={24} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <h3 className="text-base font-bold text-slate-900">No Doctors Found</h3>
                        <p className="text-xs sm:text-sm text-slate-500 max-w-sm">
                            {searchQuery ? 'No matching doctors found for your search query.' : 'No registered doctors in the clinical registry yet.'}
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            resetForm()
                            setViewMode('add')
                        }}
                        className="mt-2 text-xs sm:text-sm font-bold text-sky-600 hover:text-sky-700"
                    >
                        + Register First Specialist
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredDoctors.map(doc => (
                        <div
                            key={doc.id}
                            className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-4"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-11 h-11 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-700 font-bold text-sm shrink-0">
                                        {(doc.name || 'D').charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                                            {doc.name}
                                        </h3>
                                        <span className="text-xs sm:text-sm font-semibold text-slate-600 truncate">
                                            {doc.specialization || 'Specialist'}
                                        </span>
                                    </div>
                                </div>
                                <span className="text-xs sm:text-sm font-semibold text-slate-600 shrink-0">
                                    {doc.isAvailable ? 'Available' : 'Off-duty'}
                                </span>
                            </div>

                            <div className="flex flex-col gap-2 text-xs sm:text-sm text-slate-700 pt-3 border-t border-slate-100">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500 font-medium">Department:</span>
                                    <span className="font-semibold text-slate-900">{doc.departmentName}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500 font-medium">License:</span>
                                    <span className="font-mono text-slate-800 text-xs font-semibold">{doc.licenseNumber}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500 font-medium">Experience:</span>
                                    <span className="font-semibold text-slate-900">{doc.experienceYears} Years</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500 font-medium">Consultation Fee:</span>
                                    <span className="font-extrabold text-slate-900">${Number(doc.consultationFee).toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500 font-mono">
                                <span className="truncate">{doc.email}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default AdminDoctors