import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { 
    Calendar, 
    Clock, 
    FileText, 
    Plus, 
    ArrowRight, 
    Printer, 
    RefreshCw,
    UserCheck,
    Stethoscope
} from 'lucide-react'
import useAxiosPrivate from '../../hooks/useAxiosPrivate'
import useAuth from '../../hooks/useAuth'

const PatientOverview = () => {
    const axiosPrivate = useAxiosPrivate()
    const { auth } = useAuth()
    const navigate = useNavigate()

    const [appointments, setAppointments] = useState([])
    const [prescriptions, setPrescriptions] = useState([])
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)

    const fetchPatientData = async () => {
        try {
            setLoading(true)
            const [apptsRes, rxRes, profileRes] = await Promise.all([
                axiosPrivate.get('/Patient/my-appointment'),
                axiosPrivate.get('/Patient/prescription'),
                axiosPrivate.get('/Patient/profile')
            ])
            setAppointments(Array.isArray(apptsRes.data) ? apptsRes.data : [])
            setPrescriptions(Array.isArray(rxRes.data) ? rxRes.data : [])
            setProfile(profileRes.data || null)
        } catch {
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPatientData()
    }, [])

    const upcomingAppointments = appointments.filter(a => a.status === 'Confirmed' || a.status === 'Pending')
    const completedAppointments = appointments.filter(a => a.status === 'Completed')
    const nextAppointment = upcomingAppointments[0]

    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold text-slate-900">
                            Welcome back, {profile?.name || auth?.user || 'Patient'}
                        </h1>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                        {profile?.bloodGroup && (
                            <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700">
                                Blood Group: {profile.bloodGroup}
                            </span>
                        )}
                        {profile?.gender && (
                            <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700">
                                {profile.gender}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchPatientData}
                        className="p-2.5 rounded-xl bg-white border border-slate-200/90 text-slate-600 hover:text-slate-900 shadow-sm transition-all"
                        title="Refresh Data"
                    >
                        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={() => navigate('/patient/dashboard/book')}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-all"
                    >
                        <Plus size={16} />
                        <span>Book New Appointment</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/90 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Next Upcoming Consultation</span>
                        {nextAppointment && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
                                {nextAppointment.status}
                            </span>
                        )}
                    </div>

                    {nextAppointment ? (
                        <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                                    <Stethoscope size={24} />
                                </div>
                                <div className="flex flex-col">
                                    <h3 className="text-base font-bold text-slate-900">{nextAppointment.doctorName}</h3>
                                    <span className="text-xs font-medium text-slate-500">{nextAppointment.department}</span>
                                </div>
                            </div>

                            <div className="flex flex-col sm:items-end">
                                <span className="text-sm font-bold text-slate-800">{nextAppointment.timeSlot}</span>
                                <span className="text-xs font-medium text-slate-500">{nextAppointment.appointmentDate}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="py-6 flex flex-col items-center justify-center text-center gap-2">
                            <Calendar size={24} className="text-slate-400" />
                            <p className="text-xs font-medium text-slate-500">No upcoming consultations booked.</p>
                        </div>
                    )}

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <button
                            onClick={() => navigate('/patient/dashboard/appointments')}
                            className="text-xs font-semibold text-sky-600 hover:text-sky-800 flex items-center gap-1.5 transition-colors"
                        >
                            <span>View All Appointments</span>
                            <ArrowRight size={13} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3">
                    <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold text-slate-500">Upcoming Visits</span>
                            <span className="text-2xl font-extrabold text-slate-900 mt-0.5">{upcomingAppointments.length}</span>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
                            <Calendar size={18} />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold text-slate-500">Past Consultations</span>
                            <span className="text-2xl font-extrabold text-slate-900 mt-0.5">{completedAppointments.length}</span>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
                            <UserCheck size={18} />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold text-slate-500">Prescriptions</span>
                            <span className="text-2xl font-extrabold text-slate-900 mt-0.5">{prescriptions.length}</span>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
                            <FileText size={18} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-bold text-slate-900">My Appointments Roster</h2>
                            <p className="text-xs text-slate-500">Overview of recent hospital consultations and visits</p>
                        </div>
                        <button
                            onClick={() => navigate('/patient/dashboard/appointments')}
                            className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                        >
                            View All
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/75">
                                    <th className="px-5 py-3.5 text-xs font-bold text-slate-700 uppercase tracking-wider">Doctor</th>
                                    <th className="px-5 py-3.5 text-xs font-bold text-slate-700 uppercase tracking-wider">Date & Time</th>
                                    <th className="px-5 py-3.5 text-xs font-bold text-slate-700 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {appointments.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-5 py-8 text-center text-sm text-slate-500 font-medium">
                                            No appointments scheduled.
                                        </td>
                                    </tr>
                                ) : (
                                    appointments.slice(0, 5).map((appt) => (
                                        <tr key={appt.appointmentId} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="px-5 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-900">{appt.doctorName}</span>
                                                    <span className="text-xs font-medium text-slate-500">{appt.department}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-slate-800">{appt.appointmentDate}</span>
                                                    <span className="text-[11px] font-medium text-slate-500">{appt.timeSlot}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
                                                    {appt.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">Recent Prescriptions</h3>
                            <p className="text-xs text-slate-500">Official medical instructions</p>
                        </div>
                        <button
                            onClick={() => navigate('/patient/dashboard/prescriptions')}
                            className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                        >
                            View All
                        </button>
                    </div>

                    <div className="flex flex-col gap-3">
                        {prescriptions.length === 0 ? (
                            <div className="py-8 flex flex-col items-center text-center gap-2">
                                <FileText size={22} className="text-slate-400" />
                                <p className="text-xs font-medium text-slate-500">No prescriptions issued yet.</p>
                            </div>
                        ) : (
                            prescriptions.slice(0, 3).map((rx, idx) => (
                                <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-900">{rx.doctorName}</span>
                                        <span className="text-[11px] font-semibold text-slate-500">{rx.appointmentDate}</span>
                                    </div>
                                    <div className="text-xs font-semibold text-slate-700">
                                        {rx.title}
                                    </div>
                                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                                        {rx.note}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PatientOverview
