
// these interface is just for the admin main dasboard, patient, security logs and scheduling 


using backend.DTOs;

namespace backend.Interfaces;

public interface IAdminExtra
{
    Task<AdminDashboardDto> AdminDashboard ();
    Task<AdminPatientsDto> AdminPatient();
    Task<List<AdminLogsDto>> AdminLogs();
    Task<List<DoctorScheduleResponseDto>> GetDoctorSchedules(DateOnly date);
    Task<string> UpdateDoctorShift(int doctorId, DoctorShiftUpdateDto dto);
    Task<bool> ToggleDoctorAvailability(int doctorId);
}