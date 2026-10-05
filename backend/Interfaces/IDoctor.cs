


using backend.DTOs;

namespace backend.Interfaces;


public interface IDoctor
{
    Task<DrRegResponseDto> RegisterDoctor(DrRegRequestDto dto);
    Task<List<AdminDoctorResponse>> GetDoctorsAdmin();
    Task<List<FindDoctorResponse>> FindDoctors();
}