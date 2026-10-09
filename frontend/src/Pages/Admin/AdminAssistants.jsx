import { useState, useEffect } from 'react'
import { 
    UserCheck, 
    UserPlus, 
    Search, 
    Mail, 
    Building2, 
    Stethoscope, 
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

const AdminAssistants = () => {
    const axiosPrivate = useAxiosPrivate()

    const [viewMode, setViewMode] = useState('list')
    const [assistants, setAssistants] = useState([])
    const [departments, setDepartments] = useState([])
    const [doctors, setDoctors] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [departmentFilter, setDepartmentFilter] = useState('ALL')

    const [selectedAssistant, setSelectedAssistant] = useState(null)
    const [showPassword, setShowPassword] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const [successMessage, setSuccessMessage] = useState('')

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
        setIsSubmitting(true)
        setErrorMessage('')
        setSuccessMessage('')

        try {
            const payload = {
                name: formData.name.trim(),
                email: formData.email.trim(),
                phoneNumber: formData.phoneNumber.trim(),
                password: formData.password,
                departmentId: formData.departmentId ? parseInt(formData.departmentId) : null,
                doctorId: formData.doctorId ? parseInt(formData.doctorId) : null,
                qualifications: formData.qualifications.trim(),
                shiftStart: formData.shiftStart.length === 5 ? `${formData.shiftStart}:00` : formData.shiftStart,
                shiftEnd: formData.shiftEnd.length === 5 ? `${formData.shiftEnd}:00` : formData.shiftEnd
            }

            await axiosPrivate.post('/Assistant/register', payload)
            setSuccessMessage(`Assistant ${formData.name} successfully registered.`)
            setFormData(initialFormData)
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
        setEditFormData({
            phoneNumber: assistant.phoneNumber || '',
            departmentId: assistant.departmentId ? assistant.departmentId.toString() : '',
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
            const payload = {
                phoneNumber: editFormData.phoneNumber.trim(),
                departmentId: editFormData.departmentId ? parseInt(editFormData.departmentId) : null,
                doctorId: editFormData.doctorId ? parseInt(editFormData.doctorId) : null,
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
        const matchesSearch = 
            a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (a.phoneNumber && a.phoneNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (a.qualifications && a.qualifications.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (a.doctorName && a.doctorName.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (a.departmentName && a.departmentName.toLowerCase().includes(searchQuery.toLowerCase()))
        
        const matchesDept = 
            departmentFilter === 'ALL' || 
            (a.departmentId && a.departmentId.toString() === departmentFilter)

        return matchesSearch && matchesDept
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
                                        placeholder="e.g. Fatima Tariq"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
                                        placeholder="03001234567 or +923001234567"
                                        value={formData.phoneNumber}
                                        onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
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
                                <span>2. Clinical Station & Doctor Assignment</span>
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                        Clinical Department
                                    </label>
                                    <select
                                        value={formData.departmentId}
                                        onChange={(e) => setFormData(prev => ({ ...prev, departmentId: e.target.value }))}
                                        className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 bg-white focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
                                    >
                                        <option value="">General Hospital OPD Pool</option>
                                        {departments.map((d) => (
                                            <option key={d.id} value={d.id.toString()}>{d.name}</option>
                                        ))}
                                    </select>
                                    <span className="text-[11px] font-medium text-slate-500">
                                        Assigning a department allows this assistant to triage patients for all doctors in that department.
                                    </span>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                        Dedicated Doctor Assignment
                                    </label>
                                    <select
                                        value={formData.doctorId}
                                        onChange={(e) => setFormData(prev => ({ ...prev, doctorId: e.target.value }))}
                                        className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 bg-white focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
                                    >
                                        <option value="">No Dedicated Doctor (Department Pool)</option>
                                        {doctors.map((doc) => (
                                            <option key={doc.id} value={doc.id.toString()}>{doc.name} ({doc.specialization})</option>
                                        ))}
                                    </select>
                                    <span className="text-[11px] font-medium text-slate-500">
                                        Select a specific physician if this assistant works exclusively as their dedicated triage clerk.
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
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                    Clinical Department
                                </label>
                                <select
                                    value={editFormData.departmentId}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, departmentId: e.target.value }))}
                                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 bg-white focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
                                >
                                    <option value="">General Hospital OPD Pool</option>
                                    {departments.map((d) => (
                                        <option key={d.id} value={d.id.toString()}>{d.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                    Doctor Assignment
                                </label>
                                <select
                                    value={editFormData.doctorId}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, doctorId: e.target.value }))}
                                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 bg-white focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
                                >
                                    <option value="">Departmental / No Dedicated Doctor</option>
                                    {doctors.map((doc) => (
                                        <option key={doc.id} value={doc.id.toString()}>{doc.name} ({doc.specialization})</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                    Qualifications
                                </label>
                                <input
                                    type="text"
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
                                    placeholder="03001234567 or +923001234567"
                                    value={editFormData.phoneNumber}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
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
                <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/70">
                    <div className="relative flex-1 max-w-md">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search assistant by name, email, qualification, or doctor..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-800 bg-white"
                        />
                    </div>

                    <div className="flex items-center gap-2.5">
                        <span className="text-xs font-bold text-slate-700 whitespace-nowrap">Filter Department:</span>
                        <select
                            value={departmentFilter}
                            onChange={(e) => setDepartmentFilter(e.target.value)}
                            className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:border-slate-800 font-bold"
                        >
                            <option value="ALL">All Departments</option>
                            {departments.map((dept) => (
                                <option key={dept.id} value={dept.id.toString()}>{dept.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-100/80 text-xs font-black text-slate-700 uppercase tracking-wider">
                                <th className="py-3.5 px-4 sm:px-6">Assistant Profile</th>
                                <th className="py-3.5 px-4">Department</th>
                                <th className="py-3.5 px-4">Assigned Doctor</th>
                                <th className="py-3.5 px-4">Qualifications</th>
                                <th className="py-3.5 px-4">Shift (PKT)</th>
                                <th className="py-3.5 px-4">Status</th>
                                <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
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
                                filteredAssistants.map((ast) => (
                                    <tr key={ast.id} className="hover:bg-slate-50/90 transition-colors">
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
                                        <td className="py-4 px-4 text-slate-800">
                                            {ast.departmentName ? (
                                                <span className="inline-flex items-center gap-1.5 font-bold text-slate-900">
                                                    <Building2 size={14} className="text-slate-600" />
                                                    {ast.departmentName}
                                                </span>
                                            ) : (
                                                <span className="text-slate-500 font-semibold italic">General OPD</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-4 text-slate-800">
                                            {ast.doctorName ? (
                                                <span className="inline-flex items-center gap-1.5 font-bold text-slate-900">
                                                    <Stethoscope size={14} className="text-slate-600" />
                                                    {ast.doctorName}
                                                </span>
                                            ) : (
                                                <span className="text-slate-500 font-semibold italic">Department Pool</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-4 text-slate-800 font-semibold max-w-xs truncate" title={ast.qualifications}>
                                            {ast.qualifications || 'Certified Clinical Assistant'}
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="inline-flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-300 font-mono text-xs font-bold text-slate-900">
                                                <Clock size={13} className="text-slate-700" />
                                                {ast.shiftStart?.substring(0, 5)} - {ast.shiftEnd?.substring(0, 5)}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4">
                                            {ast.isActive ? (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-black bg-slate-900 text-white shadow-2xs">
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-black bg-slate-100 text-slate-700 border border-slate-300">
                                                    Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-4 px-4 sm:px-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenEdit(ast)}
                                                    className="p-2 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
                                                    title="Edit assistant profile"
                                                >
                                                    <Edit3 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteAssistant(ast.id, ast.name)}
                                                    className="p-2 rounded-xl text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                                                    title="Delete assistant"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default AdminAssistants
