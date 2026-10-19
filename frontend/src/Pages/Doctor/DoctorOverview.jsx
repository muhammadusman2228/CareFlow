import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { 
    Calendar, 
    Clock, 
    CheckCircle2, 
    Users, 
    Briefcase, 
    Banknote, 
    FileText, 
    ArrowRight,
    RefreshCw,
    User,
    Hourglass,
    AlertCircle,
    X,
    Loader2,
    ShieldAlert
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
    const [dailyStatusData, setDailyStatusData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [activeAppointment, setActiveAppointment] = useState(null)

    const [isDutyModalOpen, setIsDutyModalOpen] = useState(false)
    const [dutyForm, setDutyForm] = useState({
        dailyStatus: 'OnDuty',
        delayMinutes: 30,
        delayReason: ''
    })
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
    const [statusError, setStatusError] = useState('')
    const [statusSuccess, setStatusSuccess] = useState('')

    const fetchDashboardData = async () => {
        try {
            setLoading(true)
            const [statsRes, apptsRes, statusRes] = await Promise.all([
                axiosPrivate.get('/Doctor/doctor-dashboard'),
                axiosPrivate.get('/Doctor/doctor-appointments'),
                axiosPrivate.get('/Doctor/daily-status').catch(() => ({ data: null }))
            ])
            setStats(statsRes.data || {
                todayAppointments: 0,
                pendingApprovals: 0,
                todayCompletedCount: 0,
                totalUniquePatients: 0
            })
            setAppointments(Array.isArray(apptsRes.data) ? apptsRes.data : [])
            setDailyStatusData(statusRes?.data || null)
        } catch {
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const handleDutySubmit = async (e) => {
        e.preventDefault()
        setStatusError('')
        setStatusSuccess('')
        setIsUpdatingStatus(true)

        try {
            const payload = {
                dailyStatus: dutyForm.dailyStatus,
                delayMinutes: dutyForm.dailyStatus === 'Delayed' ? parseInt(dutyForm.delayMinutes, 10) : 0,
                delayReason: dutyForm.delayReason.trim()
            }

            await axiosPrivate.post('/Doctor/daily-status', payload)
            setStatusSuccess(`Status updated to ${dutyForm.dailyStatus}.`)
            setIsDutyModalOpen(false)
            await fetchDashboardData()
        } catch (err) {
            setStatusError(err?.response?.data?.message || 'Failed to update duty status.')
        } finally {
            setIsUpdatingStatus(false)
        }
    }

    const todayDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi' }).format(new Date())
    const todaysAppointments = appointments.filter(a => a.appointmentDate === todayDateStr)

    const handleStartConsultation = async (appt) => {
        if (appt.status === 'CheckedIn') {
            try {
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
            }
        } else {
            setActiveAppointment(appt)
        }
    }

    const nextPatient = todaysAppointments.find(a => a.status === 'InProgress') ||
                        todaysAppointments.find(a => a.status === 'CheckedIn') || 
                        todaysAppointments.find(a => a.status === 'Booked' || a.status === 'Confirmed' || a.status === 'Pending')

    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto">
            <div className="bg-white rounded-2xl p-5 shadow-xl shadow-slate-900/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                        {dailyStatusData?.dailyStatus === 'Delayed' ? <Hourglass size={20} /> : <CheckCircle2 size={20} />}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Today's Duty Status:</span>
                            <span className="text-xs font-semibold text-slate-900">
                                {dailyStatusData?.dailyStatus === 'Delayed' 
                                    ? `Delayed (${dailyStatusData?.delayMinutes}m delay)` 
                                    : dailyStatusData?.dailyStatus === 'OffDuty'
                                    ? 'Off Duty / On Leave'
                                    : 'On Duty & Active'}
                            </span>
                        </div>
                        <p className="text-sm font-semibold text-slate-900 mt-0.5">
                            {dailyStatusData?.dailyStatus === 'Delayed'
                                ? (dailyStatusData?.delayReason || 'Doctor is delayed today')
                                : dailyStatusData?.dailyStatus === 'OffDuty'
                                ? (dailyStatusData?.delayReason || 'Unavailable for appointments today')
                                : 'Actively consulting patients on schedule'}
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => {
                        setDutyForm({
                            dailyStatus: dailyStatusData?.dailyStatus || 'OnDuty',
                            delayMinutes: dailyStatusData?.delayMinutes > 0 ? dailyStatusData.delayMinutes : 30,
                            delayReason: dailyStatusData?.delayReason || ''
                        })
                        setStatusError('')
                        setIsDutyModalOpen(true)
                    }}
                    className="px-4 py-2.5 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-xs cursor-pointer flex items-center gap-2 shrink-0 self-start sm:self-auto"
                >
                    <Clock size={15} />
                    <span>Set Delay / Duty Status</span>
                </button>
            </div>

            {statusSuccess && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between text-sm font-medium">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 size={18} />
                        <span>{statusSuccess}</span>
                    </div>
                    <button onClick={() => setStatusSuccess('')} className="cursor-pointer">
                        <X size={16} />
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-5 shadow-xl shadow-slate-900/10 hover:shadow-2xl hover:shadow-slate-900/20 hover:-translate-y-1 transition-all flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-700">Appointments</span>
                        <span className="text-3xl font-extrabold text-slate-900 mt-1">{stats.todayAppointments}</span>
                    </div>
                    <div className="w-11 h-11 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
                        <Calendar size={22} />
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-xl shadow-slate-900/10 hover:shadow-2xl hover:shadow-slate-900/20 hover:-translate-y-1 transition-all flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-700">Booked</span>
                        <span className="text-3xl font-extrabold text-slate-900 mt-1">{stats.pendingApprovals}</span>
                    </div>
                    <div className="w-11 h-11 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
                        <Clock size={22} />
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-xl shadow-slate-900/10 hover:shadow-2xl hover:shadow-slate-900/20 hover:-translate-y-1 transition-all flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-700">Completed</span>
                        <span className="text-3xl font-extrabold text-slate-900 mt-1">{stats.todayCompletedCount}</span>
                    </div>
                    <div className="w-11 h-11 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
                        <CheckCircle2 size={22} />
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-xl shadow-slate-900/10 hover:shadow-2xl hover:shadow-slate-900/20 hover:-translate-y-1 transition-all flex items-center justify-between">
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
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl shadow-slate-900/10 overflow-hidden flex flex-col">
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
                        <table className="w-full text-left border-collapse min-w-[650px]">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/75">
                                    <th className="px-5 py-3.5 text-xs font-bold text-slate-700 uppercase tracking-wider">Patient</th>
                                    <th className="px-5 py-3.5 text-xs font-bold text-slate-700 uppercase tracking-wider">Time</th>
                                    <th className="px-5 py-3.5 text-xs font-bold text-slate-700 uppercase tracking-wider">Chief Complaint</th>
                                    <th className="px-5 py-3.5 text-xs font-bold text-slate-700 uppercase tracking-wider text-center">Status</th>
                                    <th className="px-5 py-3.5 text-xs font-bold text-slate-700 uppercase tracking-wider text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {todaysAppointments.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-500 font-medium">
                                            No consultations scheduled for today.
                                        </td>
                                    </tr>
                                ) : (
                                    todaysAppointments.map((appt) => (
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
                                            <td className="px-5 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
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
                                                    ) : appt.status === 'InProgress' ? (
                                                        <button
                                                            onClick={() => setActiveAppointment(appt)}
                                                            className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer animate-pulse"
                                                        >
                                                            Continue Consultation
                                                        </button>
                                                    ) : appt.status === 'CheckedIn' ? (
                                                        <button
                                                            onClick={() => handleStartConsultation(appt)}
                                                            className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                                                        >
                                                            Start Consultation
                                                        </button>
                                                    ) : (
                                                        <button
                                                            disabled
                                                            className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-400 cursor-not-allowed"
                                                            title="Patient must be checked in at triage before starting consultation"
                                                        >
                                                            Awaiting Check-in
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex flex-col gap-6">
                    <div className="bg-white rounded-2xl p-5 shadow-xl shadow-slate-900/10 flex flex-col gap-4">
                        <h3 className="text-sm font-bold text-slate-900">Duty Shift & Fee</h3>
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                                <div className="w-9 h-9 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-600">
                                    <Briefcase size={18} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-medium text-slate-500">Duty Shift</span>
                                    <span className="text-sm font-bold text-slate-800">
                                        {dailyStatusData?.shiftStart ? `${dailyStatusData.shiftStart} - ${dailyStatusData.shiftEnd}` : '09:00 AM - 05:00 PM'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                                <div className="w-9 h-9 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-600">
                                    <Banknote size={18} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-medium text-slate-500">Consultation Fee</span>
                                    <span className="text-sm font-bold text-slate-800">
                                        PKR {Number(dailyStatusData?.consultationFee || 1500).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 shadow-xl shadow-slate-900/10 flex flex-col gap-3.5">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Next Patient</span>
                            {nextPatient && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                    nextPatient.status === 'InProgress'
                                        ? 'bg-amber-50 text-amber-800 border border-amber-200 animate-pulse'
                                        : nextPatient.status === 'CheckedIn'
                                        ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                        : 'bg-slate-100 text-slate-600'
                                }`}>
                                    {nextPatient.status === 'InProgress' ? 'In Consultation' : nextPatient.status === 'CheckedIn' ? 'Checked In' : 'Awaiting Check-in'}
                                </span>
                            )}
                        </div>
                        {nextPatient ? (
                            <div className="flex flex-col gap-3">
                                <div>
                                    <h4 className="text-base font-bold text-slate-900">{nextPatient.patientName}</h4>
                                    <p className="text-xs font-semibold text-slate-600 mt-0.5">{nextPatient.timeSlot} • Today</p>
                                </div>
                                <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 w-fit">
                                    <Clock size={13} />
                                    <span>
                                        {nextPatient.status === 'InProgress' 
                                            ? 'Consultation in progress' 
                                            : nextPatient.status === 'CheckedIn' 
                                            ? 'Ready for Consultation' 
                                            : 'Scheduled Slot'}
                                    </span>
                                </div>
                                {nextPatient.status === 'InProgress' ? (
                                    <button
                                        onClick={() => setActiveAppointment(nextPatient)}
                                        className="w-full mt-1 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer animate-pulse"
                                    >
                                        <span>Resume Consultation</span>
                                        <ArrowRight size={14} />
                                    </button>
                                ) : nextPatient.status === 'CheckedIn' ? (
                                    <button
                                        onClick={() => handleStartConsultation(nextPatient)}
                                        className="w-full mt-1 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <span>Start Consultation</span>
                                        <ArrowRight size={14} />
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => navigate(`/doctor/dashboard/records?patientId=${nextPatient.patientId}`)}
                                        className="w-full mt-1 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <span>View Patient EHR</span>
                                        <ArrowRight size={14} />
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="py-6 flex flex-col items-center text-center gap-2">
                                <User size={24} className="text-slate-400" />
                                <p className="text-xs font-medium text-slate-500">No upcoming patients in queue today</p>
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

            {isDutyModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                                    <Clock size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Set Today's Duty Status</h3>
                                    <p className="text-xs text-slate-500">Alert clinical triage assistants of delays</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsDutyModalOpen(false)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleDutySubmit} className="p-6 space-y-4">
                            {statusError && (
                                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                                    <AlertCircle size={16} className="shrink-0" />
                                    <span>{statusError}</span>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                                    Duty Status Option
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setDutyForm(p => ({ ...p, dailyStatus: 'OnDuty' }))}
                                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                                            dutyForm.dailyStatus === 'OnDuty'
                                                ? 'bg-slate-900 border-slate-900 text-white font-bold'
                                                : 'border-slate-300 hover:bg-slate-50 text-slate-700 bg-white'
                                        }`}
                                    >
                                        <CheckCircle2 size={18} className="mx-auto mb-1" />
                                        <span className="text-xs">On Duty</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setDutyForm(p => ({ ...p, dailyStatus: 'Delayed' }))}
                                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                                            dutyForm.dailyStatus === 'Delayed'
                                                ? 'bg-slate-900 border-slate-900 text-white font-bold'
                                                : 'border-slate-300 hover:bg-slate-50 text-slate-700 bg-white'
                                        }`}
                                    >
                                        <Hourglass size={18} className="mx-auto mb-1" />
                                        <span className="text-xs">Running Late</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setDutyForm(p => ({ ...p, dailyStatus: 'OffDuty' }))}
                                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                                            dutyForm.dailyStatus === 'OffDuty'
                                                ? 'bg-slate-900 border-slate-900 text-white font-bold'
                                                : 'border-slate-300 hover:bg-slate-50 text-slate-700 bg-white'
                                        }`}
                                    >
                                        <ShieldAlert size={18} className="mx-auto mb-1" />
                                        <span className="text-xs">Off Duty</span>
                                    </button>
                                </div>
                            </div>

                            {dutyForm.dailyStatus === 'Delayed' && (
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                        Estimated Delay Duration
                                    </label>
                                    <select
                                        value={dutyForm.delayMinutes}
                                        onChange={(e) => setDutyForm(p => ({ ...p, delayMinutes: parseInt(e.target.value, 10) }))}
                                        className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                                    >
                                        <option value={15}>15 Minutes</option>
                                        <option value={30}>30 Minutes</option>
                                        <option value={45}>45 Minutes</option>
                                        <option value={60}>1 Hour (60 min)</option>
                                        <option value={90}>1.5 Hours (90 min)</option>
                                        <option value={120}>2 Hours (120 min)</option>
                                    </select>
                                </div>
                            )}

                            {(dutyForm.dailyStatus === 'Delayed' || dutyForm.dailyStatus === 'OffDuty') && (
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                        Reason / Clinical Note
                                    </label>
                                    <input
                                        type="text"
                                        value={dutyForm.delayReason}
                                        onChange={(e) => setDutyForm(p => ({ ...p, delayReason: e.target.value }))}
                                        placeholder={dutyForm.dailyStatus === 'Delayed' ? 'e.g. Critical case in OR 2' : 'e.g. Approved leave'}
                                        className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                                    />
                                </div>
                            )}

                            <div className="pt-2 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsDutyModalOpen(false)}
                                    className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isUpdatingStatus}
                                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
                                >
                                    {isUpdatingStatus && <Loader2 size={16} className="animate-spin" />}
                                    <span>Broadcast Status</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default DoctorOverview
