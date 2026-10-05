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
import DoctorDashBoard from "./Pages/Doctor/DoctorDashBoard"
import AdminDashBoard from "./Pages/Admin/AdminDashBoard"
import AdminOverview from "./Pages/Admin/AdminOverview"
import AdminDoctors from "./Pages/Admin/AdminDoctors"
import AdminDepartments from "./Pages/Admin/AdminDepartments"
import AdminSchedules from "./Pages/Admin/AdminSchedules"
import AdminPatients from "./Pages/Admin/AdminPatients"
import AdminAuditLogs from "./Pages/Admin/AdminAuditLogs"

const App = () => {
    return (
        <Routes>
            <Route path="/" element={<Home />} />

            <Route element={<GuestRoute />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} /> 
                <Route path="/forgotPassword" element={<ForgotPassword />} />
                <Route path="/verifyEmail" element={<VerifyEmail />} />
                <Route path="/resendOtp" element={<ResendMail />} />
                <Route path="/resetPassword" element={<ResetPassword />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['Patient']} />}>
                <Route path="/patient/dashboard" element={<PatientDashBoard />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['Doctor']} />}>
                <Route path="/doctor/dashboard" element={<DoctorDashBoard />} />
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
