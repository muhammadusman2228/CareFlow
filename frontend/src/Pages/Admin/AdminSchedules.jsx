import { useState, useEffect } from 'react'
import { 
    CalendarDays, 
    Clock, 
    ChevronLeft, 
    ChevronRight, 
    Edit3, 
    Stethoscope, 
    Building2, 
    CheckCircle2, 
    AlertCircle, 
    Loader2, 
    X, 
    Users, 
    CalendarClock,
    Power
} from 'lucide-react'
import useAxiosPrivate from '../../hooks/useAxiosPrivate'

const AdminSchedules = () => {
    const axiosPrivate = useAxiosPrivate()

    const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi' }).format(new Date())
    const [selectedDate, setSelectedDate] = useState(todayStr)
    const [schedules, setSchedules] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState('')

    const [isShiftModalOpen, setIsShiftModalOpen] = useState(false)
    const [selectedDoctor, setSelectedDoctor] = useState(null)
    const [shiftStartInput, setShiftStartInput] = useState('09:00')
    const [shiftEndInput, setShiftEndInput] = useState('17:00')
    const [isAvailableInput, setIsAvailableInput] = useState(true)
    const [togglingDoctorId, setTogglingDoctorId] = useState(null)
    const [isUpdatingShift, setIsUpdatingShift] = useState(false)
    const [modalError, setModalError] = useState('')
    const [successMessage, setSuccessMessage] = useState('')

    const fetchSchedules = async (date) => {
        setIsLoading(true)
        setErrorMessage('')
        try {
            const response = await axiosPrivate.get(`/Admin/schedules?date=${date}`)
            if (Array.isArray(response.data)) {
                setSchedules(response.data)
            } else {
                setSchedules([])
            }
        } catch (error) {
            setErrorMessage('Unable to load schedule roster. Please check server.')
            setSchedules([])
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchSchedules(selectedDate)
    }, [selectedDate])

    const handleDateChange = (direction) => {
        const [y, m, d] = selectedDate.split('-').map(Number)
        const current = new Date(Date.UTC(y, m - 1, d))
        if (direction === 'prev') {
            current.setUTCDate(current.getUTCDate() - 1)
        } else {
            current.setUTCDate(current.getUTCDate() + 1)
        }
        setSelectedDate(current.toISOString().split('T')[0])
    }

    const openShiftModal = (doc) => {
        setSelectedDoctor(doc)
        setShiftStartInput(doc.shiftStart ? doc.shiftStart.substring(0, 5) : '09:00')
        setShiftEndInput(doc.shiftEnd ? doc.shiftEnd.substring(0, 5) : '17:00')
        setIsAvailableInput(Boolean(doc.isAvailable))
        setModalError('')
        setSuccessMessage('')
        setIsShiftModalOpen(true)
    }

    const handleToggleAvailability = async (doctorId) => {
        try {
            setTogglingDoctorId(doctorId)
            const response = await axiosPrivate.patch(`/Admin/doctor/${doctorId}/availability`)
            setSchedules(prev => prev.map(doc => 
                doc.doctorId === doctorId 
                    ? { ...doc, isAvailable: response.data.isAvailable } 
                    : doc
            ))
        } catch {
        } finally {
            setTogglingDoctorId(null)
        }
    }

    const handleSaveShift = async (e) => {
        e.preventDefault()
        if (!selectedDoctor) return
        setModalError('')

        if (shiftStartInput >= shiftEndInput) {
            setModalError('Shift start time must be before shift end time.')
            return
        }

        setIsUpdatingShift(true)
        try {
            const payload = {
                shiftStart: `${shiftStartInput}:00`,
                shiftEnd: `${shiftEndInput}:00`,
                isAvailable: isAvailableInput
            }
            await axiosPrivate.patch(`/Admin/doctor/${selectedDoctor.doctorId}/shift`, payload)
            setSuccessMessage('Shift working hours updated successfully!')
            fetchSchedules(selectedDate)
            setTimeout(() => {
                setIsShiftModalOpen(false)
            }, 1200)
        } catch (err) {
            const msg = err?.response?.data?.message || 'Failed to update shift hours.'
            setModalError(msg)
        } finally {
            setIsUpdatingShift(false)
        }
    }

    const totalDoctorsCount = schedules.length
    const totalBookedAppointments = schedules.reduce((sum, item) => sum + item.bookedSlotsCount, 0)
    const activeCoverageCount = schedules.filter(s => s.isAvailable).length

    const formatDisplayDate = (dateString) => {
        const d = new Date(dateString + 'T00:00:00')
        return d.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    }

    return (
        <div className="schedules-page flex flex-col gap-6 max-w-7xl mx-auto pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-col">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                        Schedules & Clinical Shifts
                    </h1>
                    <p className="text-sm text-slate-600 font-medium mt-0.5">
                        Supervise physician duty shifts, slot allocations, and clinic occupancy.
                    </p>
                </div>

                <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-300 p-1.5 shadow-sm">
                    <button
                        onClick={() => handleDateChange('prev')}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                        title="Previous Day"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="px-2 py-1 text-xs sm:text-sm font-semibold text-slate-800 border-none outline-none bg-transparent cursor-pointer"
                    />
                    <button
                        onClick={() => handleDateChange('next')}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                        title="Next Day"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-700 shrink-0">
                        <Stethoscope size={22} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs sm:text-sm font-semibold text-slate-600">Doctors on Duty</span>
                        <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">{totalDoctorsCount}</span>
                        <span className="text-xs font-medium text-slate-500 mt-0.5">{activeCoverageCount} Active Coverage</span>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-700 shrink-0">
                        <CalendarClock size={22} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs sm:text-sm font-semibold text-slate-600">Booked Slots</span>
                        <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">{totalBookedAppointments}</span>
                        <span className="text-xs font-medium text-slate-500 mt-0.5">Recorded for {formatDisplayDate(selectedDate)}</span>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-700 shrink-0">
                        <CheckCircle2 size={22} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs sm:text-sm font-semibold text-slate-600">Roster Status</span>
                        <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">Operational</span>
                        <span className="text-xs font-medium text-slate-500 mt-0.5">All Shifts Published</span>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
                    <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
                    <p className="text-sm font-semibold text-slate-600">Loading daily schedule roster...</p>
                </div>
            ) : errorMessage ? (
                <div className="bg-white rounded-xl border border-rose-200 p-8 text-center flex flex-col items-center justify-center gap-2 shadow-sm">
                    <AlertCircle className="w-8 h-8 text-rose-500" />
                    <p className="text-xs sm:text-sm text-rose-600 font-semibold">{errorMessage}</p>
                </div>
            ) : schedules.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center flex flex-col items-center justify-center gap-3 shadow-sm">
                    <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-700">
                        <CalendarDays size={24} />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">No Schedules Configured</h3>
                    <p className="text-xs sm:text-sm text-slate-500 max-w-sm">
                        No physician shift records found for {formatDisplayDate(selectedDate)}.
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50/90 text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    <th className="py-3.5 px-5">Doctor</th>
                                    <th className="py-3.5 px-5">Department</th>
                                    <th className="py-3.5 px-5">Shift Hours</th>
                                    <th className="py-3.5 px-5">Booked Consultations</th>
                                    <th className="py-3.5 px-5">Availability</th>
                                    <th className="py-3.5 px-5 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm font-medium text-slate-800">
                                {schedules.map((doc) => (
                                    <tr key={doc.doctorId} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="py-4 px-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 font-bold text-xs flex items-center justify-center shrink-0">
                                                    {(doc.doctorName || 'D').charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900">{doc.doctorName}</span>
                                                    <span className="text-xs font-semibold text-slate-500 font-mono">ID: #{doc.doctorId}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-5">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm font-semibold">
                                                <Building2 size={13} className="text-slate-500" />
                                                {doc.departmentName}
                                            </span>
                                        </td>
                                        <td className="py-4 px-5">
                                            <span className="inline-flex items-center gap-1.5 font-mono text-slate-800 font-semibold bg-sky-50/60 px-2.5 py-1 rounded-lg border border-sky-100 text-xs sm:text-sm">
                                                <Clock size={13} className="text-sky-700" />
                                                {doc.shiftStart} - {doc.shiftEnd}
                                            </span>
                                        </td>
                                        <td className="py-4 px-5">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-extrabold text-slate-900">{doc.bookedSlotsCount}</span>
                                                <span className="text-xs font-semibold text-slate-500">booked</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-5">
                                            <span className="text-xs font-semibold text-slate-700">
                                                {doc.isAvailable ? 'On Duty' : 'Off Duty'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {doc.isAvailable ? (
                                                    <button
                                                        disabled={togglingDoctorId === doc.doctorId}
                                                        onClick={() => handleToggleAvailability(doc.doctorId)}
                                                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                                                        title="Mark Doctor Off Duty"
                                                    >
                                                        {togglingDoctorId === doc.doctorId ? (
                                                            <Loader2 size={12} className="animate-spin" />
                                                        ) : (
                                                            <Power size={12} />
                                                        )}
                                                        <span>Set Off</span>
                                                    </button>
                                                ) : (
                                                    <button
                                                        disabled={togglingDoctorId === doc.doctorId}
                                                        onClick={() => handleToggleAvailability(doc.doctorId)}
                                                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                                                        title="Mark Doctor On Duty"
                                                    >
                                                        {togglingDoctorId === doc.doctorId ? (
                                                            <Loader2 size={12} className="animate-spin" />
                                                        ) : (
                                                            <Power size={12} />
                                                        )}
                                                        <span>Set On</span>
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => openShiftModal(doc)}
                                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 transition-colors shadow-2xs cursor-pointer"
                                                >
                                                    <Edit3 size={12} />
                                                    <span>Update Shift</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {isShiftModalOpen && selectedDoctor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Clock size={18} className="text-sky-600" />
                                <h3 className="text-sm font-bold text-slate-900">
                                    Update Doctor Shift Hours
                                </h3>
                            </div>
                            <button
                                onClick={() => setIsShiftModalOpen(false)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveShift} className="p-6 flex flex-col gap-5">
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col gap-0.5 text-xs">
                                <span className="font-bold text-slate-900">{selectedDoctor.doctorName}</span>
                                <span className="text-slate-500">{selectedDoctor.departmentName}</span>
                            </div>

                            {modalError && (
                                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                                    <AlertCircle size={15} className="shrink-0" />
                                    <span>{modalError}</span>
                                </div>
                            )}

                            {successMessage && (
                                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                                    <CheckCircle2 size={15} className="shrink-0" />
                                    <span>{successMessage}</span>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-700">
                                        Shift Start Time
                                    </label>
                                    <input
                                        type="time"
                                        value={shiftStartInput}
                                        onChange={(e) => setShiftStartInput(e.target.value)}
                                        required
                                        className="px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-sky-500 shadow-xs"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-700">
                                        Shift End Time
                                    </label>
                                    <input
                                        type="time"
                                        value={shiftEndInput}
                                        onChange={(e) => setShiftEndInput(e.target.value)}
                                        required
                                        className="px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-sky-500 shadow-xs"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-slate-800">Duty Availability</span>
                                    <span className="text-[11px] text-slate-500">Allow patients to book appointments</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsAvailableInput(!isAvailableInput)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border cursor-pointer ${
                                        isAvailableInput
                                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                            : 'bg-rose-50 text-rose-700 border-rose-200'
                                    }`}
                                >
                                    {isAvailableInput ? 'On Duty' : 'Off Duty'}
                                </button>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsShiftModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isUpdatingShift}
                                    className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 transition-all shadow-xs disabled:opacity-50"
                                >
                                    {isUpdatingShift ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        'Save Shift'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AdminSchedules
