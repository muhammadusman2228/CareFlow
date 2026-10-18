import { useState, useEffect } from 'react'
import { FileText, Search, Printer, RefreshCw, Calendar, User, Eye, X, Stethoscope } from 'lucide-react'
import useAxiosPrivate from '../../hooks/useAxiosPrivate'
import Pagination from '../../components/common/Pagination'

const DoctorPrescriptions = () => {
    const axiosPrivate = useAxiosPrivate()
    const [appointments, setAppointments] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [page, setPage] = useState(1)
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

    useEffect(() => {
        setPage(1)
    }, [searchQuery])

    const filtered = appointments.filter(a =>
        a.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.symptoms?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.prescriptionTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.prescriptionNote?.toLowerCase().includes(searchQuery.toLowerCase())
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
                <title>CareFlow Medical Prescription - ${rx.patientName}</title>
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
                        <div>Ref: #CF-RX-${rx.appointmentId}</div>
                        <div>Date: ${rx.appointmentDate}</div>
                    </div>
                </div>

                <div class="rx-meta-grid">
                    <div class="meta-row">
                        <span class="meta-label">Patient Name:</span>
                        <span class="meta-val">${rx.patientName}</span>
                    </div>
                    <div class="meta-row">
                        <span class="meta-label">Time Slot:</span>
                        <span class="meta-val">${rx.timeSlot}</span>
                    </div>
                    <div class="meta-row">
                        <span class="meta-label">Reported Symptoms:</span>
                        <span class="meta-val">${rx.symptoms || 'General Clinical Review'}</span>
                    </div>
                    <div class="meta-row">
                        <span class="meta-label">Consultation Status:</span>
                        <span class="meta-val">Verified & Completed</span>
                    </div>
                </div>

                <div class="rx-symbol">&#8478;</div>

                <div style="margin-bottom: 20px;">
                    <div class="section-title">Clinical Diagnosis / Prescription Title:</div>
                    <div class="diagnosis-text">${rx.prescriptionTitle || 'General Prescription'}</div>
                </div>

                <div>
                    <div class="section-title">Medications, Dosage & Clinical Notes:</div>
                    <div class="notes-box">${rx.prescriptionNote || 'Take prescribed medications as clinically advised.'}</div>
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Clinical Prescriptions Issued</h1>
                    <p className="text-xs text-slate-500">Log of official medical notes and prescriptions issued to patients</p>
                </div>

                <button
                    onClick={fetchAppointments}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200/90 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-all self-start sm:self-auto cursor-pointer"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    <span>Refresh</span>
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-xl shadow-slate-900/10 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 w-full max-w-md">
                        <Search size={15} className="text-slate-400 shrink-0" />
                        <input
                            type="text"
                            maxLength={100}
                            placeholder="Search by patient, diagnosis, or medication..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-transparent border-none outline-none text-xs text-slate-800 placeholder:text-slate-400"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[750px]">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/75">
                                <th className="px-5 py-3.5 text-xs font-bold text-slate-700 uppercase tracking-wider w-12">#</th>
                                <th className="px-5 py-3.5 text-xs font-bold text-slate-700 uppercase tracking-wider">Patient</th>
                                <th className="px-5 py-3.5 text-xs font-bold text-slate-700 uppercase tracking-wider">Date & Time</th>
                                <th className="px-5 py-3.5 text-xs font-bold text-slate-700 uppercase tracking-wider">Diagnosis / Rx Title</th>
                                <th className="px-5 py-3.5 text-xs font-bold text-slate-700 uppercase tracking-wider">Prescription Note</th>
                                <th className="px-5 py-3.5 text-xs font-bold text-slate-700 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500 font-medium">
                                        No completed consultations or prescriptions found.
                                    </td>
                                </tr>
                            ) : (
                                filtered.slice((page - 1) * 20, page * 20).map((appt, index) => (
                                    <tr key={appt.appointmentId} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="px-5 py-4 font-bold text-slate-400 font-mono text-xs">
                                            {(page - 1) * 20 + index + 1}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-900">{appt.patientName}</span>
                                                <span className="text-xs text-slate-500 font-medium">{appt.symptoms || 'General'}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-slate-800">{appt.appointmentDate}</span>
                                                <span className="text-[11px] font-medium text-slate-500">{appt.timeSlot}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-xs font-bold text-slate-900 max-w-xs truncate">
                                            {appt.prescriptionTitle || 'Clinical Prescription'}
                                        </td>
                                        <td className="px-5 py-4 text-xs font-medium text-slate-600 max-w-xs truncate">
                                            {appt.prescriptionNote || 'Prescription instructions recorded'}
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setSelectedPrescription(appt)}
                                                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                                                >
                                                    <Eye size={13} />
                                                    <span>View</span>
                                                </button>
                                                <button
                                                    onClick={() => handlePrintSlip(appt)}
                                                    className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                                                >
                                                    <Printer size={13} />
                                                    <span>Print</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination
                    currentPage={page}
                    totalItems={filtered.length}
                    pageSize={20}
                    onPageChange={setPage}
                />
            </div>

            {selectedPrescription && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
                    <div className="bg-white rounded-xl shadow-xl border border-slate-200/90 w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Official Clinical Prescription</h3>
                                <p className="text-xs text-slate-500">CareFlow Outpatient Record #CF-RX-{selectedPrescription.appointmentId}</p>
                            </div>
                            <button
                                onClick={() => setSelectedPrescription(null)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6 flex flex-col gap-4">
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-2.5">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-slate-500">Patient Name:</span>
                                    <span className="font-bold text-slate-900">{selectedPrescription.patientName}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-slate-500">Date & Slot:</span>
                                    <span className="font-medium text-slate-700">{selectedPrescription.appointmentDate} at {selectedPrescription.timeSlot}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-slate-500">Chief Symptoms:</span>
                                    <span className="font-medium text-slate-700">{selectedPrescription.symptoms || 'General'}</span>
                                </div>
                                <div className="pt-2 border-t border-slate-200/60 flex flex-col gap-1 text-xs">
                                    <span className="font-semibold text-slate-500">Clinical Diagnosis:</span>
                                    <span className="font-bold text-slate-900">{selectedPrescription.prescriptionTitle || 'General Prescription'}</span>
                                </div>
                                <div className="flex flex-col gap-1 text-xs">
                                    <span className="font-semibold text-slate-500">Medications & Rx Note:</span>
                                    <p className="text-slate-800 whitespace-pre-line leading-relaxed">{selectedPrescription.prescriptionNote || 'Take medications as directed.'}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                                <button
                                    onClick={() => handlePrintSlip(selectedPrescription)}
                                    className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                                >
                                    <Printer size={14} />
                                    <span>Print Official Slip</span>
                                </button>
                                <button
                                    onClick={() => setSelectedPrescription(null)}
                                    className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
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
