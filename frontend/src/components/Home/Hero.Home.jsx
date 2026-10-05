


import Bottom from './Bottom.Home'
import Upper from './Upper.Home'


const Hero=()=>{
    return(
         <div className="hero w-full flex mt-3 flex-col bg-slate-50 px-[8%]">
               <Upper/>
                
               <Bottom/>
                    <div className="emeergency-helpline absolute bottom-1 right-[2%] z-20 flex items-center gap-2.5 bg-sky-600 hover:bg-sky-700 text-white px-5 py-2.5 rounded-full shadow-lg shadow-sky-600/30 hover:-translate-y-0.5 transition-all cursor-pointer ">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-phone-call preview-icon"><path d="M13 2a9 9 0 0 1 9 9"/><path d="M13 6a5 5 0 0 1 5 5"/><path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"/></svg>
                    <p className='text-xs sm:text-sm font-semibold tracking-wide'> 24/7 Emergency Hotline: 1-8000-CARE-NOW</p>
                    </div>
            </div>
    )
}
export default Hero