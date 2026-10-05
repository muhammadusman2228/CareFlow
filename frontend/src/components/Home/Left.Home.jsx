


const Left=()=>{
    return(
<div className="left grid lg:col-span-7 gap-4">
                        <h1 className='text-5xl font-bold z-10 ' >Modern HealthCare, Seamless Clinical Care</h1>
                        <p className='text-gray-700 '>Experience patient-centered care with advanced technologyand a 
                            dedicated team of specialists committed to your well-being.
                        </p>
                        <div className="appointments flex justify-start items-center gap-3">
                            <button className='bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm sm:text-base px-6 sm:px-7 py-3.5 rounded-xl shadow-lg shadow-sky-600/25 hover:shadow-xl hover:shadow-sky-600/35 transition-all cursor-pointer'>
                              Book an Appointment
                            </button>
                            <button className='border  border-sky-600 hover:bg-sky-600 hover:text-white font-semibold bg-sky-50 text-slate-700 text-sm sm:text-base px-6 sm:px-7 py-3.5 rounded-xl shadow-sm hover:shadow transition-all cursor-pointer'>
                              Explore Departments
                            </button>
                        </div>
                        </div>
    )
}
export default Left