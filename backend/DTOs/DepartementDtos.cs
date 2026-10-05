

using System.ComponentModel.DataAnnotations;

namespace backend.DTOs;

public class DeparmentRequestDto
{
    [Required(ErrorMessage ="Department Name is required")]
    [MaxLength(100)]
    public string Name{get;set;}=string.Empty;

    [Required(ErrorMessage ="Department Description is required")]
    [MaxLength(500)]
    public string Description{get;set;}=string.Empty;
}


public class DepartmentResponseDto
{
    
    public int Id{get;set;}

    public string Name{get;set;}=string.Empty;

    public string Description{get;set;}=string.Empty;

    public int DoctorCounts{get;set;}
}