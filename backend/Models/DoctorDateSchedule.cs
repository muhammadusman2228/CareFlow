using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

public class DoctorDateSchedule
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int DoctorId { get; set; }

    [ForeignKey(nameof(DoctorId))]
    public virtual Doctor? Doctor { get; set; }

    [Required]
    public DateOnly ScheduleDate { get; set; }

    public bool IsAvailable { get; set; } = true;

    [MaxLength(50)]
    public string DailyStatus { get; set; } = "OnDuty";

    public bool IsLate { get; set; } = false;

    public int DelayMinutes { get; set; } = 0;

    [MaxLength(255)]
    public string? DelayReason { get; set; }

    public TimeOnly? ShiftStart { get; set; }

    public TimeOnly? ShiftEnd { get; set; }

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
