using backend.DTOs;

namespace backend.Interfaces;

public interface IDoctorApis
{
    Task<List<DoctorAppointmentsDto>> DoctorAppointment(int userId);
    Task<AppointmentStatusResponseDto> AppointmentStatus(AppointmentStatusDto dto, int userId);
    Task<PrescriptionResponseDto> Prescriptions(PrescriptionsDto dto, int userId);
    Task<HistoryResponseDto> MedicalHistory(int patientId, int userId);
    Task<DoctorDashBoardDto> DoctorDashBoard(int userId);
}