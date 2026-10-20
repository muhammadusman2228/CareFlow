using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

public class Payment
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int AppointmentId { get; set; }

    [ForeignKey(nameof(AppointmentId))]
    public virtual Appointment? Appointment { get; set; } = null;

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal Amount { get; set; }

    [Required]
    [MaxLength(30)]
    public string PaymentMethod { get; set; } = "Cash";

    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "Paid";

    [Required]
    [MaxLength(50)]
    public string ReceiptNumber { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? TransactionReference { get; set; }

    public int? CollectedByAssistantId { get; set; }

    [ForeignKey(nameof(CollectedByAssistantId))]
    public virtual Assistant? CollectedByAssistant { get; set; } = null;

    public int? SettlementReportId { get; set; }

    [ForeignKey(nameof(SettlementReportId))]
    public virtual DailySettlementReport? SettlementReport { get; set; } = null;

    public DateTime PaidAt { get; set; } = DateTime.UtcNow;

    [MaxLength(255)]
    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
