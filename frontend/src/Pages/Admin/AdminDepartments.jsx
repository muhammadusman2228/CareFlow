import { useState, useEffect, useMemo } from 'react'
import { 
    Building2, 
    Plus, 
    Search, 
    Users, 
    CheckCircle2, 
    AlertCircle, 
    X, 
    Loader2, 
    Layers, 
    Activity, 
    ShieldCheck, 
    Sparkles 
} from 'lucide-react'
import useAxiosPrivate from '../../hooks/useAxiosPrivate'

const AdminDepartments = () => {
    const axiosPrivate = useAxiosPrivate()

    const [departments, setDepartments] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const [successDepartment, setSuccessDepartment] = useState(null)

    const [formData, setFormData] = useState({
        name: '',
        description: ''
    })

    const fetchDepartments = async () => {
        setIsLoading(true)
        try {
            const response = await axiosPrivate.get('/Department')
            if (Array.isArray(response.data)) {
                setDepartments(response.data)
            } else {
                setDepartments([])
            }
        } catch {
            setDepartments([])
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchDepartments()
    }, [])

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        if (errorMessage) setErrorMessage('')
    }

    const resetForm = () => {
        setFormData({
            name: '',
            description: ''
        })
        setErrorMessage('')
        setSuccessDepartment(null)
    }

    const handleOpenModal = () => {
        resetForm()
        setIsModalOpen(true)
    }

    const handleCloseModal = () => {
        setIsModalOpen(false)
        resetForm()
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!formData.name.trim()) {
            setErrorMessage('Department name is required.')
            return
        }

        if (!formData.description.trim()) {
            setErrorMessage('Department description is required.')
            return
        }

        setIsSubmitting(true)
        setErrorMessage('')

        try {
            const payload = {
                name: formData.name.trim(),
                description: formData.description.trim()
            }

            const response = await axiosPrivate.post('/Department', payload)
            const created = response.data

            setSuccessDepartment({
                id: created.id,
                name: created.name || payload.name,
                description: created.description || payload.description,
                doctorCounts: created.doctorCounts || 0
            })

            fetchDepartments()
        } catch (err) {
            const serverMsg = err.response?.data?.message || err.response?.data?.title || 'Failed to register department. Please verify details.'
            setErrorMessage(serverMsg)
        } finally {
            setIsSubmitting(false)
        }
    }

    const filteredDepartments = useMemo(() => {
        const query = searchQuery.trim().toLowerCase()
        if (!query) return departments

        return departments.filter(dept => 
            dept.name?.toLowerCase().includes(query) ||
            dept.description?.toLowerCase().includes(query) ||
            dept.id?.toString().includes(query)
        )
    }, [departments, searchQuery])

    const totalSpecialists = useMemo(() => {
        return departments.reduce((acc, curr) => acc + (curr.doctorCounts || 0), 0)
    }, [departments])

    const averageDoctors = useMemo(() => {
        if (departments.length === 0) return 0
        return (totalSpecialists / departments.length).toFixed(1)
    }, [departments, totalSpecialists])

    return (
        <div className="departments-page flex flex-col gap-6 max-w-7xl mx-auto">
            
            <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="title-block flex flex-col">
                    <div className="title-row flex items-center gap-3">
                        <div className="header-icon-box w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shadow-xs">
                            <Building2 size={22} />
                        </div>
                        <div>
                            <h1 className="page-title text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                                Departments Management
                            </h1>
                            <p className="page-subtitle text-xs sm:text-sm text-slate-500 font-medium">
                                Configure clinical units, operational capacities, and staff allocations
                            </p>
                        </div>
                    </div>
                </div>

                <div className="action-block flex items-center gap-3">
                    <button
                        type="button"
                        onClick={handleOpenModal}
                        className="add-department-btn inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-semibold shadow-sm shadow-sky-600/25 transition-all cursor-pointer"
                    >
                        <Plus size={18} strokeWidth={2.5} />
                        <span>Add Department</span>
                    </button>
                </div>
            </div>

            <div className="kpi-summary-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="kpi-card bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm shadow-slate-200/80 hover:shadow-md transition-all flex items-center gap-4">
                    <div className="kpi-icon-box w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shrink-0">
                        <Layers size={22} />
                    </div>
                    <div className="kpi-details flex flex-col min-w-0">
                        <span className="kpi-label text-xs font-semibold text-slate-500">
                            Total Departments
                        </span>
                        <span className="kpi-value text-2xl font-extrabold text-slate-900 tracking-tight">
                            {departments.length}
                        </span>
                        <span className="kpi-subtext text-[11px] font-medium text-slate-400 mt-0.5">
                            Active clinical specialties
                        </span>
                    </div>
                </div>

                <div className="kpi-card bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm shadow-slate-200/80 hover:shadow-md transition-all flex items-center gap-4">
                    <div className="kpi-icon-box w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                        <Users size={22} />
                    </div>
                    <div className="kpi-details flex flex-col min-w-0">
                        <span className="kpi-label text-xs font-semibold text-slate-500">
                            Total Specialists
                        </span>
                        <span className="kpi-value text-2xl font-extrabold text-slate-900 tracking-tight">
                            {totalSpecialists}
                        </span>
                        <span className="kpi-subtext text-[11px] font-medium text-emerald-600 mt-0.5">
                            Assigned doctors across units
                        </span>
                    </div>
                </div>

                <div className="kpi-card bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm shadow-slate-200/80 hover:shadow-md transition-all flex items-center gap-4">
                    <div className="kpi-icon-box w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                        <Activity size={22} />
                    </div>
                    <div className="kpi-details flex flex-col min-w-0">
                        <span className="kpi-label text-xs font-semibold text-slate-500">
                            Avg Staffing Ratio
                        </span>
                        <span className="kpi-value text-2xl font-extrabold text-slate-900 tracking-tight">
                            {averageDoctors}
                        </span>
                        <span className="kpi-subtext text-[11px] font-medium text-slate-400 mt-0.5">
                            Physicians per department
                        </span>
                    </div>
                </div>

                <div className="kpi-card bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm shadow-slate-200/80 hover:shadow-md transition-all flex items-center gap-4">
                    <div className="kpi-icon-box w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                        <ShieldCheck size={22} />
                    </div>
                    <div className="kpi-details flex flex-col min-w-0">
                        <span className="kpi-label text-xs font-semibold text-slate-500">
                            System Status
                        </span>
                        <span className="kpi-value text-2xl font-extrabold text-emerald-600 tracking-tight">
                            100%
                        </span>
                        <span className="kpi-subtext text-[11px] font-medium text-slate-400 mt-0.5">
                            All departments operational
                        </span>
                    </div>
                </div>
            </div>

            <div className="toolbar-section flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-sm shadow-slate-200/80">
                <div className="search-box relative flex items-center flex-1 max-w-md border border-slate-300 rounded-xl px-3 py-2 bg-white shadow-xs focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/10 transition-all">
                    <Search size={18} className="text-slate-400 shrink-0 mr-2.5" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search department name or description..."
                        className="search-input w-full bg-transparent border-none outline-none text-xs sm:text-sm text-slate-800 placeholder-slate-400"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            className="clear-search-btn text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                <div className="toolbar-stats flex items-center gap-2 text-xs font-semibold text-slate-500 px-1">
                    <span>Showing</span>
                    <span className="font-bold text-slate-800">{filteredDepartments.length}</span>
                    <span>of</span>
                    <span className="font-bold text-slate-800">{departments.length}</span>
                    <span>Departments</span>
                </div>
            </div>

            {isLoading ? (
                <div className="skeleton-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[1, 2, 3, 4, 5, 6].map(item => (
                        <div 
                            key={item}
                            className="skeleton-card bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm shadow-slate-200/80 animate-pulse flex flex-col gap-4"
                        >
                            <div className="skeleton-top flex items-center justify-between">
                                <div className="w-12 h-12 rounded-xl bg-slate-200" />
                                <div className="w-16 h-4 rounded bg-slate-200" />
                            </div>
                            <div className="w-3/4 h-5 rounded-md bg-slate-200" />
                            <div className="w-full h-14 rounded-md bg-slate-100" />
                            <div className="skeleton-bottom pt-3 border-t border-slate-100 flex items-center justify-between">
                                <div className="w-24 h-6 rounded-lg bg-slate-200" />
                                <div className="w-12 h-4 rounded-md bg-slate-200" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredDepartments.length === 0 ? (
                <div className="empty-state-card bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center shadow-sm shadow-slate-200/80 flex flex-col items-center justify-center">
                    <div className="empty-icon-box w-16 h-16 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 mb-3 shadow-xs">
                        <Building2 size={32} />
                    </div>
                    <h3 className="empty-title text-base font-bold text-slate-800">
                        {searchQuery ? 'No Matching Departments' : 'No Departments Registered'}
                    </h3>
                    <p className="empty-subtitle text-xs text-slate-500 mt-1 max-w-sm">
                        {searchQuery 
                            ? `No clinical units matched "${searchQuery}". Try a different keyword.` 
                            : 'Initialize your hospital structure by registering the first clinical department.'}
                    </p>
                    {searchQuery ? (
                        <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            className="reset-search-btn mt-4 px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                            Clear Search Filter
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleOpenModal}
                            className="create-first-btn mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700 transition-colors cursor-pointer shadow-sm shadow-sky-600/25"
                        >
                            <Plus size={16} />
                            <span>Add Department</span>
                        </button>
                    )}
                </div>
            ) : (
                <div className="departments-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredDepartments.map((dept) => (
                        <div 
                            key={dept.id}
                            className="department-card bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm shadow-slate-200/80 hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between group"
                        >
                            <div className="card-top-content flex flex-col gap-3.5">
                                <div className="card-header flex items-center justify-between">
                                    <div className="dept-icon-box w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-colors shrink-0 shadow-xs">
                                        <Building2 size={22} />
                                    </div>
                                    <span className="dept-status text-xs font-medium text-slate-500">
                                        Operational
                                    </span>
                                </div>

                                <div className="dept-info flex flex-col">
                                    <h3 className="dept-title text-base sm:text-lg font-bold text-slate-900 tracking-tight capitalize group-hover:text-sky-600 transition-colors">
                                        {dept.name}
                                    </h3>
                                    <p className="dept-description text-xs sm:text-sm text-slate-600 leading-relaxed mt-1 line-clamp-3 min-h-[4rem]">
                                        {dept.description || 'Clinical specialty unit providing medical care and diagnostic consultations.'}
                                    </p>
                                </div>
                            </div>

                            <div className="card-footer pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                                <div className="doctor-count-badge inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-bold text-slate-700">
                                    <Users size={14} className="text-sky-600" />
                                    <span>{dept.doctorCounts} Specialists</span>
                                </div>

                                <span className="dept-id-badge text-[11px] font-bold text-slate-400 font-mono">
                                    ID #{dept.id}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="modal-backdrop fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="modal-container bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
                        
                        <div className="modal-header px-6 py-4.5 border-b border-slate-100 flex items-center justify-between">
                            <div className="header-titles flex flex-col">
                                <h2 className="modal-title text-lg font-bold text-slate-900 tracking-tight">
                                    {successDepartment ? 'Department Registration' : 'Register New Department'}
                                </h2>
                                <p className="modal-subtitle text-xs text-slate-500 font-medium">
                                    {successDepartment 
                                        ? 'Clinical specialty registered and operational' 
                                        : 'Define department title and clinical scope of care'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                disabled={isSubmitting}
                                className="close-btn text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {successDepartment ? (
                            <div className="department-success-card p-6 sm:p-8 flex flex-col items-center text-center">
                                <div className="success-icon-box w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4 shadow-xs">
                                    <CheckCircle2 size={36} />
                                </div>

                                <h3 className="success-title text-xl font-bold text-slate-900">
                                    Department Registered Successfully!
                                </h3>
                                <p className="success-subtext text-xs sm:text-sm text-slate-500 mt-1 max-w-md">
                                    The clinical unit has been activated and is ready to host physician schedules and patient bookings.
                                </p>

                                <div className="department-details-box w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-4 my-5 flex flex-col gap-2.5 text-left text-xs">
                                    <div className="detail-row flex items-center justify-between">
                                        <span className="text-slate-500 font-medium">Department Title:</span>
                                        <span className="text-sky-700 font-bold capitalize">{successDepartment.name}</span>
                                    </div>
                                    <div className="detail-row flex items-center justify-between">
                                        <span className="text-slate-500 font-medium">Department Unit ID:</span>
                                        <span className="text-slate-900 font-mono font-bold">#{successDepartment.id}</span>
                                    </div>
                                    <div className="detail-row flex flex-col gap-1 border-t border-slate-200/60 pt-2">
                                        <span className="text-slate-500 font-medium">Clinical Scope:</span>
                                        <span className="text-slate-700 leading-relaxed">{successDepartment.description}</span>
                                    </div>
                                </div>

                                <div className="verification-notice-banner w-full p-3.5 rounded-xl bg-sky-50 border border-sky-200/80 flex items-start gap-3 text-left">
                                    <Sparkles size={20} className="text-sky-600 shrink-0 mt-0.5" />
                                    <div className="notice-text">
                                        <p className="text-xs font-bold text-sky-900">Immediate System Availability</p>
                                        <p className="text-[11px] text-sky-700 mt-0.5 leading-relaxed">
                                            This department is now available across the doctor registration dropdown and patient appointment booking modules.
                                        </p>
                                    </div>
                                </div>

                                <div className="modal-actions-row flex items-center justify-end gap-3 w-full mt-6 pt-4 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="register-another-btn px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                                    >
                                        Add Another Department
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="done-btn px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-semibold shadow-sm shadow-sky-600/20 transition-all cursor-pointer"
                                    >
                                        Done
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="modal-form p-6 flex flex-col gap-4">
                                {errorMessage && (
                                    <div className="alert-error p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                                        <AlertCircle size={16} className="shrink-0" />
                                        <span>{errorMessage}</span>
                                    </div>
                                )}

                                <div className="form-group flex flex-col gap-1.5">
                                    <label className="form-label text-xs font-bold text-slate-700">
                                        Department Name <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Oncology, Radiology, Orthopedics"
                                        className="form-input px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-sky-500 focus:ring-3 focus:ring-sky-500/10 text-slate-900"
                                        disabled={isSubmitting}
                                    />
                                </div>

                                <div className="form-group flex flex-col gap-1.5">
                                    <label className="form-label text-xs font-bold text-slate-700">
                                        Clinical Description <span className="text-rose-500">*</span>
                                    </label>
                                    <textarea
                                        rows={4}
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        placeholder="Outline clinical treatments, specialized procedures, and inpatient/outpatient coverage..."
                                        className="form-textarea px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-sky-500 focus:ring-3 focus:ring-sky-500/10 text-slate-900 resize-none"
                                        disabled={isSubmitting}
                                    />
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
                                            <span>Create Department</span>
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

export default AdminDepartments
