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
import Pagination from '../../components/common/Pagination'
import { formatDoctorName } from '../../utils/formatters'

const PatientPrescriptions = () => {
    const axiosPrivate = useAxiosPrivate()
    const [prescriptions, setPrescriptions] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [page, setPage] = useState(1)
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

    useEffect(() => {
        setPage(1)
    }, [searchQuery])

    const filtered = prescriptions.filter(p =>
        p.doctorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.note?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handlePrintSlip = (rx) => {
        const printWindow = window.open('', '_blank', 'width=800,height=900')
        if (!printWindow) {
            window.print()
            return
        }
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>CareFlow Medical Prescription - ${formatDoctorName(rx.doctorName)}</title>
                <style>
                    @page { size: A4; margin: 15mm; }
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                        color: #0f172a;
                        margin: 0;
                        padding: 30px;
                        background: #ffffff;
                    }
                    .rx-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        border-bottom: 2px solid #0284c7;
                        padding-bottom: 16px;
                        margin-bottom: 20px;
                    }
                    .hospital-title {
                        font-size: 24px;
                        font-weight: 800;
                        color: #0f172a;
                        letter-spacing: -0.5px;
                    }
                    .hospital-sub {
                        font-size: 11px;
                        color: #64748b;
                        margin-top: 2px;
                    }
                    .rx-meta-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 12px;
                        background: #f8fafc;
                        border: 1px solid #e2e8f0;
                        border-radius: 8px;
                        padding: 14px;
                        margin-bottom: 24px;
                        font-size: 12px;
                    }
                    .meta-row {
                        display: flex;
                        justify-content: space-between;
                    }
                    .meta-label {
                        color: #64748b;
                        font-weight: 600;
                    }
                    .meta-val {
                        color: #0f172a;
                        font-weight: 700;
                    }
                    .rx-symbol {
                        font-size: 30px;
                        font-weight: 900;
                        color: #0284c7;
                        margin-bottom: 10px;
                        font-style: italic;
                        font-family: Georgia, serif;
                    }
                    .section-title {
                        font-size: 11px;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        color: #475569;
                        font-weight: 700;
                        margin-bottom: 4px;
                    }
                    .diagnosis-text {
                        font-size: 15px;
                        font-weight: 700;
                        color: #0f172a;
                        margin-bottom: 16px;
                    }
                    .notes-box {
                        border-left: 3px solid #0284c7;
                        padding-left: 14px;
                        margin-top: 8px;
                        min-height: 120px;
                        white-space: pre-line;
                        font-size: 13px;
                        line-height: 1.6;
                        color: #334155;
                        background: #fdfdfd;
                    }
                    .rx-footer {
                        margin-top: 60px;
                        padding-top: 20px;
                        border-top: 1px dashed #cbd5e1;
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-end;
                    }
                    .signature-line {
                        border-top: 1px solid #475569;
                        width: 220px;
                        text-align: center;
                        padding-top: 6px;
                        font-size: 11px;
                        font-weight: 600;
                        color: #475569;
                    }
                </style>
            </head>
            <body>
                <div class="rx-header">
                    <div>
                        <div class="hospital-title">CareFlow Health System</div>
                        <div class="hospital-sub">Official Outpatient Prescription & Clinical Directive</div>
                    </div>
                    <div style="text-align: right; font-size: 11px; color: #64748b;">
                        <div>Attending Physician: ${formatDoctorName(rx.doctorName)}</div>
                        <div>Date: ${rx.appointmentDate}</div>
                    </div>
                </div>

                <div class="rx-meta-grid">
                    <div class="meta-row">
                        <span class="meta-label">Attending Doctor:</span>
                        <span class="meta-val">${formatDoctorName(rx.doctorName)}</span>
                    </div>
                    <div class="meta-row">
                        <span class="meta-label">Prescription Date:</span>
                        <span class="meta-val">${rx.appointmentDate}</span>
                    </div>
                    <div class="meta-row">
                        <span class="meta-label">Consultation Status:</span>
                        <span class="meta-val">Verified & Issued</span>
                    </div>
                    <div class="meta-row">
                        <span class="meta-label">Patient Record:</span>
                        <span class="meta-val">CareFlow EHR Validated</span>
                    </div>
                </div>

                <div class="rx-symbol">&#8478;</div>

                <div style="margin-bottom: 20px;">
                    <div class="section-title">Clinical Diagnosis / Prescription Title:</div>
                    <div class="diagnosis-text">${rx.title || 'General Prescription'}</div>
                </div>

                <div>
                    <div class="section-title">Medications, Dosage & Clinical Notes:</div>
                    <div class="notes-box">${rx.note || 'Take prescribed medications as clinically advised.'}</div>
                </div>

                <div class="rx-footer">
                    <div style="font-size: 10px; color: #94a3b8;">
                        CareFlow Hospital Management System • Verified Electronic Record<br/>
                        For dispensing at hospital dispensary or retail pharmacy.
                    </div>
                    <div>
                        <div class="signature-line">Attending Physician Signature / Stamp</div>
                    </div>
                </div>

                <script>
                    window.onload = function() {
                        window.print();
                    };
                </script>
            </body>
            </html>
        `
        printWindow.document.open()
        printWindow.document.write(htmlContent)
        printWindow.document.close()
    }

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
                        maxLength={100}
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
                <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {filtered.slice((page - 1) * 20, page * 20).map((rx, idx) => (
                            <div
                                key={idx}
                                className="bg-white rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between"
                            >
                                <div className="p-5 flex flex-col gap-4">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                        <span className="text-xs font-bold text-slate-400 font-mono tracking-wide">
                                            #{(page - 1) * 20 + idx + 1}
                                        </span>
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
                                            <h3 className="text-sm font-bold text-slate-900">{formatDoctorName(rx.doctorName)}</h3>
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
                                        onClick={() => handlePrintSlip(rx)}
                                        className="px-3.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                                    >
                                        <Printer size={13} />
                                        <span>Print Rx</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <Pagination
                        currentPage={page}
                        totalItems={filtered.length}
                        pageSize={20}
                        onPageChange={setPage}
                    />
                </div>
            )}

            {selectedRx && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
                    <div className="bg-white rounded-xl shadow-xl border border-slate-200/90 w-full max-w-md max-h-[90vh] overflow-y-auto flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Official Clinical Prescription</h3>
                                <p className="text-xs text-slate-500">CareFlow Health System</p>
                            </div>
                            <button
                                onClick={() => setSelectedRx(null)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6 flex flex-col gap-4">
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-2.5">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-slate-500">Attending Physician:</span>
                                    <span className="font-bold text-slate-900">{formatDoctorName(selectedRx.doctorName)}</span>
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
                                    onClick={() => handlePrintSlip(selectedRx)}
                                    className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
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
