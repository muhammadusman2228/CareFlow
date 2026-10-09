import { useState, useEffect } from 'react'
import { 
    Activity, 
    Search, 
    RefreshCw, 
    Clock, 
    User, 
    Stethoscope, 
    Building2, 
    CheckCircle2, 
    AlertCircle, 
    Loader2, 
    X, 
    PlusCircle, 
    Edit2, 
    Thermometer, 
    Heart, 
    Scale, 
    Droplets,
    AlertTriangle,
    UserCheck,
    Lock,
    PhoneCall,
    Phone,
    Calendar
} from 'lucide-react'
import useAxiosPrivate from '../../hooks/useAxiosPrivate'

const generateSlots = (shiftStart, shiftEnd) => {
    if (!shiftStart || !shiftEnd) return []
    const [startH, startM] = shiftStart.split(':').map(Number)
    const [endH, endM] = shiftEnd.split(':').map(Number)
    const startTotal = startH * 60 + startM
    const endTotal = endH * 60 + endM
    const slots = []
    for (let time = startTotal; time + 30 <= endTotal; time += 60) {
        const h = Math.floor(time / 60)
        const m = time % 60
        const hh = String(h).padStart(2, '0')
        const mm = String(m).padStart(2, '0')
        const value = `${hh}:${mm}:00`
        const period = h >= 12 ? 'PM' : 'AM'
        const displayH = h % 12 === 0 ? 12 : h % 12
        const displayHH = String(displayH).padStart(2, '0')
        const label = `${displayHH}:${mm} ${period}`
        slots.push({ label, value })
    }
    return slots
}

const isPastSlot = (slotValue, dateStr) => {
    const now = new Date()
    const todayPktStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi' }).format(now)
    if (dateStr < todayPktStr) return true
    if (dateStr > todayPktStr) return false
    const pktTimeStr = new Intl.DateTimeFormat('en-GB', { 
        timeZone: 'Asia/Karachi', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit', 
        hour12: false 
    }).format(now)
    return slotValue <= pktTimeStr
}

const AssistantTriageQueue = () => {
    const axiosPrivate = useAxiosPrivate()

    const [queue, setQueue] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [vitalsFilter, setVitalsFilter] = useState('ALL')

    const [selectedItem, setSelectedItem] = useState(null)
    const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false)
    const [isSavingVitals, setIsSavingVitals] = useState(false)
    const [vitalsError, setVitalsError] = useState(null)
    const [actionLoadingId, setActionLoadingId] = useState(null)
    const [successMessage, setSuccessMessage] = useState('')

    const initialVitalsForm = {
        bloodPressure: '',
        heartRate: '',
        temperature: '',
        weightKg: '',
        heightCm: '',
        spO2: '98',
        bloodSugar: '',
        triageNotes: ''
    }

    const [vitalsForm, setVitalsForm] = useState(initialVitalsForm)

    const todayPktStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi' }).format(new Date())
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
    const [isSubmittingBooking, setIsSubmittingBooking] = useState(false)
    const [bookingError, setBookingError] = useState(null)
    const [doctorsList, setDoctorsList] = useState([])
    const [bookedSlots, setBookedSlots] = useState([])

    const initialBookingForm = {
        patientName: '',
        patientPhone: '',
        patientEmail: '',
        gender: 'Male',
        bloodGroup: '',
        doctorId: '',
        appointmentDate: todayPktStr,
        timeSlot: '',
        symptoms: ''
    }

    const [bookingForm, setBookingForm] = useState(initialBookingForm)

    useEffect(() => {
        if (!bookingForm.doctorId || !bookingForm.appointmentDate) return
        const fetchBooked = async () => {
            try {
                const res = await axiosPrivate.get(`/Appointment/booked-slots?doctorId=${bookingForm.doctorId}&date=${bookingForm.appointmentDate}`)
                setBookedSlots(Array.isArray(res.data) ? res.data : [])
            } catch {
                setBookedSlots([])
            }
        }
        fetchBooked()
    }, [bookingForm.doctorId, bookingForm.appointmentDate])

    const handleOpenBookingModal = async () => {
        setBookingError(null)
        try {
            const res = await axiosPrivate.get('/Assistant/schedulable-doctors')
            const docs = Array.isArray(res.data) ? res.data : []
            setDoctorsList(docs)
            const firstDocId = docs.length > 0 ? docs[0].id.toString() : ''
            setBookingForm({
                ...initialBookingForm,
                appointmentDate: todayPktStr,
                doctorId: firstDocId
            })
            if (firstDocId) {
                const slotsRes = await axiosPrivate.get(`/Appointment/booked-slots?doctorId=${firstDocId}&date=${todayPktStr}`).catch(() => ({ data: [] }))
                setBookedSlots(Array.isArray(slotsRes.data) ? slotsRes.data : [])
            }
        } catch {
            setDoctorsList([])
        }
        setIsBookingModalOpen(true)
    }

    const handleAssistedBookingSubmit = async (e) => {
        e.preventDefault()
        if (!bookingForm.doctorId) {
            setBookingError('Please choose a consultant physician.')
            return
        }
        if (!bookingForm.timeSlot) {
            setBookingError('Please select a valid consultation time slot.')
            return
        }

        setIsSubmittingBooking(true)
        setBookingError(null)

        try {
            const payload = {
                patientName: bookingForm.patientName.trim(),
                patientPhone: bookingForm.patientPhone.trim(),
                patientEmail: bookingForm.patientEmail.trim() || undefined,
                gender: bookingForm.gender,
                bloodGroup: bookingForm.bloodGroup || undefined,
                doctorId: parseInt(bookingForm.doctorId),
                appointmentDate: bookingForm.appointmentDate,
                timeSlot: bookingForm.timeSlot,
                symptoms: bookingForm.symptoms.trim() || 'Assisted phone reservation'
            }

            const res = await axiosPrivate.post('/Assistant/book-appointment', payload)
            setSuccessMessage(`Appointment successfully confirmed for ${res.data.patientName} with Dr. ${res.data.doctorName} at ${res.data.timeSlot.substring(0, 5)}!`)
            setIsBookingModalOpen(false)
            setBookingForm(initialBookingForm)
            await fetchQueue()
        } catch (err) {
            setBookingError(err.response?.data?.message || 'Failed to book assisted appointment.')
        } finally {
            setIsSubmittingBooking(false)
        }
    }

    const fetchQueue = async () => {
        setIsLoading(true)
        setVitalsError(null)
        try {
            const res = await axiosPrivate.get('/Assistant/queue')
            setQueue(Array.isArray(res.data) ? res.data : [])
        } catch {
            setVitalsError('Unable to load triage patient queue for today.')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchQueue()
    }, [])

    const handleCheckIn = async (appointmentId, patientName) => {
        try {
            setActionLoadingId(appointmentId)
            setVitalsError(null)
            await axiosPrivate.patch(`/Assistant/check-in/${appointmentId}`)
            setSuccessMessage(`Patient ${patientName} marked as Checked In at triage station.`)
            await fetchQueue()
        } catch (err) {
            setVitalsError(err.response?.data?.message || 'Failed to check in patient.')
        } finally {
            setActionLoadingId(null)
        }
    }

    const handleOpenVitalsModal = (item) => {
        if (!item.canRecordVitals || item.isPast || item.status === 'Completed' || item.status === 'Cancelled' || item.status === 'Missed') {
            setVitalsError('This appointment has already passed or concluded. Vitals cannot be modified.')
            return
        }

        setSelectedItem(item)
        setVitalsError(null)

        if (item.vitals) {
            setVitalsForm({
                bloodPressure: item.vitals.bloodPressure || '',
                heartRate: item.vitals.heartRate?.toString() || '',
                temperature: item.vitals.temperature?.toString() || '',
                weightKg: item.vitals.weightKg?.toString() || '',
                heightCm: item.vitals.heightCm ? item.vitals.heightCm.toString() : '',
                spO2: item.vitals.spO2 ? item.vitals.spO2.toString() : '98',
                bloodSugar: item.vitals.bloodSugar || '',
                triageNotes: item.vitals.triageNotes || ''
            })
        } else {
            setVitalsForm(initialVitalsForm)
        }

        setIsVitalsModalOpen(true)
    }

    const handleSaveVitals = async (e) => {
        e.preventDefault()
        if (!selectedItem) return

        setIsSavingVitals(true)
        setVitalsError(null)

        try {
            const payload = {
                appointmentId: selectedItem.appointmentId,
                bloodPressure: vitalsForm.bloodPressure.trim(),
                heartRate: parseInt(vitalsForm.heartRate),
                temperature: parseFloat(vitalsForm.temperature),
                weightKg: parseFloat(vitalsForm.weightKg),
                heightCm: vitalsForm.heightCm ? parseFloat(vitalsForm.heightCm) : null,
                spO2: parseInt(vitalsForm.spO2),
                bloodSugar: vitalsForm.bloodSugar.trim(),
                triageNotes: vitalsForm.triageNotes.trim()
            }

            await axiosPrivate.post('/Assistant/vitals', payload)
            setSuccessMessage(`Triage vitals recorded and patient ${selectedItem.patientName} checked in.`)
            setIsVitalsModalOpen(false)
            setSelectedItem(null)
            await fetchQueue()
        } catch (err) {
            setVitalsError(err.response?.data?.message || 'Failed to record vitals.')
        } finally {
            setIsSavingVitals(false)
        }
    }

    const filteredQueue = queue.filter(item => {
        const matchesSearch = 
            item.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.departmentName && item.departmentName.toLowerCase().includes(searchQuery.toLowerCase()))

        const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter

        const matchesVitals = 
            vitalsFilter === 'ALL' ||
            (vitalsFilter === 'RECORDED' && item.hasVitals) ||
            (vitalsFilter === 'PENDING' && !item.hasVitals)

        return matchesSearch && matchesStatus && matchesVitals
    })

    const isHighBP = (bp) => {
        if (!bp || !bp.includes('/')) return false
        const parts = bp.split('/')
        const sys = parseInt(parts[0])
        const dia = parseInt(parts[1])
        return sys >= 140 || dia >= 90
    }

    const isFever = (temp) => {
        const t = parseFloat(temp)
        return !isNaN(t) && t >= 99.5
    }

    const isLowSpO2 = (spo2) => {
        const s = parseInt(spo2)
        return !isNaN(s) && s < 95
    }

    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Today's Patient Triage Queue</h1>
                    <p className="text-sm font-medium text-slate-600 mt-1">Check in incoming OPD patients, measure vitals, and update status in real-time</p>
                </div>

                <div className="flex items-center gap-3 self-start sm:self-auto">
                    <button
                        onClick={fetchQueue}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-800 hover:bg-slate-50 shadow-xs transition-all"
                    >
                        <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
                        <span>Refresh Queue</span>
                    </button>

                    <button
                        onClick={handleOpenBookingModal}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 shadow-sm transition-all"
                    >
                        <PhoneCall size={15} />
                        <span>Book for Patient (Phone / Walk-In)</span>
                    </button>
                </div>
            </div>

            {successMessage && (
                <div className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between text-xs font-bold shadow-sm">
                    <div className="flex items-center gap-2.5">
                        <CheckCircle2 size={18} className="text-white shrink-0" />
                        <span>{successMessage}</span>
                    </div>
                    <button onClick={() => setSuccessMessage('')} className="text-slate-400 hover:text-white">
                        <X size={16} />
                    </button>
                </div>
            )}

            {vitalsError && (
                <div className="p-4 bg-slate-100 border border-slate-300 rounded-xl flex items-center justify-between text-xs text-slate-900 font-bold shadow-xs">
                    <div className="flex items-center gap-2.5">
                        <AlertCircle size={18} className="text-slate-900 shrink-0" />
                        <span>{vitalsError}</span>
                    </div>
                    <button onClick={() => setVitalsError(null)} className="text-slate-400 hover:text-slate-700">
                        <X size={16} />
                    </button>
                </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/70">
                    <div className="relative flex-1 max-w-md">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search patient, doctor, or department..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-800 bg-white"
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-700 whitespace-nowrap">Triage:</span>
                            <select
                                value={vitalsFilter}
                                onChange={(e) => setVitalsFilter(e.target.value)}
                                className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:border-slate-800 font-bold"
                            >
                                <option value="ALL">All Patients</option>
                                <option value="PENDING">Pending Vitals</option>
                                <option value="RECORDED">Vitals Recorded</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-700 whitespace-nowrap">Status:</span>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:border-slate-800 font-bold"
                            >
                                <option value="ALL">All Statuses</option>
                                <option value="CheckedIn">Checked In</option>
                                <option value="Confirmed">Confirmed</option>
                                <option value="Completed">Completed</option>
                                <option value="Pending">Pending</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-100/80 text-xs font-black text-slate-700 uppercase tracking-wider">
                                <th className="py-3.5 px-4 sm:px-6">Slot (PKT)</th>
                                <th className="py-3.5 px-4">Patient Name</th>
                                <th className="py-3.5 px-4">Consultant Doctor</th>
                                <th className="py-3.5 px-4">Visit Status</th>
                                <th className="py-3.5 px-4">Triage Vitals Check</th>
                                <th className="py-3.5 px-4 sm:px-6 text-right">Triage Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="py-14 text-center text-slate-600">
                                        <div className="flex items-center justify-center gap-2.5">
                                            <Loader2 size={18} className="animate-spin text-slate-900" />
                                            <span className="text-sm font-bold text-slate-700">Loading today's queue...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredQueue.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-14 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Activity size={36} className="text-slate-400" />
                                            <span className="text-base font-bold text-slate-800">No appointments scheduled for today</span>
                                            <span className="text-xs text-slate-500">Queue reflects Pakistan Standard Time date boundaries</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredQueue.map((item) => {
                                    const isLocked = !item.canRecordVitals || item.isPast || item.status === 'Completed' || item.status === 'Cancelled' || item.status === 'Missed'

                                    return (
                                        <tr key={item.appointmentId} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="py-4 px-4 sm:px-6 text-xs font-semibold text-slate-800 whitespace-nowrap">
                                                {item.timeSlot?.substring(0, 5)}
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-900">{item.patientName}</span>
                                                    <span className="text-xs font-medium text-slate-500">ID: #PID-{item.patientId}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-slate-900">Dr. {item.doctorName}</span>
                                                    <span className="text-[11px] font-semibold text-slate-500 mt-0.5">{item.departmentName}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className={`text-xs font-semibold ${
                                                    item.status === 'CheckedIn'
                                                        ? 'text-slate-950 font-bold'
                                                        : item.status === 'Confirmed'
                                                        ? 'text-slate-800'
                                                        : item.status === 'Completed'
                                                        ? 'text-slate-600'
                                                        : 'text-slate-500'
                                                }`}>
                                                    {item.status === 'CheckedIn' ? 'Checked In' : item.status}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                {item.hasVitals && item.vitals ? (
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-xs font-semibold text-slate-800">
                                                            BP: {item.vitals.bloodPressure} &bull; HR: {item.vitals.heartRate} bpm &bull; {item.vitals.temperature}&deg;F &bull; SpO2: {item.vitals.spO2}%
                                                        </span>
                                                        <span className="text-[11px] text-slate-500">
                                                            Triage completed by {item.vitals.assistantName}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400 font-medium">Pending measurement</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-4 sm:px-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {item.status !== 'CheckedIn' && item.status !== 'Completed' && item.status !== 'Cancelled' && !item.isPast && (
                                                        <button
                                                            onClick={() => handleCheckIn(item.appointmentId, item.patientName)}
                                                            disabled={actionLoadingId === item.appointmentId}
                                                            className="px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                                                            title="Mark patient checked in"
                                                        >
                                                            {actionLoadingId === item.appointmentId ? (
                                                                <Loader2 size={13} className="animate-spin" />
                                                            ) : (
                                                                <UserCheck size={13} />
                                                            )}
                                                            <span>Check In</span>
                                                        </button>
                                                    )}

                                                    {isLocked ? (
                                                        <span className="text-xs font-medium text-slate-400">Locked (Concluded)</span>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleOpenVitalsModal(item)}
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                                                                item.hasVitals
                                                                    ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs'
                                                                    : 'bg-slate-900 text-white hover:bg-slate-800 shadow-xs'
                                                            }`}
                                                        >
                                                            {item.hasVitals ? <Edit2 size={13} /> : <PlusCircle size={13} />}
                                                            <span>{item.hasVitals ? 'Update Vitals' : 'Measure Vitals'}</span>
                                                        </button>
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

            {isVitalsModalOpen && selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
                    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col">
                        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                                    <Activity size={20} />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-slate-900">Record Patient Triage Vitals</h3>
                                    <p className="text-xs font-semibold text-slate-600 mt-0.5">
                                        Patient: <span className="text-slate-950 font-bold">{selectedItem.patientName}</span> &bull; Consultant: <span className="text-slate-950 font-bold">Dr. {selectedItem.doctorName}</span>
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsVitalsModalOpen(false)}
                                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveVitals} className="p-6 sm:p-8 flex flex-col gap-5">
                            {vitalsError && (
                                <div className="p-4 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 flex items-center gap-2">
                                    <AlertCircle size={16} />
                                    <span>{vitalsError}</span>
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                            Blood Pressure (mmHg) <span className="text-slate-900">*</span>
                                        </label>
                                        {isHighBP(vitalsForm.bloodPressure) && (
                                            <span className="text-xs text-white font-black flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded">
                                                <AlertTriangle size={12} /> High BP
                                            </span>
                                        )}
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. 120/80"
                                        value={vitalsForm.bloodPressure}
                                        onChange={(e) => setVitalsForm(prev => ({ ...prev, bloodPressure: e.target.value }))}
                                        className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 font-mono bg-white"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                        Heart Rate (bpm) <span className="text-slate-900">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="30"
                                        max="250"
                                        placeholder="e.g. 72"
                                        value={vitalsForm.heartRate}
                                        onChange={(e) => setVitalsForm(prev => ({ ...prev, heartRate: e.target.value }))}
                                        className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 font-mono bg-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                            Temperature (°F) <span className="text-slate-900">*</span>
                                        </label>
                                        {isFever(vitalsForm.temperature) && (
                                            <span className="text-xs text-white font-black flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded">
                                                <AlertTriangle size={12} /> Fever
                                            </span>
                                        )}
                                    </div>
                                    <input
                                        type="number"
                                        step="0.1"
                                        required
                                        min="80"
                                        max="115"
                                        placeholder="e.g. 98.6"
                                        value={vitalsForm.temperature}
                                        onChange={(e) => setVitalsForm(prev => ({ ...prev, temperature: e.target.value }))}
                                        className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 font-mono bg-white"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                            SpO2 Oxygen Saturation (%) <span className="text-slate-900">*</span>
                                        </label>
                                        {isLowSpO2(vitalsForm.spO2) && (
                                            <span className="text-xs text-white font-black flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded">
                                                <AlertTriangle size={12} /> Low SpO2
                                            </span>
                                        )}
                                    </div>
                                    <input
                                        type="number"
                                        required
                                        min="50"
                                        max="100"
                                        placeholder="e.g. 98"
                                        value={vitalsForm.spO2}
                                        onChange={(e) => setVitalsForm(prev => ({ ...prev, spO2: e.target.value }))}
                                        className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 font-mono bg-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                        Weight (kg) <span className="text-slate-900">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        required
                                        min="1"
                                        max="350"
                                        placeholder="e.g. 70.5"
                                        value={vitalsForm.weightKg}
                                        onChange={(e) => setVitalsForm(prev => ({ ...prev, weightKg: e.target.value }))}
                                        className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 font-mono bg-white"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                        Height (cm)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        placeholder="e.g. 175"
                                        value={vitalsForm.heightCm}
                                        onChange={(e) => setVitalsForm(prev => ({ ...prev, heightCm: e.target.value }))}
                                        className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 font-mono bg-white"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                        Blood Sugar
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 110 mg/dL"
                                        value={vitalsForm.bloodSugar}
                                        onChange={(e) => setVitalsForm(prev => ({ ...prev, bloodSugar: e.target.value }))}
                                        className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 bg-white"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                    Assistant Triage Notes
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="Enter physical observations, reported complaints, or allergies observed at triage..."
                                    value={vitalsForm.triageNotes}
                                    onChange={(e) => setVitalsForm(prev => ({ ...prev, triageNotes: e.target.value }))}
                                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 bg-white resize-none"
                                />
                            </div>

                            <div className="mt-2 flex items-center justify-end gap-3 border-t border-slate-200 pt-5">
                                <button
                                    type="button"
                                    onClick={() => setIsVitalsModalOpen(false)}
                                    className="px-5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSavingVitals}
                                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 shadow-sm transition-all disabled:opacity-50"
                                >
                                    {isSavingVitals && <Loader2 size={16} className="animate-spin" />}
                                    <span>Save & Check In Patient</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isBookingModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full p-6 sm:p-7 flex flex-col gap-5 my-8">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
                                    <PhoneCall size={18} />
                                </div>
                                <div className="flex flex-col">
                                    <h2 className="text-base font-bold text-slate-900">
                                        Book Assisted Consultation
                                    </h2>
                                    <p className="text-xs font-semibold text-slate-500">
                                        For illiterate, phone call, or walk-in OPD patients
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsBookingModalOpen(false)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {bookingError && (
                            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs font-bold text-rose-800">
                                <AlertCircle size={16} className="text-rose-600 shrink-0" />
                                <span>{bookingError}</span>
                            </div>
                        )}

                        <form onSubmit={handleAssistedBookingSubmit} className="flex flex-col gap-5">
                            <div className="flex flex-col gap-3">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                    <User size={14} />
                                    <span>1. Patient Demographics</span>
                                </span>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    <div className="flex flex-col gap-1 sm:col-span-2">
                                        <label className="text-xs font-bold text-slate-800">
                                            Patient Full Name <span className="text-rose-600">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. Muhammad Rasheed"
                                            value={bookingForm.patientName}
                                            onChange={(e) => setBookingForm(prev => ({ ...prev, patientName: e.target.value }))}
                                            className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-800 bg-white"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-bold text-slate-800">
                                            Contact Phone Number <span className="text-rose-600">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="tel"
                                                required
                                                placeholder="03001234567"
                                                value={bookingForm.patientPhone}
                                                onChange={(e) => setBookingForm(prev => ({ ...prev, patientPhone: e.target.value }))}
                                                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-800 bg-white"
                                            />
                                            <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-bold text-slate-800">
                                            Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                                        </label>
                                        <input
                                            type="email"
                                            placeholder="patient@careflow.com"
                                            value={bookingForm.patientEmail}
                                            onChange={(e) => setBookingForm(prev => ({ ...prev, patientEmail: e.target.value }))}
                                            className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-800 bg-white"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-bold text-slate-800">
                                            Gender
                                        </label>
                                        <select
                                            value={bookingForm.gender}
                                            onChange={(e) => setBookingForm(prev => ({ ...prev, gender: e.target.value }))}
                                            className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-900 bg-white focus:outline-none focus:border-slate-800"
                                        >
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-bold text-slate-800">
                                            Blood Group
                                        </label>
                                        <select
                                            value={bookingForm.bloodGroup}
                                            onChange={(e) => setBookingForm(prev => ({ ...prev, bloodGroup: e.target.value }))}
                                            className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-900 bg-white focus:outline-none focus:border-slate-800"
                                        >
                                            <option value="">Unknown / Not Disclosed</option>
                                            <option value="A+">A+</option>
                                            <option value="A-">A-</option>
                                            <option value="B+">B+</option>
                                            <option value="B-">B-</option>
                                            <option value="AB+">AB+</option>
                                            <option value="AB-">AB-</option>
                                            <option value="O+">O+</option>
                                            <option value="O-">O-</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 pt-3 border-t border-slate-100">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                    <Stethoscope size={14} />
                                    <span>2. Consultant & Shift Timing</span>
                                </span>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-bold text-slate-800">
                                            Consultant Doctor <span className="text-rose-600">*</span>
                                        </label>
                                        <select
                                            required
                                            value={bookingForm.doctorId}
                                            onChange={(e) => setBookingForm(prev => ({ ...prev, doctorId: e.target.value, timeSlot: '' }))}
                                            className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-900 bg-white focus:outline-none focus:border-slate-800"
                                        >
                                            {doctorsList.length === 0 ? (
                                                <option value="" disabled>No doctors available in your assigned department</option>
                                            ) : (
                                                doctorsList.map((doc) => (
                                                    <option key={doc.id} value={doc.id.toString()}>
                                                        {doc.name} ({doc.specialization || doc.departmentName})
                                                    </option>
                                                ))
                                            )}
                                        </select>
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-bold text-slate-800">
                                            Appointment Date (PKT) <span className="text-rose-600">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            required
                                            min={todayPktStr}
                                            value={bookingForm.appointmentDate}
                                            onChange={(e) => setBookingForm(prev => ({ ...prev, appointmentDate: e.target.value, timeSlot: '' }))}
                                            className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-900 bg-white focus:outline-none focus:border-slate-800"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5 mt-1">
                                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                        <Clock size={13} className="text-slate-500" />
                                        <span>Consultation Time Slot (PKT)</span>
                                        <span className="text-rose-600">*</span>
                                    </label>

                                    {(() => {
                                        const doc = doctorsList.find(d => String(d.id) === String(bookingForm.doctorId))
                                        const slots = doc ? generateSlots(doc.shiftStart, doc.shiftEnd) : []

                                        if (slots.length === 0) {
                                            return (
                                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
                                                    Please select a valid doctor with active shift hours.
                                                </div>
                                            )
                                        }

                                        return (
                                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1 border border-slate-200 rounded-xl bg-slate-50/50">
                                                {slots.map((s) => {
                                                    const isBooked = bookedSlots.includes(s.value)
                                                    const isPast = isPastSlot(s.value, bookingForm.appointmentDate)
                                                    const isDisabled = isBooked || isPast
                                                    const isSelected = bookingForm.timeSlot === s.value

                                                    return (
                                                        <button
                                                            key={s.value}
                                                            type="button"
                                                            disabled={isDisabled}
                                                            onClick={() => setBookingForm(prev => ({ ...prev, timeSlot: s.value }))}
                                                            className={`p-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center transition-all border ${
                                                                isDisabled
                                                                    ? 'opacity-60 bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                                                    : isSelected
                                                                        ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                                                                        : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                                                            }`}
                                                        >
                                                            <span>{s.label}</span>
                                                            {isBooked && <span className="text-[9px] font-semibold text-rose-600">Booked</span>}
                                                            {isPast && !isBooked && <span className="text-[9px] font-semibold text-slate-400">Passed</span>}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        )
                                    })()}
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5 pt-3 border-t border-slate-100">
                                <label className="text-xs font-bold text-slate-800">
                                    Patient Symptoms & Primary Complaints
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="e.g. High fever, persistent cough, walk-in consultation request..."
                                    value={bookingForm.symptoms}
                                    onChange={(e) => setBookingForm(prev => ({ ...prev, symptoms: e.target.value }))}
                                    className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-800 bg-white resize-none"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setIsBookingModalOpen(false)}
                                    className="px-5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingBooking || !bookingForm.timeSlot}
                                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 text-white text-xs sm:text-sm font-bold hover:bg-slate-800 shadow-sm transition-all disabled:opacity-50"
                                >
                                    {isSubmittingBooking && <Loader2 size={16} className="animate-spin" />}
                                    <span>Confirm Assisted Booking</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AssistantTriageQueue
