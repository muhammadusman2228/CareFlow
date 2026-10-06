
// these interface is just for the admin main dasboard, patient, security logs and scheduling 


using backend.DTOs;

namespace backend.Interfaces;

public interface IAdminExtra
{
    Task<AdminDashboardDto> AdminDashboard ();
    Task<AdminPatientsDto> AdminPatient();
}