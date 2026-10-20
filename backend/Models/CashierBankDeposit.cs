using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

public class CashierBankDeposit
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string DepositReference { get; set; } = string.Empty;

    [Required]
    public DateOnly DepositDate { get; set; }

    [Required]
    public int CashierId { get; set; }

    [ForeignKey(nameof(CashierId))]
    public virtual User? Cashier { get; set; } = null;

    [Required]
    [MaxLength(100)]
    public string BankName { get; set; } = "Meezan Bank";

    [Required]
    [MaxLength(50)]
    public string BankAccountNumber { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string BankDepositSlipNumber { get; set; } = string.Empty;

    public DateTime DepositedAt { get; set; } = DateTime.UtcNow;

    public int TotalHandoversIncluded { get; set; }

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalCashDeposited { get; set; }

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalOnlineAmount { get; set; }

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal GrandTotal { get; set; }

    [Required]
    [MaxLength(30)]
    public string Status { get; set; } = "SubmittedToAdmin";

    [MaxLength(500)]
    public string? CashierNotes { get; set; }

    public int? VerifiedByAdminId { get; set; }

    [ForeignKey(nameof(VerifiedByAdminId))]
    public virtual User? VerifiedByAdmin { get; set; } = null;

    public DateTime? AdminVerifiedAt { get; set; }

    [MaxLength(500)]
    public string? AdminNotes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual ICollection<DailySettlementReport> HandoverReports { get; set; } = new List<DailySettlementReport>();
}
