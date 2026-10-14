import { useState, useEffect } from 'react'
import { 
    UserCheck, 
    UserPlus, 
    Search, 
    Mail, 
    Building2, 
    Clock, 
    Award, 
    Edit3, 
    Trash2, 
    Loader2, 
    X, 
    CheckCircle2, 
    AlertCircle, 
    RefreshCw, 
    ShieldCheck, 
    ArrowLeft, 
    Check, 
    Eye, 
    EyeOff, 
    Phone 
} from 'lucide-react'
import useAxiosPrivate from '../../hooks/useAxiosPrivate'
import Pagination from '../../components/common/Pagination'

const AdminAssistants = () => {
    const axiosPrivate = useAxiosPrivate()

    const [viewMode, setViewMode] = useState('list')
    const [assistants, setAssistants] = useState([])
    const [departments, setDepartments] = useState([])
    const [doctors, setDoctors] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [page, setPage] = useState(1)

    useEffect(() => {
        setPage(1)
    }, [searchQuery])

    const [selectedAssistant, setSelectedAssistant] = useState(null)
    const [showPassword, setShowPassword] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const [successMessage, setSuccessMessage] = useState('')
    const [selectedDeptIds, setSelectedDeptIds] = useState([])
    const [editDeptIds, setEditDeptIds] = useState([])

    const initialFormData = {
        name: '',
        email: '',
        phoneNumber: '',
        password: '',
        departmentId: '',
        doctorId: '',
        qualifications: '',
        shiftStart: '08:00',
        shiftEnd: '16:00'
    }

    const [formData, setFormData] = useState(initialFormData)

    const [editFormData, setEditFormData] = useState({
        phoneNumber: '',
        departmentId: '',
        doctorId: '',
        qualifications: '',
        shiftStart: '08:00',
        shiftEnd: '16:00',
        isActive: true
    })

    const fetchData = async () => {
        setIsLoading(true)
        setErrorMessage('')
        try {
            const [assistantsRes, deptsRes, docsRes] = await Promise.all([
                axiosPrivate.get('/Assistant/all').catch(() => ({ data: [] })),
                axiosPrivate.get('/Department').catch(() => ({ data: [] })),
                axiosPrivate.get('/Admin/admin').catch(() => ({ data: [] }))
            ])

            setAssistants(Array.isArray(assistantsRes.data) ? assistantsRes.data : [])
            setDepartments(Array.isArray(deptsRes.data) ? deptsRes.data : [])
            setDoctors(Array.isArray(docsRes.data) ? docsRes.data : [])
        } catch {
            setErrorMessage('Unable to load clinical assistants catalog.')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleCreateSubmit = async (e) => {
        e.preventDefault()
        setErrorMessage('')
        setSuccessMessage('')

        const trimmedName = formData.name.trim()
        if (!trimmedName || trimmedName.length < 2) {
            setErrorMessage('Full name is required and must contain at least 2 characters.')
            return
        }

        if (!/^[a-zA-Z\s.'-]+$/.test(trimmedName)) {
            setErrorMessage('Full name can only contain letters, spaces, dots, and hyphens.')
            return
        }

        const trimmedEmail = formData.email.trim()
        if (!trimmedEmail) {
            setErrorMessage('Official email address is required.')
            return
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(trimmedEmail)) {
            setErrorMessage('Please enter a valid email address.')
            return
        }

        const cleanPhone = formData.phoneNumber.replace(/[^\d+]/g, '')
        if (!cleanPhone || cleanPhone.length < 10 || cleanPhone.length > 15) {
            setErrorMessage('Phone number must be between 10 and 15 digits.')
            return
        }

        if (!formData.password || formData.password.length < 6) {
            setErrorMessage('Password must be at least 6 characters long.')
            return
        }

        setIsSubmitting(true)

        try {
            const allDeptIds = Array.from(new Set([
                formData.departmentId ? parseInt(formData.departmentId, 10) : null,
                ...selectedDeptIds.map(Number)
            ])).filter(id => id !== null && !isNaN(id))

            const payload = {
                name: trimmedName,
                email: trimmedEmail,
                phoneNumber: cleanPhone,
                password: formData.password,
                departmentId: allDeptIds.length > 0 ? allDeptIds[0] : null,
                departmentIds: allDeptIds,
                doctorId: null,
                qualifications: formData.qualifications.trim(),
                shiftStart: formData.shiftStart.length === 5 ? `${formData.shiftStart}:00` : formData.shiftStart,
                shiftEnd: formData.shiftEnd.length === 5 ? `${formData.shiftEnd}:00` : formData.shiftEnd
            }

            await axiosPrivate.post('/Assistant/register', payload)
            setSuccessMessage(`Assistant ${trimmedName} successfully registered.`)
            setFormData(initialFormData)
            setSelectedDeptIds([])
            setViewMode('list')
            await fetchData()
        } catch (err) {
            setErrorMessage(err.response?.data?.message || 'Failed to register assistant.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleOpenEdit = (assistant) => {
        setSelectedAssistant(assistant)
        const deptIds = assistant.departmentIds && assistant.departmentIds.length > 0
            ? assistant.departmentIds
            : assistant.departmentId ? [assistant.departmentId] : []
        setEditDeptIds(deptIds)
        setEditFormData({
            phoneNumber: assistant.phoneNumber || '',
            departmentId: assistant.departmentId ? assistant.departmentId.toString() : (deptIds[0]?.toString() || ''),
            doctorId: assistant.doctorId ? assistant.doctorId.toString() : '',
            qualifications: assistant.qualifications || '',
            shiftStart: assistant.shiftStart ? assistant.shiftStart.substring(0, 5) : '08:00',
            shiftEnd: assistant.shiftEnd ? assistant.shiftEnd.substring(0, 5) : '16:00',
            isActive: assistant.isActive
        })
        setErrorMessage('')
        setViewMode('edit')
    }

    const handleEditSubmit = async (e) => {
        e.preventDefault()
        if (!selectedAssistant) return

        setIsSubmitting(true)
        setErrorMessage('')
        setSuccessMessage('')

        try {
            const allDeptIds = Array.from(new Set([
                editFormData.departmentId ? parseInt(editFormData.departmentId, 10) : null,
                ...editDeptIds.map(Number)
            ])).filter(id => id !== null && !isNaN(id))

            const payload = {
                phoneNumber: editFormData.phoneNumber.trim(),
                departmentId: allDeptIds.length > 0 ? allDeptIds[0] : null,
                departmentIds: allDeptIds,
                doctorId: null,
                qualifications: editFormData.qualifications.trim(),
                shiftStart: editFormData.shiftStart.length === 5 ? `${editFormData.shiftStart}:00` : editFormData.shiftStart,
                shiftEnd: editFormData.shiftEnd.length === 5 ? `${editFormData.shiftEnd}:00` : editFormData.shiftEnd,
                isActive: editFormData.isActive
            }

            await axiosPrivate.put(`/Assistant/${selectedAssistant.id}`, payload)
            setSuccessMessage(`Assistant ${selectedAssistant.name} profile updated successfully.`)
            setViewMode('list')
            setSelectedAssistant(null)
            await fetchData()
        } catch (err) {
            setErrorMessage(err.response?.data?.message || 'Failed to update assistant.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteAssistant = async (id, name) => {
        if (!window.confirm(`Are you sure you want to deactivate and remove assistant ${name}?`)) {
            return
        }

        try {
            await axiosPrivate.delete(`/Assistant/${id}`)
            setSuccessMessage(`Assistant ${name} removed.`)
            await fetchData()
        } catch (err) {
            setErrorMessage(err.response?.data?.message || 'Failed to delete assistant.')
        }
    }

    const filteredAssistants = assistants.filter(a => {
        const q = searchQuery.toLowerCase()
        return (
            (a.name || '').toLowerCase().includes(q) ||
            (a.email || '').toLowerCase().includes(q) ||
            (a.phoneNumber || '').toLowerCase().includes(q) ||
            (a.qualifications || '').toLowerCase().includes(q) ||
            (a.doctorName || '').toLowerCase().includes(q) ||
            (a.departmentName || '').toLowerCase().includes(q)
        )
    })

    if (viewMode === 'add') {
        return (
            <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-12 animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                    <button
                        onClick={() => {
                            setFormData(initialFormData)
                            setErrorMessage('')
                            setViewMode('list')
                        }}
                        className="flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-slate-950 transition-colors"
                    >
                        <ArrowLeft size={18} />
                        <span>Back to Clinical Assistants</span>
                    </button>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight">
                        Register Clinical Assistant
                    </h1>
                    <div className="w-24"></div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col gap-6">
                    <div className="flex items-center gap-3.5 pb-5 border-b border-slate-100">
                        <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <UserPlus size={22} />
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-lg font-black text-slate-900 tracking-tight">
                                Assistant Credentials & Clinical Assignment
                            </h2>
                            <p className="text-xs font-semibold text-slate-500 mt-0.5">
                                Create portal authentication, department station, and operational shift timings
                            </p>
                        </div>
                    </div>

                    {errorMessage && (
                        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs font-bold text-rose-800">
                            <AlertCircle size={18} className="text-rose-600 shrink-0" />
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    <form onSubmit={handleCreateSubmit} className="flex flex-col gap-6">
                        <div className="flex flex-col gap-4">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                                <ShieldCheck size={16} />
                                <span>1. Personal & Authentication Credentials</span>
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5 sm:col-span-2">
                                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                        Full Name <span className="text-rose-600">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        maxLength={50}
                                        placeholder="e.g. Fatima Tariq"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value.replace(/[^a-zA-Z\s.'-]/g, '') }))}
                                        className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 bg-white"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                        Official Email Address <span className="text-rose-600">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        maxLength={100}
                                        placeholder="fatima.triage@careflow.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                        className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 bg-white"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                        Contact Phone / Hotline <span className="text-rose-600">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        required
                                        maxLength={15}
                                        placeholder="03001234567 or +923001234567"
                                        value={formData.phoneNumber}
                                        onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value.replace(/[^\d+]/g, '') }))}
                                        className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 bg-white"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5 sm:col-span-2">
                                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                        Initial Password <span className="text-rose-600">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            minLength={6}
                                            maxLength={50}
                                            placeholder="Minimum 6 characters"
                                            value={formData.password}
                                            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                            className="w-full pl-4 pr-11 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 bg-white"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 pt-4 border-t border-slate-100">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                                <Building2 size={16} />
                                <span>2. Department Pool & Physician Coverage</span>
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5 sm:col-span-2">
                                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                        Primary Assigned Department
                                    </label>
                                    <select
                                        value={formData.departmentId}
                                        onChange={(e) => setFormData(prev => ({ ...prev, departmentId: e.target.value }))}
                                        className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 bg-white focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
                                    >
                                        <option value="">Select Primary Department</option>
                                        {departments.map((d) => (
                                            <option key={d.id} value={d.id.toString()}>{d.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex flex-col gap-1.5 sm:col-span-2">
                                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                        Additional Department Pools (Multi-Department Pool)
                                    </label>
                                    <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                        {departments.map(d => {
                                            const isPrimary = formData.departmentId === d.id.toString()
                                            const isSelected = selectedDeptIds.includes(d.id) || isPrimary
                                            return (
                                                <button
                                                    type="button"
                                                    key={d.id}
                                                    disabled={isPrimary}
                                                    onClick={() => {
                                                        if (isPrimary) return
                                                        setSelectedDeptIds(prev =>
                                                            prev.includes(d.id)
                                                                ? prev.filter(id => id !== d.id)
                                                                : [...prev, d.id]
                                                        )
                                                    }}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                                        isPrimary
                                                            ? 'bg-slate-900 text-white border-slate-900 cursor-not-allowed'
                                                            : isSelected
                                                            ? 'bg-slate-800 text-white border-slate-800 shadow-2xs'
                                                            : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                                                    }`}
                                                >
                                                    {d.name} {isPrimary && '(Primary)'}
                                                </button>
                                            )
                                        })}
                                    </div>
                                    <span className="text-[11px] font-medium text-slate-500">
                                        One assistant can cover all doctors across multiple departments to optimize clinical costs.
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 pt-4 border-t border-slate-100">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                                <Clock size={16} />
                                <span>3. Qualifications & Operating Shifts</span>
                            </h3>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                    Qualifications & Diplomas
                                </label>
                                <input
                                    type="text"
                                    maxLength={100}
                                    placeholder="e.g. Diploma in General Nursing, Certified Medical Lab Technician (BSc MLT)"
                                    value={formData.qualifications}
                                    onChange={(e) => setFormData(prev => ({ ...prev, qualifications: e.target.value }))}
                                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 bg-white"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                        Shift Start (Pakistan Standard Time) <span className="text-rose-600">*</span>
                                    </label>
                                    <input
                                        type="time"
                                        required
                                        value={formData.shiftStart}
                                        onChange={(e) => setFormData(prev => ({ ...prev, shiftStart: e.target.value }))}
                                        className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 bg-white font-mono"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                        Shift End (Pakistan Standard Time) <span className="text-rose-600">*</span>
                                    </label>
                                    <input
                                        type="time"
                                        required
                                        value={formData.shiftEnd}
                                        onChange={(e) => setFormData(prev => ({ ...prev, shiftEnd: e.target.value }))}
                                        className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 bg-white font-mono"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-200 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setFormData(initialFormData)
                                    setViewMode('list')
                                }}
                                className="px-5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 shadow-sm transition-all disabled:opacity-50"
                            >
                                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                                <span>Register Clinical Assistant</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )
    }

    if (viewMode === 'edit' && selectedAssistant) {
        return (
            <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-12 animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                    <button
                        onClick={() => {
                            setSelectedAssistant(null)
                            setViewMode('list')
                        }}
                        className="flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-slate-950 transition-colors"
                    >
                        <ArrowLeft size={18} />
                        <span>Back to Clinical Assistants</span>
                    </button>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight">
                        Edit Assistant: {selectedAssistant.name}
                    </h1>
                    <div className="w-24"></div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col gap-6">
                    <div className="flex items-center gap-3.5 pb-5 border-b border-slate-100">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-900 border border-slate-300 flex items-center justify-center shrink-0">
                            <Edit3 size={20} />
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-lg font-black text-slate-900 tracking-tight">
                                {selectedAssistant.name}
                            </h2>
                            <p className="text-xs font-semibold text-slate-600 mt-0.5">
                                {selectedAssistant.email} &bull; Member since {new Date(selectedAssistant.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>

                    {errorMessage && (
                        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs font-bold text-rose-800">
                            <AlertCircle size={18} className="text-rose-600 shrink-0" />
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    <form onSubmit={handleEditSubmit} className="flex flex-col gap-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5 sm:col-span-2">
                                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                    Primary Assigned Department
                                </label>
                                <select
                                    value={editFormData.departmentId}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, departmentId: e.target.value }))}
                                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 bg-white focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
                                >
                                    <option value="">Select Primary Department</option>
                                    {departments.map((d) => (
                                        <option key={d.id} value={d.id.toString()}>{d.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-col gap-1.5 sm:col-span-2">
                                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                    Additional Department Pools (Multi-Department Pool)
                                </label>
                                <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                    {departments.map(d => {
                                        const isPrimary = editFormData.departmentId === d.id.toString()
                                        const isSelected = editDeptIds.includes(d.id) || isPrimary
                                        return (
                                            <button
                                                type="button"
                                                key={d.id}
                                                disabled={isPrimary}
                                                onClick={() => {
                                                    if (isPrimary) return
                                                    setEditDeptIds(prev =>
                                                        prev.includes(d.id)
                                                            ? prev.filter(id => id !== d.id)
                                                            : [...prev, d.id]
                                                    )
                                                }}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                                    isPrimary
                                                        ? 'bg-slate-900 text-white border-slate-900 cursor-not-allowed'
                                                        : isSelected
                                                        ? 'bg-slate-800 text-white border-slate-800 shadow-2xs'
                                                        : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                                                }`}
                                            >
                                                {d.name} {isPrimary && '(Primary)'}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                    Qualifications
                                </label>
                                <input
                                    type="text"
                                    maxLength={100}
                                    value={editFormData.qualifications}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, qualifications: e.target.value }))}
                                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 bg-white"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                    Contact Phone / Hotline
                                </label>
                                <input
                                    type="tel"
                                    maxLength={15}
                                    placeholder="03001234567 or +923001234567"
                                    value={editFormData.phoneNumber}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, phoneNumber: e.target.value.replace(/[^\d+]/g, '') }))}
                                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 bg-white"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                    Shift Start (PKT)
                                </label>
                                <input
                                    type="time"
                                    required
                                    value={editFormData.shiftStart}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, shiftStart: e.target.value }))}
                                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 bg-white font-mono"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                    Shift End (PKT)
                                </label>
                                <input
                                    type="time"
                                    required
                                    value={editFormData.shiftEnd}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, shiftEnd: e.target.value }))}
                                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 bg-white font-mono"
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-900">Active Duty Status</span>
                                <span className="text-xs font-medium text-slate-500">
                                    Allows or suspends assistant portal access to patient triage and lab desks.
                                </span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={editFormData.isActive}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                            </label>
                        </div>

                        <div className="pt-6 border-t border-slate-200 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedAssistant(null)
                                    setViewMode('list')
                                }}
                                className="px-5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 shadow-sm transition-all disabled:opacity-50"
                            >
                                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                                <span>Save Changes</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Clinical Assistants Management</h1>
                    <p className="text-sm font-medium text-slate-600 mt-1">Manage triage assistants, doctor assignments, and operational shifts</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchData}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs transition-all"
                    >
                        <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
                        <span>Refresh</span>
                    </button>

                    <button
                        onClick={() => {
                            setFormData(initialFormData)
                            setErrorMessage('')
                            setViewMode('add')
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 shadow-sm transition-all"
                    >
                        <UserPlus size={16} />
                        <span>Register Assistant</span>
                    </button>
                </div>
            </div>

            {successMessage && (
                <div className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between text-xs font-bold shadow-xs">
                    <div className="flex items-center gap-2.5">
                        <CheckCircle2 size={18} className="text-white shrink-0" />
                        <span>{successMessage}</span>
                    </div>
                    <button onClick={() => setSuccessMessage('')} className="text-slate-400 hover:text-white">
                        <X size={16} />
                    </button>
                </div>
            )}

            {errorMessage && (
                <div className="p-4 bg-slate-100 border border-slate-300 rounded-xl flex items-center justify-between text-xs text-slate-900 font-bold shadow-xs">
                    <div className="flex items-center gap-2.5">
                        <AlertCircle size={18} className="text-slate-900 shrink-0" />
                        <span>{errorMessage}</span>
                    </div>
                    <button onClick={() => setErrorMessage('')} className="text-slate-400 hover:text-slate-700">
                        <X size={16} />
                    </button>
                </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70">
                    <div className="relative w-full">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            maxLength={100}
                            placeholder="Search assistant by name, email, qualification, department, or doctor..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-800 bg-white"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto w-full">
                    <table className="w-full min-w-[1000px] text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-100/80 text-xs font-black text-slate-700 uppercase tracking-wider">
                                <th className="py-3.5 px-4 sm:px-6 w-12 text-slate-700">#</th>
                                <th className="py-3.5 px-4 sm:px-6">Assistant Profile</th>
                                <th className="py-3.5 px-4">Department Pool</th>
                                <th className="py-3.5 px-4">Qualifications</th>
                                <th className="py-3.5 px-4">Shift (PKT)</th>
                                <th className="py-3.5 px-4">Status</th>
                                <th className="py-3.5 px-4 sm:px-6 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="py-14 text-center text-slate-600">
                                        <div className="flex items-center justify-center gap-2.5">
                                            <Loader2 size={18} className="animate-spin text-slate-900" />
                                            <span className="text-sm font-bold text-slate-700">Loading assistant personnel...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredAssistants.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-14 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <UserCheck size={36} className="text-slate-400" />
                                            <span className="text-base font-bold text-slate-800">No medical assistants found</span>
                                            <span className="text-xs text-slate-500">Register assistants to enable patient triage and lab order processing</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredAssistants.slice((page - 1) * 20, page * 20).map((ast, index) => (
                                    <tr key={ast.id} className="hover:bg-slate-50/90 transition-colors">
                                        <td className="py-4 px-4 sm:px-6 font-bold text-slate-400 font-mono">
                                            {(page - 1) * 20 + index + 1}
                                        </td>
                                        <td className="py-4 px-4 sm:px-6">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-950">{ast.name}</span>
                                                <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 mt-0.5">
                                                    <Mail size={13} className="text-slate-500" />
                                                    {ast.email}
                                                </span>
                                                {ast.phoneNumber && (
                                                    <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 mt-0.5">
                                                        <Phone size={13} className="text-slate-500" />
                                                        {ast.phoneNumber}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 text-slate-700 text-sm font-medium capitalize">
                                            {ast.departmentNames && ast.departmentNames.length > 0 ? (
                                                ast.departmentNames.join(', ')
                                            ) : (
                                                ast.departmentName || 'General OPD'
                                            )}
                                        </td>
                                        <td className="py-4 px-4 text-slate-700 text-sm font-medium max-w-xs truncate" title={ast.qualifications}>
                                            {ast.qualifications || 'Certified Clinical Assistant'}
                                        </td>
                                        <td className="py-4 px-4 text-slate-700 text-sm font-medium font-mono">
                                            {ast.shiftStart?.substring(0, 5)} - {ast.shiftEnd?.substring(0, 5)}
                                        </td>
                                        <td className="py-4 px-4 text-slate-700 text-sm font-medium">
                                            {ast.isActive ? 'Active' : 'Inactive'}
                                        </td>
                                        <td className="py-4 px-4 sm:px-6 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleOpenEdit(ast)}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
                                                    title="Edit assistant profile"
                                                >
                                                    <Edit3 size={13} />
                                                    <span>Edit</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteAssistant(ast.id, ast.name)}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-white border border-rose-200 hover:bg-rose-50 transition-colors cursor-pointer"
                                                    title="Delete assistant"
                                                >
                                                    <Trash2 size={13} />
                                                    <span>Delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination
                    currentPage={page}
                    totalItems={filteredAssistants.length}
                    pageSize={20}
                    onPageChange={setPage}
                />
            </div>
        </div>
    )
}

export default AdminAssistants
