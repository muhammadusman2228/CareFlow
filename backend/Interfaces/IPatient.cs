


using backend.DTOs;

namespace backend.Interfaces;

public interface IPatient
{
    Task<List<PatientAppointmentDto>> Appointment(int userId);
    Task<List<PatientPrescriptionsDto>> Prescriptions(int userId);
    Task<string> CancelAppointment(int appointmentId,int userId);

    Task<ProfileResponseDto> GetProfile(int userId);

    Task<string> UpdateProfile(ProfileUpdateDto dto,int userId);
}