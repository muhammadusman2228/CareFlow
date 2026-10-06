using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

public class Doctor
{
    [Key]
    public int Id { get; set; }

      [Required]
    public int UserId { get; set; }

    [ForeignKey(nameof(UserId))]
    public virtual User? User { get; set; } = null;


    public int DepartmentId { get; set; }

    [ForeignKey(nameof(DepartmentId))]
    public virtual Departments? Department { get; set; } = null;


    [Required]
    [MaxLength(100)]
    public string Specialization { get; set; } = string.Empty;

    [Required]
    [MaxLength(150)]
    public string Qualifications { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string LicenseNumber { get; set; } = string.Empty;

    [Range(0, 60)]
    public int ExperienceYears { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal ConsultationFee { get; set; }

    public bool IsAvailable { get; set; } = true;

    public TimeOnly ShiftStart { get; set; } = new TimeOnly(9, 0);

    public TimeOnly ShiftEnd { get; set; } = new TimeOnly(17, 0);

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual ICollection<Appointment> Appointments{get;set;}=new List<Appointment>();
    public virtual ICollection<Prescriptions> Prescriptions{get;set;}=new List<Prescriptions>();
}