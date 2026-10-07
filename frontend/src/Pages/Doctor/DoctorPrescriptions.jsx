import { useState, useEffect } from 'react'
import { FileText, Search, Printer, RefreshCw, Calendar, User } from 'lucide-react'
import useAxiosPrivate from '../../hooks/useAxiosPrivate'

const DoctorPrescriptions = () => {
    const axiosPrivate = useAxiosPrivate()
    const [appointments, setAppointments] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedPrescription, setSelectedPrescription] = useState(null)

    const fetchAppointments = async () => {
        try {
            setLoading(true)
            const res = await axiosPrivate.get('/Doctor/doctor-appointments')
            const completed = Array.isArray(res.data) ? res.data.filter(a => a.status === 'Completed') : []
            setAppointments(completed)
        } catch {
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAppointments()
    }, [])

    const filtered = appointments.filter(a =>
        a.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.symptoms?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Clinical Prescriptions Issued</h1>
                    <p className="text-xs text-slate-500">Log of official medical notes and prescriptions issued to patients</p>
                </div>

                <button
                    onClick={fetchAppointments}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200/90 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-all self-start sm:self-auto"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    <span>Refresh</span>
                </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 w-full max-w-md">
                        <Search size={15} className="text-slate-400 shrink-0" />
                        <input
                            type="text"
                            placeholder="Search by patient or symptoms..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-transparent border-none outline-none text-xs text-slate-800 placeholder:text-slate-400"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/75">
                                <th className="px-5 py-3.5 text-xs font-bold text-slate-700 uppercase tracking-wider">Patient</th>
                                <th className="px-5 py-3.5 text-xs font-bold text-slate-700 uppercase tracking-wider">Date & Time</th>
                                <th className="px-5 py-3.5 text-xs font-bold text-slate-700 uppercase tracking-wider">Symptoms Recorded</th>
                                <th className="px-5 py-3.5 text-xs font-bold text-slate-700 uppercase tracking-wider">Status</th>
                                <th className="px-5 py-3.5 text-xs font-bold text-slate-700 uppercase tracking-wider text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-500 font-medium">
                                        No completed consultations or prescriptions found.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((appt) => (
                                    <tr key={appt.appointmentId} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="px-5 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-900">{appt.patientName}</span>
                                                <span className="text-xs font-medium text-slate-500">#CF-0{appt.patientId}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-slate-800">{appt.appointmentDate}</span>
                                                <span className="text-[11px] font-medium text-slate-500">{appt.timeSlot}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-xs font-medium text-slate-600 max-w-sm truncate">
                                            {appt.symptoms || 'General clinical review'}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
                                                Issued & Completed
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <button
                                                onClick={() => setSelectedPrescription(appt)}
                                                className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5"
                                            >
                                                <FileText size={13} />
                                                <span>View Slip</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedPrescription && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                    <div className="bg-white rounded-xl shadow-xl border border-slate-200/90 w-full max-w-lg overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Official Consultation Record</h3>
                                <p className="text-xs text-slate-500">Issued consultation summary</p>
                            </div>
                            <button
                                onClick={() => setSelectedPrescription(null)}
                                className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-6 flex flex-col gap-4">
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-slate-500">Patient:</span>
                                    <span className="font-bold text-slate-900">{selectedPrescription.patientName}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-slate-500">Date:</span>
                                    <span className="font-medium text-slate-700">{selectedPrescription.appointmentDate} at {selectedPrescription.timeSlot}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-slate-500">Symptoms:</span>
                                    <span className="font-medium text-slate-700">{selectedPrescription.symptoms || 'General'}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                                <button
                                    onClick={() => window.print()}
                                    className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                                >
                                    <Printer size={14} />
                                    <span>Print</span>
                                </button>
                                <button
                                    onClick={() => setSelectedPrescription(null)}
                                    className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default DoctorPrescriptions
