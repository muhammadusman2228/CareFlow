import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router'
import { 
    Stethoscope, 
    Clock, 
    DollarSign, 
    Calendar, 
    Award, 
    GraduationCap, 
    ArrowLeft, 
    CheckCircle2, 
    AlertCircle, 
    ShieldCheck, 
    PhoneCall, 
    Building2, 
    MapPin, 
    Loader2 
} from 'lucide-react'
import axios from '../api/axios'
import useAxiosPrivate from '../hooks/useAxiosPrivate'
import useAuth from '../hooks/useAuth'
import AppLogo from '../components/Home/AppLogo.Home'

const generateDoctorSlots = (shiftStart, shiftEnd) => {
    if (!shiftStart || !shiftEnd) {
        return [
            { label: '09:00 AM', value: '09:00:00' },
            { label: '10:30 AM', value: '10:30:00' },
            { label: '11:45 AM', value: '11:45:00' },
            { label: '02:00 PM', value: '14:00:00' },
            { label: '03:30 PM', value: '15:30:00' }
        ]
    }

    const [startH, startM] = shiftStart.split(':').map(Number)
    const [endH, endM] = shiftEnd.split(':').map(Number)

    const startTotal = startH * 60 + startM
    const endTotal = endH * 60 + endM

    const slots = []
    const step = 60

    for (let time = startTotal; time + 30 <= endTotal; time += step) {
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

    return slots.length > 0 ? slots : [
        { label: '09:00 AM', value: '09:00:00' },
        { label: '11:00 AM', value: '11:00:00' },
        { label: '02:00 PM', value: '14:00:00' }
    ]
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

const DoctorPublicProfile = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { auth } = useAuth()
    const axiosPrivate = useAxiosPrivate()

    const [doctor, setDoctor] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi' }).format(new Date())
    const [selectedDate, setSelectedDate] = useState(todayStr)
    const [bookedSlots, setBookedSlots] = useState([])
    const [selectedSlot, setSelectedSlot] = useState(null)
    const [symptoms, setSymptoms] = useState('')
    const [bookingLoading, setBookingLoading] = useState(false)
    const [bookingError, setBookingError] = useState(null)
    const [bookingSuccess, setBookingSuccess] = useState(false)

    useEffect(() => {
        if (!id || !selectedDate) return
        const fetchBookedSlots = async () => {
            try {
                const res = await axios.get(`/Appointment/booked-slots?doctorId=${id}&date=${selectedDate}`)
                setBookedSlots(Array.isArray(res.data) ? res.data : [])
            } catch {
                setBookedSlots([])
            }
        }
        fetchBookedSlots()
    }, [id, selectedDate])

    useEffect(() => {
        if (!doctor) return
        const allSlots = generateDoctorSlots(doctor.shiftStart, doctor.shiftEnd)
        const firstAvailable = allSlots.find(s => !bookedSlots.includes(s.value) && !isPastSlot(s.value, selectedDate))
        setSelectedSlot(firstAvailable || null)
    }, [selectedDate, bookedSlots, doctor])

    useEffect(() => {
        const fetchDoctor = async () => {
            try {
                setLoading(true)
                setError(null)
                const res = await axios.get(`/Admin/doctor/${id}`)
                if (res.data) {
                    setDoctor(res.data)
                } else {
                    setError('Physician record not found')
                }
            } catch {
                try {
                    const fallbackRes = await axios.get('/Admin')
                    if (Array.isArray(fallbackRes.data)) {
                        const matched = fallbackRes.data.find(d => String(d.id) === String(id))
                        if (matched) {
                            setDoctor(matched)
                        } else {
                            setError('Physician record not found')
                        }
                    }
                } catch {
                    setError('Unable to load physician information at this moment.')
                }
            } finally {
                setLoading(false)
            }
        }
        fetchDoctor()
    }, [id])

    const handleConfirmBooking = async (e) => {
        e.preventDefault()
        if (!auth?.accessToken) {
            navigate('/login')
            return
        }

        if (auth?.role !== 'Patient') {
            setBookingError('Only registered patients can book clinical consultations.')
            return
        }

        if (!doctor || !selectedSlot) return

        try {
            setBookingLoading(true)
            setBookingError(null)
            await axiosPrivate.post('/Appointment/booking', {
                patientId: 0,
                doctorId: doctor.id,
                appointmentDate: selectedDate,
                timeSlot: selectedSlot.value,
                symptom: symptoms.trim() || 'General consultation request'
            })
            setBookingSuccess(true)
            setTimeout(() => {
                navigate('/patient/dashboard/appointments')
            }, 1500)
        } catch (err) {
            setBookingError(err.response?.data?.message || 'Failed to schedule appointment. Time slot may be fully booked.')
        } finally {
            setBookingLoading(false)
        }
    }

    const formatTime = (timeStr = '') => {
        if (!timeStr) return '09:00 AM'
        const parts = timeStr.split(':')
        const h = parseInt(parts[0], 10)
        const m = parts[1] || '00'
        const ampm = h >= 12 ? 'PM' : 'AM'
        const hour12 = h % 12 || 12
        return `${hour12.toString().padStart(2, '0')}:${m} ${ampm}`
    }

    const availableSlots = doctor ? generateDoctorSlots(doctor.shiftStart, doctor.shiftEnd) : []

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
                <div className="max-w-7xl mx-auto px-6 lg:px-12 h-18 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link to="/" className="cursor-pointer">
                            <AppLogo />
                        </Link>
                        <button
                            onClick={() => navigate(-1)}
                            className="hidden sm:inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                            <ArrowLeft size={14} />
                            <span>Back to Specialists</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        {auth?.accessToken ? (
                            <Link
                                to={auth?.role === 'Admin' ? '/admin/dashboard' : auth?.role === 'Doctor' ? '/doctor/dashboard' : '/patient/dashboard'}
                                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link
                                    to="/login"
                                    className="px-4 py-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
                                >
                                    Log In
                                </Link>
                                <Link
                                    to="/register"
                                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                                >
                                    Register
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto w-full px-6 lg:px-12 py-8 sm:py-10">
                {loading ? (
                    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
                        <Loader2 className="w-9 h-9 text-sky-600 animate-spin" />
                        <p className="text-sm font-semibold text-slate-600">Loading physician profile...</p>
                    </div>
                ) : error || !doctor ? (
                    <div className="bg-white rounded-2xl border border-rose-200 p-12 text-center max-w-xl mx-auto flex flex-col items-center gap-3 shadow-sm">
                        <AlertCircle className="w-10 h-10 text-rose-500" />
                        <h2 className="text-lg font-bold text-slate-900">Physician Not Found</h2>
                        <p className="text-xs sm:text-sm text-slate-500">{error || 'Requested doctor record does not exist or has been relocated.'}</p>
                        <button
                            onClick={() => navigate('/')}
                            className="mt-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                        >
                            Browse All Specialists
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        <div className="lg:col-span-7 flex flex-col gap-6">
                            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-sm flex flex-col gap-6">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pb-6 border-b border-slate-100">
                                    <div className="w-20 h-20 rounded-2xl bg-sky-50 border border-sky-100 text-sky-700 font-extrabold text-2xl flex items-center justify-center shrink-0 shadow-2xs">
                                        {(doctor.name || 'D').replace('Dr. ', '').charAt(0)}
                                    </div>
                                    <div className="flex flex-col gap-1.5 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-md border border-sky-100">
                                                <Building2 size={12} />
                                                <span>{doctor.departmentName} Department</span>
                                            </span>
                                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                                                <ShieldCheck size={12} className="text-sky-600" />
                                                <span>Verified Practitioner</span>
                                            </span>
                                        </div>
                                        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                                            {doctor.name}
                                        </h1>
                                        <p className="text-sm font-semibold text-slate-600">
                                            {doctor.specialization}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex flex-col gap-1">
                                        <span className="text-slate-400 font-medium text-[11px]">Experience</span>
                                        <span className="font-bold text-slate-900 text-sm">
                                            {doctor.experienceYears ? `${doctor.experienceYears} Years` : '10+ Years'}
                                        </span>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex flex-col gap-1">
                                        <span className="text-slate-400 font-medium text-[11px]">Fee</span>
                                        <span className="font-extrabold text-slate-900 text-sm">
                                            ${Number(doctor.consultationFee || 0).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex flex-col gap-1">
                                        <span className="text-slate-400 font-medium text-[11px]">Shift Timing</span>
                                        <span className="font-bold text-slate-900 font-mono text-[11px]">
                                            {formatTime(doctor.shiftStart)} - {formatTime(doctor.shiftEnd)}
                                        </span>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex flex-col gap-1">
                                        <span className="text-slate-400 font-medium text-[11px]">Clinic Location</span>
                                        <span className="font-bold text-slate-900 text-[11px]">
                                            Pavilion Wing A
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <h3 className="text-sm font-bold text-slate-900 tracking-tight uppercase text-xs text-slate-500">
                                        Qualifications & Accreditations
                                    </h3>
                                    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                                        <GraduationCap size={18} className="text-sky-600 shrink-0" />
                                        <span className="font-semibold text-slate-800">
                                            {doctor.qualifications || 'MBBS, FCPS Certified Specialist, Member of Medical Council'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <h3 className="text-sm font-bold text-slate-900 tracking-tight uppercase text-xs text-slate-500">
                                        Clinical Focus & Care Methodology
                                    </h3>
                                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                        {doctor.name} provides evidence-based clinical diagnostics and therapeutic treatments within the {doctor.departmentName} department. Patient care pathways are individualized, focusing on thorough evaluations, clinical lab reviews, and proactive health maintenance.
                                    </p>
                                </div>

                                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                                    <div className="flex items-center gap-2">
                                        <MapPin size={14} className="text-slate-400" />
                                        <span>CareFlow Central Hospital, Floor 3</span>
                                    </div>
                                    {doctor.assistantPhone ? (
                                        <a href={`tel:${doctor.assistantPhone}`} className="flex items-center gap-2 text-slate-700 hover:text-slate-950 font-bold">
                                            <PhoneCall size={14} className="text-slate-500" />
                                            <span>Assistant: {doctor.assistantPhone}</span>
                                        </a>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <PhoneCall size={14} className="text-slate-400" />
                                            <span>Ext. #{doctor.id + 100}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-5 flex flex-col gap-4">
                            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-sm flex flex-col gap-5 sticky top-24">
                                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                                    <div>
                                        <h2 className="text-base font-bold text-slate-900 tracking-tight">
                                            Book Consultation
                                        </h2>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Direct reservation with {doctor.name}
                                        </p>
                                    </div>
                                    <span className="text-base font-extrabold text-slate-900">
                                        ${Number(doctor.consultationFee || 0).toFixed(2)}
                                    </span>
                                </div>

                                {bookingSuccess && (
                                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5">
                                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                                        <span>Consultation confirmed successfully! Redirecting to appointments...</span>
                                    </div>
                                )}

                                {bookingError && (
                                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2.5">
                                        <AlertCircle size={16} className="text-rose-600 shrink-0" />
                                        <span>{bookingError}</span>
                                    </div>
                                )}

                                <form onSubmit={handleConfirmBooking} className="flex flex-col gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                            <Calendar size={13} className="text-slate-500" />
                                            <span>Select Consultation Date</span>
                                        </label>
                                        <input
                                            type="date"
                                            min={todayStr}
                                            value={selectedDate}
                                            onChange={(e) => setSelectedDate(e.target.value)}
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 transition-all cursor-pointer"
                                            required
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                            <Clock size={13} className="text-slate-500" />
                                            <span>Available Shift Slots</span>
                                        </label>
                                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                                            {availableSlots.map((slot) => {
                                                const isBooked = bookedSlots.includes(slot.value)
                                                const isPast = isPastSlot(slot.value, selectedDate)
                                                const isUnavailable = isBooked || isPast
                                                const isSelected = selectedSlot?.value === slot.value
                                                return (
                                                    <button
                                                        key={slot.value}
                                                        type="button"
                                                        disabled={isUnavailable}
                                                        onClick={() => setSelectedSlot(slot)}
                                                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border flex flex-col items-center justify-center ${
                                                            isUnavailable
                                                                ? 'opacity-75 cursor-not-allowed bg-slate-100/80 text-slate-400 border-slate-200'
                                                                : isSelected
                                                                    ? 'bg-sky-600 text-white border-sky-600 shadow-2xs cursor-pointer'
                                                                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 cursor-pointer'
                                                        }`}
                                                        title={isBooked ? 'Slot already booked' : isPast ? 'Time has passed' : 'Available'}
                                                    >
                                                        <span>{slot.label}</span>
                                                        {isBooked && <span className="text-[9px] font-semibold tracking-tight text-slate-500">Booked</span>}
                                                        {isPast && !isBooked && <span className="text-[9px] font-medium tracking-tight text-slate-400">Passed</span>}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                        {!selectedSlot && (
                                            <p className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/80 p-2 rounded-lg mt-1">
                                                No consultation slots available for this date. Please pick a future date.
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-slate-700">
                                            Reason for Visit / Symptoms
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={symptoms}
                                            onChange={(e) => setSymptoms(e.target.value)}
                                            placeholder="Describe primary concerns, health symptoms, or prior medical history..."
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 transition-all resize-none"
                                        />
                                    </div>

                                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col gap-1.5 text-xs text-slate-600">
                                        <div className="flex justify-between">
                                            <span>Doctor Consultation:</span>
                                            <span className="font-bold text-slate-800">${Number(doctor.consultationFee || 0).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Clinical Registration:</span>
                                            <span className="font-bold text-emerald-600">Included</span>
                                        </div>
                                        <div className="flex justify-between pt-1.5 border-t border-slate-200 font-bold text-slate-900">
                                            <span>Total Due:</span>
                                            <span className="text-sm font-extrabold text-sky-700">${Number(doctor.consultationFee || 0).toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={bookingLoading || bookingSuccess || !selectedSlot}
                                        className="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {bookingLoading ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                <span>Confirming Schedule...</span>
                                            </>
                                        ) : auth?.accessToken ? (
                                            <span>Confirm Appointment</span>
                                        ) : (
                                            <span>Sign In & Book Consultation</span>
                                        )}
                                    </button>
                                </form>
                            </div>

                            {doctor.assistantPhone && (
                                <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm flex flex-col gap-3.5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
                                            <PhoneCall size={18} />
                                        </div>
                                        <div className="flex flex-col">
                                            <h3 className="text-sm font-bold text-slate-900">Assisted Phone Booking</h3>
                                            <p className="text-xs font-semibold text-slate-500">Call assistant to reserve a slot directly</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                        Patients unable to register online or seeking urgent walk-in appointments can call clinical assistant {doctor.assistantName ? <span className="font-bold text-slate-900">{doctor.assistantName}</span> : 'on duty'} to schedule directly.
                                    </p>
                                    <a 
                                        href={`tel:${doctor.assistantPhone}`}
                                        className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs transition-colors border border-slate-300"
                                    >
                                        <PhoneCall size={14} />
                                        <span>Call Assistant: {doctor.assistantPhone}</span>
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}

export default DoctorPublicProfile
