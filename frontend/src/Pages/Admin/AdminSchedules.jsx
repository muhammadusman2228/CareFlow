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
    Power,
    ArrowRightLeft,
    RefreshCw
} from 'lucide-react'
import useAxiosPrivate from '../../hooks/useAxiosPrivate'
import Pagination from '../../components/common/Pagination'
import { formatDoctorName, formatDepartmentName } from '../../utils/formatters'

const AdminSchedules = () => {
    const axiosPrivate = useAxiosPrivate()

    const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi' }).format(new Date())
    const [selectedDate, setSelectedDate] = useState(todayStr)
    const [schedules, setSchedules] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState('')
    const [page, setPage] = useState(1)

    const [isShiftModalOpen, setIsShiftModalOpen] = useState(false)
    const [selectedDoctor, setSelectedDoctor] = useState(null)
    const [shiftStartInput, setShiftStartInput] = useState('09:00')
    const [shiftEndInput, setShiftEndInput] = useState('17:00')
    const [isAvailableInput, setIsAvailableInput] = useState(true)
    const [togglingDoctorId, setTogglingDoctorId] = useState(null)
    const [isUpdatingShift, setIsUpdatingShift] = useState(false)
    const [modalError, setModalError] = useState('')
    const [successMessage, setSuccessMessage] = useState('')

    const [isAppointmentsModalOpen, setIsAppointmentsModalOpen] = useState(false)
    const [viewingDoctor, setViewingDoctor] = useState(null)
    const [doctorAppointments, setDoctorAppointments] = useState([])
    const [isLoadingAppointments, setIsLoadingAppointments] = useState(false)
    const [appointmentsError, setAppointmentsError] = useState('')

    const [isDivertModalOpen, setIsDivertModalOpen] = useState(false)
    const [divertItem, setDivertItem] = useState(null)
    const [diversionCandidates, setDiversionCandidates] = useState(null)
    const [isLoadingCandidates, setIsLoadingCandidates] = useState(false)
    const [selectedDiversionOption, setSelectedDiversionOption] = useState('PeerDoctor')
    const [targetDoctorId, setTargetDoctorId] = useState('')
    const [targetSlot, setTargetSlot] = useState('')
    const [targetDate, setTargetDate] = useState(todayStr)
    const [diversionReasonInput, setDiversionReasonInput] = useState('')
    const [isSubmittingDivert, setIsSubmittingDivert] = useState(false)
    const [divertError, setDivertError] = useState('')
    const [divertSuccess, setDivertSuccess] = useState('')
    const [bookingGuardModal, setBookingGuardModal] = useState({
        isOpen: false,
        doctor: null
    })

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
        setPage(1)
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
        const doc = schedules.find(s => s.doctorId === doctorId)
        if (!doc) return

        if (doc.isAvailable && (doc.bookedSlotsCount || 0) > 0) {
            setBookingGuardModal({
                isOpen: true,
                doctor: doc
            })
            return
        }

        try {
            setTogglingDoctorId(doctorId)
            const response = await axiosPrivate.patch(`/Admin/doctor/${doctorId}/availability?date=${selectedDate}`)
            setSchedules(prev => prev.map(item => 
                item.doctorId === doctorId 
                    ? { ...item, isAvailable: response.data.isAvailable } 
                    : item
            ))
        } catch (err) {
            const msg = err?.response?.data?.message || 'Failed to update doctor availability.'
            setErrorMessage(msg)
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

        if (selectedDoctor.isAvailable && !isAvailableInput && (selectedDoctor.bookedSlotsCount || 0) > 0) {
            setModalError(`Cannot set Off Duty: ${formatDoctorName(selectedDoctor)} has ${selectedDoctor.bookedSlotsCount} active appointment(s) on this date. Please divert or reschedule these appointments first.`)
            return
        }

        setIsUpdatingShift(true)
        try {
            const payload = {
                shiftStart: `${shiftStartInput}:00`,
                shiftEnd: `${shiftEndInput}:00`,
                isAvailable: isAvailableInput
            }
            await axiosPrivate.patch(`/Admin/doctor/${selectedDoctor.doctorId}/shift?date=${selectedDate}`, payload)
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
    const totalBookedAppointments = schedules.reduce((sum, item) => sum + (item.bookedSlotsCount || 0), 0)
    const totalCompletedAppointments = schedules.reduce((sum, item) => sum + (item.completedSlotsCount || 0), 0)
    const activeCoverageCount = schedules.filter(s => s.isAvailable).length
    const isPastDate = selectedDate < todayStr
    const isToday = selectedDate === todayStr

    const formatDisplayDate = (dateString) => {
        const d = new Date(dateString + 'T00:00:00')
        return d.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    }

    const formatTime = (timeStr) => {
        if (!timeStr) return ''
        const parts = timeStr.split(':')
        if (parts.length < 2) return timeStr
        const h = parseInt(parts[0], 10)
        const m = parts[1]
        const period = h >= 12 ? 'PM' : 'AM'
        const displayH = h % 12 === 0 ? 12 : h % 12
        const displayHH = String(displayH).padStart(2, '0')
        return `${displayHH}:${m} ${period}`
    }

    const fetchDoctorAppointments = async (doctorId, date) => {
        setIsLoadingAppointments(true)
        setAppointmentsError('')
        try {
            const response = await axiosPrivate.get(`/Admin/doctor/${doctorId}/appointments?date=${date}`)
            setDoctorAppointments(Array.isArray(response.data) ? response.data : [])
        } catch (err) {
            setAppointmentsError(err?.response?.data?.message || 'Failed to load doctor appointments.')
            setDoctorAppointments([])
        } finally {
            setIsLoadingAppointments(false)
        }
    }

    const handleOpenAppointments = (doc) => {
        setViewingDoctor(doc)
        setIsAppointmentsModalOpen(true)
        fetchDoctorAppointments(doc.doctorId, selectedDate)
    }

    const handleOpenDivertModal = async (app) => {
        setDivertItem(app)
        setDivertError('')
        setDivertSuccess('')
        setDiversionCandidates(null)
        setSelectedDiversionOption('PeerDoctor')
        setTargetDoctorId('')
        setTargetSlot('')
        setTargetDate(app.appointmentDate || selectedDate)
        setDiversionReasonInput('')
        setIsDivertModalOpen(true)
        setIsLoadingCandidates(true)

        try {
            const res = await axiosPrivate.get(`/Admin/diversion/candidates/${app.appointmentId}`)
            setDiversionCandidates(res.data)
            if (res.data.peerDoctors && res.data.peerDoctors.length > 0) {
                const firstAvailablePeer = res.data.peerDoctors.find(p => p.availableSlots && p.availableSlots.length > 0) || res.data.peerDoctors[0]
                setTargetDoctorId(firstAvailablePeer.doctorId.toString())
                if (firstAvailablePeer.availableSlots && firstAvailablePeer.availableSlots.length > 0) {
                    setTargetSlot(firstAvailablePeer.availableSlots[0])
                }
            } else if (res.data.sameDoctorAlternativeSlots && res.data.sameDoctorAlternativeSlots.length > 0) {
                setSelectedDiversionOption('SameDoctor')
                setTargetDoctorId(app.doctorId ? app.doctorId.toString() : viewingDoctor?.doctorId?.toString() || '')
                setTargetSlot(res.data.sameDoctorAlternativeSlots[0])
            }
        } catch (err) {
            setDivertError(err.response?.data?.message || 'Failed to load diversion options.')
        } finally {
            setIsLoadingCandidates(false)
        }
    }

    const handleConfirmDivert = async (e) => {
        e.preventDefault()
        if (!divertItem) return

        const chosenDoctorId = selectedDiversionOption === 'SameDoctor' 
            ? (divertItem.doctorId || viewingDoctor?.doctorId)
            : parseInt(targetDoctorId)

        if (!chosenDoctorId) {
            setDivertError('Please select a target doctor.')
            return
        }

        if (!targetSlot) {
            setDivertError('Please select a valid time slot.')
            return
        }

        setIsSubmittingDivert(true)
        setDivertError('')
        setDivertSuccess('')

        try {
            const payload = {
                appointmentId: divertItem.appointmentId,
                targetDoctorId: chosenDoctorId,
                newDate: targetDate,
                newTimeSlot: targetSlot.length === 5 ? `${targetSlot}:00` : targetSlot,
                diversionReason: diversionReasonInput.trim() || 'Administrative roster reallocation'
            }

            const res = await axiosPrivate.post('/Admin/divert-appointment', payload)
            setDivertSuccess(res.data?.message || 'Appointment diverted successfully!')
            if (viewingDoctor) {
                await fetchDoctorAppointments(viewingDoctor.doctorId, selectedDate)
            }
            await fetchSchedules(selectedDate)
            setTimeout(() => {
                setIsDivertModalOpen(false)
                setDivertItem(null)
            }, 1200)
        } catch (err) {
            setDivertError(err.response?.data?.message || 'Failed to divert appointment.')
        } finally {
            setIsSubmittingDivert(false)
        }
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
                <div className="bg-white rounded-2xl p-5 shadow-xl shadow-slate-900/10 hover:shadow-2xl hover:shadow-slate-900/20 hover:-translate-y-1 transition-all flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Doctors on Duty</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{totalDoctorsCount}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{activeCoverageCount} Active Coverage</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                        <Stethoscope size={20} />
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-xl shadow-slate-900/10 hover:shadow-2xl hover:shadow-slate-900/20 hover:-translate-y-1 transition-all flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            {isPastDate ? 'Scheduled Slots' : isToday ? 'Today\'s Booked Slots' : 'Scheduled Slots'}
                        </p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{totalBookedAppointments}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                            {isPastDate 
                                ? `${totalCompletedAppointments} Completed • ${formatDisplayDate(selectedDate)}`
                                : isToday
                                ? `${totalCompletedAppointments} Completed • Recorded for Today`
                                : `Recorded for ${formatDisplayDate(selectedDate)}`}
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                        <CalendarClock size={20} />
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-xl shadow-slate-900/10 hover:shadow-2xl hover:shadow-slate-900/20 hover:-translate-y-1 transition-all flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Roster Status</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">Operational</p>
                        <p className="text-xs text-slate-500 mt-0.5">All Shifts Published</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={20} />
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
                    <Loader2 className="w-8 h-8 text-slate-700 animate-spin" />
                    <p className="text-sm font-semibold text-slate-600">Loading daily schedule roster...</p>
                </div>
            ) : errorMessage ? (
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center flex flex-col items-center justify-center gap-2 shadow-xs">
                    <AlertCircle className="w-8 h-8 text-rose-500" />
                    <p className="text-xs sm:text-sm text-rose-600 font-semibold">{errorMessage}</p>
                </div>
            ) : schedules.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center gap-3 shadow-xs">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                        <CalendarDays size={24} />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">No Schedules Configured</h3>
                    <p className="text-xs sm:text-sm text-slate-500 max-w-sm">
                        No physician shift records found for {formatDisplayDate(selectedDate)}.
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    <div className="bg-white rounded-2xl shadow-xl shadow-slate-900/10 overflow-hidden">
                        <div className="overflow-x-auto w-full">
                            <table className="w-full text-left border-collapse min-w-[1100px]">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50/90 text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        <th className="py-3.5 px-5 w-12 text-slate-700">#</th>
                                        <th className="py-3.5 px-5">Doctor</th>
                                        <th className="py-3.5 px-5">Department</th>
                                        <th className="py-3.5 px-5">Shift Hours</th>
                                        <th className="py-3.5 px-5">Booked Consultations</th>
                                        <th className="py-3.5 px-5">Availability</th>
                                        <th className="py-3.5 px-5 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm font-medium text-slate-800">
                                    {schedules.slice((page - 1) * 20, page * 20).map((doc, index) => (
                                        <tr key={doc.doctorId} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="py-4 px-5 font-bold text-slate-400 font-mono">
                                                {(page - 1) * 20 + index + 1}
                                            </td>
                                            <td className="py-4 px-5">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-slate-900 text-sm">{formatDoctorName(doc.doctorName)}</span>
                                                    <span className="text-xs text-slate-500">{doc.specialization || 'Clinical Specialist'}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-5 text-slate-700 text-sm font-medium">
                                                {doc.departmentName}
                                            </td>
                                            <td className="py-4 px-5 text-slate-700 text-sm font-medium">
                                                {doc.shiftStart} - {doc.shiftEnd}
                                            </td>
                                            <td className="py-4 px-5">
                                                <button
                                                    onClick={() => handleOpenAppointments(doc)}
                                                    className="text-slate-800 hover:text-sky-600 text-sm font-medium hover:underline cursor-pointer"
                                                    title="View Consultations"
                                                >
                                                    {isPastDate
                                                        ? `${doc.completedSlotsCount || 0} completed / ${doc.bookedSlotsCount || 0} slots`
                                                        : `${doc.bookedSlotsCount || 0} booked`}
                                                </button>
                                            </td>
                                            <td className="py-4 px-5 text-slate-700 text-sm font-medium">
                                                {doc.isAvailable ? 'On Duty' : 'Off Duty'}
                                            </td>
                                            <td className="py-4 px-5 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleOpenAppointments(doc)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
                                                        title="Manage Appointments & Clinical Diversion"
                                                    >
                                                        <CalendarDays size={13} />
                                                        <span>Appointments</span>
                                                    </button>
                                                    {doc.isAvailable ? (
                                                        <button
                                                            disabled={togglingDoctorId === doc.doctorId}
                                                            onClick={() => handleToggleAvailability(doc.doctorId)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
                                                            title="Mark Doctor Off Duty"
                                                        >
                                                            {togglingDoctorId === doc.doctorId ? (
                                                                <Loader2 size={13} className="animate-spin" />
                                                            ) : (
                                                                <Power size={13} />
                                                            )}
                                                            <span>Set Off</span>
                                                        </button>
                                                    ) : (
                                                        <button
                                                            disabled={togglingDoctorId === doc.doctorId}
                                                            onClick={() => handleToggleAvailability(doc.doctorId)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
                                                            title="Mark Doctor On Duty"
                                                        >
                                                            {togglingDoctorId === doc.doctorId ? (
                                                                <Loader2 size={13} className="animate-spin" />
                                                            ) : (
                                                                <Power size={13} />
                                                            )}
                                                            <span>Set On</span>
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => openShiftModal(doc)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors cursor-pointer"
                                                    >
                                                        <Edit3 size={13} />
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

                    <Pagination
                        currentPage={page}
                        totalItems={schedules.length}
                        pageSize={20}
                        onPageChange={setPage}
                    />
                </div>
            )}

            {isShiftModalOpen && selectedDoctor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
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

            {isAppointmentsModalOpen && viewingDoctor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 font-bold flex items-center justify-center">
                                    <CalendarDays size={20} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">
                                        Appointments: {viewingDoctor.doctorName}
                                    </h3>
                                    <p className="text-xs text-slate-500 font-medium">
                                        {viewingDoctor.departmentName} &bull; {formatDisplayDate(selectedDate)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => fetchDoctorAppointments(viewingDoctor.doctorId, selectedDate)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
                                    title="Refresh"
                                >
                                    <RefreshCw size={16} />
                                </button>
                                <button
                                    onClick={() => setIsAppointmentsModalOpen(false)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
                            {isLoadingAppointments ? (
                                <div className="flex flex-col items-center justify-center py-16 gap-3">
                                    <Loader2 className="w-7 h-7 text-sky-600 animate-spin" />
                                    <p className="text-xs font-semibold text-slate-600">Loading appointments for {viewingDoctor.doctorName}...</p>
                                </div>
                            ) : appointmentsError ? (
                                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                                    <AlertCircle size={16} className="shrink-0" />
                                    <span>{appointmentsError}</span>
                                </div>
                            ) : doctorAppointments.length === 0 ? (
                                <div className="text-center py-16 flex flex-col items-center justify-center gap-2">
                                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                                        <CalendarDays size={24} />
                                    </div>
                                    <h4 className="text-sm font-bold text-slate-800">No Appointments Booked</h4>
                                    <p className="text-xs text-slate-500 max-w-sm">
                                        There are currently no scheduled consultations for {formatDoctorName(viewingDoctor.doctorName)} on this date.
                                    </p>
                                </div>
                            ) : (
                                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                                    <table className="w-full text-left border-collapse text-xs">
                                        <thead>
                                            <tr className="border-b border-slate-200 bg-slate-50 font-bold text-slate-700 uppercase">
                                                <th className="py-3 px-4">Time Slot</th>
                                                <th className="py-3 px-4">Patient</th>
                                                <th className="py-3 px-4">Phone</th>
                                                <th className="py-3 px-4">Status</th>
                                                <th className="py-3 px-4">Diversion State</th>
                                                <th className="py-3 px-4 text-center">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                                            {doctorAppointments.map((app) => (
                                                <tr key={app.appointmentId} className="hover:bg-slate-50/70 transition-colors">
                                                    <td className="py-3 px-4 font-mono text-slate-900">
                                                        {formatTime(app.timeSlot)}
                                                    </td>
                                                    <td className="py-3 px-4 font-semibold text-slate-900">
                                                        {app.patientName}
                                                    </td>
                                                    <td className="py-3 px-4 text-slate-600 font-mono">
                                                        {app.patientPhone || '-'}
                                                    </td>
                                                    <td className="py-3 px-4 text-slate-700">
                                                        {app.status}
                                                    </td>
                                                    <td className="py-3 px-4 text-slate-700">
                                                        {app.isDiverted ? `Diverted${app.originalDoctorName ? ` from ${formatDoctorName(app.originalDoctorName)}` : ''}` : 'Original'}
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        {app.status !== 'Completed' && app.status !== 'Cancelled' && app.status !== 'Missed' ? (
                                                            <button
                                                                onClick={() => handleOpenDivertModal(app)}
                                                                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
                                                                title="Reallocate appointment to peer doctor or alternate slot"
                                                            >
                                                                Divert
                                                            </button>
                                                        ) : (
                                                            <span className="text-slate-400 text-xs">Closed</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {isDivertModalOpen && divertItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-xl max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                            <div className="flex items-center gap-2">
                                <ArrowRightLeft size={18} className="text-slate-700" />
                                <h3 className="text-sm font-bold text-slate-900">
                                    Administrative Appointment Diversion
                                </h3>
                            </div>
                            <button
                                onClick={() => setIsDivertModalOpen(false)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleConfirmDivert} className="p-6 flex flex-col gap-4">
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col gap-1 text-xs text-slate-700">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-slate-900 text-sm">{divertItem.patientName}</span>
                                    <span className="font-mono font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded">
                                        {formatTime(divertItem.timeSlot)}
                                    </span>
                                </div>
                                <div className="text-slate-600 flex items-center gap-2 mt-1">
                                    <span>Current Doctor: <strong>{formatDoctorName(divertItem.doctorName || viewingDoctor?.doctorName)}</strong></span>
                                    <span>&bull;</span>
                                    <span>Date: <strong>{divertItem.appointmentDate || selectedDate}</strong></span>
                                </div>
                            </div>

                            {divertError && (
                                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                                    <AlertCircle size={15} className="shrink-0" />
                                    <span>{divertError}</span>
                                </div>
                            )}

                            {divertSuccess && (
                                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                                    <CheckCircle2 size={15} className="shrink-0" />
                                    <span>{divertSuccess}</span>
                                </div>
                            )}

                            {isLoadingCandidates ? (
                                <div className="py-8 flex flex-col items-center justify-center gap-2">
                                    <Loader2 className="w-6 h-6 text-slate-700 animate-spin" />
                                    <span className="text-xs text-slate-500 font-semibold">Scanning available doctors and open slots...</span>
                                </div>
                            ) : diversionCandidates && (
                                <>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-slate-700">Diversion Strategy</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedDiversionOption('PeerDoctor')
                                                    if (diversionCandidates.peerDoctors?.length > 0) {
                                                        const firstPeer = diversionCandidates.peerDoctors.find(p => p.availableSlots?.length > 0) || diversionCandidates.peerDoctors[0]
                                                        setTargetDoctorId(firstPeer.doctorId.toString())
                                                        if (firstPeer.availableSlots?.length > 0) {
                                                            setTargetSlot(firstPeer.availableSlots[0])
                                                        }
                                                    }
                                                }}
                                                className={`p-3 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                                                    selectedDiversionOption === 'PeerDoctor'
                                                        ? 'border-slate-900 bg-slate-50 text-slate-900 shadow-2xs'
                                                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span>Peer Doctor</span>
                                                    <Users size={14} className={selectedDiversionOption === 'PeerDoctor' ? 'text-slate-900' : 'text-slate-400'} />
                                                </div>
                                                <p className="text-[11px] font-normal text-slate-500 mt-1">
                                                    Reallocate to available doctor in department pool
                                                </p>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedDiversionOption('SameDoctor')
                                                    setTargetDoctorId(divertItem.doctorId ? divertItem.doctorId.toString() : viewingDoctor?.doctorId?.toString() || '')
                                                    if (diversionCandidates.sameDoctorAlternativeSlots?.length > 0) {
                                                        setTargetSlot(diversionCandidates.sameDoctorAlternativeSlots[0])
                                                    }
                                                }}
                                                className={`p-3 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                                                    selectedDiversionOption === 'SameDoctor'
                                                        ? 'border-slate-900 bg-slate-50 text-slate-900 shadow-2xs'
                                                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span>Later Open Slot</span>
                                                    <Clock size={14} className={selectedDiversionOption === 'SameDoctor' ? 'text-slate-900' : 'text-slate-400'} />
                                                </div>
                                                <p className="text-[11px] font-normal text-slate-500 mt-1">
                                                    Reschedule to another time with same doctor
                                                </p>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-bold text-slate-700">Effective Date</label>
                                            <input
                                                type="date"
                                                value={targetDate}
                                                min={todayStr}
                                                onChange={(e) => setTargetDate(e.target.value)}
                                                required
                                                className="px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-slate-900 shadow-2xs"
                                            />
                                        </div>

                                        {selectedDiversionOption === 'PeerDoctor' && (
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-xs font-bold text-slate-700">Target Physician</label>
                                                <select
                                                    value={targetDoctorId}
                                                    onChange={(e) => {
                                                        const newId = e.target.value
                                                        setTargetDoctorId(newId)
                                                        const peer = diversionCandidates.peerDoctors?.find(p => p.doctorId.toString() === newId)
                                                        if (peer && peer.availableSlots && peer.availableSlots.length > 0) {
                                                            setTargetSlot(peer.availableSlots[0])
                                                        } else {
                                                            setTargetSlot('')
                                                        }
                                                    }}
                                                    required
                                                    className="px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-slate-900 shadow-2xs bg-white"
                                                >
                                                    <option value="">Select Candidate Doctor</option>
                                                    {diversionCandidates.peerDoctors?.map(peer => (
                                                        <option key={peer.doctorId} value={peer.doctorId}>
                                                            {formatDoctorName(peer.doctorName)} ({formatDepartmentName(peer.departmentName)}) - {peer.availableSlots?.length || 0} open slots {peer.isFreeAtTargetSlot ? '★ Matches Slot' : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-slate-700">Target Time Slot</label>
                                        {selectedDiversionOption === 'PeerDoctor' ? (
                                            (() => {
                                                const currentPeer = diversionCandidates.peerDoctors?.find(p => p.doctorId.toString() === targetDoctorId)
                                                const slots = currentPeer?.availableSlots || []
                                                if (slots.length === 0) {
                                                    return (
                                                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 font-medium">
                                                            No remaining open slots available for this physician today.
                                                        </div>
                                                    )
                                                }
                                                return (
                                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1">
                                                        {slots.map(slot => (
                                                            <button
                                                                key={slot}
                                                                type="button"
                                                                onClick={() => setTargetSlot(slot)}
                                                                className={`py-2 px-2.5 rounded-lg text-xs font-mono font-bold transition-all border cursor-pointer ${
                                                                    targetSlot === slot
                                                                        ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                                                                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                                                                }`}
                                                            >
                                                                {formatTime(slot)}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )
                                            })()
                                        ) : (
                                            (() => {
                                                const slots = diversionCandidates.sameDoctorAlternativeSlots || []
                                                if (slots.length === 0) {
                                                    return (
                                                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 font-medium">
                                                            No later alternative open slots found for this physician today.
                                                        </div>
                                                    )
                                                }
                                                return (
                                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1">
                                                        {slots.map(slot => (
                                                            <button
                                                                key={slot}
                                                                type="button"
                                                                onClick={() => setTargetSlot(slot)}
                                                                className={`py-2 px-2.5 rounded-lg text-xs font-mono font-bold transition-all border cursor-pointer ${
                                                                    targetSlot === slot
                                                                        ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                                                                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                                                                }`}
                                                            >
                                                                {formatTime(slot)}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )
                                            })()
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-slate-700">Diversion Justification</label>
                                        <input
                                            type="text"
                                            value={diversionReasonInput}
                                            onChange={(e) => setDiversionReasonInput(e.target.value)}
                                            placeholder="e.g. Physician emergency leave / Administrative load balancing"
                                            className="px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-slate-900 shadow-2xs"
                                        />
                                    </div>
                                </>
                            )}

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsDivertModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingDivert || !targetSlot || isLoadingCandidates}
                                    className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                                >
                                    {isSubmittingDivert ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin" />
                                            Diverting...
                                        </>
                                    ) : (
                                        <>
                                            <ArrowRightLeft size={14} />
                                            Confirm Diversion
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {bookingGuardModal.isOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        <div className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center shrink-0 border border-slate-200">
                                    <AlertCircle size={22} className="text-slate-800" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-base font-bold text-slate-900">
                                        Active Appointments Detected
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {formatDoctorName(bookingGuardModal.doctor)} has <strong className="text-slate-900">{bookingGuardModal.doctor?.bookedSlotsCount}</strong> active appointment(s) booked for <span className="text-slate-900 font-semibold">{formatDisplayDate(selectedDate)}</span>.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setBookingGuardModal({ isOpen: false, doctor: null })}
                                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
                                Hospital clinical protocol prohibits marking a physician Off Duty while patient appointments remain booked. Please review and divert these appointments to available peer physicians or alternative dates first.
                            </div>

                            <div className="mt-6 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setBookingGuardModal({ isOpen: false, doctor: null })}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const doc = bookingGuardModal.doctor
                                        setBookingGuardModal({ isOpen: false, doctor: null })
                                        if (doc) {
                                            handleOpenAppointments(doc)
                                        }
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
                                >
                                    <ArrowRightLeft size={14} />
                                    <span>Review & Divert Appointments</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AdminSchedules
