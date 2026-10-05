using System.ComponentModel.DataAnnotations;

namespace backend.DTOs;

public class ResponseAppointmentDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Specialization { get; set; } = string.Empty;
    public bool IsAvailable { get; set; }
    public decimal ConsultationFee { get; set; }
    public bool IsSlotBooked { get; set; }
}

public class RequestBookingDto
{
    [Required]
    public int PatientId { get; set; }

    [Required]
    public int DoctorId { get; set; }

    [Required]
    public DateOnly AppointmentDate { get; set; }

    [Required]
    public TimeOnly TimeSlot { get; set; }

    [Required]
    [MaxLength(500)]
    public string Symptom { get; set; } = string.Empty;
}

public class ResponseBookingDto
{
    public int Id { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public DateOnly AppointmentDate { get; set; }
    public TimeOnly TimeSlot { get; set; }
    public string Status { get; set; } = string.Empty;
}