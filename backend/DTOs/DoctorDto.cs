








using System.ComponentModel.DataAnnotations;

namespace backend.DTOs;

public class DoctorAppointmentsDto
{

    public int AppointmentId { get; set; }
    public int PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public DateOnly AppointmentDate { get; set; }

    public TimeOnly TimeSlot { get; set; }

    public string Symptoms { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;
}


public class AppointmentStatusDto
{

    [Required]
    public int AppointmentId { get; set; }

    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = string.Empty;


}


public class AppointmentStatusResponseDto
{

    public int AppointmentId { get; set; }


    public string Status { get; set; } = string.Empty;
}



public class PrescriptionsDto
{
    [Required]
    public int PatientId { get; set; }

    [Required]
    public int DoctorId { get; set; }

    [Required]
    public int AppointmentId { get; set; }

    [Required]
    [MaxLength(100)]
    public string Title { get; set; } = string.Empty;

    public string Note { get; set; } = string.Empty;
}

public class PrescriptionResponseDto
{
    public string DoctorName { get; set; } = string.Empty;

    public string PatientName { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public string Note { get; set; } = string.Empty;


}


public class HistoryDto
{
    [Required]
    public int PatientId { get; set; }
}
public class HistoryResponseDto
{
    public DateOnly DateOfBirth { get; set; }
    public string Gender { get; set; } = string.Empty;
    public string BloodGroup { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string EmergencyContact { get; set; } = string.Empty;
    public List<HistoryResponseListDto> MedicalHistory { get; set; } = new List<HistoryResponseListDto>();

}

public class HistoryResponseListDto
{
    public string DoctorName { get; set; } = string.Empty;
    public DateOnly AppointmentDate { get; set; }
    public string Symptoms { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;

    public string Note { get; set; } = string.Empty;
}



public class DoctorDashBoardDto
{

    public int TodayAppointments { get; set; }
    public int PendingApprovals { get; set; }
    public int TodayCompletedCount { get; set; }
    public int TotalUniquePatients { get; set; }
}