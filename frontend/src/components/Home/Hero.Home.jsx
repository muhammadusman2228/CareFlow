import { PhoneCall } from 'lucide-react'
import Bottom from './Bottom.Home'
import Upper from './Upper.Home'

const Hero = () => {
    return (
        <div className="hero w-full flex mt-6 flex-col bg-slate-50/80 px-[6%] lg:px-[8%] py-8 rounded-3xl border border-slate-200/60 max-w-7xl mx-auto relative">
            <Upper />
            <div className="mt-12">
                <Bottom />
            </div>
            <a 
                href="tel:1-8000-CARE-NOW"
                className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 bg-sky-600 hover:bg-sky-700 text-white px-5 py-3 rounded-full shadow-xl shadow-sky-600/30 hover:-translate-y-0.5 transition-all cursor-pointer"
            >
                <PhoneCall size={18} className="text-white animate-pulse" />
                <span className="text-xs sm:text-sm font-bold tracking-wide">24/7 Hotline: 1-8000-CARE-NOW</span>
            </a>
        </div>
    )
}

export default Hero