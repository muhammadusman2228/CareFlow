using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

public class DailySettlementReport
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string ReportNumber { get; set; } = string.Empty;

    [Required]
    public DateOnly ReportDate { get; set; }

    [Required]
    public int AssistantId { get; set; }

    [ForeignKey(nameof(AssistantId))]
    public virtual Assistant? Assistant { get; set; } = null;

    public int TotalAppointments { get; set; }

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalAmount { get; set; }

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal CashAmount { get; set; }

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal OnlineAmount { get; set; }

    [Required]
    [MaxLength(30)]
    public string Status { get; set; } = "Submitted";

    [MaxLength(500)]
    public string? AssistantNotes { get; set; }

    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

    public int? CashierId { get; set; }

    [ForeignKey(nameof(CashierId))]
    public virtual User? Cashier { get; set; } = null;

    public DateTime? CashierVerifiedAt { get; set; }

    [MaxLength(500)]
    public string? CashierNotes { get; set; }

    public int? BankDepositId { get; set; }

    [ForeignKey(nameof(BankDepositId))]
    public virtual CashierBankDeposit? BankDeposit { get; set; } = null;

    public int? VerifiedByAdminId { get; set; }

    [ForeignKey(nameof(VerifiedByAdminId))]
    public virtual User? VerifiedByAdmin { get; set; } = null;

    public DateTime? VerifiedAt { get; set; }

    [MaxLength(500)]
    public string? AdminNotes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();
}
