import { useState, useEffect } from 'react'
import { 
    FileText, 
    Printer, 
    Search, 
    Calendar, 
    Stethoscope, 
    RefreshCw, 
    X,
    Eye
} from 'lucide-react'
import useAxiosPrivate from '../../hooks/useAxiosPrivate'

const PatientPrescriptions = () => {
    const axiosPrivate = useAxiosPrivate()
    const [prescriptions, setPrescriptions] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedRx, setSelectedRx] = useState(null)

    const fetchPrescriptions = async () => {
        try {
            setLoading(true)
            const res = await axiosPrivate.get('/Patient/prescription')
            setPrescriptions(Array.isArray(res.data) ? res.data : [])
        } catch {
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPrescriptions()
    }, [])

    const filtered = prescriptions.filter(p =>
        p.doctorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.note?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-slate-500">CareFlow Patient Portal</span>
                    <h1 className="text-2xl font-bold text-slate-900">Digital Prescriptions</h1>
                    <p className="text-xs text-slate-500">Official medical prescriptions and pharmacy instructions issued by your doctors</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchPrescriptions}
                        className="p-2.5 rounded-xl bg-white border border-slate-200/90 text-slate-600 hover:text-slate-900 shadow-sm transition-all"
                        title="Refresh Prescriptions"
                    >
                        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-sm flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 flex-1 max-w-md">
                    <Search size={15} className="text-slate-400 shrink-0" />
                    <input
                        type="text"
                        placeholder="Search prescription by doctor, diagnosis, or medication..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-transparent border-none outline-none text-xs text-slate-800 placeholder:text-slate-400"
                    />
                </div>
            </div>

            {loading ? (
                <div className="p-16 flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200/90">
                    <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-semibold text-slate-600 mt-3">Loading prescriptions...</span>
                </div>
            ) : filtered.length === 0 ? (
                <div className="p-12 bg-white rounded-xl border border-slate-200/90 text-center flex flex-col items-center gap-2">
                    <FileText size={28} className="text-slate-400" />
                    <p className="text-sm font-semibold text-slate-700">No prescriptions found.</p>
                    <p className="text-xs text-slate-500">Consultation prescriptions will appear here once issued by your doctor.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filtered.map((rx, idx) => (
                        <div
                            key={idx}
                            className="bg-white rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between"
                        >
                            <div className="p-5 flex flex-col gap-4">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                    <span className="text-xs font-bold text-slate-900 tracking-wide">#RX-{3800 + idx}</span>
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                                        <Calendar size={13} />
                                        <span>{rx.appointmentDate}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                                        Rx
                                    </div>
                                    <div className="flex flex-col">
                                        <h3 className="text-sm font-bold text-slate-900">{rx.doctorName}</h3>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-semibold text-slate-500">Diagnosis:</span>
                                    <span className="text-sm font-bold text-slate-900">{rx.title}</span>
                                </div>

                                <div className="flex flex-col gap-1 p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
                                    <span className="text-xs font-semibold text-slate-500">Clinical Instructions:</span>
                                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">{rx.note}</p>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-3">
                                <button
                                    onClick={() => setSelectedRx(rx)}
                                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
                                >
                                    <Eye size={13} />
                                    <span>View Slip</span>
                                </button>
                                <button
                                    onClick={() => window.print()}
                                    className="px-3.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-xs"
                                >
                                    <Printer size={13} />
                                    <span>Print Rx</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedRx && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
                    <div className="bg-white rounded-xl shadow-xl border border-slate-200/90 w-full max-w-md overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Official Clinical Prescription</h3>
                                <p className="text-xs text-slate-500">CareFlow Health System</p>
                            </div>
                            <button
                                onClick={() => setSelectedRx(null)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6 flex flex-col gap-4">
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-2.5">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-slate-500">Attending Physician:</span>
                                    <span className="font-bold text-slate-900">{selectedRx.doctorName}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-slate-500">Prescription Date:</span>
                                    <span className="font-medium text-slate-700">{selectedRx.appointmentDate}</span>
                                </div>
                                <div className="pt-2 border-t border-slate-200/60 flex flex-col gap-1 text-xs">
                                    <span className="font-semibold text-slate-500">Diagnosis:</span>
                                    <span className="font-bold text-slate-900">{selectedRx.title}</span>
                                </div>
                                <div className="flex flex-col gap-1 text-xs">
                                    <span className="font-semibold text-slate-500">Medications & Rx Note:</span>
                                    <p className="text-slate-800 whitespace-pre-line leading-relaxed">{selectedRx.note}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                                <button
                                    onClick={() => window.print()}
                                    className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                                >
                                    <Printer size={14} />
                                    <span>Print Slip</span>
                                </button>
                                <button
                                    onClick={() => setSelectedRx(null)}
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

export default PatientPrescriptions
