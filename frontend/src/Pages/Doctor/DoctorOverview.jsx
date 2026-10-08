import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { 
    Calendar, 
    Clock, 
    CheckCircle2, 
    Users, 
    Briefcase, 
    DollarSign, 
    FileText, 
    ArrowRight,
    RefreshCw,
    User
} from 'lucide-react'
import useAxiosPrivate from '../../hooks/useAxiosPrivate'
import DoctorPrescriptionModal from './DoctorPrescriptionModal'

const DoctorOverview = () => {
    const axiosPrivate = useAxiosPrivate()
    const navigate = useNavigate()

    const [stats, setStats] = useState({
        todayAppointments: 0,
        pendingApprovals: 0,
        todayCompletedCount: 0,
        totalUniquePatients: 0
    })
    const [appointments, setAppointments] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeAppointment, setActiveAppointment] = useState(null)

    const fetchDashboardData = async () => {
        try {
            setLoading(true)
            const [statsRes, apptsRes] = await Promise.all([
                axiosPrivate.get('/Doctor/doctor-dashboard'),
                axiosPrivate.get('/Doctor/doctor-appointments')
            ])
            setStats(statsRes.data || {
                todayAppointments: 0,
                pendingApprovals: 0,
                todayCompletedCount: 0,
                totalUniquePatients: 0
            })
            setAppointments(Array.isArray(apptsRes.data) ? apptsRes.data : [])
        } catch {
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const todayDateStr = new Date().toISOString().split('T')[0]
    const todaysAppointments = appointments.filter(a => a.appointmentDate === todayDateStr || true)

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Confirmed':
                return 'bg-slate-100 text-slate-800 border border-slate-300'
            case 'Completed':
                return 'bg-slate-100 text-slate-700 border border-slate-200'
            case 'Cancelled':
                return 'bg-slate-100 text-slate-500 border border-slate-200'
            case 'Missed':
                return 'bg-slate-100 text-slate-500 border border-slate-200'
            default:
                return 'bg-slate-100 text-slate-700 border border-slate-200'
        }
    }

    const nextPatient = appointments.find(a => a.status === 'Confirmed' || a.status === 'Pending')

    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-700">Appointments</span>
                        <span className="text-3xl font-extrabold text-slate-900 mt-1">{stats.todayAppointments}</span>
                    </div>
                    <div className="w-11 h-11 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
                        <Calendar size={22} />
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-700">Pending</span>
                        <span className="text-3xl font-extrabold text-slate-900 mt-1">{stats.pendingApprovals}</span>
                    </div>
                    <div className="w-11 h-11 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
                        <Clock size={22} />
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-700">Completed</span>
                        <span className="text-3xl font-extrabold text-slate-900 mt-1">{stats.todayCompletedCount}</span>
                    </div>
                    <div className="w-11 h-11 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
                        <CheckCircle2 size={22} />
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-700">Total Patients</span>
                        <span className="text-3xl font-extrabold text-slate-900 mt-1">{stats.totalUniquePatients}</span>
                    </div>
                    <div className="w-11 h-11 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
                        <Users size={22} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-bold text-slate-900">Today's Consultation Schedule</h2>
                            <p className="text-xs text-slate-500">Live roster of scheduled patient appointments</p>
                        </div>
                        <button
                            onClick={fetchDashboardData}
                            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
                            title="Refresh Schedule"
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/75">
                                    <th className="px-5 py-3.5 text-xs font-bold text-slate-700 uppercase tracking-wider">Patient</th>
                                    <th className="px-5 py-3.5 text-xs font-bold text-slate-700 uppercase tracking-wider">Time</th>
                                    <th className="px-5 py-3.5 text-xs font-bold text-slate-700 uppercase tracking-wider">Chief Complaint</th>
                                    <th className="px-5 py-3.5 text-xs font-bold text-slate-700 uppercase tracking-wider">Status</th>
                                    <th className="px-5 py-3.5 text-xs font-bold text-slate-700 uppercase tracking-wider text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {appointments.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-500 font-medium">
                                            No consultations scheduled for today.
                                        </td>
                                    </tr>
                                ) : (
                                    appointments.map((appt) => (
                                        <tr key={appt.appointmentId} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="px-5 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-900">{appt.patientName}</span>
                                                    <span className="text-xs font-medium text-slate-500">#CF-0{appt.patientId}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                                                {appt.timeSlot}
                                            </td>
                                            <td className="px-5 py-4 text-xs font-medium text-slate-600 max-w-xs truncate">
                                                {appt.symptoms || 'General routine consultation'}
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${getStatusBadge(appt.status)}`}>
                                                    {appt.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                {appt.status === 'Completed' ? (
                                                    <button
                                                        onClick={() => navigate(`/doctor/dashboard/records?patientId=${appt.patientId}`)}
                                                        className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                                                    >
                                                        View EHR
                                                    </button>
                                                ) : appt.status === 'Cancelled' ? (
                                                    <span className="text-xs font-semibold text-slate-400">
                                                        Cancelled
                                                    </span>
                                                ) : appt.status === 'Missed' ? (
                                                    <span className="text-xs font-semibold text-slate-400">
                                                        Missed
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => setActiveAppointment(appt)}
                                                        className="px-3.5 py-1.5 rounded-lg border border-sky-300 text-xs font-semibold text-sky-700 hover:bg-sky-50 transition-colors cursor-pointer"
                                                    >
                                                        Start Consultation
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex flex-col gap-6">
                    <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4">
                        <h3 className="text-sm font-bold text-slate-900">Duty Shift & Fee</h3>
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                                <div className="w-9 h-9 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-600">
                                    <Briefcase size={18} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-medium text-slate-500">Duty Shift</span>
                                    <span className="text-sm font-bold text-slate-800">09:00 AM - 05:00 PM</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                                <div className="w-9 h-9 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-600">
                                    <DollarSign size={18} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-medium text-slate-500">Consultation Fee</span>
                                    <span className="text-sm font-bold text-slate-800">$40.00</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Next Patient</span>
                        {nextPatient ? (
                            <div className="flex flex-col gap-3">
                                <div>
                                    <h4 className="text-base font-bold text-slate-900">{nextPatient.patientName}</h4>
                                    <p className="text-xs font-semibold text-slate-600 mt-0.5">{nextPatient.timeSlot} • Today</p>
                                </div>
                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-xs font-semibold text-slate-700 w-fit">
                                    <Clock size={13} />
                                    <span>Scheduled Slot</span>
                                </div>
                                <button
                                    onClick={() => navigate(`/doctor/dashboard/records?patientId=${nextPatient.patientId}`)}
                                    className="w-full mt-1 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2"
                                >
                                    <span>View Patient EHR</span>
                                    <ArrowRight size={14} />
                                </button>
                            </div>
                        ) : (
                            <div className="py-6 flex flex-col items-center text-center gap-2">
                                <User size={24} className="text-slate-400" />
                                <p className="text-xs font-medium text-slate-500">No upcoming patients in queue</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {activeAppointment && (
                <DoctorPrescriptionModal
                    appointment={activeAppointment}
                    onClose={() => setActiveAppointment(null)}
                    onSuccess={fetchDashboardData}
                />
            )}
        </div>
    )
}

export default DoctorOverview
