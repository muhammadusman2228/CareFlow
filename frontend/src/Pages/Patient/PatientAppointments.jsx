import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { 
    Calendar, 
    Clock, 
    Search, 
    X, 
    Plus, 
    RefreshCw, 
    AlertCircle, 
    CheckCircle2,
    Stethoscope
} from 'lucide-react'
import useAxiosPrivate from '../../hooks/useAxiosPrivate'

const PatientAppointments = () => {
    const axiosPrivate = useAxiosPrivate()
    const navigate = useNavigate()

    const [appointments, setAppointments] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedTab, setSelectedTab] = useState('All')
    const [cancelAppointmentId, setCancelAppointmentId] = useState(null)
    const [cancelling, setCancelling] = useState(false)
    const [message, setMessage] = useState(null)

    const fetchAppointments = async () => {
        try {
            setLoading(true)
            const res = await axiosPrivate.get('/Patient/my-appointment')
            setAppointments(Array.isArray(res.data) ? res.data : [])
        } catch {
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAppointments()
    }, [])

    const handleConfirmCancel = async () => {
        if (!cancelAppointmentId) return

        try {
            setCancelling(true)
            await axiosPrivate.patch(`/Patient/cancel-appointment/${cancelAppointmentId}`)
            setMessage({ type: 'success', text: 'Appointment cancelled successfully.' })
            setCancelAppointmentId(null)
            await fetchAppointments()
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to cancel appointment.' })
        } finally {
            setCancelling(false)
        }
    }

    const filtered = appointments.filter(a => {
        const matchesTab = selectedTab === 'All' || a.status === selectedTab
        const matchesSearch = 
            a.doctorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.department?.toLowerCase().includes(searchQuery.toLowerCase())
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">My Medical Consultations</h1>
                    <p className="text-xs text-slate-500">Track scheduled appointments and consultation history</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchAppointments}
                        className="p-2.5 rounded-xl bg-white border border-slate-200/90 text-slate-600 hover:text-slate-900 shadow-sm transition-all"
                        title="Refresh"
                    >
                        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={() => navigate('/patient/dashboard/book')}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-all"
                    >
                        <Plus size={16} />
                        <span>Book Appointment</span>
                    </button>
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between border ${
                    message.type === 'success' 
                        ? 'bg-slate-900 text-white border-slate-900' 
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                    <div className="flex items-center gap-2">
                        {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                        <span>{message.text}</span>
                    </div>
                    <button onClick={() => setMessage(null)} className="text-xs opacity-75 hover:opacity-100">✕</button>
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
                            placeholder="Filter by doctor or department..."
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
                                <th className="px-5 py-3.5 text-xs font-bold text-slate-700 uppercase tracking-wider">Physician</th>
                                <th className="px-5 py-3.5 text-xs font-bold text-slate-700 uppercase tracking-wider">Department</th>
                                <th className="px-5 py-3.5 text-xs font-bold text-slate-700 uppercase tracking-wider">Schedule</th>
                                <th className="px-5 py-3.5 text-xs font-bold text-slate-700 uppercase tracking-wider">Status</th>
                                <th className="px-5 py-3.5 text-xs font-bold text-slate-700 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-500 font-medium">
                                        No appointments match this filter.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((appt) => (
                                    <tr key={appt.appointmentId} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs shrink-0">
                                                    {appt.doctorName?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'DR'}
                                                </div>
                                                <span className="text-sm font-bold text-slate-900">{appt.doctorName}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-xs font-semibold text-slate-600">
                                            {appt.department}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-slate-800">{appt.timeSlot}</span>
                                                <span className="text-[11px] font-medium text-slate-500">{appt.appointmentDate}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${getStatusBadge(appt.status)}`}>
                                                {appt.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            {(appt.status === 'Pending' || appt.status === 'Confirmed') && (
                                                <button
                                                    onClick={() => setCancelAppointmentId(appt.appointmentId)}
                                                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                            {appt.status === 'Missed' && (
                                                <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md">
                                                    Missed
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {cancelAppointmentId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
                    <div className="bg-white rounded-xl shadow-xl border border-slate-200/90 w-full max-w-sm overflow-hidden p-6 flex flex-col gap-4">
                        <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                            <AlertCircle size={20} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900">Cancel Appointment?</h3>
                            <p className="text-xs text-slate-500 mt-1">Are you sure you want to cancel this consultation? This action cannot be undone.</p>
                        </div>
                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                onClick={() => setCancelAppointmentId(null)}
                                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                                Keep Appointment
                            </button>
                            <button
                                disabled={cancelling}
                                onClick={handleConfirmCancel}
                                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                            >
                                {cancelling ? 'Cancelling...' : 'Confirm Cancel'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default PatientAppointments
