import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { 
    CalendarCheck, 
    Search, 
    Check, 
    X, 
    FileText, 
    RefreshCw, 
    FolderClock,
    AlertCircle,
    Stethoscope
} from 'lucide-react'
import useAxiosPrivate from '../../hooks/useAxiosPrivate'
import DoctorPrescriptionModal from './DoctorPrescriptionModal'
import Pagination from '../../components/common/Pagination'

const DoctorAppointments = () => {
    const axiosPrivate = useAxiosPrivate()
    const navigate = useNavigate()

    const [appointments, setAppointments] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedTab, setSelectedTab] = useState('All')
    const [dateScope, setDateScope] = useState('All')
    const [page, setPage] = useState(1)
    const [activeAppointment, setActiveAppointment] = useState(null)
    const [actionLoadingId, setActionLoadingId] = useState(null)
    const [noShowTargetAppointment, setNoShowTargetAppointment] = useState(null)
    const [error, setError] = useState(null)

    const todayDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi' }).format(new Date())

    const fetchAppointments = async () => {
        try {
            setLoading(true)
            setError(null)
            const res = await axiosPrivate.get('/Doctor/doctor-appointments')
            setAppointments(Array.isArray(res.data) ? res.data : [])
        } catch {
            setError('Failed to load appointments list.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAppointments()
    }, [])

    useEffect(() => {
        setPage(1)
    }, [selectedTab, dateScope, searchQuery])

    const handleUpdateStatus = async (appointmentId, status) => {
        try {
            setActionLoadingId(appointmentId)
            await axiosPrivate.patch('/Doctor/appointment-status', {
                appointmentId,
                status
            })
            await fetchAppointments()
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update status.')
        } finally {
            setActionLoadingId(null)
        }
    }

    const handleStartConsultation = async (appt) => {
        if (appt.status === 'CheckedIn') {
            try {
                setActionLoadingId(appt.appointmentId)
                await axiosPrivate.patch('/Doctor/appointment-status', {
                    appointmentId: appt.appointmentId,
                    status: 'InProgress'
                })
                setAppointments(prev => prev.map(a => 
                    a.appointmentId === appt.appointmentId ? { ...a, status: 'InProgress' } : a
                ))
                setActiveAppointment({ ...appt, status: 'InProgress' })
            } catch {
                setActiveAppointment(appt)
            } finally {
                setActionLoadingId(null)
            }
        } else {
            setActiveAppointment(appt)
        }
    }

    const filteredAppointments = appointments.filter(a => {
        const matchesTab = selectedTab === 'All' 
            || (selectedTab === 'Booked' ? (a.status === 'Booked' || a.status === 'Confirmed' || a.status === 'Pending') : a.status === selectedTab)
        
        let matchesDate = true
        if (dateScope === 'Today') {
            matchesDate = a.appointmentDate === todayDateStr
        } else if (dateScope === 'Upcoming') {
            matchesDate = a.appointmentDate > todayDateStr
        } else if (dateScope === 'Past') {
            matchesDate = a.appointmentDate < todayDateStr
        }

        const matchesSearch = 
            a.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.symptoms?.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesTab && matchesDate && matchesSearch
    })

    const tabs = ['All', 'Booked', 'CheckedIn', 'InProgress', 'Completed', 'Cancelled', 'Missed']

    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Consultation Appointments</h1>
                    <p className="text-xs text-slate-500">Manage patient bookings, confirm schedules, and issue medical notes</p>
                </div>

                <button
                    onClick={fetchAppointments}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200/90 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-all self-start sm:self-auto"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    <span>Refresh</span>
                </button>
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-xl shadow-slate-900/10 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 flex flex-col gap-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                            {tabs.map((tab) => {
                                const count = tab === 'All' 
                                    ? appointments.length 
                                    : tab === 'Booked'
                                    ? appointments.filter(a => a.status === 'Booked' || a.status === 'Confirmed' || a.status === 'Pending').length
                                    : appointments.filter(a => a.status === tab).length
                                const isActive = selectedTab === tab
                                return (
                                    <button
                                        key={tab}
                                        onClick={() => setSelectedTab(tab)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                                            isActive
                                                ? 'bg-slate-900 text-white shadow-xs'
                                                : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                        }`}
                                    >
                                        <span>{tab === 'InProgress' ? 'In Progress' : tab === 'CheckedIn' ? 'Checked In' : tab}</span>
                                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                                            isActive ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-600'
                                        }`}>
                                            {count}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>

                        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 w-full md:w-72">
                            <Search size={15} className="text-slate-400 shrink-0" />
                            <input
                                type="text"
                                placeholder="Filter by patient or symptoms..."
                                value={searchQuery}
                                maxLength={100}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-transparent border-none outline-none text-xs text-slate-800 placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Date:</span>
                        {[
                            { id: 'All', label: 'All Dates' },
                            { id: 'Today', label: `Today (${appointments.filter(a => a.appointmentDate === todayDateStr).length})` },
                            { id: 'Upcoming', label: `Upcoming (${appointments.filter(a => a.appointmentDate > todayDateStr).length})` },
                            { id: 'Past', label: `Past (${appointments.filter(a => a.appointmentDate < todayDateStr).length})` }
                        ].map((d) => (
                            <button
                                key={d.id}
                                onClick={() => setDateScope(d.id)}
                                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                                    dateScope === d.id
                                        ? 'bg-sky-600 text-white shadow-xs font-bold'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                                }`}
                            >
                                {d.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/75">
                                <th className="px-5 py-3.5 text-xs font-bold text-slate-700 uppercase tracking-wider w-12">#</th>
                                <th className="px-5 py-3.5 text-xs font-bold text-slate-700 uppercase tracking-wider">Patient</th>
                                <th className="px-5 py-3.5 text-xs font-bold text-slate-700 uppercase tracking-wider">Schedule</th>
                                <th className="px-5 py-3.5 text-xs font-bold text-slate-700 uppercase tracking-wider">Symptoms / Chief Complaint</th>
                                <th className="px-5 py-3.5 text-xs font-bold text-slate-700 uppercase tracking-wider text-center">Status</th>
                                <th className="px-5 py-3.5 text-xs font-bold text-slate-700 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredAppointments.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500 font-medium">
                                        No appointments match this filter.
                                    </td>
                                </tr>
                            ) : (
                                filteredAppointments.slice((page - 1) * 20, page * 20).map((appt, index) => {
                                    const isProcessing = actionLoadingId === appt.appointmentId
                                    return (
                                        <tr key={appt.appointmentId} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="px-5 py-4 font-bold text-slate-400 font-mono text-xs">
                                                {(page - 1) * 20 + index + 1}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-900">{appt.patientName}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-slate-800">{appt.timeSlot}</span>
                                                    <span className="text-[11px] font-medium text-slate-500">
                                                        {appt.appointmentDate}
                                                        {appt.appointmentDate === todayDateStr && (
                                                            <span className="ml-1.5 px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">Today</span>
                                                        )}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-xs font-medium text-slate-600 max-w-sm">
                                                {appt.symptoms || 'Routine checkup / general review'}
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-md text-xs font-semibold ${
                                                    appt.status === 'InProgress'
                                                        ? 'text-amber-800 bg-amber-100 animate-pulse'
                                                        : appt.status === 'CheckedIn'
                                                        ? 'text-sky-800 bg-sky-100'
                                                        : (appt.status === 'Booked' || appt.status === 'Confirmed' || appt.status === 'Pending')
                                                        ? 'text-slate-800 bg-slate-100'
                                                        : appt.status === 'Completed'
                                                        ? 'text-slate-700 bg-slate-100'
                                                        : appt.status === 'Missed'
                                                        ? 'text-slate-600 bg-slate-100'
                                                        : appt.status === 'Cancelled'
                                                        ? 'text-slate-500 bg-slate-100'
                                                        : 'text-slate-700 bg-slate-100'
                                                }`}>
                                                    {appt.status === 'InProgress' ? 'In Consultation' : appt.status === 'CheckedIn' ? 'Checked In' : ((appt.status === 'Booked' || appt.status === 'Confirmed' || appt.status === 'Pending') ? 'Booked' : appt.status)}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => navigate(`/doctor/dashboard/records?patientId=${appt.patientId}`)}
                                                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                                                        title="View Patient Medical History"
                                                    >
                                                        <FolderClock size={15} />
                                                    </button>

                                                    {appt.status === 'CheckedIn' && (
                                                        <button
                                                            disabled={isProcessing}
                                                            onClick={() => handleStartConsultation(appt)}
                                                            className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                                        >
                                                            <Stethoscope size={13} />
                                                            <span>Start Consultation</span>
                                                        </button>
                                                    )}

                                                    {appt.status === 'InProgress' && (
                                                        <button
                                                            onClick={() => setActiveAppointment(appt)}
                                                            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer animate-pulse"
                                                        >
                                                            <Stethoscope size={13} />
                                                            <span>Continue Consultation</span>
                                                        </button>
                                                    )}

                                                    {(appt.status === 'Booked' || appt.status === 'Confirmed' || appt.status === 'Pending') && (
                                                        <>
                                                            <span className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium">
                                                                {appt.appointmentDate > todayDateStr ? 'Upcoming' : 'Awaiting Check-in'}
                                                            </span>
                                                            {appt.appointmentDate <= todayDateStr && (
                                                                <button
                                                                    disabled={isProcessing}
                                                                    onClick={() => setNoShowTargetAppointment(appt)}
                                                                    className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                                                                    title="Mark as Missed (No-Show)"
                                                                >
                                                                    No Show
                                                                </button>
                                                            )}
                                                        </>
                                                    )}

                                                    {appt.status === 'Completed' && (
                                                        <span className="text-xs font-medium text-slate-500 pr-1">
                                                            Completed
                                                        </span>
                                                    )}

                                                    {appt.status === 'Cancelled' && (
                                                        <span className="text-xs font-medium text-slate-400 pr-1">
                                                            Cancelled
                                                        </span>
                                                    )}

                                                    {appt.status === 'Missed' && (
                                                        <span className="text-xs font-medium text-slate-400 pr-1">
                                                            Missed
                                                        </span>
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

                <Pagination
                    currentPage={page}
                    totalItems={filteredAppointments.length}
                    pageSize={20}
                    onPageChange={setPage}
                />
            </div>

            {activeAppointment && (
                <DoctorPrescriptionModal
                    appointment={activeAppointment}
                    onClose={() => setActiveAppointment(null)}
                    onSuccess={fetchAppointments}
                />
            )}

            {noShowTargetAppointment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-100">
                    <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full flex flex-col gap-4">
                        <h3 className="text-base font-bold text-slate-900">Mark Patient as No-Show?</h3>
                        <p className="text-xs text-slate-600">
                            Are you sure you want to mark <span className="font-bold text-slate-900">{noShowTargetAppointment.patientName}</span> as Missed (No-Show)?
                        </p>
                        <div className="flex items-center justify-end gap-2.5 pt-2">
                            <button
                                onClick={() => setNoShowTargetAppointment(null)}
                                className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    handleUpdateStatus(noShowTargetAppointment.appointmentId, 'Missed')
                                    setNoShowTargetAppointment(null)
                                }}
                                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                                Confirm No-Show
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default DoctorAppointments
