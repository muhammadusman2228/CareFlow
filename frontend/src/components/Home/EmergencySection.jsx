import { PhoneCall, Ambulance, MapPin, Clock } from 'lucide-react'

const EmergencySection = () => {
    return (
        <section id="emergency" className="py-16 px-6 lg:px-16 max-w-7xl mx-auto w-full">
            <div className="bg-slate-900 rounded-3xl p-8 sm:p-12 text-white border border-slate-800 shadow-xl">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                    <div className="flex flex-col gap-2 max-w-2xl">
                        <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
                            Emergency Response Unit
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                            24/7 Acute Trauma & Ambulance Dispatch
                        </h2>
                        <p className="text-sm text-slate-300 leading-relaxed mt-1">
                            For acute chest pain, trauma, difficulty breathing, or stroke symptoms, our rapid-response clinical paramedics and triage team are on duty 24 hours a day, 7 days a week.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto shrink-0">
                        <a
                            href="tel:1-8000-CARE-NOW"
                            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-md transition-colors cursor-pointer"
                        >
                            <PhoneCall size={18} />
                            <span>Call 1-8000-CARE-NOW</span>
                        </a>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10 pt-8 border-t border-slate-800">
                    <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-sky-400 shrink-0">
                            <Ambulance size={18} />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="font-bold text-white text-xs sm:text-sm">Ambulance Dispatch</span>
                            <span className="text-slate-400 text-xs truncate">Average response: 8-12 mins</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-sky-400 shrink-0">
                            <MapPin size={18} />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="font-bold text-white text-xs sm:text-sm">ER Trauma Centre</span>
                            <span className="text-slate-400 text-xs truncate">Main Hospital, Gate 2</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-sky-400 shrink-0">
                            <Clock size={18} />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="font-bold text-white text-xs sm:text-sm">Zero Wait Triage</span>
                            <span className="text-slate-400 text-xs truncate">Immediate physician evaluation</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default EmergencySection
