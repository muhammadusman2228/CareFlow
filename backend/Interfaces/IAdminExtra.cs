
using backend.DTOs;

namespace backend.Interfaces;

public interface IAdminExtra
{
    Task<AdminDashboardDto> AdminDashboard();
    Task<AdminPatientsDto> AdminPatient();
    Task<List<AdminLogsDto>> AdminLogs();
    Task<List<DoctorScheduleResponseDto>> GetDoctorSchedules(DateOnly date);
    Task<string> UpdateDoctorShift(int doctorId, DoctorShiftUpdateDto dto, DateOnly? date = null);
    Task<bool> ToggleDoctorAvailability(int doctorId, DateOnly? date = null);
    Task<string> RegisterAdmin(RegisterAdminRequestDto dto);
    Task<string> VerifyAdminOtp(VerifyAdminOtpDto dto);
    Task<List<AdminListItemDto>> GetAdminsList();
    Task<string> DeleteAdmin(int adminId, int currentUserId);
    Task<DiversionCandidatesResponseDto> GetAdminDiversionCandidates(int appointmentId);
    Task<DivertAppointmentResponseDto> DivertFutureAppointment(AdminDivertAppointmentDto dto, int adminUserId);
    Task<List<AdminDoctorAppointmentDto>> GetDoctorAppointments(int doctorId, DateOnly date);
    Task<MonthlyAppointmentsSummaryDto> GetMonthlyAppointments(int year, int month);
}