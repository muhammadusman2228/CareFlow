using System.ComponentModel.DataAnnotations;

namespace backend.DTOs;

public class CollectPaymentDto
{
    [Required]
    public int AppointmentId { get; set; }

    [Required]
    [MaxLength(30)]
    public string PaymentMethod { get; set; } = "Cash"; // Cash, JazzCash, EasyPaisa, BankTransfer, Card

    [MaxLength(100)]
    public string? TransactionReference { get; set; } // Required if JazzCash, EasyPaisa, BankTransfer, Card

    [MaxLength(255)]
    public string? Notes { get; set; }
}

public class PaymentReceiptDto
{
    public int PaymentId { get; set; }
    public string ReceiptNumber { get; set; } = string.Empty;
    public int AppointmentId { get; set; }
    public DateOnly AppointmentDate { get; set; }
    public TimeOnly TimeSlot { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public string PatientPhone { get; set; } = string.Empty;
    public string DoctorName { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = "Cash";
    public string Status { get; set; } = "Paid";
    public string? TransactionReference { get; set; }
    public string AssistantName { get; set; } = string.Empty;
    public DateTime PaidAt { get; set; }
    public string? Notes { get; set; }
}

public class AssistantDailyFinanceSummaryDto
{
    public DateOnly ReportDate { get; set; }
    public int TotalAppointmentsToday { get; set; }
    public int PaidAppointmentsCount { get; set; }
    public int PendingPaymentsCount { get; set; }
    public decimal TotalCollected { get; set; }
    public decimal CashCollected { get; set; }
    public decimal OnlineCollected { get; set; }
    public bool IsReportSubmitted { get; set; }
    public string? ReportStatus { get; set; }
    public string? ReportNumber { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public List<PaymentReceiptDto> Transactions { get; set; } = new List<PaymentReceiptDto>();
}

public class SubmitDailySettlementDto
{
    public DateOnly? ReportDate { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }
}

public class SettlementReportResponseDto
{
    public int Id { get; set; }
    public string ReportNumber { get; set; } = string.Empty;
    public DateOnly ReportDate { get; set; }
    public int AssistantId { get; set; }
    public string AssistantName { get; set; } = string.Empty;
    public string? DoctorName { get; set; }
    public string? DepartmentName { get; set; }
    public int TotalAppointments { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal CashAmount { get; set; }
    public decimal OnlineAmount { get; set; }
    public string Status { get; set; } = "Submitted"; // Submitted, Verified, Rejected
    public string? AssistantNotes { get; set; }
    public DateTime SubmittedAt { get; set; }
    public int? VerifiedByAdminId { get; set; }
    public string? VerifiedByAdminName { get; set; }
    public DateTime? VerifiedAt { get; set; }
    public string? AdminNotes { get; set; }
    public List<PaymentReceiptDto> Transactions { get; set; } = new List<PaymentReceiptDto>();
}

public class VerifySettlementDto
{
    [Required]
    public string Status { get; set; } = "Verified"; // Verified, Rejected

    [MaxLength(500)]
    public string? AdminNotes { get; set; }
}
