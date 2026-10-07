import { useState } from 'react'
import Navbar from '../components/Home/Navbar.Home'
import Hero from '../components/Home/Hero.Home'
import DepartmentsSection from '../components/Home/DepartmentsSection'
import DoctorsSection from '../components/Home/DoctorsSection'
import AboutSection from '../components/Home/AboutSection'
import EmergencySection from '../components/Home/EmergencySection'
import Footer from '../components/Home/Footer.Home'

const Home = () => {
    const [selectedDeptFilter, setSelectedDeptFilter] = useState('')

    const handleSelectDepartment = (deptName) => {
        setSelectedDeptFilter(deptName)
        const el = document.getElementById('doctors')
        if (el) {
            el.scrollIntoView({ behavior: 'smooth' })
        }
    }

    return (
        <div className="bg-white w-full overflow-x-hidden relative min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1 flex flex-col gap-10">
                <Hero />
                <DepartmentsSection onSelectDepartment={handleSelectDepartment} />
                <DoctorsSection 
                    selectedDepartmentFilter={selectedDeptFilter}
                    onClearDepartmentFilter={() => setSelectedDeptFilter('')}
                />
                <AboutSection />
                <EmergencySection />
            </main>
            <Footer />
        </div>
    )
}

export default Home