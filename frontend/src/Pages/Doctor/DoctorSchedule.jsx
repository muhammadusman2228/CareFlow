import { useState, useEffect } from 'react'
import { 
    Calendar, 
    Clock, 
    Building2, 
    CheckCircle2, 
    AlertCircle, 
    RefreshCw, 
    Loader2, 
    CalendarDays, 
    ShieldAlert, 
    Hourglass, 
    Users,
    X,
    Stethoscope,
    ChevronRight
} from 'lucide-react'
import useAxiosPrivate from '../../hooks/useAxiosPrivate'

const DoctorSchedule = () => {
    const axiosPrivate = useAxiosPrivate()

    const [schedule, setSchedule] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState('')

    const [isDutyModalOpen, setIsDutyModalOpen] = useState(false)
    const [dutyStatusForm, setDutyStatusForm] = useState({
        dailyStatus: 'OnDuty',
        delayMinutes: 30,
        delayReason: ''
    })
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
    const [dutyError, setDutyError] = useState('')
    const [dutySuccess, setDutySuccess] = useState('')

    const fetchSchedule = async () => {
        setIsLoading(true)
        setErrorMessage('')
        try {
            const response = await axiosPrivate.get('/Doctor/my-schedule')
            setSchedule(response.data)
            if (response.data) {
                setDutyStatusForm({
                    dailyStatus: response.data.dailyStatus || 'OnDuty',
                    delayMinutes: response.data.delayMinutes > 0 ? response.data.delayMinutes : 30,
                    delayReason: response.data.delayReason || ''
                })
            }
        } catch {
            setErrorMessage('Unable to load clinical schedule roster.')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchSchedule()
    }, [])

    const handleDutySubmit = async (e) => {
        e.preventDefault()
        setDutyError('')
        setDutySuccess('')
        setIsUpdatingStatus(true)

        try {
            const payload = {
                dailyStatus: dutyStatusForm.dailyStatus,
                delayMinutes: dutyStatusForm.dailyStatus === 'Delayed' ? parseInt(dutyStatusForm.delayMinutes, 10) : 0,
                delayReason: dutyStatusForm.delayReason.trim()
            }

            await axiosPrivate.post('/Doctor/daily-status', payload)
            setDutySuccess(`Duty status updated to ${dutyStatusForm.dailyStatus}.`)
            setIsDutyModalOpen(false)
            await fetchSchedule()
        } catch (err) {
            setDutyError(err?.response?.data?.message || 'Failed to update duty status.')
        } finally {
            setIsUpdatingStatus(false)
        }
    }

    const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi' }).format(new Date())

    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                        <CalendarDays size={22} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">My Clinical Schedule</h1>
                        <p className="text-sm text-slate-500 mt-0.5">
                            Weekly consultation calendar, departmental coverage, and daily duty management
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchSchedule}
                        disabled={isLoading}
                        className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                        title="Refresh Schedule"
                    >
                        <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={() => {
                            setDutyError('')
                            setDutySuccess('')
                            setIsDutyModalOpen(true)
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors cursor-pointer"
                    >
                        <Clock size={16} />
                        <span>Update Today's Status</span>
                    </button>
                </div>
            </div>

            {dutySuccess && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 flex items-center justify-between text-sm font-medium">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 size={18} />
                        <span>{dutySuccess}</span>
                    </div>
                    <button onClick={() => setDutySuccess('')} className="cursor-pointer">
                        <X size={16} />
                    </button>
                </div>
            )}

            {errorMessage && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2 text-sm font-medium">
                    <AlertCircle size={18} />
                    <span>{errorMessage}</span>
                </div>
            )}

            {isLoading && !schedule ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
                    <Loader2 size={24} className="animate-spin mx-auto mb-3 text-slate-700" />
                    Loading weekly roster...
                </div>
            ) : schedule ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-5 rounded-2xl shadow-xl shadow-slate-900/10 hover:shadow-2xl hover:shadow-slate-900/20 hover:-translate-y-1 transition-all flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Official Shift Timing</p>
                                <p className="text-lg font-bold text-slate-900 mt-0.5">
                                    {schedule.shiftStart?.substring(0, 5)} - {schedule.shiftEnd?.substring(0, 5)}
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5">Regular consulting hours</p>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                                <Clock size={20} />
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl shadow-xl shadow-slate-900/10 hover:shadow-2xl hover:shadow-slate-900/20 hover:-translate-y-1 transition-all flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Department Coverage</p>
                                <p className="text-sm font-semibold text-slate-900 mt-1 capitalize truncate">
                                    {schedule.departmentNames && schedule.departmentNames.length > 0 
                                        ? schedule.departmentNames.join(', ') 
                                        : (schedule.departmentName || 'General')}
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5">Assigned department pool</p>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                                <Building2 size={20} />
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl shadow-xl shadow-slate-900/10 hover:shadow-2xl hover:shadow-slate-900/20 hover:-translate-y-1 transition-all flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Current Duty Status</p>
                                <p className="text-sm font-semibold text-slate-900 mt-1">
                                    {schedule.dailyStatus === 'Delayed' ? `Late (${schedule.delayMinutes}m delay)` : schedule.dailyStatus}
                                </p>
                                {schedule.delayReason && (
                                    <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs" title={schedule.delayReason}>
                                        {schedule.delayReason}
                                    </p>
                                )}
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                                <CheckCircle2 size={20} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl shadow-slate-900/10 overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-bold text-slate-900">Weekly Shift Schedule & Consultation Timetable</h2>
                                <p className="text-xs text-slate-500">Official physician roster, shift timings, and daily consultation capacity</p>
                            </div>
                        </div>

                        <div className="overflow-x-auto w-full">
                            <table className="w-full text-left border-collapse min-w-[900px]">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-600">
                                        <th className="py-3.5 px-6">Day</th>
                                        <th className="py-3.5 px-6">Date</th>
                                        <th className="py-3.5 px-6">Shift Start</th>
                                        <th className="py-3.5 px-6">Shift End</th>
                                        <th className="py-3.5 px-6">Consultations Booked</th>
                                        <th className="py-3.5 px-6 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm">
                                    {schedule.upcomingDays?.map((day, idx) => {
                                        const isToday = day.date === todayStr
                                        return (
                                            <tr key={idx} className={`hover:bg-slate-50/60 transition-colors ${isToday ? 'bg-slate-50/70 font-semibold' : ''}`}>
                                                <td className="py-4 px-6 text-slate-900">
                                                    {day.dayOfWeek} {isToday && <span className="text-xs text-slate-500 font-normal">(Today)</span>}
                                                </td>
                                                <td className="py-4 px-6 text-slate-700 text-xs">
                                                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </td>
                                                <td className="py-4 px-6 text-slate-800 font-mono text-xs">
                                                    {(day.shiftStart || schedule.shiftStart)?.substring(0, 5)}
                                                </td>
                                                <td className="py-4 px-6 text-slate-800 font-mono text-xs">
                                                    {(day.shiftEnd || schedule.shiftEnd)?.substring(0, 5)}
                                                </td>
                                                <td className="py-4 px-6 text-slate-700 text-xs">
                                                    {day.totalAppointments} booked ({day.confirmedCount} confirmed, {day.completedCount} completed)
                                                </td>
                                                <td className="py-4 px-6 text-center text-xs font-medium text-slate-700">
                                                    {(() => {
                                                        const isOff = !day.isAvailable || day.dailyStatus === 'OffDuty'
                                                        const isDelayed = day.dailyStatus === 'Delayed'
                                                        return isOff ? 'Off Duty' : isDelayed ? (isToday ? `Delayed (${schedule.delayMinutes}m)` : 'Delayed') : 'On Duty'
                                                    })()}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : null}

            {isDutyModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                                    <Clock size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Set Today's Duty Status</h3>
                                    <p className="text-xs text-slate-500">Alert clinical assistants of delay or availability</p>
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
                            {dutyError && (
                                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                                    <AlertCircle size={16} className="shrink-0" />
                                    <span>{dutyError}</span>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                                    Duty Status Option
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setDutyStatusForm(p => ({ ...p, dailyStatus: 'OnDuty' }))}
                                        className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                                            dutyStatusForm.dailyStatus === 'OnDuty'
                                                ? 'bg-slate-900 text-white border-slate-900'
                                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                                        }`}
                                    >
                                        On Duty
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setDutyStatusForm(p => ({ ...p, dailyStatus: 'Delayed' }))}
                                        className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                                            dutyStatusForm.dailyStatus === 'Delayed'
                                                ? 'bg-slate-900 text-white border-slate-900'
                                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                                        }`}
                                    >
                                        Running Late
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setDutyStatusForm(p => ({ ...p, dailyStatus: 'OffDuty' }))}
                                        className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                                            dutyStatusForm.dailyStatus === 'OffDuty'
                                                ? 'bg-slate-900 text-white border-slate-900'
                                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                                        }`}
                                    >
                                        Off Duty
                                    </button>
                                </div>
                            </div>

                            {dutyStatusForm.dailyStatus === 'Delayed' && (
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                        Estimated Delay Duration
                                    </label>
                                    <select
                                        value={dutyStatusForm.delayMinutes}
                                        onChange={(e) => setDutyStatusForm(p => ({ ...p, delayMinutes: parseInt(e.target.value, 10) }))}
                                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-slate-800"
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

                            {(dutyStatusForm.dailyStatus === 'Delayed' || dutyStatusForm.dailyStatus === 'OffDuty') && (
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                        Reason / Clinical Note
                                    </label>
                                    <input
                                        type="text"
                                        value={dutyStatusForm.delayReason}
                                        onChange={(e) => setDutyStatusForm(p => ({ ...p, delayReason: e.target.value }))}
                                        placeholder={dutyStatusForm.dailyStatus === 'Delayed' ? 'e.g. Emergency surgery in OR 3' : 'e.g. On approved emergency leave'}
                                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-slate-800"
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
                                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                                >
                                    {isUpdatingStatus && <Loader2 size={16} className="animate-spin" />}
                                    <span>Save & Broadcast Status</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default DoctorSchedule
