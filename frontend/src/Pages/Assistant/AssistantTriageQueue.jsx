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
    Calendar,
    ArrowRightLeft,
    Receipt,
    Banknote,
    CreditCard
} from 'lucide-react'
import useAxiosPrivate from '../../hooks/useAxiosPrivate'
import Pagination from '../../components/common/Pagination'
import PaymentReceiptModal from '../../components/common/PaymentReceiptModal'
import { formatDoctorName, formatDepartmentName } from '../../utils/formatters'

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
    const [doctorDaySchedule, setDoctorDaySchedule] = useState(null)

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
    const [triagePage, setTriagePage] = useState(1)
    const [doctorSearchTerm, setDoctorSearchTerm] = useState('')
    const [doctorSearchFilter, setDoctorSearchFilter] = useState('')
    const [isDivertModalOpen, setIsDivertModalOpen] = useState(false)
    const [divertItem, setDivertItem] = useState(null)
    const [diversionCandidates, setDiversionCandidates] = useState(null)
    const [isLoadingCandidates, setIsLoadingCandidates] = useState(false)
    const [selectedDiversionOption, setSelectedDiversionOption] = useState('PeerDoctor')
    const [targetDoctorId, setTargetDoctorId] = useState('')
    const [targetSlot, setTargetSlot] = useState('')
    const [diversionReasonInput, setDiversionReasonInput] = useState('')
    const [isSubmittingDivert, setIsSubmittingDivert] = useState(false)
    const [divertError, setDivertError] = useState('')

    const [selectedPaymentItem, setSelectedPaymentItem] = useState(null)
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
    const [paymentMethod, setPaymentMethod] = useState('Cash')
    const [transactionReference, setTransactionReference] = useState('')
    const [paymentNotes, setPaymentNotes] = useState('')
    const [isCollectingPayment, setIsCollectingPayment] = useState(false)
    const [paymentError, setPaymentError] = useState(null)
    const [activeReceipt, setActiveReceipt] = useState(null)
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false)
    const [isLoadingReceipt, setIsLoadingReceipt] = useState(false)

    useEffect(() => {
        setTriagePage(1)
    }, [searchQuery, vitalsFilter, statusFilter])

    useEffect(() => {
        if (!bookingForm.doctorId || !bookingForm.appointmentDate) return
        const fetchSchedule = async () => {
            try {
                const res = await axiosPrivate.get(`/Appointment/doctor-day-schedule?doctorId=${bookingForm.doctorId}&date=${bookingForm.appointmentDate}`)
                if (res.data) {
                    setDoctorDaySchedule(res.data)
                    setBookedSlots(Array.isArray(res.data.bookedSlots) ? res.data.bookedSlots : [])
                    return
                }
            } catch {
                // Fallback to booked-slots
            }

            try {
                const res = await axiosPrivate.get(`/Appointment/booked-slots?doctorId=${bookingForm.doctorId}&date=${bookingForm.appointmentDate}`)
                setBookedSlots(Array.isArray(res.data) ? res.data : [])
            } catch {
                setBookedSlots([])
            }
            setDoctorDaySchedule(null)
        }
        fetchSchedule()
    }, [bookingForm.doctorId, bookingForm.appointmentDate])

    const handleOpenBookingModal = async () => {
        setBookingError(null)
        setDoctorSearchTerm('')
        setDoctorSearchFilter('')
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

    const handleOpenPaymentModal = (item) => {
        setSelectedPaymentItem(item)
        setPaymentMethod('Cash')
        setTransactionReference('')
        setPaymentNotes('')
        setPaymentError(null)
        setIsPaymentModalOpen(true)
    }

    const handleCollectPayment = async (e) => {
        e.preventDefault()
        if (!selectedPaymentItem) return

        if (paymentMethod !== 'Cash' && !transactionReference.trim()) {
            setPaymentError(`Transaction Reference / TRX ID is required for ${paymentMethod} payments.`)
            return
        }

        setIsCollectingPayment(true)
        setPaymentError(null)

        try {
            const payload = {
                appointmentId: selectedPaymentItem.appointmentId,
                paymentMethod,
                transactionReference: paymentMethod === 'Cash' ? null : transactionReference.trim(),
                notes: paymentNotes.trim() || undefined
            }

            const res = await axiosPrivate.post('/Assistant/payment/collect', payload)
            
            setQueue(prevQueue => prevQueue.map(item => {
                if (item.appointmentId === selectedPaymentItem.appointmentId) {
                    return {
                        ...item,
                        isPaid: true,
                        paymentMethod: res.data.paymentMethod,
                        receiptNumber: res.data.receiptNumber,
                        paidAt: res.data.paidAt,
                        transactionReference: res.data.transactionReference,
                        consultationFee: res.data.amount
                    }
                }
                return item
            }))

            setIsPaymentModalOpen(false)
            setActiveReceipt(res.data)
            setIsReceiptModalOpen(true)
            setSuccessMessage(`Fee of PKR ${res.data.amount?.toLocaleString()} collected successfully for ${selectedPaymentItem.patientName}! Official slip issued.`)
        } catch (err) {
            setPaymentError(err.response?.data?.message || 'Failed to collect payment. Please verify details.')
        } finally {
            setIsCollectingPayment(false)
        }
    }

    const handleViewReceipt = async (appointmentId) => {
        setIsLoadingReceipt(true)
        try {
            const res = await axiosPrivate.get(`/Assistant/payment/receipt/${appointmentId}`)
            setActiveReceipt(res.data)
            setIsReceiptModalOpen(true)
        } catch (err) {
            setVitalsError(err.response?.data?.message || 'Could not retrieve payment receipt.')
        } finally {
            setIsLoadingReceipt(false)
        }
    }

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
        if (item.status === 'Completed' || item.status === 'Cancelled' || item.isPast) {
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

    const handleOpenDivertModal = async (item) => {
        setDivertItem(item)
        setDivertError('')
        setDiversionCandidates(null)
        setSelectedDiversionOption('PeerDoctor')
        setTargetDoctorId('')
        setTargetSlot('')
        setDiversionReasonInput('')
        setIsDivertModalOpen(true)
        setIsLoadingCandidates(true)

        try {
            const res = await axiosPrivate.get(`/Assistant/diversion/candidates/${item.appointmentId}`)
            setDiversionCandidates(res.data)
            if (res.data.peerDoctors && res.data.peerDoctors.length > 0) {
                const firstAvailablePeer = res.data.peerDoctors.find(p => p.availableSlots && p.availableSlots.length > 0) || res.data.peerDoctors[0]
                setTargetDoctorId(firstAvailablePeer.doctorId.toString())
                if (firstAvailablePeer.availableSlots && firstAvailablePeer.availableSlots.length > 0) {
                    setTargetSlot(firstAvailablePeer.availableSlots[0])
                }
            } else if (res.data.sameDoctorAlternativeSlots && res.data.sameDoctorAlternativeSlots.length > 0) {
                setSelectedDiversionOption('SameDoctor')
                setTargetDoctorId(item.doctorId.toString())
                setTargetSlot(res.data.sameDoctorAlternativeSlots[0])
            }
        } catch (err) {
            setDivertError(err.response?.data?.message || 'Failed to load diversion options.')
        } finally {
            setIsLoadingCandidates(false)
        }
    }

    const handleSubmitDiversion = async (e) => {
        e.preventDefault()
        if (!divertItem) return

        if (!targetDoctorId) {
            setDivertError('Please select a target physician.')
            return
        }

        if (!targetSlot) {
            setDivertError('Please select a valid consultation time slot.')
            return
        }

        setIsSubmittingDivert(true)
        setDivertError('')

        try {
            const payload = {
                appointmentId: divertItem.appointmentId,
                targetDoctorId: parseInt(targetDoctorId),
                newTimeSlot: targetSlot.length === 5 ? `${targetSlot}:00` : targetSlot,
                diversionReason: diversionReasonInput.trim() || 'Physician schedule adjustment / delay reassignment',
                optionType: selectedDiversionOption
            }

            const res = await axiosPrivate.post('/Assistant/divert-appointment', payload)
            setSuccessMessage(`Appointment successfully diverted to Dr. ${res.data.newDoctorName} at ${res.data.newTimeSlot.substring(0, 5)}!`)
            setIsDivertModalOpen(false)
            setDivertItem(null)
            await fetchQueue()
        } catch (err) {
            setDivertError(err.response?.data?.message || 'Failed to divert appointment.')
        } finally {
            setIsSubmittingDivert(false)
        }
    }

    const filteredQueue = queue.filter(item => {
        const matchesSearch = 
            item.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.departmentName && item.departmentName.toLowerCase().includes(searchQuery.toLowerCase()))

        const matchesStatus = statusFilter === 'ALL'
            ? true
            : statusFilter === 'Booked'
            ? (item.status === 'Booked' || item.status === 'Confirmed' || item.status === 'Pending')
            : item.status === statusFilter

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

            <div className="bg-white rounded-2xl shadow-xl shadow-slate-900/10 overflow-hidden flex flex-col">
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

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
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
                                <option value="Booked">Booked</option>
                                <option value="CheckedIn">Checked In</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-100/80 text-xs font-black text-slate-700 uppercase tracking-wider">
                                <th className="py-3.5 px-4 sm:px-6">#</th>
                                <th className="py-3.5 px-4">Slot (PKT)</th>
                                <th className="py-3.5 px-4">Patient Name</th>
                                <th className="py-3.5 px-4">Consultant Doctor</th>
                                <th className="py-3.5 px-4 text-center">Visit Status</th>
                                <th className="py-3.5 px-4 text-center">Fee & Payment</th>
                                <th className="py-3.5 px-4">Triage Vitals Check</th>
                                <th className="py-3.5 px-4 sm:px-6 text-center">Triage Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={8} className="py-14 text-center text-slate-600">
                                        <div className="flex items-center justify-center gap-2.5">
                                            <Loader2 size={18} className="animate-spin text-slate-900" />
                                            <span className="text-sm font-bold text-slate-700">Loading today's queue...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredQueue.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-14 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Activity size={36} className="text-slate-400" />
                                            <span className="text-base font-bold text-slate-800">No appointments scheduled for today</span>
                                            <span className="text-xs text-slate-500">Queue reflects Pakistan Standard Time date boundaries</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredQueue.slice((triagePage - 1) * 20, triagePage * 20).map((item, index) => {
                                    const serialNumber = (triagePage - 1) * 20 + index + 1
                                    const isLocked = item.status === 'Completed' || item.status === 'Cancelled' || item.isPast

                                    return (
                                        <tr key={item.appointmentId} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="py-4 px-4 sm:px-6 font-mono text-xs font-bold text-slate-600">
                                                {serialNumber}
                                            </td>
                                            <td className="py-4 px-4 text-xs font-semibold text-slate-800 whitespace-nowrap">
                                                {item.timeSlot?.substring(0, 5)}
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-900">{item.patientName}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-xs font-bold text-slate-900">{formatDoctorName(item.doctorName)}</span>
                                                    <span className="text-[11px] font-semibold text-slate-500">{item.departmentName}</span>

                                                    {item.isDoctorLateToday && (
                                                        <span className="text-[11px] font-semibold text-slate-600">
                                                            Delayed ({item.doctorDelayMinutes}m){item.doctorDelayReason ? `: ${item.doctorDelayReason}` : ''}
                                                        </span>
                                                    )}

                                                    {item.doctorDailyStatus === 'OffDuty' && (
                                                        <span className="text-[11px] font-semibold text-slate-600">
                                                            Off-Duty Today
                                                        </span>
                                                    )}

                                                    {item.isDiverted && (
                                                        <span className="text-[11px] font-semibold text-slate-600">
                                                            Diverted from {formatDoctorName(item.originalDoctorName || 'Peer')}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-center">
                                                <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-md text-xs font-semibold ${
                                                    item.status === 'CheckedIn'
                                                        ? 'text-sky-800 bg-sky-100'
                                                        : (item.status === 'Confirmed' || item.status === 'Booked' || item.status === 'Pending')
                                                        ? 'text-slate-800 bg-slate-100'
                                                        : item.status === 'Completed'
                                                        ? 'text-slate-700 bg-slate-100'
                                                        : item.status === 'Missed'
                                                        ? 'text-slate-600 bg-slate-100'
                                                        : item.status === 'Cancelled'
                                                        ? 'text-slate-500 bg-slate-100'
                                                        : 'text-slate-700 bg-slate-100'
                                                }`}>
                                                    {item.status === 'CheckedIn' ? 'Checked In' : ((item.status === 'Confirmed' || item.status === 'Pending') ? 'Booked' : item.status)}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-center whitespace-nowrap">
                                                {item.isPaid ? (
                                                    <div className="flex flex-col items-center gap-1">
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold text-slate-800 bg-slate-100 border border-slate-200">
                                                            <CheckCircle2 size={12} className="text-slate-500" />
                                                            <span>PKR {item.consultationFee?.toLocaleString()}</span>
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleViewReceipt(item.appointmentId)}
                                                            disabled={isLoadingReceipt}
                                                            className="text-[11px] font-semibold text-slate-700 hover:text-slate-900 underline flex items-center gap-1 cursor-pointer"
                                                            title={`Slip: ${item.receiptNumber || 'View Slip'}`}
                                                        >
                                                            <Receipt size={12} className="text-slate-500" />
                                                            <span>Slip ({item.paymentMethod || 'Paid'})</span>
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-1">
                                                        <span className="text-xs font-bold text-slate-800">
                                                            PKR {item.consultationFee?.toLocaleString() || '1,500'}
                                                        </span>
                                                        {item.status !== 'Cancelled' && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenPaymentModal(item)}
                                                                className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                                                            >
                                                                <CreditCard size={12} />
                                                                <span>Collect Fee</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
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
                                            <td className="py-4 px-4 sm:px-6 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    {(item.isDoctorLateToday || item.doctorDailyStatus === 'OffDuty' || item.doctorDailyStatus === 'Delayed') && item.status !== 'Completed' && item.status !== 'Cancelled' && !item.isPast && (
                                                        <button
                                                            onClick={() => handleOpenDivertModal(item)}
                                                            className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                                                            title="Divert appointment due to doctor delay or absence"
                                                        >
                                                            <ArrowRightLeft size={13} />
                                                            <span>Divert</span>
                                                        </button>
                                                    )}

                                                    {(item.status === 'Booked' || item.status === 'Confirmed' || item.status === 'Pending' || item.status === 'Missed') && !item.isPast && (
                                                        <button
                                                            onClick={() => handleCheckIn(item.appointmentId, item.patientName)}
                                                            disabled={actionLoadingId === item.appointmentId}
                                                            className="px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
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
                                                        <span className="text-xs font-medium text-slate-400">Locked</span>
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

                <Pagination
                    currentPage={triagePage}
                    totalItems={filteredQueue.length}
                    pageSize={20}
                    onPageChange={setTriagePage}
                />
            </div>

            {isVitalsModalOpen && selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
                    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
                        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                                    <Activity size={20} />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-slate-900">Record Patient Triage Vitals</h3>
                                    <p className="text-xs font-semibold text-slate-600 mt-0.5">
                                        Patient: <span className="text-slate-950 font-bold">{selectedItem.patientName}</span> &bull; Consultant: <span className="text-slate-950 font-bold">{formatDoctorName(selectedItem.doctorName)}</span>
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
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-in fade-in duration-150">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
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
                            <div className="mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs font-bold text-rose-800 shrink-0">
                                <AlertCircle size={16} className="text-rose-600 shrink-0" />
                                <span>{bookingError}</span>
                            </div>
                        )}

                        <form onSubmit={handleAssistedBookingSubmit} className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4.5 [scrollbar-width:thin]">
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
                                            maxLength={50}
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
                                                maxLength={15}
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
                                            maxLength={100}
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

                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-slate-800">
                                            Consultant Doctor <span className="text-rose-600">*</span>
                                        </label>
                                        {bookingForm.doctorId && (
                                            <span className="text-[11px] font-semibold text-sky-700 truncate max-w-[200px]">
                                                {formatDoctorName(doctorsList.find(d => String(d.id) === String(bookingForm.doctorId))?.name)}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className="relative flex-1">
                                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Search doctor by name, specialty..."
                                                maxLength={100}
                                                value={doctorSearchTerm}
                                                onChange={(e) => {
                                                    setDoctorSearchTerm(e.target.value)
                                                    if (e.target.value === '') setDoctorSearchFilter('')
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault()
                                                        setDoctorSearchFilter(doctorSearchTerm)
                                                    }
                                                }}
                                                className="w-full pl-8.5 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 placeholder:text-slate-400 bg-white focus:outline-none focus:border-slate-800"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setDoctorSearchFilter(doctorSearchTerm)}
                                            className="px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                                        >
                                            <Search size={13} />
                                            <span>Search</span>
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1.5 border border-slate-200 rounded-xl bg-slate-50/50 [scrollbar-width:thin]">
                                        {(() => {
                                            const filteredDocs = doctorsList.filter(doc => {
                                                const q = (doctorSearchFilter || doctorSearchTerm || '').trim().toLowerCase()
                                                if (!q) return true
                                                return (doc.name || '').toLowerCase().includes(q) ||
                                                       (doc.specialization || '').toLowerCase().includes(q) ||
                                                       (doc.departmentName || '').toLowerCase().includes(q)
                                            })

                                            if (filteredDocs.length === 0) {
                                                return (
                                                    <div className="col-span-2 p-3 text-center text-xs text-slate-500">
                                                        No matching doctors found in your department.
                                                    </div>
                                                )
                                            }

                                            return filteredDocs.map((doc) => {
                                                const isSelected = String(bookingForm.doctorId) === String(doc.id)
                                                return (
                                                    <button
                                                        key={doc.id}
                                                        type="button"
                                                        onClick={() => setBookingForm(prev => ({ ...prev, doctorId: doc.id.toString(), timeSlot: '' }))}
                                                        className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                                                            isSelected
                                                                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                                                                : 'bg-white hover:bg-slate-100 text-slate-900 border-slate-200'
                                                        }`}
                                                    >
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-xs font-bold truncate">{formatDoctorName(doc.name)}</span>
                                                            <span className={`text-[10px] truncate ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                                                                {doc.specialization || doc.departmentName}
                                                            </span>
                                                        </div>
                                                        {isSelected && (
                                                            <UserCheck size={14} className="shrink-0 text-white" />
                                                        )}
                                                    </button>
                                                )
                                            })
                                        })()}
                                    </div>
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

                                <div className="flex flex-col gap-1.5 mt-1">
                                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                        <Clock size={13} className="text-slate-500" />
                                        <span>Consultation Time Slot (PKT)</span>
                                        <span className="text-rose-600">*</span>
                                    </label>

                                    {(() => {
                                        const doc = doctorsList.find(d => String(d.id) === String(bookingForm.doctorId))
                                        const effectiveStart = doctorDaySchedule?.shiftStart || doc?.shiftStart
                                        const effectiveEnd = doctorDaySchedule?.shiftEnd || doc?.shiftEnd
                                        const slots = (effectiveStart && effectiveEnd) ? generateSlots(effectiveStart, effectiveEnd) : []

                                        if (doctorDaySchedule?.dailyStatus === 'OffDuty') {
                                            return (
                                                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
                                                    Physician is marked Off-Duty on {bookingForm.appointmentDate}. Please choose another date or doctor.
                                                </div>
                                            )
                                        }

                                        if (slots.length === 0) {
                                            return (
                                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
                                                    Please select a valid doctor with active shift hours.
                                                </div>
                                            )
                                        }

                                        return (
                                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-32 overflow-y-auto p-1.5 border border-slate-200 rounded-xl bg-slate-50/50 [scrollbar-width:thin]">
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
                                    maxLength={255}
                                    placeholder="e.g. High fever, persistent cough, walk-in consultation request..."
                                    value={bookingForm.symptoms}
                                    onChange={(e) => setBookingForm(prev => ({ ...prev, symptoms: e.target.value }))}
                                    className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-800 bg-white resize-none"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setIsBookingModalOpen(false)}
                                    className="px-5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingBooking || !bookingForm.timeSlot}
                                    className="flex items-center gap-2 px-6 py-2 rounded-xl bg-slate-900 text-white text-xs sm:text-sm font-bold hover:bg-slate-800 shadow-sm transition-all disabled:opacity-50"
                                >
                                    {isSubmittingBooking && <Loader2 size={16} className="animate-spin" />}
                                    <span>Confirm Assisted Booking</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {isDivertModalOpen && divertItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
                    <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between p-5 border-b border-slate-100">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    <ArrowRightLeft size={16} className="text-slate-800" />
                                    <span>Divert Clinical Appointment</span>
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Patient: <span className="font-semibold text-slate-800">{divertItem.patientName}</span> • Current Slot: <span className="font-mono text-slate-800">{divertItem.timeSlot?.substring(0, 5)}</span>
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setIsDivertModalOpen(false)
                                    setDivertItem(null)
                                }}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitDiversion} className="p-5 flex flex-col gap-4">
                            {divertError && (
                                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                                    <AlertCircle size={15} className="shrink-0" />
                                    <span>{divertError}</span>
                                </div>
                            )}

                            {divertItem.isDoctorLateToday && (
                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs flex items-center gap-2.5">
                                    <Clock size={16} className="text-slate-600 shrink-0" />
                                    <div>
                                        <span className="font-bold">{formatDoctorName(divertItem.doctorName)}</span> is delayed by {divertItem.doctorDelayMinutes} minutes {divertItem.doctorDelayReason ? `(${divertItem.doctorDelayReason})` : ''}.
                                    </div>
                                </div>
                            )}

                            {divertItem.doctorDailyStatus === 'OffDuty' && (
                                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2.5">
                                    <AlertTriangle size={16} className="text-rose-700 shrink-0" />
                                    <div>
                                        <span className="font-bold">{formatDoctorName(divertItem.doctorName)}</span> is marked off-duty today. Reassign appointment to avoid patient wait.
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedDiversionOption('PeerDoctor')
                                        if (diversionCandidates?.peerDoctors?.length > 0) {
                                            const firstDoc = diversionCandidates.peerDoctors[0]
                                            setTargetDoctorId(firstDoc.doctorId.toString())
                                            setTargetSlot(firstDoc.availableSlots?.[0] || '')
                                        }
                                    }}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                        selectedDiversionOption === 'PeerDoctor'
                                            ? 'bg-white text-slate-900 shadow-xs'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    Peer Doctor in Department
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedDiversionOption('SameDoctor')
                                        setTargetDoctorId(divertItem.doctorId.toString())
                                        setTargetSlot(diversionCandidates?.sameDoctorAlternativeSlots?.[0] || '')
                                    }}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                        selectedDiversionOption === 'SameDoctor'
                                            ? 'bg-white text-slate-900 shadow-xs'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    Later Slot with Same Doctor
                                </button>
                            </div>

                            {isLoadingCandidates ? (
                                <div className="flex flex-col items-center justify-center py-8 gap-2">
                                    <Loader2 size={24} className="animate-spin text-slate-900" />
                                    <span className="text-xs font-semibold text-slate-500">Checking open slots and peer doctors...</span>
                                </div>
                            ) : selectedDiversionOption === 'PeerDoctor' ? (
                                <div className="flex flex-col gap-3">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-slate-700">
                                            Target Physician ({formatDepartmentName(diversionCandidates?.departmentName)})
                                        </label>
                                        <select
                                            value={targetDoctorId}
                                            onChange={(e) => {
                                                const newId = e.target.value
                                                setTargetDoctorId(newId)
                                                const peer = diversionCandidates?.peerDoctors?.find(p => p.doctorId.toString() === newId)
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
                                            {diversionCandidates?.peerDoctors?.map(peer => (
                                                <option key={peer.doctorId} value={peer.doctorId}>
                                                    {formatDoctorName(peer.doctorName)} ({formatDepartmentName(peer.departmentName)}) - {peer.availableSlots?.length || 0} open slots {peer.isFreeAtTargetSlot ? '★ Matches Slot' : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-slate-700">Target Time Slot</label>
                                        {(() => {
                                            const currentPeer = diversionCandidates?.peerDoctors?.find(p => p.doctorId.toString() === targetDoctorId)
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
                                                            {slot.substring(0, 5)}
                                                        </button>
                                                    ))}
                                                </div>
                                            )
                                        })()}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-700">
                                        Select Later Slot for {formatDoctorName(divertItem.doctorName)}
                                    </label>
                                    {(!diversionCandidates?.sameDoctorAlternativeSlots || diversionCandidates.sameDoctorAlternativeSlots.length === 0) ? (
                                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 font-medium">
                                            No alternative open slots remaining for {formatDoctorName(divertItem.doctorName)} today.
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1">
                                            {diversionCandidates.sameDoctorAlternativeSlots.map(slot => (
                                                <button
                                                    type="button"
                                                    key={slot}
                                                    onClick={() => setTargetSlot(slot)}
                                                    className={`py-2 px-2.5 rounded-lg text-xs font-mono font-bold transition-all border cursor-pointer ${
                                                        targetSlot === slot
                                                            ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                                                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                                                    }`}
                                                >
                                                    {slot.substring(0, 5)}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-800">
                                    Reason for Diversion / Reassignment Notes
                                </label>
                                <input
                                    type="text"
                                    maxLength={200}
                                    placeholder="e.g. Doctor delay reassignment with patient consent"
                                    value={diversionReasonInput}
                                    onChange={(e) => setDiversionReasonInput(e.target.value)}
                                    className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:border-slate-800"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsDivertModalOpen(false)
                                        setDivertItem(null)
                                    }}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingDivert || !targetDoctorId || !targetSlot}
                                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-xs flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                                >
                                    {isSubmittingDivert ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin" />
                                            Diverting...
                                        </>
                                    ) : (
                                        'Confirm Diversion'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isPaymentModalOpen && selectedPaymentItem && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl max-w-lg w-full shadow-lg border border-slate-200 overflow-hidden flex flex-col my-6">
                        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                                    <Banknote size={20} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">Collect Consultation Fee</h3>
                                    <p className="text-xs font-semibold text-slate-500">
                                        Patient: <span className="text-slate-900 font-bold">{selectedPaymentItem.patientName}</span>
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setIsPaymentModalOpen(false)
                                    setSelectedPaymentItem(null)
                                }}
                                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCollectPayment} className="p-6 flex flex-col gap-4">
                            {paymentError && (
                                <div className="p-3.5 bg-slate-100 border border-slate-300 text-slate-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                                    <AlertCircle size={16} className="shrink-0 text-slate-600" />
                                    <span>{paymentError}</span>
                                </div>
                            )}

                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-3 text-xs">
                                <div>
                                    <span className="text-slate-500 font-medium">Physician:</span>
                                    <p className="font-bold text-slate-900">{formatDoctorName(selectedPaymentItem.doctorName)}</p>
                                    <span className="text-[11px] text-slate-500">{selectedPaymentItem.departmentName}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 font-medium">Scheduled Time:</span>
                                    <p className="font-bold text-slate-900">{selectedPaymentItem.timeSlot?.substring(0, 5)} (PKT)</p>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between">
                                <div>
                                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Total Consultation Fee</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-2xl font-bold font-mono text-white">
                                        PKR {selectedPaymentItem.consultationFee?.toLocaleString() || '1,500'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                    Select Payment Method <span className="text-slate-900">*</span>
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: 'Cash', label: 'Cash', icon: Banknote },
                                        { id: 'JazzCash', label: 'JazzCash', icon: CreditCard },
                                        { id: 'EasyPaisa', label: 'EasyPaisa', icon: CreditCard },
                                        { id: 'BankTransfer', label: 'Bank / Raast', icon: CreditCard },
                                        { id: 'Card', label: 'Debit / Card', icon: CreditCard },
                                    ].map(method => {
                                        const Icon = method.icon
                                        const isSelected = paymentMethod === method.id
                                        return (
                                            <button
                                                key={method.id}
                                                type="button"
                                                onClick={() => {
                                                    setPaymentMethod(method.id)
                                                    setPaymentError(null)
                                                }}
                                                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                                    isSelected
                                                        ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                                                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                                }`}
                                            >
                                                <Icon size={16} className={isSelected ? 'text-white' : 'text-slate-500'} />
                                                <span>{method.label}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {paymentMethod !== 'Cash' && (
                                <div className="flex flex-col gap-1.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                                    <label className="text-xs font-bold text-slate-900 flex items-center justify-between">
                                        <span>Transaction Reference / TRX ID <span className="text-rose-600">*</span></span>
                                        <span className="text-[11px] font-semibold text-slate-500">Required for {paymentMethod}</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        maxLength={100}
                                        placeholder={`Enter ${paymentMethod} transaction reference number...`}
                                        value={transactionReference}
                                        onChange={(e) => setTransactionReference(e.target.value)}
                                        className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-900 bg-white focus:outline-none focus:border-sky-500"
                                    />
                                    <p className="text-[11px] text-slate-500 font-medium">
                                        Verify transaction confirmation on patient device before confirming.
                                    </p>
                                </div>
                            )}

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-700">
                                    Internal Notes (Optional)
                                </label>
                                <input
                                    type="text"
                                    maxLength={250}
                                    placeholder="Optional billing remarks..."
                                    value={paymentNotes}
                                    onChange={(e) => setPaymentNotes(e.target.value)}
                                    className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:border-sky-500 font-medium"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsPaymentModalOpen(false)
                                        setSelectedPaymentItem(null)
                                    }}
                                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCollectingPayment || (paymentMethod !== 'Cash' && !transactionReference.trim())}
                                    className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 transition-colors shadow-xs flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                                >
                                    {isCollectingPayment ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin" />
                                            <span>Processing Fee...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 size={14} className="text-white" />
                                            <span>Confirm & Issue Official Slip</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <PaymentReceiptModal
                receipt={activeReceipt}
                isOpen={isReceiptModalOpen}
                onClose={() => {
                    setIsReceiptModalOpen(false)
                    setActiveReceipt(null)
                }}
            />
        </div>
    )
}

export default AssistantTriageQueue
