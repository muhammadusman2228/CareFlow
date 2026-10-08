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
    AlertCircle
} from 'lucide-react'
import useAxiosPrivate from '../../hooks/useAxiosPrivate'
import DoctorPrescriptionModal from './DoctorPrescriptionModal'

const DoctorAppointments = () => {
    const axiosPrivate = useAxiosPrivate()
    const navigate = useNavigate()

    const [appointments, setAppointments] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedTab, setSelectedTab] = useState('All')
    const [activeAppointment, setActiveAppointment] = useState(null)
    const [actionLoadingId, setActionLoadingId] = useState(null)
    const [error, setError] = useState(null)

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

    const filteredAppointments = appointments.filter(a => {
        const matchesTab = selectedTab === 'All' || a.status === selectedTab
        const matchesSearch = 
            a.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.symptoms?.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesTab && matchesSearch
    })

    const tabs = ['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled', 'Missed']

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Confirmed':
                return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            case 'Completed':
                return 'bg-sky-50 text-sky-700 border border-sky-200'
            case 'Cancelled':
                return 'bg-rose-50 text-rose-700 border border-rose-200'
            case 'Missed':
                return 'bg-amber-50 text-amber-700 border border-amber-200'
            default:
                return 'bg-slate-100 text-slate-700 border border-slate-200'
        }
    }

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

            <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                        {tabs.map((tab) => {
                            const count = tab === 'All' ? appointments.length : appointments.filter(a => a.status === tab).length
                            const isActive = selectedTab === tab
                            return (
                                <button
                                    key={tab}
                                    onClick={() => setSelectedTab(tab)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                                        isActive
                                            ? 'bg-slate-900 text-white shadow-xs'
                                            : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                    }`}
                                >
                                    <span>{tab}</span>
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
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-transparent border-none outline-none text-xs text-slate-800 placeholder:text-slate-400"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/75">
                                <th className="px-5 py-3.5 text-xs font-bold text-slate-700 uppercase tracking-wider">Patient</th>
                                <th className="px-5 py-3.5 text-xs font-bold text-slate-700 uppercase tracking-wider">Schedule</th>
                                <th className="px-5 py-3.5 text-xs font-bold text-slate-700 uppercase tracking-wider">Symptoms / Chief Complaint</th>
                                <th className="px-5 py-3.5 text-xs font-bold text-slate-700 uppercase tracking-wider">Status</th>
                                <th className="px-5 py-3.5 text-xs font-bold text-slate-700 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredAppointments.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-500 font-medium">
                                        No appointments match this filter.
                                    </td>
                                </tr>
                            ) : (
                                filteredAppointments.map((appt) => {
                                    const isProcessing = actionLoadingId === appt.appointmentId
                                    return (
                                        <tr key={appt.appointmentId} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="px-5 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-900">{appt.patientName}</span>
                                                    <span className="text-xs font-medium text-slate-500">ID: #PID-{appt.patientId}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-slate-800">{appt.timeSlot}</span>
                                                    <span className="text-[11px] font-medium text-slate-500">{appt.appointmentDate}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-xs font-medium text-slate-600 max-w-sm">
                                                {appt.symptoms || 'Routine checkup / general review'}
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${getStatusBadge(appt.status)}`}>
                                                    {appt.status}
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

                                                    {appt.status === 'Pending' && (
                                                        <>
                                                            <button
                                                                disabled={isProcessing}
                                                                onClick={() => handleUpdateStatus(appt.appointmentId, 'Confirmed')}
                                                                className="px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                                                            >
                                                                <Check size={13} />
                                                                <span>Approve</span>
                                                            </button>
                                                            <button
                                                                disabled={isProcessing}
                                                                onClick={() => handleUpdateStatus(appt.appointmentId, 'Cancelled')}
                                                                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors disabled:opacity-50"
                                                            >
                                                                <X size={13} />
                                                            </button>
                                                        </>
                                                    )}

                                                    {appt.status === 'Confirmed' && (
                                                        <>
                                                            <button
                                                                onClick={() => setActiveAppointment(appt)}
                                                                className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                                                            >
                                                                <FileText size={13} />
                                                                <span>Prescribe</span>
                                                            </button>
                                                            <button
                                                                disabled={isProcessing}
                                                                onClick={() => handleUpdateStatus(appt.appointmentId, 'Missed')}
                                                                className="px-2.5 py-1.5 rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-50 text-xs font-semibold transition-colors disabled:opacity-50"
                                                                title="Mark as Missed (No-Show)"
                                                            >
                                                                No Show
                                                            </button>
                                                        </>
                                                    )}

                                                    {appt.status === 'Completed' && (
                                                        <span className="text-xs font-semibold text-slate-500 pr-1">
                                                            Completed
                                                        </span>
                                                    )}

                                                    {appt.status === 'Cancelled' && (
                                                        <span className="text-xs font-semibold text-slate-400 pr-1">
                                                            Cancelled
                                                        </span>
                                                    )}

                                                    {appt.status === 'Missed' && (
                                                        <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md">
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
            </div>

            {activeAppointment && (
                <DoctorPrescriptionModal
                    appointment={activeAppointment}
                    onClose={() => setActiveAppointment(null)}
                    onSuccess={fetchAppointments}
                />
            )}
        </div>
    )
}

export default DoctorAppointments
