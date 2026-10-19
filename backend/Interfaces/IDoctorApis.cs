using backend.DTOs;

namespace backend.Interfaces;

public interface IDoctorApis
{
    Task<List<DoctorAppointmentsDto>> DoctorAppointment(int userId);
    Task<AppointmentStatusResponseDto> AppointmentStatus(AppointmentStatusDto dto, int userId);
    Task<PrescriptionResponseDto> Prescriptions(PrescriptionsDto dto, int userId);
    Task<HistoryResponseDto> MedicalHistory(int patientId, int userId);
    Task<DoctorDashBoardDto> DoctorDashBoard(int userId);
    Task<DoctorDailyStatusResponseDto> GetDoctorDailyStatus(int userId);
    Task<string> SetDoctorDailyStatus(int userId, DoctorDailyStatusDto dto);
    Task<DoctorMyScheduleDto> GetDoctorMySchedule(int userId);
    Task<string> UpdateConsultationFee(int userId, decimal fee);
}