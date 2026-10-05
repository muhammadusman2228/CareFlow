



using backend.DTOs;

namespace backend.Interfaces;

public interface IDepartments
{
     Task<DepartmentResponseDto> registerDepartment(DeparmentRequestDto dto);
     Task<List<DepartmentResponseDto>> getDepartments();
}