


using System.ComponentModel.DataAnnotations;

namespace backend.DTOs;
public class DrRegRequestDto
{

    [Required]
    [MaxLength(100)]
    public string Name{get;set;}=string.Empty;

    [Required]
    [MaxLength(100)]
    [EmailAddress]
    public string Email{get;set;}=string.Empty;


    [Required]
    [MinLength(8,ErrorMessage ="The Password Must be greater than 8 characters")]
    [MaxLength(100)]


    public string Password{get;set;}=string.Empty;
  
    [Required]


    public int DepartmentId{get;set;}

   
       
    [Required]
    [MaxLength(100)]   
    public string Specialization{get;set;}=string.Empty;



    [Required]
    [MaxLength(100)]
    public string Qualifications{get;set;}=string.Empty;

    [Required]
    [MaxLength(100)]
    public string LicenseNumber{get;set;}=string.Empty;
     
     [Required]
     [Range(0,60)]
    public int ExperienceYears{get;set;}

    [Required]
    [Range(0,10000000000)]

    public decimal ConsultationFee{get;set;}
}
public class DrRegResponseDto
{
   
    public string Name{get;set;}=string.Empty;

    public string Email{get;set;}=string.Empty;
    public int DepartmentId{get;set;}
    public string DepartmentName{get;set;}=string.Empty;

    public string Specialization{get;set;}=string.Empty;
    public decimal  ConsultationFee{get;set;}
}


public class AdminDoctorResponse
{
    public int Id{get;set;}
    public string Name{get;set;}=string.Empty;
    public string Email{get;set;}=string.Empty;
    public int DepartmentId{get;set;}
    public string DepartmentName{get;set;}=string.Empty;
    public string Specialization{get;set;}=string.Empty;
    public string Qualifications{get;set;}=string.Empty;
    public string LicenseNumber{get;set;}=string.Empty;
    public int  ExperienceYears{get;set;}
    public decimal ConsultationFee{get;set;}
    public bool IsAvailable{get;set;}
    public DateTime CreatedAt{get;set;}
}

public class FindDoctorResponse
{
    public int Id{get;set;}
    public string Name{get;set;}=string.Empty;
    public string DepartmentName{get;set;}=string.Empty;

    public string Specialization{get;set;}=string.Empty;

    public decimal ConsultationFee{get;set;}
}