using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

public class PatientVitals
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int AppointmentId { get; set; }

    [ForeignKey(nameof(AppointmentId))]
    public virtual Appointment? Appointment { get; set; } = null;

    [Required]
    public int PatientId { get; set; }

    [ForeignKey(nameof(PatientId))]
    public virtual Patient? Patient { get; set; } = null;

    [Required]
    public int AssistantId { get; set; }

    [ForeignKey(nameof(AssistantId))]
    public virtual Assistant? Assistant { get; set; } = null;

    [Required]
    [MaxLength(20)]
    public string BloodPressure { get; set; } = string.Empty;

    public int HeartRate { get; set; }

    [Column(TypeName = "decimal(5,2)")]
    public decimal Temperature { get; set; }

    [Column(TypeName = "decimal(5,2)")]
    public decimal WeightKg { get; set; }

    [Column(TypeName = "decimal(5,2)")]
    public decimal? HeightCm { get; set; }

    public int SpO2 { get; set; }

    [MaxLength(50)]
    public string BloodSugar { get; set; } = string.Empty;

    [MaxLength(500)]
    public string TriageNotes { get; set; } = string.Empty;

    public DateTime RecordedAt { get; set; } = DateTime.UtcNow;
}