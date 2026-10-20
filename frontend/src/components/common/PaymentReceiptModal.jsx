import { useRef } from 'react'
import { X, Printer, CheckCircle2, User, Stethoscope, ShieldCheck } from 'lucide-react'

const PaymentReceiptModal = ({ receipt, isOpen, onClose }) => {
    const printAreaRef = useRef(null)

    if (!isOpen || !receipt) return null

    const handlePrint = () => {
        window.print()
    }

    const formatDate = (dateStr) => {
        if (!dateStr) return ''
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    const formatDateTime = (dateStr) => {
        if (!dateStr) return ''
        const date = new Date(dateStr)
        return date.toLocaleString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        })
    }

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-lg border border-slate-200 overflow-hidden flex flex-col my-8">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 print:hidden">
                    <h3 className="text-sm font-bold text-slate-800">Official Payment Slip</h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrint}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
                        >
                            <Printer size={14} />
                            <span>Print Slip</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                <div ref={printAreaRef} className="p-6 flex flex-col gap-5 text-slate-800 print:p-0 print:m-0">
                    <div className="flex flex-col items-center text-center pb-4 border-b border-dashed border-slate-300">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white mb-2 shadow-xs">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 4V20M4 12H20" stroke="white" strokeWidth="3" strokeLinecap="round" />
                            </svg>
                        </div>
                        <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase">CareFlow Hospital</h2>
                        <p className="text-xs text-slate-500 font-medium">Outpatient Clinic & Consultation Billing</p>
                        <span className="text-[11px] font-mono text-slate-400 mt-1">NTN: 8214-CARE-01 • Tax Exempt Clinic Service</span>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center justify-between text-xs font-mono">
                        <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Receipt Number</span>
                            <span className="font-bold text-slate-900 text-xs sm:text-sm">{receipt.receiptNumber}</span>
                        </div>
                        <div className="text-right">
                            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Payment Timestamp</span>
                            <span className="font-semibold text-slate-700 text-xs">{formatDateTime(receipt.paidAt)}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="flex flex-col gap-1 p-3 rounded-xl bg-slate-50 border border-slate-200">
                            <span className="text-slate-400 font-semibold uppercase text-[10px] flex items-center gap-1">
                                <User size={11} className="text-slate-400" /> Patient Details
                            </span>
                            <span className="font-bold text-slate-900 text-sm">{receipt.patientName}</span>
                            {receipt.patientPhone && (
                                <span className="font-mono text-slate-600 text-[11px]">{receipt.patientPhone}</span>
                            )}
                            <span className="text-[11px] text-slate-500">Ref: Appt #{receipt.appointmentId}</span>
                        </div>

                        <div className="flex flex-col gap-1 p-3 rounded-xl bg-slate-50 border border-slate-200">
                            <span className="text-slate-400 font-semibold uppercase text-[10px] flex items-center gap-1">
                                <Stethoscope size={11} className="text-slate-400" /> Attending Doctor
                            </span>
                            <span className="font-bold text-slate-900 text-sm">{receipt.doctorName}</span>
                            <span className="text-slate-600 font-medium text-[11px]">{receipt.departmentName}</span>
                            <span className="text-[11px] text-slate-500">
                                Date: {formatDate(receipt.appointmentDate)}
                            </span>
                        </div>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                                <tr>
                                    <th className="py-2.5 px-3">Service Description</th>
                                    <th className="py-2.5 px-3 text-right">Amount (PKR)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                <tr>
                                    <td className="py-3 px-3">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900">Clinical Consultation Fee</span>
                                            <span className="text-[11px] text-slate-500">Standard Specialist Outpatient Slot</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-3 text-right font-extrabold text-slate-900">
                                        PKR {Number(receipt.amount).toLocaleString()}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="py-2 px-3 text-slate-500">Clinical Registration & Triage</td>
                                    <td className="py-2 px-3 text-right font-medium text-slate-600">Included</td>
                                </tr>
                            </tbody>
                            <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                                <tr>
                                    <td className="py-3 px-3 text-sm text-slate-900">Total Cleared & Paid:</td>
                                    <td className="py-3 px-3 text-right text-base font-black text-slate-900">
                                        PKR {Number(receipt.amount).toLocaleString()}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Payment Method</span>
                            <span className="font-bold text-slate-900 mt-0.5">
                                {receipt.paymentMethod}
                                {receipt.transactionReference && (
                                    <span className="font-mono text-slate-600 font-semibold ml-1.5 text-[11px]">
                                        (TRX: {receipt.transactionReference})
                                    </span>
                                )}
                            </span>
                            {receipt.notes && (
                                <span className="text-[11px] text-slate-500 italic mt-0.5">Note: {receipt.notes}</span>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-900 text-white font-bold text-xs shadow-2xs">
                            <CheckCircle2 size={13} className="text-white" />
                            <span>PAID</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-dashed border-slate-300 text-[11px] text-slate-500">
                        <div className="flex flex-col">
                            <span>Cashier / Clinical Desk:</span>
                            <span className="font-bold text-slate-800">{receipt.assistantName || 'Clinic Assistant'}</span>
                        </div>
                        <div className="text-right flex flex-col items-end">
                            <span className="text-slate-700 font-semibold flex items-center gap-1">
                                <ShieldCheck size={13} className="text-slate-500" /> Verified Electronic Record
                            </span>
                            <span className="text-[10px] text-slate-400">Valid for consultation admission</span>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5 print:hidden">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                    >
                        Close
                    </button>
                    <button
                        type="button"
                        onClick={handlePrint}
                        className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                        <Printer size={14} />
                        <span>Print Customer Slip</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

export default PaymentReceiptModal
