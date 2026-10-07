import { Routes, Route } from "react-router"
import Home from "./Pages/Home"
import Login from "./Pages/Login"
import Register from "./Pages/Register"
import ForgotPassword from "./Pages/ForgotPassword"
import VerifyEmail from "./Pages/VerifyEmail"
import ResendMail from "./Pages/ResendMail"
import ResetPassword from "./Pages/ResetPassoword"
import ProtectedRoute from "./components/ProtectedRoutes"
import GuestRoute from "./components/GuestRoute"
import PatientDashBoard from "./Pages/Patient/PatientDashBoard"
import PatientOverview from "./Pages/Patient/PatientOverview"
import PatientBooking from "./Pages/Patient/PatientBooking"
import PatientAppointments from "./Pages/Patient/PatientAppointments"
import PatientPrescriptions from "./Pages/Patient/PatientPrescriptions"
import PatientProfile from "./Pages/Patient/PatientProfile"
import DoctorDashBoard from "./Pages/Doctor/DoctorDashBoard"
import DoctorOverview from "./Pages/Doctor/DoctorOverview"
import DoctorAppointments from "./Pages/Doctor/DoctorAppointments"
import DoctorPrescriptions from "./Pages/Doctor/DoctorPrescriptions"
import DoctorPatientHistory from "./Pages/Doctor/DoctorPatientHistory"
import AdminDashBoard from "./Pages/Admin/AdminDashBoard"
import AdminOverview from "./Pages/Admin/AdminOverview"
import AdminDoctors from "./Pages/Admin/AdminDoctors"
import AdminDepartments from "./Pages/Admin/AdminDepartments"
import AdminSchedules from "./Pages/Admin/AdminSchedules"
import AdminPatients from "./Pages/Admin/AdminPatients"
import AdminAuditLogs from "./Pages/Admin/AdminAuditLogs"
import DoctorPublicProfile from "./Pages/DoctorPublicProfile"

const App = () => {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/doctor-profile/:id" element={<DoctorPublicProfile />} />
            <Route path="/doctor/:id" element={<DoctorPublicProfile />} />

            <Route element={<GuestRoute />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} /> 
                <Route path="/forgotPassword" element={<ForgotPassword />} />
                <Route path="/verifyEmail" element={<VerifyEmail />} />
                <Route path="/resendOtp" element={<ResendMail />} />
                <Route path="/resetPassword" element={<ResetPassword />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['Patient']} />}>
                <Route path="/patient/dashboard" element={<PatientDashBoard />}>
                    <Route index element={<PatientOverview />} />
                    <Route path="book" element={<PatientBooking />} />
                    <Route path="appointments" element={<PatientAppointments />} />
                    <Route path="prescriptions" element={<PatientPrescriptions />} />
                    <Route path="profile" element={<PatientProfile />} />
                </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['Doctor']} />}>
                <Route path="/doctor/dashboard" element={<DoctorDashBoard />}>
                    <Route index element={<DoctorOverview />} />
                    <Route path="appointments" element={<DoctorAppointments />} />
                    <Route path="prescriptions" element={<DoctorPrescriptions />} />
                    <Route path="records" element={<DoctorPatientHistory />} />
                </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
                <Route path="/admin/dashboard" element={<AdminDashBoard />}>
                    <Route index element={<AdminOverview />} />
                    <Route path="doctors" element={<AdminDoctors />} />
                    <Route path="departments" element={<AdminDepartments />} />
                    <Route path="schedules" element={<AdminSchedules />} />
                    <Route path="patients" element={<AdminPatients />} />
                    <Route path="audit-logs" element={<AdminAuditLogs />} />
                </Route>
            </Route>
        </Routes>
    )
}

export default App
