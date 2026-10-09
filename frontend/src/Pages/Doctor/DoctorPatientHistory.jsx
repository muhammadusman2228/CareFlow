import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router'
import { 
    Printer, 
    Calendar, 
    User, 
    Droplet, 
    Phone, 
    AlertCircle, 
    ArrowLeft,
    Clock,
    FileText,
    Stethoscope
} from 'lucide-react'
import useAxiosPrivate from '../../hooks/useAxiosPrivate'

const DoctorPatientHistory = () => {
    const axiosPrivate = useAxiosPrivate()
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const patientIdParam = searchParams.get('patientId')

    const [patientList, setPatientList] = useState([])
    const [selectedPatientId, setSelectedPatientId] = useState(patientIdParam || '')
    const [historyData, setHistoryData] = useState(null)
    const [labHistory, setLabHistory] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchPatients = async () => {
            try {
                const res = await axiosPrivate.get('/Doctor/doctor-appointments')
                if (Array.isArray(res.data)) {
                    const uniquePatients = []
                    const seen = new Set()
                    res.data.forEach(a => {
                        if (!seen.has(a.patientId)) {
                            seen.add(a.patientId)
                            uniquePatients.push({ id: a.patientId, name: a.patientName })
                        }
                    })
                    setPatientList(uniquePatients)
                    if (!selectedPatientId && uniquePatients.length > 0) {
                        setSelectedPatientId(String(uniquePatients[0].id))
                    }
                }
            } catch {
            }
        }
        fetchPatients()
    }, [])

    useEffect(() => {
        if (!selectedPatientId) return

        const fetchHistory = async () => {
            try {
                setLoading(true)
                setError(null)
                const [medRes, labRes] = await Promise.allSettled([
                    axiosPrivate.get(`/Doctor/medical-history/${selectedPatientId}`),
                    axiosPrivate.get(`/Assistant/patient-lab-history/${selectedPatientId}`)
                ])
                if (medRes.status === 'fulfilled') {
                    setHistoryData(medRes.value.data)
                } else {
                    setHistoryData(null)
                    setError(medRes.reason?.response?.data?.message || 'Unable to retrieve medical history for this patient.')
                }
                if (labRes.status === 'fulfilled' && Array.isArray(labRes.value.data)) {
                    setLabHistory(labRes.value.data)
                } else {
                    setLabHistory([])
                }
            } catch (err) {
                setHistoryData(null)
                setLabHistory([])
                setError('Unable to retrieve records.')
            } finally {
                setLoading(false)
            }
        }

        fetchHistory()
    }, [selectedPatientId])

    const selectedPatientMeta = patientList.find(p => String(p.id) === String(selectedPatientId))
    const patientName = selectedPatientMeta?.name || 'Patient Clinical Dossier'

    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/doctor/dashboard')}
                        className="p-2 rounded-xl bg-white border border-slate-200/90 text-slate-600 hover:text-slate-900 shadow-sm transition-all"
                        title="Back to Overview"
                    >
                        <ArrowLeft size={16} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                            <span>Patients</span>
                            <span>/</span>
                            <span className="text-slate-800">Medical History Dossier</span>
                        </div>
                        <h1 className="text-xl font-bold text-slate-900 mt-0.5">Electronic Health Record (EHR)</h1>
                    </div>
                </div>

                <div className="flex items-center gap-3 self-start sm:self-auto">
                    {patientList.length > 0 && (
                        <select
                            value={selectedPatientId}
                            onChange={(e) => setSelectedPatientId(e.target.value)}
                            className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-800 shadow-sm focus:outline-none focus:border-sky-500"
                        >
                            {patientList.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.name} (#PID-{p.id})
                                </option>
                            ))}
                        </select>
                    )}

                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-800 hover:bg-slate-50 shadow-sm transition-all"
                    >
                        <Printer size={15} />
                        <span>Print Dossier</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="p-16 flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200/90">
                    <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-semibold text-slate-600 mt-3">Loading clinical record...</span>
                </div>
            ) : error ? (
                <div className="p-6 bg-white rounded-xl border border-slate-200/90 shadow-sm flex flex-col items-center justify-center text-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-900">Medical Record Inaccessible</h3>
                        <p className="text-xs text-slate-500 mt-1 max-w-md">{error}</p>
                    </div>
                </div>
            ) : historyData ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-5 h-fit">
                        <div className="flex flex-col items-center text-center pb-5 border-b border-slate-100">
                            <div className="w-20 h-20 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-extrabold text-xl shadow-xs">
                                {patientName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                            </div>
                            <h2 className="text-lg font-bold text-slate-900 mt-3">{patientName}</h2>
                            <span className="text-xs font-semibold text-slate-500 mt-0.5">Patient Record #PID-{selectedPatientId}</span>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex flex-col items-center text-center">
                                <Calendar size={15} className="text-slate-500 mb-1" />
                                <span className="text-[10px] font-semibold text-slate-500 uppercase">DOB</span>
                                <span className="text-xs font-bold text-slate-800 mt-0.5">{historyData.dateOfBirth || 'N/A'}</span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex flex-col items-center text-center">
                                <User size={15} className="text-slate-500 mb-1" />
                                <span className="text-[10px] font-semibold text-slate-500 uppercase">Gender</span>
                                <span className="text-xs font-bold text-slate-800 mt-0.5">{historyData.gender || 'N/A'}</span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex flex-col items-center text-center">
                                <Droplet size={15} className="text-slate-500 mb-1" />
                                <span className="text-[10px] font-semibold text-slate-500 uppercase">Blood</span>
                                <span className="text-xs font-bold text-slate-800 mt-0.5">{historyData.bloodGroup || 'N/A'}</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 pt-2 border-t border-slate-100">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Emergency & Contact</h4>
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                                <Phone size={15} className="text-slate-500 shrink-0" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-medium text-slate-500">Contact Number</span>
                                    <span className="text-xs font-bold text-slate-800">{historyData.phoneNumber || 'Not provided'}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                                <AlertCircle size={15} className="text-slate-500 shrink-0" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-medium text-slate-500">Emergency Contact</span>
                                    <span className="text-xs font-bold text-slate-800">{historyData.emergencyContact || 'Not provided'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col gap-6">
                        <div className="border-b border-slate-100 pb-4">
                            <h2 className="text-base font-bold text-slate-900">Consultation & Prescription History</h2>
                            <p className="text-xs text-slate-500">Chronological timeline of past hospital visits, clinical diagnoses, and prescriptions</p>
                        </div>

                        {(!historyData.medicalHistory || historyData.medicalHistory.length === 0) ? (
                            <div className="py-12 flex flex-col items-center justify-center text-center gap-2">
                                <FileText size={28} className="text-slate-400" />
                                <p className="text-xs font-medium text-slate-500">No prior completed consultations on file for this patient.</p>
                            </div>
                        ) : (
                            <div className="relative pl-6 border-l-2 border-slate-200 flex flex-col gap-6">
                                {historyData.medicalHistory.map((item, idx) => (
                                    <div key={idx} className="relative flex flex-col gap-2">
                                        <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-slate-600 shadow-xs" />

                                        <div className="bg-slate-50/80 rounded-xl border border-slate-200/90 p-4 shadow-2xs flex flex-col gap-3">
                                            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
                                                <div className="flex items-center gap-2">
                                                    <Stethoscope size={15} className="text-slate-600" />
                                                    <span className="text-xs font-bold text-slate-900">{item.doctorName}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                                                    <Clock size={13} />
                                                    <span>{item.appointmentDate}</span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-1.5">
                                                <div className="text-xs">
                                                    <span className="font-semibold text-slate-500">Clinical Diagnosis: </span>
                                                    <span className="font-bold text-slate-900">{item.title || 'General Checkup'}</span>
                                                </div>

                                                {item.symptoms && (
                                                    <div className="text-xs">
                                                        <span className="font-semibold text-slate-500">Reported Symptoms: </span>
                                                        <span className="font-medium text-slate-700 italic">{item.symptoms}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {item.note && (
                                                <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs flex flex-col gap-1">
                                                    <span className="font-bold text-slate-800">Prescription & Clinical Instructions:</span>
                                                    <p className="text-slate-700 whitespace-pre-line leading-relaxed">{item.note}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="border-t border-slate-100 pt-6 flex flex-col gap-4">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Diagnostic Laboratory History</h3>
                                <p className="text-xs text-slate-500">Historical pathology specimens and laboratory reports across all visits</p>
                            </div>

                            {labHistory.length === 0 ? (
                                <p className="text-xs text-slate-500 py-3">No laboratory tests recorded for this patient.</p>
                            ) : (
                                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600">
                                            <tr>
                                                <th className="py-2.5 px-3">Date</th>
                                                <th className="py-2.5 px-3">Test Name</th>
                                                <th className="py-2.5 px-3">Consultant</th>
                                                <th className="py-2.5 px-3">Status</th>
                                                <th className="py-2.5 px-3">Laboratory Findings</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {labHistory.map((test) => (
                                                <tr key={test.id} className="hover:bg-slate-50/50">
                                                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                                                        {new Date(test.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="py-2.5 px-3 font-semibold text-slate-900">{test.testName}</td>
                                                    <td className="py-2.5 px-3 text-slate-700">Dr. {test.doctorName}</td>
                                                    <td className="py-2.5 px-3">
                                                        <span className={`text-xs font-semibold ${
                                                            test.status === 'Completed'
                                                                ? 'text-slate-950 font-bold'
                                                                : test.status === 'Sample Collected'
                                                                ? 'text-slate-800'
                                                                : 'text-slate-500'
                                                        }`}>
                                                            {test.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-2.5 px-3 text-slate-900">
                                                        {test.resultsSummary ? (
                                                            <span className="font-mono text-[11px]">{test.resultsSummary}</span>
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
                </div>
            ) : (
                <div className="p-12 text-center text-sm text-slate-500">
                    Select a patient from the consultation list to view their electronic health record.
                </div>
            )}
        </div>
    )
}

export default DoctorPatientHistory
