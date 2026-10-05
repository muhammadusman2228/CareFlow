




using backend.DTOs;

namespace backend.Interfaces;


public interface IDoctorApis
{
    Task<List<DoctorAppointmentsDto>> DoctorAppointment(int userId);
    Task<AppointmentStatusResponseDto> AppointmentStatus(AppointmentStatusDto dto);

    Task<PrescriptionResponseDto> Prescriptions(PrescriptionsDto dto);
    Task<HistoryResponseDto> MedicalHistory(HistoryDto dto);
    Task<DoctorDashBoardDto> DoctorDashBoard(int userId);

}