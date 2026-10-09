using System.ComponentModel.DataAnnotations;

namespace backend.DTOs;

public class DrRegRequestDto
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(8, ErrorMessage = "The Password Must be greater than 8 characters")]
    [MaxLength(100)]
    public string Password { get; set; } = string.Empty;

    [Required]
    public int DepartmentId { get; set; }

    [Required]
    [MaxLength(100)]
    public string Specialization { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Qualifications { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string LicenseNumber { get; set; } = string.Empty;

    [Required]
    [Range(0, 60)]
    public int ExperienceYears { get; set; }

    [Required]
    [Range(0, 10000000000)]
    public decimal ConsultationFee { get; set; }
}

public class DrRegResponseDto
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public int DepartmentId { get; set; }
    public string DepartmentName { get; set; } = string.Empty;
    public string Specialization { get; set; } = string.Empty;
    public decimal ConsultationFee { get; set; }
}

public class AdminDoctorResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public int DepartmentId { get; set; }
    public string DepartmentName { get; set; } = string.Empty;
    public string Specialization { get; set; } = string.Empty;
    public string Qualifications { get; set; } = string.Empty;
    public string LicenseNumber { get; set; } = string.Empty;
    public int ExperienceYears { get; set; }
    public decimal ConsultationFee { get; set; }
    public bool IsAvailable { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class FindDoctorResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int DepartmentId { get; set; }
    public string DepartmentName { get; set; } = string.Empty;
    public string Specialization { get; set; } = string.Empty;
    public string Qualifications { get; set; } = string.Empty;
    public int ExperienceYears { get; set; }
    public decimal ConsultationFee { get; set; }
    public TimeOnly ShiftStart { get; set; }
    public TimeOnly ShiftEnd { get; set; }
    public string? AssistantName { get; set; }
    public string? AssistantPhone { get; set; }
}

public class AdminDashboardDto
{
    public int TotalDoctors { get; set; }
    public int TotalPatients { get; set; }
    public int TodayAppointments { get; set; }
    public decimal DailyRevenue { get; set; }
    public int PendingAppointments { get; set; }
    public int ConfirmedAppointments { get; set; }
    public int CompletedAppointments { get; set; }
    public int CancelledAppointments { get; set; }
    public int MissedAppointments { get; set; }
    public int MonthlyTrends { get; set; }
    public List<int> WeeklyCompletedTrends { get; set; } = new List<int>();
    public List<DepartmentWorkloadDto> DepartmentWorkload { get; set; } = new List<DepartmentWorkloadDto>();
    public List<RecentActivityDto> RecentActivities { get; set; } = new List<RecentActivityDto>();
}

public class DepartmentWorkloadDto
{
    public string DepartmentName { get; set; } = string.Empty;
    public int AppointmentCount { get; set; }
}

public class RecentActivityDto
{
    public string Time { get; set; } = string.Empty;
    public string User { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string Module { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}

public class AdminPatientsDto
{
    public int TotalPatients { get; set; }
    public List<AdminPatientDataDto> Details { get; set; } = new List<AdminPatientDataDto>();
}

public class AdminPatientDataDto
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public DateTime RegistrationDate { get; set; }
    public string PhoneNumber { get; set; } = string.Empty;
    public int VisitCount { get; set; }
}

public class AdminLogsDto
{
    public int SessionId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string IP { get; set; } = string.Empty;
    public string UserAgent { get; set; } = string.Empty;
    public DateTime LoginTime { get; set; }
    public bool IsActive { get; set; }
}

public class DoctorShiftUpdateDto
{
    [Required]
    public TimeOnly ShiftStart { get; set; }

    [Required]
    public TimeOnly ShiftEnd { get; set; }

    public bool IsAvailable { get; set; }
}

public class DoctorScheduleResponseDto
{
    public int DoctorId { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public TimeOnly ShiftStart { get; set; }
    public TimeOnly ShiftEnd { get; set; }
    public bool IsAvailable { get; set; }
    public int BookedSlotsCount { get; set; }
}