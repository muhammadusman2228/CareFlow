import { PhoneCall } from 'lucide-react'
import Bottom from './Bottom.Home'
import Upper from './Upper.Home'

const Hero = () => {
    return (
        <div className="hero w-full flex mt-6 flex-col bg-slate-200/50 px-[6%] lg:px-[8%] py-8 sm:py-10 rounded-3xl max-w-7xl mx-auto relative shadow-sm">
            <Upper />
            <div className="mt-10 sm:mt-12">
                <Bottom />
            </div>
            <a 
                href="tel:1-8000-CARE-NOW"
                className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-3.5 py-2.5 sm:px-5 sm:py-3 rounded-full shadow-xl shadow-sky-600/30 hover:-translate-y-0.5 transition-all cursor-pointer"
            >
                <PhoneCall size={18} className="text-white animate-pulse shrink-0" />
                <span className="text-xs sm:text-sm font-bold tracking-wide"><span className="hidden sm:inline">24/7 Hotline: </span>1-8000-CARE-NOW</span>
            </a>
        </div>
    )
}

export default Hero