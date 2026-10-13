
using backend.DTOs;

namespace backend.Interfaces;

public interface IAdminExtra
{
    Task<AdminDashboardDto> AdminDashboard();
    Task<AdminPatientsDto> AdminPatient();
    Task<List<AdminLogsDto>> AdminLogs();
    Task<List<DoctorScheduleResponseDto>> GetDoctorSchedules(DateOnly date);
    Task<string> UpdateDoctorShift(int doctorId, DoctorShiftUpdateDto dto);
    Task<bool> ToggleDoctorAvailability(int doctorId);
    Task<string> RegisterAdmin(RegisterAdminRequestDto dto);
    Task<string> VerifyAdminOtp(VerifyAdminOtpDto dto);
    Task<List<AdminListItemDto>> GetAdminsList();
}