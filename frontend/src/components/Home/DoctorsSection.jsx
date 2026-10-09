import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { 
    Search, 
    Stethoscope, 
    Clock, 
    DollarSign, 
    Calendar, 
    ChevronRight, 
    Building2, 
    Loader2,
    PhoneCall
} from 'lucide-react'
import axios from '../../api/axios'
import useAuth from '../../hooks/useAuth'

const DoctorsSection = ({ selectedDepartmentFilter, onClearDepartmentFilter }) => {
    const navigate = useNavigate()
    const { auth } = useAuth()

    const [doctors, setDoctors] = useState([])
    const [departments, setDepartments] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [activeDept, setActiveDept] = useState('All')
    const [visibleCount, setVisibleCount] = useState(8)

    useEffect(() => {
        if (selectedDepartmentFilter) {
            setActiveDept(selectedDepartmentFilter.toLowerCase())
        }
    }, [selectedDepartmentFilter])

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [docsRes, deptsRes] = await Promise.all([
                    axios.get('/Admin'),
                    axios.get('/Department')
                ])
                if (Array.isArray(docsRes.data)) {
                    setDoctors(docsRes.data)
                }
                if (Array.isArray(deptsRes.data)) {
                    setDepartments(deptsRes.data)
                }
            } catch {
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const filteredDoctors = doctors.filter((doc) => {
        const matchesSearch = 
            (doc.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (doc.specialization || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (doc.departmentName || '').toLowerCase().includes(searchQuery.toLowerCase())

        const matchesDept = 
            activeDept === 'All' || 
            (doc.departmentName || '').toLowerCase() === activeDept.toLowerCase()

        return matchesSearch && matchesDept
    })

    const displayedDoctors = filteredDoctors.slice(0, visibleCount)

    const handleViewDoctor = (docId) => {
        navigate(`/doctor-profile/${docId}`)
    }

    const formatTime = (timeStr = '') => {
        if (!timeStr) return '09:00 AM'
        const parts = timeStr.split(':')
        const h = parseInt(parts[0], 10)
        const m = parts[1] || '00'
        const ampm = h >= 12 ? 'PM' : 'AM'
        const hour12 = h % 12 || 12
        return `${hour12.toString().padStart(2, '0')}:${m} ${ampm}`
    }

    return (
        <section id="doctors" className="py-16 px-6 lg:px-16 max-w-7xl mx-auto w-full border-t border-slate-200/80">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-3 py-1 rounded-full border border-sky-100">
                        Medical Team
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
                        Find & Consult Leading Doctors
                    </h2>
                    <p className="text-sm text-slate-600 mt-1 max-w-xl">
                        Schedule immediate clinical consultations with certified department heads and healthcare practitioners.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-600">
                        {filteredDoctors.length} Specialists Available
                    </span>
                </div>
            </div>

            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 w-full md:max-w-md shadow-xs focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/10 transition-all">
                    <Search size={16} className="text-slate-400 shrink-0" />
                    <input
                        type="text"
                        placeholder="Search by physician name, department, or specialization..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-transparent border-none outline-none text-xs sm:text-sm text-slate-800 placeholder:text-slate-400"
                    />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    <button
                        onClick={() => {
                            setActiveDept('All')
                            onClearDepartmentFilter?.()
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                            activeDept === 'All'
                                ? 'bg-slate-900 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                    >
                        All Disciplines
                    </button>
                    {departments.map((d) => {
                        const isSelected = activeDept.toLowerCase() === d.name.toLowerCase()
                        return (
                            <button
                                key={d.id}
                                onClick={() => setActiveDept(d.name.toLowerCase())}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize whitespace-nowrap transition-colors cursor-pointer ${
                                    isSelected
                                        ? 'bg-sky-600 text-white'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                            >
                                {d.name}
                            </button>
                        )
                    })}
                </div>
            </div>

            <div className="mb-6 p-4 bg-slate-50 border border-slate-200/90 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-700 shadow-2xs">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <PhoneCall size={15} />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm">Assisted Phone & Walk-In Reservations</span>
                        <span className="text-[11px] text-slate-500 font-medium">Elderly or non-tech-savvy patients can call the doctor's clinical assistant hotline directly to book.</span>
                    </div>
                </div>
                <span className="text-[11px] font-bold text-slate-700 bg-white px-3 py-1 rounded-lg border border-slate-300 self-start sm:self-auto shrink-0">
                    Triage Dispatch Active
                </span>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
                    <p className="text-xs font-semibold text-slate-600">Loading verified clinical specialists...</p>
                </div>
            ) : filteredDoctors.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center gap-2">
                    <Stethoscope size={28} className="text-slate-400 mb-1" />
                    <h3 className="text-sm font-bold text-slate-900">No Specialists Matched</h3>
                    <p className="text-xs text-slate-500 max-w-sm">
                        No doctors match the specified filter criteria. Please try searching with a different term.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {displayedDoctors.map((doc) => (
                        <div
                            key={doc.id}
                            className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all flex flex-col justify-between"
                        >
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-xl bg-sky-50 border border-sky-100 text-sky-700 font-extrabold text-sm flex items-center justify-center shrink-0">
                                        {(doc.name || 'D').replace('Dr. ', '').charAt(0)}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <h3 className="text-sm font-bold text-slate-900 truncate">
                                            {doc.name}
                                        </h3>
                                        <span className="text-xs font-semibold text-sky-700 truncate capitalize">
                                            {doc.departmentName}
                                        </span>
                                    </div>
                                </div>

                                <div className="text-xs text-slate-600 font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                    <span className="text-slate-400 block text-[11px]">Specialization</span>
                                    <span className="font-semibold text-slate-800 line-clamp-1">{doc.specialization}</span>
                                </div>

                                <div className="flex flex-col gap-1.5 text-xs font-medium text-slate-600">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500 flex items-center gap-1">
                                            <Clock size={12} />
                                            <span>Shift Hours:</span>
                                        </span>
                                        <span className="font-bold text-slate-800">
                                            {formatTime(doc.shiftStart)} - {formatTime(doc.shiftEnd)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500 flex items-center gap-1">
                                            <DollarSign size={12} />
                                            <span>Consultation:</span>
                                        </span>
                                        <span className="font-extrabold text-slate-900">
                                            ${Number(doc.consultationFee || 0).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2.5">
                                {doc.assistantPhone && (
                                    <a
                                        href={`tel:${doc.assistantPhone}`}
                                        title={`Call Assistant ${doc.assistantName ? `(${doc.assistantName})` : ''} for phone booking`}
                                        className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs transition-colors border border-slate-200 shadow-2xs"
                                    >
                                        <PhoneCall size={13} className="text-slate-700 shrink-0" />
                                        <span className="truncate">Call Assistant: {doc.assistantPhone}</span>
                                    </a>
                                )}

                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-slate-600">
                                        Available
                                    </span>
                                    <button
                                        onClick={() => handleViewDoctor(doc.id)}
                                        className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                                    >
                                        <span>Book Online</span>
                                        <ChevronRight size={13} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {filteredDoctors.length > visibleCount && (
                <div className="flex items-center justify-center mt-10">
                    <button
                        onClick={() => setVisibleCount((prev) => Math.min(prev + 8, filteredDoctors.length))}
                        className="px-6 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 shadow-xs transition-all cursor-pointer"
                    >
                        View More Specialists ({filteredDoctors.length - visibleCount} remaining)
                    </button>
                </div>
            )}
        </section>
    )
}

export default DoctorsSection
