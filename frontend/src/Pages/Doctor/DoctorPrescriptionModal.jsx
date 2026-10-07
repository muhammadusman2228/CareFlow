import { useState } from 'react'
import { X, FileText, CheckCircle2 } from 'lucide-react'
import useAxiosPrivate from '../../hooks/useAxiosPrivate'

const DoctorPrescriptionModal = ({ appointment, onClose, onSuccess }) => {
    const axiosPrivate = useAxiosPrivate()
    const [title, setTitle] = useState('')
    const [note, setNote] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-xl shadow-xl border border-slate-200/90 w-full max-w-lg overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                            <FileText size={18} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900">Clinical Consultation & Rx</h3>
                            <p className="text-xs text-slate-500">Record diagnosis and issue official prescription</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
                    {error && (
                        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
                            {error}
                        </div>
                    )}

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-500">Patient:</span>
                            <span className="font-bold text-slate-900">{appointment.patientName}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-500">Time Slot:</span>
                            <span className="font-medium text-slate-700">{appointment.timeSlot} • {appointment.appointmentDate}</span>
                        </div>
                        {appointment.symptoms && (
                            <div className="mt-1 pt-2 border-t border-slate-200/60 text-xs">
                                <span className="font-semibold text-slate-500 block">Reported Symptoms:</span>
                                <span className="text-slate-700 italic">{appointment.symptoms}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-800">
                            Clinical Diagnosis / Rx Title <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Acute Bronchitis, Hypertension Management"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-3 focus:ring-sky-500/15 transition-all"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-800">
                            Clinical Instructions & Medications
                        </label>
                        <textarea
                            rows={4}
                            placeholder="Enter prescribed medications, dosage, frequency, and care instructions..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-3 focus:ring-sky-500/15 transition-all resize-none"
                        />
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
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
                            className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            <CheckCircle2 size={15} />
                            <span>{loading ? 'Finalizing...' : 'Complete & Issue Rx'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default DoctorPrescriptionModal
