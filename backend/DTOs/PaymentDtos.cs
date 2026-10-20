using System.ComponentModel.DataAnnotations;

namespace backend.DTOs;

public class CollectPaymentDto
{
    [Required]
    public int AppointmentId { get; set; }

    [Required]
    [MaxLength(30)]
    public string PaymentMethod { get; set; } = "Cash";

    [MaxLength(100)]
    public string? TransactionReference { get; set; }

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
    public int? SettlementReportId { get; set; }
    public string? SettlementReportNumber { get; set; }
    public bool IsSettled { get; set; }
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
    public decimal PreviouslySettledAmount { get; set; }
    public decimal PreviouslySettledCash { get; set; }
    public decimal PreviouslySettledOnline { get; set; }
    public int SettledBatchesCount { get; set; }
    public decimal UnsettledAmount { get; set; }
    public decimal UnsettledCash { get; set; }
    public decimal UnsettledOnline { get; set; }
    public int UnsettledAppointmentsCount { get; set; }
    public int NextBatchNumber { get; set; } = 1;
    public bool IsReportSubmitted { get; set; }
    public string? ReportStatus { get; set; }
    public string? ReportNumber { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public List<PaymentReceiptDto> Transactions { get; set; } = new List<PaymentReceiptDto>();
    public List<SettlementReportResponseDto> BatchesToday { get; set; } = new List<SettlementReportResponseDto>();
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
    public string Status { get; set; } = "Submitted";
    public string? AssistantNotes { get; set; }
    public DateTime SubmittedAt { get; set; }
    public int? CashierId { get; set; }
    public string? CashierName { get; set; }
    public DateTime? CashierVerifiedAt { get; set; }
    public string? CashierNotes { get; set; }
    public int? BankDepositId { get; set; }
    public int? VerifiedByAdminId { get; set; }
    public string? VerifiedByAdminName { get; set; }
    public DateTime? VerifiedAt { get; set; }
    public string? AdminNotes { get; set; }
    public List<PaymentReceiptDto> Transactions { get; set; } = new List<PaymentReceiptDto>();
}

public class VerifySettlementDto
{
    [Required]
    public string Status { get; set; } = "Verified";

    [MaxLength(500)]
    public string? AdminNotes { get; set; }
}

public class CashierVerifyHandoverDto
{
    [Required]
    public string Status { get; set; } = "CashierVerified";

    [MaxLength(500)]
    public string? CashierNotes { get; set; }
}

public class SubmitBankDepositDto
{
    public DateOnly? DepositDate { get; set; }

    [Required]
    [MaxLength(100)]
    public string BankName { get; set; } = "Meezan Bank";

    [Required]
    [MaxLength(50)]
    public string BankAccountNumber { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string BankDepositSlipNumber { get; set; } = string.Empty;

    public DateTime? DepositedAt { get; set; }

    [MaxLength(500)]
    public string? CashierNotes { get; set; }
}

public class CashierDailySummaryDto
{
    public DateOnly Date { get; set; }
    public int TotalHandovers { get; set; }
    public int VerifiedHandoversCount { get; set; }
    public int PendingHandoversCount { get; set; }
    public decimal TotalCashInHand { get; set; }
    public decimal TotalOnlineInflow { get; set; }
    public decimal GrandTotal { get; set; }
    public decimal TotalDepositedInBank { get; set; }
    public bool IsBankDeposited { get; set; }
    public string? BankDepositReference { get; set; }
    public string? BankDepositStatus { get; set; }
    public List<SettlementReportResponseDto> Handovers { get; set; } = new List<SettlementReportResponseDto>();
}

public class CashierBankDepositResponseDto
{
    public int Id { get; set; }
    public string DepositReference { get; set; } = string.Empty;
    public DateOnly DepositDate { get; set; }
    public int CashierId { get; set; }
    public string CashierName { get; set; } = string.Empty;
    public string BankName { get; set; } = string.Empty;
    public string BankAccountNumber { get; set; } = string.Empty;
    public string BankDepositSlipNumber { get; set; } = string.Empty;
    public DateTime DepositedAt { get; set; }
    public int TotalHandoversIncluded { get; set; }
    public decimal TotalCashDeposited { get; set; }
    public decimal TotalOnlineAmount { get; set; }
    public decimal GrandTotal { get; set; }
    public string Status { get; set; } = "SubmittedToAdmin";
    public string? CashierNotes { get; set; }
    public int? VerifiedByAdminId { get; set; }
    public string? VerifiedByAdminName { get; set; }
    public DateTime? AdminVerifiedAt { get; set; }
    public string? AdminNotes { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<SettlementReportResponseDto> HandoverReports { get; set; } = new List<SettlementReportResponseDto>();
}

public class AdminVerifyBankDepositDto
{
    [Required]
    public string Status { get; set; } = "AdminApproved";

    [MaxLength(500)]
    public string? AdminNotes { get; set; }
}

public class CashierUserDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public bool IsVerified { get; set; }
    public DateTime CreatedAt { get; set; }
    public int TodayDepositsCount { get; set; }
    public decimal TodayCashDeposited { get; set; }
    public int TotalDepositsCount { get; set; }
    public decimal TotalCashDeposited { get; set; }
    public int TotalHandoversAudited { get; set; }
    public string? LatestDepositReference { get; set; }
    public string? LatestBankName { get; set; }
    public string? LatestSlipNumber { get; set; }
    public DateTime? LatestDepositDate { get; set; }
}

public class RegisterCashierDto
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(150)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(6)]
    public string Password { get; set; } = string.Empty;
}

public class UpdateCashierDto
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(150)]
    public string Email { get; set; } = string.Empty;

    public bool IsVerified { get; set; } = true;

    public string? NewPassword { get; set; }
}
