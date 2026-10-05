using backend.DTOs;

namespace backend.Interfaces;

public interface IAppointment
{
    Task<List<ResponseAppointmentDto>> GetAvailableDoctors(int departmentId, DateOnly date, TimeOnly timeSlot);

    Task<ResponseBookingDto> BookAppointment(RequestBookingDto dto);
}