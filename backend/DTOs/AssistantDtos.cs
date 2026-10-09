using System.ComponentModel.DataAnnotations;

namespace backend.DTOs;

public class RegisterAssistantDto
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(150)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(6)]
    public string Password { get; set; } = string.Empty;

    [MaxLength(20)]
    public string PhoneNumber { get; set; } = string.Empty;

    public int? DepartmentId { get; set; }

    public int? DoctorId { get; set; }

    [MaxLength(150)]
    public string Qualifications { get; set; } = string.Empty;

    public TimeOnly ShiftStart { get; set; } = new TimeOnly(9, 0);

    public TimeOnly ShiftEnd { get; set; } = new TimeOnly(17, 0);
}

public class ResponseAssistantDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public int? DepartmentId { get; set; }
    public string? DepartmentName { get; set; }
    public int? DoctorId { get; set; }
    public string? DoctorName { get; set; }
    public string Qualifications { get; set; } = string.Empty;
    public TimeOnly ShiftStart { get; set; }
    public TimeOnly ShiftEnd { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class UpdateAssistantDto
{
    [MaxLength(20)]
    public string PhoneNumber { get; set; } = string.Empty;

    public int? DepartmentId { get; set; }
    public int? DoctorId { get; set; }
    public string Qualifications { get; set; } = string.Empty;
    public TimeOnly ShiftStart { get; set; }
    public TimeOnly ShiftEnd { get; set; }
    public bool IsActive { get; set; }
}

public class CreateVitalsDto
{
    [Required]
    public int AppointmentId { get; set; }

    [Required]
    [MaxLength(20)]
    public string BloodPressure { get; set; } = string.Empty;

    [Range(30, 250)]
    public int HeartRate { get; set; }

    [Range(80, 115)]
    public decimal Temperature { get; set; }

    [Range(1, 350)]
    public decimal WeightKg { get; set; }

    public decimal? HeightCm { get; set; }

    [Range(50, 100)]
    public int SpO2 { get; set; }

    [MaxLength(50)]
    public string BloodSugar { get; set; } = string.Empty;

    [MaxLength(500)]
    public string TriageNotes { get; set; } = string.Empty;
}

public class ResponseVitalsDto
{
    public int Id { get; set; }
    public int AppointmentId { get; set; }
    public int PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public string AssistantName { get; set; } = string.Empty;
    public string BloodPressure { get; set; } = string.Empty;
    public int HeartRate { get; set; }
    public decimal Temperature { get; set; }
    public decimal WeightKg { get; set; }
    public decimal? HeightCm { get; set; }
    public int SpO2 { get; set; }
    public string BloodSugar { get; set; } = string.Empty;
    public string TriageNotes { get; set; } = string.Empty;
    public DateTime RecordedAt { get; set; }
}

public class AssistantQueueItemDto
{
    public int AppointmentId { get; set; }
    public int PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public int DoctorId { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public DateOnly AppointmentDate { get; set; }
    public TimeOnly TimeSlot { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool HasVitals { get; set; }
    public bool IsPast { get; set; }
    public bool CanRecordVitals { get; set; }
    public ResponseVitalsDto? Vitals { get; set; }
}

public class CreateLabOrderDto
{
    [Required]
    public int AppointmentId { get; set; }

    [Required]
    [MaxLength(150)]
    public string TestName { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string ClinicalNotes { get; set; } = string.Empty;
}

public class UpdateLabStatusDto
{
    [Required]
    public string Status { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? ResultsSummary { get; set; }
}

public class ResponseLabOrderDto
{
    public int Id { get; set; }
    public int AppointmentId { get; set; }
    public int PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public int DoctorId { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public string TestName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string ClinicalNotes { get; set; } = string.Empty;
    public string? ResultsSummary { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string AppointmentStatus { get; set; } = string.Empty;
    public bool IsAppointmentCompleted { get; set; }
}

public class AssistantBookAppointmentDto
{
    [Required]
    [MaxLength(100)]
    public string PatientName { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string PatientPhone { get; set; } = string.Empty;

    [MaxLength(150)]
    public string? PatientEmail { get; set; }

    [MaxLength(10)]
    public string? Gender { get; set; }

    public DateOnly? DateOfBirth { get; set; }

    [MaxLength(10)]
    public string? BloodGroup { get; set; }

    [Required]
    public int DoctorId { get; set; }

    [Required]
    public DateOnly AppointmentDate { get; set; }

    [Required]
    public TimeOnly TimeSlot { get; set; }

    [MaxLength(500)]
    public string Symptoms { get; set; } = string.Empty;
}

public class ResponseAssistantBookingDto
{
    public int AppointmentId { get; set; }
    public int PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public string PatientPhone { get; set; } = string.Empty;
    public int DoctorId { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public DateOnly AppointmentDate { get; set; }
    public TimeOnly TimeSlot { get; set; }
    public string Status { get; set; } = string.Empty;
    public string Symptoms { get; set; } = string.Empty;
}
