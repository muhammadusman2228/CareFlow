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
}
