








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

    public string? PrescriptionTitle { get; set; }

    public string? PrescriptionNote { get; set; }
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

public class DoctorDailyStatusDto
{
    [Required]
    [MaxLength(50)]
    public string DailyStatus { get; set; } = "OnDuty";

    [Range(0, 480)]
    public int DelayMinutes { get; set; } = 0;

    [MaxLength(255)]
    public string? DelayReason { get; set; }
}

public class DoctorDailyStatusResponseDto
{
    public int DoctorId { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public string DailyStatus { get; set; } = "OnDuty";
    public bool IsLateToday { get; set; }
    public int DelayMinutes { get; set; }
    public string? DelayReason { get; set; }
    public DateOnly StatusDate { get; set; }
    public bool IsAvailable { get; set; }
    public TimeOnly ShiftStart { get; set; }
    public TimeOnly ShiftEnd { get; set; }
}

public class DoctorMyScheduleDto
{
    public int DoctorId { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public List<string> DepartmentNames { get; set; } = new List<string>();
    public TimeOnly ShiftStart { get; set; }
    public TimeOnly ShiftEnd { get; set; }
    public bool IsAvailable { get; set; }
    public string DailyStatus { get; set; } = "OnDuty";
    public bool IsLateToday { get; set; }
    public int DelayMinutes { get; set; }
    public string? DelayReason { get; set; }
    public List<DoctorDailyRosterDayDto> UpcomingDays { get; set; } = new List<DoctorDailyRosterDayDto>();
}

public class DoctorDailyRosterDayDto
{
    public DateOnly Date { get; set; }
    public string DayOfWeek { get; set; } = string.Empty;
    public int TotalAppointments { get; set; }
    public int ConfirmedCount { get; set; }
    public int CompletedCount { get; set; }
    public bool IsAvailable { get; set; } = true;
    public string DailyStatus { get; set; } = "OnDuty";
    public TimeOnly ShiftStart { get; set; }
    public TimeOnly ShiftEnd { get; set; }
}