using backend.DTOs;

namespace backend.Interfaces;

public interface IPaymentService
{
    Task<PaymentReceiptDto> CollectPayment(int userId, CollectPaymentDto dto);
    Task<PaymentReceiptDto?> GetPaymentReceiptByAppointmentId(int appointmentId);
    Task<AssistantDailyFinanceSummaryDto> GetAssistantDailyFinanceSummary(int userId, DateOnly? date);
    Task<SettlementReportResponseDto> SubmitDailySettlement(int userId, SubmitDailySettlementDto dto);
    Task<List<SettlementReportResponseDto>> GetAssistantSettlementHistory(int userId);
    Task<List<SettlementReportResponseDto>> GetAdminSettlementReports(DateOnly? date, string? status, int? assistantId);
    Task<SettlementReportResponseDto> GetSettlementReportById(int reportId);
    Task<SettlementReportResponseDto> VerifySettlementReport(int adminUserId, int reportId, VerifySettlementDto dto);

    Task<List<SettlementReportResponseDto>> GetCashierPendingHandovers(DateOnly? date);
    Task<SettlementReportResponseDto> CashierVerifyAssistantHandover(int cashierUserId, int reportId, CashierVerifyHandoverDto dto);
    Task<CashierDailySummaryDto> GetCashierDailySummary(int cashierUserId, DateOnly? date);
    Task<CashierBankDepositResponseDto> SubmitBankDeposit(int cashierUserId, SubmitBankDepositDto dto);
    Task<List<CashierBankDepositResponseDto>> GetBankDeposits(DateOnly? date);
    Task<CashierBankDepositResponseDto> GetBankDepositById(int depositId);
    Task<CashierBankDepositResponseDto> AdminVerifyBankDeposit(int adminUserId, int depositId, AdminVerifyBankDepositDto dto);

    Task<List<CashierUserDto>> GetCashiers();
    Task<CashierUserDto> CreateCashier(RegisterCashierDto dto);
    Task<CashierUserDto> UpdateCashier(int id, UpdateCashierDto dto);
    Task<bool> DeleteCashier(int id);
}
