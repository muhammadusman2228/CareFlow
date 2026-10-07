import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { 
    Search, 
    Calendar, 
    Clock, 
    X, 
    CheckCircle2, 
    AlertCircle, 
    Stethoscope, 
    Filter
} from 'lucide-react'
import useAxiosPrivate from '../../hooks/useAxiosPrivate'
import axios from '../../api/axios'

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

const PatientBooking = () => {
    const axiosPrivate = useAxiosPrivate()
    const navigate = useNavigate()

    const [doctors, setDoctors] = useState([])
    const [departments, setDepartments] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedDepartment, setSelectedDepartment] = useState('All')
    
    const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi' }).format(new Date())
    const [selectedDate, setSelectedDate] = useState(todayStr)

    const [selectedDoctor, setSelectedDoctor] = useState(null)
    const [selectedSlot, setSelectedSlot] = useState(null)
    const [symptoms, setSymptoms] = useState('')
    const [bookingLoading, setBookingLoading] = useState(false)
    const [bookingError, setBookingError] = useState(null)
    const [bookingSuccess, setBookingSuccess] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                const [docsRes, deptsRes] = await Promise.all([
                    axios.get('/Admin'),
                    axios.get('/Department')
                ])
                setDoctors(Array.isArray(docsRes.data) ? docsRes.data : [])
                setDepartments(Array.isArray(deptsRes.data) ? deptsRes.data : [])
            } catch {
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const filteredDoctors = doctors.filter(doc => {
        const matchesDept = selectedDepartment === 'All' || doc.departmentName === selectedDepartment
        const matchesSearch = 
            doc.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.specialization?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.departmentName?.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesDept && matchesSearch
    })

    const handleOpenModal = (doc, slot) => {
        const docSlots = generateDoctorSlots(doc.shiftStart, doc.shiftEnd)
        setSelectedDoctor(doc)
        setSelectedSlot(slot || docSlots[0])
        setSymptoms('')
        setBookingError(null)
        setBookingSuccess(false)
    }

    const handleConfirmBooking = async (e) => {
        e.preventDefault()
        if (!selectedDoctor || !selectedSlot) return

        try {
            setBookingLoading(true)
            setBookingError(null)
            await axiosPrivate.post('/Appointment/booking', {
                patientId: 0,
                doctorId: selectedDoctor.id,
                appointmentDate: selectedDate,
                timeSlot: selectedSlot.value,
                symptom: symptoms.trim() || 'General consultation request'
            })
            setBookingSuccess(true)
            setTimeout(() => {
                navigate('/patient/dashboard/appointments')
            }, 1200)
        } catch (err) {
            setBookingError(err.response?.data?.message || 'Failed to book appointment. Time slot may be unavailable.')
        } finally {
            setBookingLoading(false)
        }
    }

    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto">
            <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-500">Patient Portal / Find a Doctor</span>
                <h1 className="text-2xl font-bold text-slate-900">Find a Doctor & Book Consultation</h1>
                <p className="text-xs text-slate-500">Book appointments with available medical specialists</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 flex-1">
                    <Search size={16} className="text-slate-400 shrink-0" />
                    <input
                        type="text"
                        placeholder="Search doctor by name, specialty..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-transparent border-none outline-none text-xs text-slate-800 placeholder:text-slate-400"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200">
                        <Filter size={15} className="text-slate-400 shrink-0" />
                        <select
                            value={selectedDepartment}
                            onChange={(e) => setSelectedDepartment(e.target.value)}
                            className="bg-transparent border-none outline-none text-xs font-semibold text-slate-800 cursor-pointer"
                        >
                            <option value="All">All Departments</option>
                            {departments.map(d => (
                                <option key={d.id} value={d.name}>{d.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200">
                        <Calendar size={15} className="text-slate-400 shrink-0" />
                        <input
                            type="date"
                            min={todayStr}
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-transparent border-none outline-none text-xs font-semibold text-slate-800 cursor-pointer"
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="p-16 flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200/90">
                    <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-semibold text-slate-600 mt-3">Loading available physicians...</span>
                </div>
            ) : filteredDoctors.length === 0 ? (
                <div className="p-12 bg-white rounded-xl border border-slate-200/90 text-center flex flex-col items-center gap-2">
                    <Stethoscope size={28} className="text-slate-400" />
                    <p className="text-sm font-semibold text-slate-700">No doctors match your criteria.</p>
                    <p className="text-xs text-slate-500">Try modifying your search or department filter.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filteredDoctors.map((doc) => {
                        const doctorSlots = generateDoctorSlots(doc.shiftStart, doc.shiftEnd)
                        return (
                            <div
                                key={doc.id}
                                className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-4"
                            >
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-extrabold text-lg shadow-2xs mb-3">
                                        {doc.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'DR'}
                                    </div>
                                    <h3 className="text-base font-bold text-slate-900">{doc.name}</h3>
                                    <span className="text-xs font-semibold text-slate-600 mt-0.5">{doc.departmentName}</span>
                                    <span className="text-[11px] font-medium text-slate-500">{doc.specialization}</span>

                                    <div className="mt-3 px-3 py-1 rounded-md bg-slate-50 border border-slate-100 text-xs font-bold text-slate-800">
                                        Fee: ${doc.consultationFee?.toFixed(2) || '40.00'}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                                        <span className="uppercase tracking-wider">Available Slots</span>
                                        <span className="text-[10px] font-medium text-slate-400">Shift: {doc.shiftStart?.substring(0, 5)} - {doc.shiftEnd?.substring(0, 5)}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        {doctorSlots.slice(0, 4).map((slot) => (
                                            <button
                                                key={slot.value}
                                                onClick={() => handleOpenModal(doc, slot)}
                                                className="px-2 py-1.5 rounded-lg border border-slate-200 hover:border-sky-500 hover:bg-sky-50/50 text-[11px] font-semibold text-slate-700 transition-all text-center cursor-pointer"
                                            >
                                                {slot.label}
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => handleOpenModal(doc, doctorSlots[0])}
                                        className="w-full mt-2 px-3 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs transition-all text-center cursor-pointer"
                                    >
                                        Book Consultation
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {selectedDoctor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
                    <div className="bg-white rounded-xl shadow-xl border border-slate-200/90 w-full max-w-md overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Confirm Appointment Booking</h3>
                                <p className="text-xs text-slate-500">Review and finalize your session details</p>
                            </div>
                            <button
                                onClick={() => setSelectedDoctor(null)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleConfirmBooking} className="p-6 flex flex-col gap-4">
                            {bookingError && (
                                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700 flex items-center gap-2">
                                    <AlertCircle size={15} />
                                    <span>{bookingError}</span>
                                </div>
                            )}

                            {bookingSuccess && (
                                <div className="p-3 rounded-lg bg-slate-900 text-white text-xs font-medium flex items-center gap-2">
                                    <CheckCircle2 size={15} />
                                    <span>Appointment booked successfully! Redirecting...</span>
                                </div>
                            )}

                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-2.5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-bold text-sm">
                                        {selectedDoctor.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-900">{selectedDoctor.name}</span>
                                        <span className="text-xs font-medium text-slate-500">{selectedDoctor.departmentName} Specialist</span>
                                    </div>
                                </div>

                                <div className="mt-2 pt-2 border-t border-slate-200/60 flex flex-col gap-2 text-xs">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500 font-semibold">Appointment Date:</span>
                                        <span className="text-slate-800 font-bold">{selectedDate}</span>
                                    </div>
                                    
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-slate-500 font-semibold">Select Time Slot:</span>
                                        <div className="grid grid-cols-3 gap-1.5 max-h-32 overflow-y-auto pr-1">
                                            {generateDoctorSlots(selectedDoctor.shiftStart, selectedDoctor.shiftEnd).map(slot => (
                                                <button
                                                    key={slot.value}
                                                    type="button"
                                                    onClick={() => setSelectedSlot(slot)}
                                                    className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-all border text-center ${
                                                        selectedSlot?.value === slot.value
                                                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                                                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    {slot.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                                        <span className="text-slate-500 font-semibold">Consultation Fee:</span>
                                        <span className="text-slate-800 font-bold">${selectedDoctor.consultationFee?.toFixed(2) || '40.00'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-800">
                                    Describe your symptoms (optional)
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="Enter symptoms, reasons for this visit, or specific questions..."
                                    value={symptoms}
                                    onChange={(e) => setSymptoms(e.target.value)}
                                    className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-3 focus:ring-sky-500/15 transition-all resize-none"
                                />
                            </div>

                            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setSelectedDoctor(null)}
                                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={bookingLoading || bookingSuccess}
                                    className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                                >
                                    <CheckCircle2 size={15} />
                                    <span>{bookingLoading ? 'Reserving...' : 'Book Appointment'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default PatientBooking
