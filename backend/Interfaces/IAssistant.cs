using backend.DTOs;

namespace backend.Interfaces;

public interface IAssistant
{
    Task<ResponseAssistantDto> RegisterAssistant(RegisterAssistantDto dto);
    Task<List<ResponseAssistantDto>> GetAllAssistants();
    Task<ResponseAssistantDto> UpdateAssistant(int id, UpdateAssistantDto dto);
    Task<bool> DeleteAssistant(int id);
    Task<List<ResponseAssistantDto>> GetDoctorAssistants(int doctorUserId);
    Task<List<AssistantQueueItemDto>> GetTodayQueue(int assistantUserId);
    Task<ResponseVitalsDto> RecordVitals(CreateVitalsDto dto, int assistantUserId);
    Task<ResponseVitalsDto?> GetVitalsByAppointment(int appointmentId);
    Task<ResponseLabOrderDto> CreateLabOrder(CreateLabOrderDto dto, int doctorUserId);
    Task<List<ResponseLabOrderDto>> GetLabOrdersByAppointment(int appointmentId);
    Task<List<ResponseLabOrderDto>> GetPendingLabOrders(int assistantUserId);
    Task<ResponseLabOrderDto> UpdateLabOrderStatus(int labOrderId, UpdateLabStatusDto dto);
    Task<AppointmentStatusResponseDto> CheckInPatient(int appointmentId, int assistantUserId);
    Task<List<ResponseLabOrderDto>> GetPatientLabHistory(int patientId);
    Task<ResponseAssistantBookingDto> BookAssistedAppointment(AssistantBookAppointmentDto dto, int assistantUserId);
    Task<List<FindDoctorResponse>> GetSchedulableDoctors(int assistantUserId);
}
