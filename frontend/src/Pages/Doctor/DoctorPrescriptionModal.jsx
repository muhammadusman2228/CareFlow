import { useState, useEffect } from 'react'
import { 
    X, 
    FileText, 
    CheckCircle2, 
    Activity, 
    FlaskConical, 
    Plus, 
    Loader2, 
    AlertCircle, 
    Clock, 
    Thermometer, 
    Heart, 
    Scale, 
    Droplets 
} from 'lucide-react'
import useAxiosPrivate from '../../hooks/useAxiosPrivate'

const DoctorPrescriptionModal = ({ appointment, onClose, onSuccess }) => {
    const axiosPrivate = useAxiosPrivate()
    const [title, setTitle] = useState('')
    const [note, setNote] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const [vitals, setVitals] = useState(null)
    const [vitalsLoading, setVitalsLoading] = useState(true)

    const [labOrders, setLabOrders] = useState([])
    const [labLoading, setLabLoading] = useState(true)
    const [patientLabHistory, setPatientLabHistory] = useState([])
    const [historyLoading, setHistoryLoading] = useState(true)
    const [newTestName, setNewTestName] = useState('')
    const [newTestNotes, setNewTestNotes] = useState('')
    const [isOrderingLab, setIsOrderingLab] = useState(false)
    const [labOrderError, setLabOrderError] = useState(null)

    const commonTests = [
        'CBC (Complete Blood Count)',
        'LFT (Liver Function)',
        'RFT / Serum Creatinine',
        'Lipid Profile',
        'Chest X-Ray (PA View)',
        'Ultrasound Abdomen',
        'Urine R/E',
        'HbA1c (Glycated Hb)'
    ]

    const fetchVitalsAndLabs = async () => {
        if (!appointment?.appointmentId) return

        setVitalsLoading(true)
        try {
            const vitalsRes = await axiosPrivate.get(`/Assistant/vitals/${appointment.appointmentId}`)
            setVitals(vitalsRes.data)
        } catch {
            setVitals(null)
        } finally {
            setVitalsLoading(false)
        }

        setLabLoading(true)
        try {
            const labsRes = await axiosPrivate.get(`/Assistant/lab-orders/${appointment.appointmentId}`)
            setLabOrders(Array.isArray(labsRes.data) ? labsRes.data : [])
        } catch {
            setLabOrders([])
        } finally {
            setLabLoading(false)
        }

        if (appointment?.patientId) {
            setHistoryLoading(true)
            try {
                const historyRes = await axiosPrivate.get(`/Assistant/patient-lab-history/${appointment.patientId}`)
                setPatientLabHistory(Array.isArray(historyRes.data) ? historyRes.data : [])
            } catch {
                setPatientLabHistory([])
            } finally {
                setHistoryLoading(false)
            }
        }
    }

    useEffect(() => {
        fetchVitalsAndLabs()
    }, [appointment?.appointmentId, appointment?.patientId])

    const handleCreateLabOrder = async (e) => {
        e.preventDefault()
        if (!newTestName.trim()) {
            setLabOrderError('Please specify the lab test name.')
            return
        }

        setIsOrderingLab(true)
        setLabOrderError(null)

        try {
            await axiosPrivate.post('/Assistant/lab-order', {
                appointmentId: appointment.appointmentId,
                testName: newTestName.trim(),
                clinicalNotes: newTestNotes.trim()
            })
            setNewTestName('')
            setNewTestNotes('')
            const labsRes = await axiosPrivate.get(`/Assistant/lab-orders/${appointment.appointmentId}`)
            setLabOrders(Array.isArray(labsRes.data) ? labsRes.data : [])
        } catch (err) {
            setLabOrderError(err.response?.data?.message || 'Failed to order diagnostic test.')
        } finally {
            setIsOrderingLab(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (appointment?.status === 'Cancelled') {
            setError('Cannot prescribe medicine for a cancelled appointment.')
            return
        }
        if (!title.trim()) {
            setError('Please enter a clinical diagnosis or prescription title.')
            return
        }

        try {
            setLoading(true)
            setError(null)
            await axiosPrivate.post('/Doctor/prescription', {
                patientId: appointment.patientId,
                doctorId: 0,
                appointmentId: appointment.appointmentId,
                title: title.trim(),
                note: note.trim()
            })
            onSuccess?.()
            onClose()
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to issue prescription. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const calculateBMI = (weightKg, heightCm) => {
        if (!weightKg || !heightCm || heightCm <= 0) return null
        const heightM = heightCm / 100
        const bmi = weightKg / (heightM * heightM)
        return bmi.toFixed(1)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                            <FileText size={18} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900">Clinical Examination & Prescriptions</h3>
                            <p className="text-xs text-slate-500">Triage vitals, diagnostic test orders, and medication management</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="overflow-y-auto p-6 flex flex-col gap-6">
                    {error && (
                        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700 flex items-center gap-2">
                            <AlertCircle size={15} />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-slate-500">Patient Information</span>
                            <span className="font-bold text-slate-900 text-sm">{appointment.patientName}</span>
                        </div>
                        <div className="flex flex-col gap-0.5 sm:text-right">
                            <span className="font-semibold text-slate-500">Consultation Schedule</span>
                            <span className="font-medium text-slate-800">{appointment.timeSlot} • {appointment.appointmentDate} (PKT)</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Activity size={16} className="text-slate-700" />
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Pre-Consultation Triage Vitals</h4>
                            </div>
                            {vitals && (
                                <span className="text-[11px] text-slate-500">
                                    Recorded by <strong className="text-slate-700">{vitals.assistantName}</strong>
                                </span>
                            )}
                        </div>

                        {vitalsLoading ? (
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center gap-2 text-xs text-slate-500">
                                <Loader2 size={14} className="animate-spin text-slate-600" />
                                <span>Retrieving assistant triage data...</span>
                            </div>
                        ) : vitals ? (
                            <div className="bg-slate-50/70 border border-slate-200/90 rounded-xl p-4 flex flex-col gap-3">
                                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                                    <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Blood Pressure</span>
                                        <span className="text-xs font-bold text-slate-900 font-mono mt-0.5">{vitals.bloodPressure}</span>
                                        <span className="text-[10px] text-slate-400">mmHg</span>
                                    </div>

                                    <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Pulse</span>
                                        <span className="text-xs font-bold text-slate-900 font-mono mt-0.5">{vitals.heartRate}</span>
                                        <span className="text-[10px] text-slate-400">bpm</span>
                                    </div>

                                    <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Temperature</span>
                                        <span className="text-xs font-bold text-slate-900 font-mono mt-0.5">{vitals.temperature}°F</span>
                                        <span className="text-[10px] text-slate-400">oral / axillary</span>
                                    </div>

                                    <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">SpO2</span>
                                        <span className="text-xs font-bold text-slate-900 font-mono mt-0.5">{vitals.spO2}%</span>
                                        <span className="text-[10px] text-slate-400">oxygen sat</span>
                                    </div>

                                    <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Weight / BMI</span>
                                        <span className="text-xs font-bold text-slate-900 font-mono mt-0.5">
                                            {vitals.weightKg} kg
                                        </span>
                                        <span className="text-[10px] text-slate-400">
                                            {calculateBMI(vitals.weightKg, vitals.heightCm) ? `BMI: ${calculateBMI(vitals.weightKg, vitals.heightCm)}` : 'Height: -'}
                                        </span>
                                    </div>

                                    <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Height</span>
                                        <span className="text-xs font-bold text-slate-900 font-mono mt-0.5">
                                            {vitals.heightCm ? `${vitals.heightCm} cm` : 'N/A'}
                                        </span>
                                        <span className="text-[10px] text-slate-400">stature</span>
                                    </div>

                                    <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Blood Sugar</span>
                                        <span className="text-xs font-bold text-slate-900 font-mono mt-0.5">
                                            {vitals.bloodSugar || 'Not checked'}
                                        </span>
                                        <span className="text-[10px] text-slate-400">random / fasting</span>
                                    </div>
                                </div>

                                {vitals.triageNotes && (
                                    <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs">
                                        <span className="font-semibold text-slate-600 block text-[11px]">Assistant's Triage Observation:</span>
                                        <span className="text-slate-800 italic">{vitals.triageNotes}</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-3.5 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-xs text-slate-500 text-center">
                                Vitals pending triage measurement by medical assistant.
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                            <FlaskConical size={16} className="text-slate-700" />
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Diagnostic Lab Orders</h4>
                        </div>

                        {labOrders.length > 0 && (
                            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600">
                                        <tr>
                                            <th className="py-2.5 px-3">Test Name</th>
                                            <th className="py-2.5 px-3">Status</th>
                                            <th className="py-2.5 px-3">Clinical Instructions</th>
                                            <th className="py-2.5 px-3">Results Summary</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {labOrders.map((order) => (
                                            <tr key={order.id} className="hover:bg-slate-50/50">
                                                <td className="py-2.5 px-3 font-semibold text-slate-900">{order.testName}</td>
                                                <td className="py-2.5 px-3">
                                                    <span className={`text-xs font-semibold ${
                                                        order.status === 'Completed' 
                                                            ? 'text-slate-950 font-bold' 
                                                            : order.status === 'Sample Collected' 
                                                            ? 'text-slate-800' 
                                                            : 'text-slate-500'
                                                    }`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">{order.clinicalNotes || '-'}</td>
                                                <td className="py-2.5 px-3 text-slate-900 font-medium">
                                                    {order.resultsSummary ? (
                                                        <span className="font-mono text-[11px]">{order.resultsSummary}</span>
                                                    ) : (
                                                        <span className="text-slate-400 italic">Pending lab analysis</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/90 flex flex-col gap-2.5">
                            <span className="text-xs font-semibold text-slate-700">Order New Test for Patient</span>
                            
                            <div className="flex flex-wrap gap-1.5">
                                {commonTests.map((t) => (
                                    <button
                                        type="button"
                                        key={t}
                                        onClick={() => setNewTestName(t)}
                                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-medium text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-colors"
                                    >
                                        + {t}
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1">
                                <input
                                    type="text"
                                    placeholder="Test name (e.g. Serum Ferritin, ECG)"
                                    value={newTestName}
                                    onChange={(e) => setNewTestName(e.target.value)}
                                    className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:border-slate-500"
                                />
                                <input
                                    type="text"
                                    placeholder="Notes for lab desk (e.g. Fasting sample)"
                                    value={newTestNotes}
                                    onChange={(e) => setNewTestNotes(e.target.value)}
                                    className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:border-slate-500"
                                />
                                <button
                                    type="button"
                                    onClick={handleCreateLabOrder}
                                    disabled={isOrderingLab || !newTestName.trim()}
                                    className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-1.5"
                                >
                                    {isOrderingLab ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                                    <span>Send Order to Lab Desk</span>
                                </button>
                            </div>

                            {labOrderError && (
                                <span className="text-[11px] text-rose-600 font-medium">{labOrderError}</span>
                            )}
                        </div>

                        <div className="flex flex-col gap-2.5 pt-2">
                            <div className="flex items-center justify-between">
                                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                    Patient's Prior Diagnostic History ({patientLabHistory.filter(h => h.appointmentId !== appointment.appointmentId).length} past tests)
                                </h5>
                                {historyLoading && <Loader2 size={13} className="animate-spin text-slate-500" />}
                            </div>

                            {patientLabHistory.filter(h => h.appointmentId !== appointment.appointmentId).length === 0 ? (
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                                    No prior diagnostic laboratory tests on record for this patient.
                                </div>
                            ) : (
                                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600">
                                            <tr>
                                                <th className="py-2.5 px-3">Date</th>
                                                <th className="py-2.5 px-3">Test Name</th>
                                                <th className="py-2.5 px-3">Referring Doctor</th>
                                                <th className="py-2.5 px-3">Status</th>
                                                <th className="py-2.5 px-3">Diagnostic Findings</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {patientLabHistory
                                                .filter(h => h.appointmentId !== appointment.appointmentId)
                                                .map((item) => (
                                                    <tr key={item.id} className="hover:bg-slate-50/50">
                                                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                                                            {new Date(item.createdAt).toLocaleDateString()}
                                                        </td>
                                                        <td className="py-2.5 px-3 font-semibold text-slate-900">{item.testName}</td>
                                                        <td className="py-2.5 px-3 text-slate-700">Dr. {item.doctorName}</td>
                                                        <td className="py-2.5 px-3">
                                                            <span className={`text-xs font-semibold ${
                                                                item.status === 'Completed'
                                                                    ? 'text-slate-950 font-bold'
                                                                    : item.status === 'Sample Collected'
                                                                    ? 'text-slate-800'
                                                                    : 'text-slate-500'
                                                            }`}>
                                                                {item.status}
                                                            </span>
                                                        </td>
                                                        <td className="py-2.5 px-3 text-slate-900">
                                                            {item.resultsSummary ? (
                                                                <span className="font-mono text-[11px]">{item.resultsSummary}</span>
                                                            ) : (
                                                                <span className="text-slate-400 italic">No findings recorded</span>
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

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-3 border-t border-slate-200">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-slate-800">
                                Clinical Diagnosis / Rx Title <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. Acute Bronchitis, Type 2 Diabetes Follow-up"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-600 transition-all"
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-slate-800">
                                Prescribed Medications & Management Advice
                            </label>
                            <textarea
                                rows={4}
                                placeholder="Enter prescribed drug dosage, frequency (e.g. Tab Panadol 500mg TDS x 3 days), dietary restrictions, and follow-up timeline..."
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-600 transition-all resize-none"
                            />
                        </div>

                        <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading || appointment?.status === 'Cancelled'}
                                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                <CheckCircle2 size={15} />
                                <span>{loading ? 'Finalizing...' : 'Issue Prescription'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default DoctorPrescriptionModal
