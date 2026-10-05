



const DoctorDashBoard=()=>{
    return(
          <div className="div flex flex-col w-full h-full">
        <nav className="flex h-[10vh] w-full">
            <div className="searchBar">
               <label htmlFor="search"></label>
               <input 
               
               placeholder="Search patients,doctors,appointments...."
               type="text"/>
            </div>

            <div className="profile">

            </div>
        </nav>
        <div className="hero-section flex flex-col ">
            <div className="first">
                <div className="patients"></div>
                <div className="active-doctors"></div>
                <div className="today-appointments"></div>
                <div className="revenue"></div>
            </div>
            <div className="charts">
                <div className="weekly-appointment"></div>
                <div className="load-distribution"></div>
            </div>
            <div className="logs"></div>
        </div>
        </div>
    )
}
export default DoctorDashBoard