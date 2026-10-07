import { useState, useEffect } from 'react'
import { 
    User, 
    Mail, 
    Phone, 
    AlertCircle, 
    Droplet, 
    Calendar, 
    CheckCircle2, 
    Save, 
    RefreshCw 
} from 'lucide-react'
import useAxiosPrivate from '../../hooks/useAxiosPrivate'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const GENDERS = ['Male', 'Female', 'Other']

const PatientProfile = () => {
    const axiosPrivate = useAxiosPrivate()

    const [profile, setProfile] = useState({
        name: '',
        email: '',
        phoneNumber: '',
        emergencyContact: '',
        bloodGroup: '',
        gender: '',
        dateOfBirth: ''
    })

    const [formData, setFormData] = useState({
        name: '',
        phoneNumber: '',
        emergencyContact: '',
        bloodGroup: '',
        gender: ''
    })

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState(null)

    const fetchProfile = async () => {
        try {
            setLoading(true)
            setMessage(null)
            const res = await axiosPrivate.get('/Patient/profile')
            const data = res.data || {}
            setProfile(data)
            setFormData({
                name: data.name || '',
                phoneNumber: data.phoneNumber || '',
                emergencyContact: data.emergencyContact || '',
                bloodGroup: data.bloodGroup || '',
                gender: data.gender || ''
            })
        } catch {
            setMessage({ type: 'error', text: 'Failed to load profile details.' })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchProfile()
    }, [])

    const handleSave = async (e) => {
        e.preventDefault()
        try {
            setSaving(true)
            setMessage(null)
            await axiosPrivate.patch('/Patient/profile', {
                name: formData.name.trim(),
                phoneNumber: formData.phoneNumber.trim(),
                emergencyContact: formData.emergencyContact.trim(),
                bloodGroup: formData.bloodGroup,
                gender: formData.gender
            })
            setMessage({ type: 'success', text: 'Profile updated successfully.' })
            setProfile(prev => ({ ...prev, ...formData }))
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update profile.' })
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-slate-500">Patient Account</span>
                    <h1 className="text-2xl font-bold text-slate-900">Patient Profile & Medical Record</h1>
                    <p className="text-xs text-slate-500">Manage personal contact and clinical demographic information</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchProfile}
                        className="p-2.5 rounded-xl bg-white border border-slate-200/90 text-slate-600 hover:text-slate-900 shadow-sm transition-all"
                        title="Reload"
                    >
                        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || loading}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                    >
                        <Save size={15} />
                        <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between border ${
                    message.type === 'success' 
                        ? 'bg-slate-900 text-white border-slate-900' 
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                    <div className="flex items-center gap-2">
                        {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                        <span>{message.text}</span>
                    </div>
                    <button onClick={() => setMessage(null)} className="text-xs opacity-75 hover:opacity-100">✕</button>
                </div>
            )}

            {loading ? (
                <div className="p-16 flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200/90">
                    <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-semibold text-slate-600 mt-3">Loading profile data...</span>
                </div>
            ) : (
                <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-5 h-fit">
                        <div className="flex flex-col items-center text-center pb-5 border-b border-slate-100">
                            <div className="w-20 h-20 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-extrabold text-xl shadow-xs">
                                {profile.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'PT'}
                            </div>
                            <h2 className="text-lg font-bold text-slate-900 mt-3">{profile.name || 'Patient'}</h2>
                            <span className="text-xs font-medium text-slate-500 mt-0.5">{profile.email}</span>
                            <span className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
                                Verified Patient
                            </span>
                        </div>

                        <div className="flex flex-col gap-3">
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Calendar size={15} className="text-slate-500" />
                                    <span className="text-xs font-medium text-slate-600">Date of Birth</span>
                                </div>
                                <span className="text-xs font-bold text-slate-900">{profile.dateOfBirth || 'Not set'}</span>
                            </div>

                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Mail size={15} className="text-slate-500" />
                                    <span className="text-xs font-medium text-slate-600">Account Email</span>
                                </div>
                                <span className="text-xs font-semibold text-slate-700 truncate max-w-[150px]">{profile.email}</span>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2 flex flex-col gap-6">
                        <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-5">
                            <div className="border-b border-slate-100 pb-3">
                                <h3 className="text-base font-bold text-slate-900">Demographic & Clinical Details</h3>
                                <p className="text-xs text-slate-500">Basic identification and health profile</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5 sm:col-span-2">
                                    <label className="text-xs font-bold text-slate-800">
                                        Full Name <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-3 focus:ring-sky-500/15 transition-all"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-800">Gender</label>
                                    <select
                                        value={formData.gender}
                                        onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                                        className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-3 focus:ring-sky-500/15 transition-all"
                                    >
                                        <option value="">Select Gender</option>
                                        {GENDERS.map(g => (
                                            <option key={g} value={g}>{g}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-800">Blood Group</label>
                                    <select
                                        value={formData.bloodGroup}
                                        onChange={(e) => setFormData(prev => ({ ...prev, bloodGroup: e.target.value }))}
                                        className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-3 focus:ring-sky-500/15 transition-all"
                                    >
                                        <option value="">Select Blood Group</option>
                                        {BLOOD_GROUPS.map(bg => (
                                            <option key={bg} value={bg}>{bg}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-5">
                            <div className="border-b border-slate-100 pb-3">
                                <h3 className="text-base font-bold text-slate-900">Contact & Emergency Coordinates</h3>
                                <p className="text-xs text-slate-500">Direct phone number and emergency reachable contact</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-800">Personal Phone Number</label>
                                    <div className="relative">
                                        <Phone size={15} className="absolute left-3.5 top-3 text-slate-400" />
                                        <input
                                            type="tel"
                                            placeholder="Enter phone number"
                                            value={formData.phoneNumber}
                                            onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                                            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-3 focus:ring-sky-500/15 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-800">Emergency Contact</label>
                                    <div className="relative">
                                        <AlertCircle size={15} className="absolute left-3.5 top-3 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Contact name and phone"
                                            value={formData.emergencyContact}
                                            onChange={(e) => setFormData(prev => ({ ...prev, emergencyContact: e.target.value }))}
                                            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-3 focus:ring-sky-500/15 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
                                >
                                    <Save size={15} />
                                    <span>{saving ? 'Saving Changes...' : 'Save Profile Details'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            )}
        </div>
    )
}

export default PatientProfile
