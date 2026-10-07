import doctorImage from '../../assets/doctorImage.png'

const Right = () => {
    return (
        <div className="right relative w-full max-w-md mx-auto flex justify-center lg:col-span-5">
            <img className="w-auto h-72 rounded-3xl object-contain shadow-2xl" src={doctorImage} alt="Specialist Physician" />
            
            <div className="box1 absolute -top-3 -left-3 sm:-left-6 bg-white px-3.5 py-2 rounded-2xl shadow-xl shadow-slate-900/10 border border-slate-200/90 flex items-center gap-3 z-30">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0369a1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield-check preview-icon">
                    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                    <path d="m9 12 2 2 4-4" />
                </svg>
                <div className="content">
                    <h2 className="font-semibold text-slate-800 text-sm">Verified</h2>
                    <span className="text-slate-500 text-xs">Specialists</span>
                </div>
            </div>

            <div className="box2 absolute top-6 -right-4 sm:-right-6 bg-white px-4 py-2.5 rounded-2xl shadow-xl shadow-slate-900/10 border border-slate-200/90 flex items-center gap-3 z-10">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0369a1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock preview-icon">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                </svg>
                <div className="content">
                    <h2 className="font-semibold text-slate-800 text-sm">24/7</h2>
                    <span className="text-slate-500 text-xs">Availability</span>
                </div>
            </div>

            <div className="box3 absolute bottom-8 -right-4 sm:-right-6 bg-white px-4 py-2.5 rounded-2xl shadow-xl shadow-slate-900/10 border border-slate-200/90 flex flex-col items-center gap-2 z-10">
                <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="30" 
                    height="30" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                >
                    <rect x="4" y="2" width="16" height="20" rx="2.5" fill="#e8eff5" stroke="#1e3a5f" strokeWidth="1.5" />
                    <rect x="5.5" y="3.5" width="13" height="15" rx="1.2" fill="#ffffff" />
                    <circle cx="12" cy="20.3" r="0.6" fill="#1e3a5f" />
                    <path d="M7.5 6v4" stroke="#0284c7" strokeWidth="1.3" />
                    <path d="M7.5 6h1.5a1.1 1.1 0 0 1 0 2.2H7.5" stroke="#0284c7" strokeWidth="1.3" />
                    <path d="M8.6 8.2l1.4 2" stroke="#0284c7" strokeWidth="1.3" />
                    <path d="M9.8 8.4l1.8 2" stroke="#0284c7" strokeWidth="1.1" />
                    <path d="M11.6 8.4l-1.8 2" stroke="#0284c7" strokeWidth="1.1" />
                    <path d="M14.5 6h2.5" stroke="#94a3b8" strokeWidth="1.2" />
                    <path d="M14.5 7.8h2.5" stroke="#94a3b8" strokeWidth="1.2" />
                    <path d="M7.5 11.5h9" stroke="#94a3b8" strokeWidth="1.2" />
                    <path d="M7.5 13.5h9" stroke="#94a3b8" strokeWidth="1.2" />
                    <path d="M7.5 15.5h6" stroke="#94a3b8" strokeWidth="1.2" />
                    <path d="M14.5 17.5h2.5" stroke="#0284c7" strokeWidth="1.6" />
                </svg>
                <div className="content">
                    <h2 className="font-semibold text-slate-800 text-xs">Instant Digital Rx</h2>
                </div>
            </div>
        </div>
    )
}

export default Right