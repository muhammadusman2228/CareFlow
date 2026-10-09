using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

public class Assistant
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int UserId { get; set; }

    [ForeignKey(nameof(UserId))]
    public virtual User? User { get; set; } = null;

    public int? DepartmentId { get; set; }

    [ForeignKey(nameof(DepartmentId))]
    public virtual Departments? Department { get; set; } = null;

    public int? DoctorId { get; set; }

    [ForeignKey(nameof(DoctorId))]
    public virtual Doctor? Doctor { get; set; } = null;

    [MaxLength(20)]
    public string PhoneNumber { get; set; } = string.Empty;

    [MaxLength(150)]
    public string Qualifications { get; set; } = string.Empty;

    public TimeOnly ShiftStart { get; set; } = new TimeOnly(9, 0);

    public TimeOnly ShiftEnd { get; set; } = new TimeOnly(17, 0);

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual ICollection<PatientVitals> RecordedVitals { get; set; } = new List<PatientVitals>();
}