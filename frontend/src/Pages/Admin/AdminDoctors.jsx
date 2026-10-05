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
    ShieldCheck 
} from 'lucide-react'
import useAxiosPrivate from '../../hooks/useAxiosPrivate'

const AdminDoctors = () => {
    const axiosPrivate = useAxiosPrivate()

    const [doctors, setDoctors] = useState([])
    const [departments, setDepartments] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedDepartmentId, setSelectedDepartmentId] = useState('ALL')

    const [isModalOpen, setIsModalOpen] = useState(false)
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
        departmentId: '',
        specialization: '',
        qualifications: '',
        licenseNumber: '',
        experienceYears: '',
        consultationFee: ''
    })

    const fetchData = async () => {
        setIsLoading(true)
        try {
            const [docsRes, deptsRes] = await Promise.all([
                axiosPrivate.get('/Doctor/admin').catch(() => ({ data: [] })),
                axiosPrivate.get('/Department').catch(() => ({ data: [] }))
            ])

            if (Array.isArray(docsRes.data)) {
                setDoctors(docsRes.data)
            } else {
                setDoctors([])
            }

            if (Array.isArray(deptsRes.data)) {
                setDepartments(deptsRes.data)
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
            departmentId: departments.length > 0 ? departments[0].id.toString() : '',
            specialization: '',
            qualifications: '',
            licenseNumber: '',
            experienceYears: '',
            consultationFee: ''
        })
        setErrorMessage('')
        setSuccessDoctor(null)
        setVerificationCode('')
        setVerifyError('')
        setIsVerifiedSuccess(false)
        setResendSuccessMessage('')
    }

    const handleOpenModal = () => {
        resetForm()
        setIsModalOpen(true)
    }

    const handleCloseModal = () => {
        if (isSubmitting || isVerifying) return
        setIsModalOpen(false)
        resetForm()
    }

    const handleVerifyDoctor = async (e) => {
        e.preventDefault()
        if (!verificationCode.trim()) {
            setVerifyError('Please enter the 6-digit verification code.')
            return
        }

        if (verificationCode.trim().length !== 6) {
            setVerifyError('Verification code must be exactly 6 digits.')
            return
        }

        setIsVerifying(true)
        setVerifyError('')

        try {
            await axiosPrivate.post('/auth/patient/verify-email', {
                email: successDoctor.email,
                code: verificationCode.trim()
            })
            setIsVerifiedSuccess(true)
            fetchData()
        } catch (err) {
            const msg = err.response?.data?.message || 'Invalid or expired verification code.'
            setVerifyError(msg)
        } finally {
            setIsVerifying(false)
        }
    }

    const handleResendOtp = async () => {
        if (!successDoctor?.email || isResendingOtp) return
        setIsResendingOtp(true)
        setVerifyError('')
        setResendSuccessMessage('')

        try {
            await axiosPrivate.post('/auth/resend-otp', {
                email: successDoctor.email
            })
            setResendSuccessMessage('A new 6-digit verification code has been dispatched.')
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to resend code. Please try again.'
            setVerifyError(msg)
        } finally {
            setIsResendingOtp(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setErrorMessage('')

        if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
            setErrorMessage('Name, email, and password are required.')
            return
        }

        if (formData.password.length < 8) {
            setErrorMessage('Password must be at least 8 characters long.')
            return
        }

        if (!formData.departmentId) {
            setErrorMessage('Please select a department.')
            return
        }

        if (!formData.specialization.trim() || !formData.qualifications.trim() || !formData.licenseNumber.trim()) {
            setErrorMessage('Specialization, qualifications, and license number are required.')
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
            const payload = {
                name: formData.name.trim(),
                email: formData.email.trim(),
                password: formData.password,
                departmentId: parseInt(formData.departmentId, 10),
                specialization: formData.specialization.trim(),
                qualifications: formData.qualifications.trim(),
                licenseNumber: formData.licenseNumber.trim(),
                experienceYears: exp,
                consultationFee: fee
            }

            const response = await axiosPrivate.post('/Doctor', payload)
            setSuccessDoctor(response.data)
            fetchData()
        } catch (err) {
            const serverMsg = err?.response?.data?.message || 'Failed to register doctor. Please try again.'
            setErrorMessage(serverMsg)
        } finally {
            setIsSubmitting(false)
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

    return (
        <div className="doctors-page flex flex-col gap-6 max-w-7xl mx-auto pb-10">
            
            <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="header-text">
                    <h1 className="page-title text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                        Doctors Management
                    </h1>
                    <p className="page-subtitle text-xs sm:text-sm text-slate-500 mt-0.5">
                        Manage doctor credentials, clinical availability, and department assignments.
                    </p>
                </div>

                <button 
                    onClick={handleOpenModal}
                    className="register-doctor-btn inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-semibold shadow-sm shadow-sky-600/20 transition-all cursor-pointer shrink-0"
                >
                    <UserPlus size={16} />
                    <span>Register New Doctor</span>
                </button>
            </div>

            <div className="filter-controls-row flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="search-box flex items-center gap-2.5 w-full max-w-md px-3.5 py-2 rounded-xl bg-white border border-slate-300 shadow-xs focus-within:border-sky-500 focus-within:ring-3 focus-within:ring-sky-500/15 transition-all">
                    <Search size={16} className="search-icon text-slate-400 shrink-0" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by doctor name, specialization, or license..."
                        className="search-input w-full bg-transparent border-none outline-none text-xs sm:text-sm text-slate-800 placeholder:text-slate-400"
                    />
                </div>

                <div className="doctors-count-badge text-xs font-semibold text-slate-500">
                    Total Doctors: {doctors.length}
                </div>
            </div>

            <div className="department-pills-bar flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                    onClick={() => setSelectedDepartmentId('ALL')}
                    className={`dept-pill-btn px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                        selectedDepartmentId === 'ALL'
                            ? 'bg-sky-600 text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                >
                    All Departments ({doctors.length})
                </button>
                {departments.map(dept => {
                    const count = doctors.filter(d => d.departmentId === dept.id).length
                    return (
                        <button
                            key={dept.id}
                            onClick={() => setSelectedDepartmentId(dept.id.toString())}
                            className={`dept-pill-btn px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize shrink-0 transition-all cursor-pointer ${
                                selectedDepartmentId === dept.id.toString()
                                    ? 'bg-sky-600 text-white shadow-xs'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            {dept.name} ({count})
                        </button>
                    )
                })}
            </div>

            {isLoading ? (
                <div className="loading-state-card bg-white rounded-2xl border border-slate-200/90 p-12 shadow-sm shadow-slate-200/80 flex flex-col items-center justify-center min-h-[300px]">
                    <Loader2 size={32} className="text-sky-600 animate-spin mb-3" />
                    <span className="loading-text text-sm font-semibold text-slate-600">Loading medical personnel...</span>
                </div>
            ) : filteredDoctors.length === 0 ? (
                <div className="empty-state-card bg-white rounded-2xl border border-slate-200/90 p-8 sm:p-12 shadow-sm shadow-slate-200/80 text-center flex flex-col items-center justify-center">
                    <div className="empty-icon-box w-14 h-14 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center mb-3">
                        <Stethoscope size={28} className="text-sky-600" />
                    </div>
                    <h3 className="empty-title text-base font-bold text-slate-800">
                        {searchQuery || selectedDepartmentId !== 'ALL' ? 'No matching doctors found' : 'No doctors registered yet'}
                    </h3>
                    <p className="empty-description text-xs sm:text-sm text-slate-500 max-w-md mt-1 mb-4">
                        Try adjusting your search criteria or select a different department.
                    </p>
                </div>
            ) : (
                <div className="doctors-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredDoctors.map((doc) => (
                        <div 
                            key={doc.id}
                            className="doctor-card bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm shadow-slate-200/80 hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between"
                        >
                            <div className="doctor-card-body">
                                <div className="doctor-card-header flex items-start justify-between gap-3 mb-3">
                                    <div className="doctor-meta flex items-center gap-3">
                                        <div className="doctor-avatar w-11 h-11 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 font-bold text-sm shrink-0">
                                            {(doc.name || 'D').charAt(0).toUpperCase()}
                                        </div>
                                        <div className="doctor-headings">
                                            <h3 className="doctor-name text-base font-bold text-slate-900 leading-snug">
                                                {doc.name}
                                            </h3>
                                            <span className="department-badge text-[11px] font-semibold px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 capitalize">
                                                {doc.departmentName || 'Department'}
                                            </span>
                                        </div>
                                    </div>

                                    <span className="availability-status text-xs font-medium text-slate-500">
                                        {doc.isAvailable ? 'Available' : 'Off Duty'}
                                    </span>
                                </div>

                                <div className="doctor-details-list flex flex-col gap-1.5 mt-3 text-xs text-slate-600">
                                    <div className="detail-item flex items-center gap-2">
                                        <Award size={14} className="text-slate-400 shrink-0" />
                                        <span className="specialization-text font-semibold text-slate-800">{doc.specialization}</span>
                                        <span className="qualifications-text text-slate-400">({doc.qualifications})</span>
                                    </div>
                                    <div className="detail-item flex items-center gap-2">
                                        <Mail size={14} className="text-slate-400 shrink-0" />
                                        <span className="email-text truncate">{doc.email}</span>
                                    </div>
                                    <div className="detail-item flex items-center gap-2">
                                        <FileText size={14} className="text-slate-400 shrink-0" />
                                        <span className="license-label text-slate-500">License:</span>
                                        <span className="license-number font-mono text-slate-700 font-medium">{doc.licenseNumber}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="doctor-card-footer mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
                                <span className="experience-text text-slate-500 font-medium">
                                    {doc.experienceYears} Years Exp.
                                </span>
                                <span className="fee-text font-bold text-emerald-600 text-sm">
                                    ${Number(doc.consultationFee).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
                    <div className="modal-card bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        <div className="modal-header px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <div className="modal-title-group flex items-center gap-2.5">
                                <div className="modal-icon-box w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                                    <UserPlus size={18} />
                                </div>
                                <h2 className="modal-title text-base font-bold text-slate-900">
                                    {successDoctor ? 'Doctor Verification & Activation' : 'Register New Doctor'}
                                </h2>
                            </div>
                            <button
                                onClick={handleCloseModal}
                                disabled={isSubmitting || isVerifying}
                                className="modal-close-btn p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {successDoctor ? (
                            <div className="verification-div p-6 sm:p-7 flex flex-col gap-4.5">
                                <div className="verification-header flex items-center gap-3.5 pb-4 border-b border-slate-100">
                                    <div className={`verification-icon-box w-12 h-12 rounded-xl ${isVerifiedSuccess ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-sky-50 text-sky-600 border border-sky-100'} flex items-center justify-center shrink-0 shadow-xs`}>
                                        {isVerifiedSuccess ? <CheckCircle2 size={26} /> : <ShieldCheck size={26} />}
                                    </div>
                                    <div className="verification-titles flex flex-col">
                                        <h3 className="verification-heading text-base font-bold text-slate-900 tracking-tight">
                                            {isVerifiedSuccess ? 'Doctor Verified Successfully!' : 'Enter 6-Digit Verification Code'}
                                        </h3>
                                        <p className="verification-subtext text-xs text-slate-500 font-medium mt-0.5">
                                            {isVerifiedSuccess 
                                                ? 'Account activated and verified in hospital registry.' 
                                                : 'Enter the OTP code sent to the doctor to complete activation.'}
                                        </p>
                                    </div>
                                </div>

                                <div className="doctor-summary-box bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex items-center justify-between text-xs">
                                    <div className="summary-left flex flex-col gap-0.5">
                                        <span className="physician-name font-bold text-slate-800 text-sm">{successDoctor.name}</span>
                                        <span className="physician-dept text-slate-500 font-medium capitalize">{successDoctor.departmentName} &bull; {successDoctor.specialization}</span>
                                    </div>
                                    <span className="physician-email font-mono text-xs font-semibold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                                        {successDoctor.email}
                                    </span>
                                </div>

                                {isVerifiedSuccess ? (
                                    <div className="verification-confirmed-box p-4 rounded-xl bg-emerald-50 border border-emerald-200/90 flex items-center gap-3">
                                        <CheckCircle2 size={22} className="text-emerald-600 shrink-0" />
                                        <div className="confirmed-text flex flex-col">
                                            <span className="text-xs font-bold text-emerald-900">Doctor Profile Active</span>
                                            <span className="text-[11px] text-emerald-700 mt-0.5 leading-relaxed">
                                                Physician credentials PMC verified. This doctor is now fully available across patient scheduling and department rosters.
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <form onSubmit={handleVerifyDoctor} className="verification-form flex flex-col gap-4">
                                        {verifyError && (
                                            <div className="alert-error p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                                                <AlertCircle size={16} className="shrink-0" />
                                                <span>{verifyError}</span>
                                            </div>
                                        )}

                                        {resendSuccessMessage && (
                                            <div className="alert-success p-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-xs font-semibold flex items-center gap-2">
                                                <CheckCircle2 size={16} className="shrink-0" />
                                                <span>{resendSuccessMessage}</span>
                                            </div>
                                        )}

                                        <div className="form-group flex flex-col gap-1.5">
                                            <label className="form-label text-xs font-bold text-slate-700">
                                                6-Digit Verification Code (OTP) <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="verificationCode"
                                                maxLength={6}
                                                value={verificationCode}
                                                onChange={(e) => {
                                                    setVerificationCode(e.target.value.replace(/\D/g, ''))
                                                    if (verifyError) setVerifyError('')
                                                    if (resendSuccessMessage) setResendSuccessMessage('')
                                                }}
                                                placeholder="000000"
                                                autoFocus
                                                disabled={isVerifying}
                                                className="otp-input px-4 py-3 rounded-xl border border-slate-300 text-xl font-mono font-bold tracking-widest text-center text-slate-900 placeholder:text-slate-300 placeholder:tracking-widest focus:outline-none focus:border-sky-500 focus:ring-3 focus:ring-sky-500/10 shadow-xs transition-all"
                                            />
                                        </div>

                                        <div className="resend-row flex items-center justify-between text-xs">
                                            <span className="resend-label text-slate-500">Didn't receive code?</span>
                                            <button
                                                type="button"
                                                onClick={handleResendOtp}
                                                disabled={isResendingOtp || isVerifying}
                                                className="resend-btn text-sky-600 hover:text-sky-700 font-semibold cursor-pointer disabled:opacity-50"
                                            >
                                                {isResendingOtp ? 'Resending...' : 'Resend Code'}
                                            </button>
                                        </div>

                                        <div className="modal-actions-row flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                                            <button
                                                type="button"
                                                onClick={handleCloseModal}
                                                disabled={isVerifying}
                                                className="cancel-btn px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                                            >
                                                Verify Later
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isVerifying || verificationCode.length !== 6}
                                                className="verify-btn inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold shadow-sm shadow-sky-600/20 transition-all cursor-pointer"
                                            >
                                                {isVerifying ? (
                                                    <>
                                                        <Loader2 size={16} className="animate-spin" />
                                                        <span>Verifying...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <ShieldCheck size={16} />
                                                        <span>Verify Doctor</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {isVerifiedSuccess && (
                                    <div className="modal-actions-row flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                                        <button
                                            type="button"
                                            onClick={resetForm}
                                            className="register-another-btn px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                                        >
                                            Register Another Doctor
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleCloseModal}
                                            className="done-btn px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-semibold shadow-sm shadow-sky-600/20 transition-all cursor-pointer"
                                        >
                                            Done
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="modal-form p-6 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
                                {errorMessage && (
                                    <div className="alert-error p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                                        <AlertCircle size={16} className="shrink-0" />
                                        <span>{errorMessage}</span>
                                    </div>
                                )}

                                <div className="form-row grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    <div className="form-group flex flex-col gap-1">
                                        <label className="form-label text-xs font-bold text-slate-700">
                                            Full Name <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            placeholder="e.g. Dr. Tariq Mehmood"
                                            className="form-input px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-sky-500 focus:ring-3 focus:ring-sky-500/10"
                                            disabled={isSubmitting}
                                        />
                                    </div>

                                    <div className="form-group flex flex-col gap-1">
                                        <label className="form-label text-xs font-bold text-slate-700">
                                            Email Address <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            placeholder="doctor@careflow.com"
                                            className="form-input px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-sky-500 focus:ring-3 focus:ring-sky-500/10"
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                </div>

                                <div className="form-row grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    <div className="form-group flex flex-col gap-1">
                                        <label className="form-label text-xs font-bold text-slate-700">
                                            Temporary Password <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            placeholder="Min 8 characters"
                                            className="form-input px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-sky-500 focus:ring-3 focus:ring-sky-500/10"
                                            disabled={isSubmitting}
                                        />
                                    </div>

                                    <div className="form-group flex flex-col gap-1">
                                        <label className="form-label text-xs font-bold text-slate-700">
                                            Department <span className="text-rose-500">*</span>
                                        </label>
                                        <select
                                            name="departmentId"
                                            value={formData.departmentId}
                                            onChange={handleInputChange}
                                            className="form-select px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:border-sky-500 focus:ring-3 focus:ring-sky-500/10 capitalize"
                                            disabled={isSubmitting}
                                        >
                                            <option value="">Select Department</option>
                                            {departments.map(dept => (
                                                <option key={dept.id} value={dept.id}>
                                                    {dept.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-row grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    <div className="form-group flex flex-col gap-1">
                                        <label className="form-label text-xs font-bold text-slate-700">
                                            Specialization <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="specialization"
                                            value={formData.specialization}
                                            onChange={handleInputChange}
                                            placeholder="e.g. Interventional Cardiologist"
                                            className="form-input px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-sky-500 focus:ring-3 focus:ring-sky-500/10"
                                            disabled={isSubmitting}
                                        />
                                    </div>

                                    <div className="form-group flex flex-col gap-1">
                                        <label className="form-label text-xs font-bold text-slate-700">
                                            Qualifications <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="qualifications"
                                            value={formData.qualifications}
                                            onChange={handleInputChange}
                                            placeholder="e.g. MBBS, FCPS (Cardiology)"
                                            className="form-input px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-sky-500 focus:ring-3 focus:ring-sky-500/10"
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                </div>

                                <div className="form-row grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                                    <div className="form-group flex flex-col gap-1">
                                        <label className="form-label text-xs font-bold text-slate-700">
                                            License Number <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="licenseNumber"
                                            value={formData.licenseNumber}
                                            onChange={handleInputChange}
                                            placeholder="PMC-20101-P"
                                            className="form-input px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-sky-500 focus:ring-3 focus:ring-sky-500/10 font-mono"
                                            disabled={isSubmitting}
                                        />
                                    </div>

                                    <div className="form-group flex flex-col gap-1">
                                        <label className="form-label text-xs font-bold text-slate-700">
                                            Experience (Yrs) <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            name="experienceYears"
                                            min="0"
                                            max="60"
                                            value={formData.experienceYears}
                                            onChange={handleInputChange}
                                            placeholder="10"
                                            className="form-input px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-sky-500 focus:ring-3 focus:ring-sky-500/10"
                                            disabled={isSubmitting}
                                        />
                                    </div>

                                    <div className="form-group flex flex-col gap-1">
                                        <label className="form-label text-xs font-bold text-slate-700">
                                            Fee ($) <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            name="consultationFee"
                                            min="0"
                                            step="0.01"
                                            value={formData.consultationFee}
                                            onChange={handleInputChange}
                                            placeholder="150.00"
                                            className="form-input px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-sky-500 focus:ring-3 focus:ring-sky-500/10"
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                </div>

                                <div className="modal-footer flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        disabled={isSubmitting}
                                        className="cancel-btn px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="submit-btn inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white text-xs sm:text-sm font-semibold shadow-sm shadow-sky-600/20 transition-all cursor-pointer"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                <span>Registering...</span>
                                            </>
                                        ) : (
                                            <span>Register Doctor</span>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

        </div>
    )
}

export default AdminDoctors