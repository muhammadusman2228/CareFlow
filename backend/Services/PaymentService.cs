using backend.Data;
using backend.DTOs;
using backend.Interfaces;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public class PaymentService : IPaymentService
{
    private readonly AppDbContext _context;

    public PaymentService(AppDbContext context)
    {
        _context = context;
    }

    private DateOnly GetPktToday()
    {
        return DateOnly.FromDateTime(DateTime.UtcNow.AddHours(5));
    }

    public async Task<PaymentReceiptDto> CollectPayment(int userId, CollectPaymentDto dto)
    {
        var assistant = await _context.Assistants
            .Include(a => a.User)
            .FirstOrDefaultAsync(a => a.UserId == userId);

        if (assistant == null)
        {
            throw new InvalidOperationException("Only clinical assistants are authorized to collect consultation fees.");
        }

        var appointment = await _context.Appointments
            .Include(a => a.Doctor)
                .ThenInclude(d => d!.User)
            .Include(a => a.Doctor)
                .ThenInclude(d => d!.Department)
            .Include(a => a.Patient)
                .ThenInclude(p => p!.User)
            .Include(a => a.Payment)
            .FirstOrDefaultAsync(a => a.Id == dto.AppointmentId);

        if (appointment == null)
        {
            throw new KeyNotFoundException("Appointment record was not found.");
        }

        if (appointment.Payment != null && appointment.Payment.Status == "Paid")
        {
            throw new InvalidOperationException($"Fee for this consultation has already been paid under Receipt #{appointment.Payment.ReceiptNumber}.");
        }

        decimal feeAmount = appointment.Doctor != null && appointment.Doctor.ConsultationFee > 0
            ? appointment.Doctor.ConsultationFee
            : 1500.00m;

        var method = string.IsNullOrWhiteSpace(dto.PaymentMethod) ? "Cash" : dto.PaymentMethod.Trim();
        var validMethods = new[] { "Cash", "JazzCash", "EasyPaisa", "BankTransfer", "Card" };
        if (!validMethods.Contains(method, StringComparer.OrdinalIgnoreCase))
        {
            throw new InvalidDataException("Invalid payment method. Supported methods: Cash, JazzCash, EasyPaisa, BankTransfer, Card.");
        }

        if (!method.Equals("Cash", StringComparison.OrdinalIgnoreCase) && string.IsNullOrWhiteSpace(dto.TransactionReference))
        {
            throw new InvalidDataException($"A Transaction Reference ID is required for {method} payments.");
        }

        var todayPkt = GetPktToday();
        var receiptNumber = $"CF-REC-{todayPkt:yyyyMMdd}-{appointment.Id:D4}";

        var payment = appointment.Payment;
        if (payment == null)
        {
            payment = new Payment
            {
                AppointmentId = appointment.Id,
                Amount = feeAmount,
                PaymentMethod = method,
                Status = "Paid",
                ReceiptNumber = receiptNumber,
                TransactionReference = dto.TransactionReference?.Trim(),
                CollectedByAssistantId = assistant.Id,
                PaidAt = DateTime.UtcNow,
                Notes = dto.Notes?.Trim()
            };
            await _context.Payments.AddAsync(payment);
        }
        else
        {
            payment.Amount = feeAmount;
            payment.PaymentMethod = method;
            payment.Status = "Paid";
            payment.ReceiptNumber = receiptNumber;
            payment.TransactionReference = dto.TransactionReference?.Trim();
            payment.CollectedByAssistantId = assistant.Id;
            payment.PaidAt = DateTime.UtcNow;
            payment.Notes = dto.Notes?.Trim();
        }

        await _context.SaveChangesAsync();

        return new PaymentReceiptDto
        {
            PaymentId = payment.Id,
            ReceiptNumber = payment.ReceiptNumber,
            AppointmentId = appointment.Id,
            AppointmentDate = appointment.AppointmentDate,
            TimeSlot = appointment.TimeSlot,
            PatientName = appointment.Patient?.User?.Name ?? "Patient",
            PatientPhone = appointment.Patient?.PhoneNumber ?? string.Empty,
            DoctorName = appointment.Doctor?.User?.Name ?? "Attending Doctor",
            DepartmentName = appointment.Doctor?.Department?.Name ?? "Clinical Unit",
            Amount = payment.Amount,
            PaymentMethod = payment.PaymentMethod,
            Status = payment.Status,
            TransactionReference = payment.TransactionReference,
            AssistantName = assistant.User?.Name ?? "Clinical Assistant",
            PaidAt = payment.PaidAt,
            Notes = payment.Notes
        };
    }

    public async Task<PaymentReceiptDto?> GetPaymentReceiptByAppointmentId(int appointmentId)
    {
        var payment = await _context.Payments
            .Include(p => p.Appointment)
                .ThenInclude(a => a!.Doctor)
                    .ThenInclude(d => d!.User)
            .Include(p => p.Appointment)
                .ThenInclude(a => a!.Doctor)
                    .ThenInclude(d => d!.Department)
            .Include(p => p.Appointment)
                .ThenInclude(a => a!.Patient)
                    .ThenInclude(pt => pt!.User)
            .Include(p => p.CollectedByAssistant)
                .ThenInclude(ast => ast!.User)
            .FirstOrDefaultAsync(p => p.AppointmentId == appointmentId);

        if (payment == null)
        {
            return null;
        }

        return new PaymentReceiptDto
        {
            PaymentId = payment.Id,
            ReceiptNumber = payment.ReceiptNumber,
            AppointmentId = payment.AppointmentId,
            AppointmentDate = payment.Appointment?.AppointmentDate ?? DateOnly.MinValue,
            TimeSlot = payment.Appointment?.TimeSlot ?? TimeOnly.MinValue,
            PatientName = payment.Appointment?.Patient?.User?.Name ?? "Patient",
            PatientPhone = payment.Appointment?.Patient?.PhoneNumber ?? string.Empty,
            DoctorName = payment.Appointment?.Doctor?.User?.Name ?? "Doctor",
            DepartmentName = payment.Appointment?.Doctor?.Department?.Name ?? "Department",
            Amount = payment.Amount,
            PaymentMethod = payment.PaymentMethod,
            Status = payment.Status,
            TransactionReference = payment.TransactionReference,
            AssistantName = payment.CollectedByAssistant?.User?.Name ?? "Clinical Assistant",
            PaidAt = payment.PaidAt,
            Notes = payment.Notes
        };
    }

    public async Task<AssistantDailyFinanceSummaryDto> GetAssistantDailyFinanceSummary(int userId, DateOnly? date)
    {
        var assistant = await _context.Assistants
            .Include(a => a.User)
            .Include(a => a.AssistantDepartments)
            .FirstOrDefaultAsync(a => a.UserId == userId);

        var reportDate = date ?? GetPktToday();

        if (assistant == null)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user != null && (user.Role == "Admin" || user.Role == "SuperAdmin"))
            {
                return await GetHospitalDailyFinanceSummary(reportDate);
            }

            throw new InvalidOperationException("Assistant record not found.");
        }

        var doctorId = assistant.DoctorId;
        var deptIds = assistant.AssistantDepartments.Select(ad => ad.DepartmentId).ToList();
        if (assistant.DepartmentId.HasValue && !deptIds.Contains(assistant.DepartmentId.Value))
        {
            deptIds.Add(assistant.DepartmentId.Value);
        }

        var startUtc = reportDate.ToDateTime(TimeOnly.MinValue).AddHours(-5);
        var endUtc = reportDate.ToDateTime(TimeOnly.MaxValue).AddHours(-5);

        var collectedPayments = await _context.Payments
            .Include(p => p.Appointment)
                .ThenInclude(a => a!.Doctor)
                    .ThenInclude(d => d!.User)
            .Include(p => p.Appointment)
                .ThenInclude(a => a!.Doctor)
                    .ThenInclude(d => d!.Department)
            .Include(p => p.Appointment)
                .ThenInclude(a => a!.Patient)
                    .ThenInclude(pt => pt!.User)
            .Include(p => p.CollectedByAssistant)
                .ThenInclude(ast => ast!.User)
            .Where(p => (p.CollectedByAssistantId == assistant.Id ||
                        (p.Appointment != null && ((doctorId.HasValue && p.Appointment.DoctorId == doctorId.Value) ||
                                                   (deptIds.Count > 0 && p.Appointment.Doctor != null && deptIds.Contains(p.Appointment.Doctor.DepartmentId))))) &&
                       ((p.PaidAt >= startUtc && p.PaidAt <= endUtc) || (p.Appointment != null && p.Appointment.AppointmentDate == reportDate)) &&
                       p.Status == "Paid")
            .OrderBy(p => p.PaidAt)
            .ToListAsync();

        var queueAppointmentsQuery = _context.Appointments
            .Include(a => a.Doctor)
                .ThenInclude(d => d!.DoctorDepartments)
            .Include(a => a.Payment)
            .Where(a => a.AppointmentDate == reportDate && a.Status != "Cancelled" && a.Status != "Missed");

        if (doctorId.HasValue)
        {
            queueAppointmentsQuery = queueAppointmentsQuery.Where(a =>
                a.DoctorId == doctorId.Value ||
                a.OriginalDoctorId == doctorId.Value ||
                (a.Doctor != null && (deptIds.Contains(a.Doctor.DepartmentId) || a.Doctor.DoctorDepartments.Any(dd => deptIds.Contains(dd.DepartmentId)))));
        }
        else if (deptIds.Count > 0)
        {
            queueAppointmentsQuery = queueAppointmentsQuery.Where(a =>
                a.Doctor != null && (deptIds.Contains(a.Doctor.DepartmentId) || a.Doctor.DoctorDepartments.Any(dd => deptIds.Contains(dd.DepartmentId))));
        }

        var queueAppointments = await queueAppointmentsQuery.ToListAsync();

        var pendingCount = queueAppointments.Count(a => a.Payment == null || a.Payment.Status != "Paid");

        decimal totalCollected = collectedPayments.Sum(p => p.Amount);
        decimal cashCollected = collectedPayments.Where(p => p.PaymentMethod.Equals("Cash", StringComparison.OrdinalIgnoreCase)).Sum(p => p.Amount);
        decimal onlineCollected = totalCollected - cashCollected;

        var existingReport = await _context.DailySettlementReports
            .FirstOrDefaultAsync(r => r.AssistantId == assistant.Id && r.ReportDate == reportDate);

        var transactions = collectedPayments.Select(p => new PaymentReceiptDto
        {
            PaymentId = p.Id,
            ReceiptNumber = p.ReceiptNumber,
            AppointmentId = p.AppointmentId,
            AppointmentDate = p.Appointment?.AppointmentDate ?? reportDate,
            TimeSlot = p.Appointment?.TimeSlot ?? TimeOnly.MinValue,
            PatientName = p.Appointment?.Patient?.User?.Name ?? "Patient",
            PatientPhone = p.Appointment?.Patient?.PhoneNumber ?? string.Empty,
            DoctorName = p.Appointment?.Doctor?.User?.Name ?? "Doctor",
            DepartmentName = p.Appointment?.Doctor?.Department?.Name ?? "Department",
            Amount = p.Amount,
            PaymentMethod = p.PaymentMethod,
            Status = p.Status,
            TransactionReference = p.TransactionReference,
            AssistantName = p.CollectedByAssistant?.User?.Name ?? assistant.User?.Name ?? "Assistant",
            PaidAt = p.PaidAt,
            Notes = p.Notes
        }).ToList();

        return new AssistantDailyFinanceSummaryDto
        {
            ReportDate = reportDate,
            TotalAppointmentsToday = collectedPayments.Count + pendingCount,
            PaidAppointmentsCount = collectedPayments.Count,
            PendingPaymentsCount = pendingCount,
            TotalCollected = totalCollected,
            CashCollected = cashCollected,
            OnlineCollected = onlineCollected,
            IsReportSubmitted = existingReport != null,
            ReportStatus = existingReport?.Status,
            ReportNumber = existingReport?.ReportNumber,
            SubmittedAt = existingReport?.SubmittedAt,
            Transactions = transactions
        };
    }

    private async Task<AssistantDailyFinanceSummaryDto> GetHospitalDailyFinanceSummary(DateOnly reportDate)
    {
        var startUtc = reportDate.ToDateTime(TimeOnly.MinValue).AddHours(-5);
        var endUtc = reportDate.ToDateTime(TimeOnly.MaxValue).AddHours(-5);

        var collectedPayments = await _context.Payments
            .Include(p => p.Appointment)
                .ThenInclude(a => a!.Doctor)
                    .ThenInclude(d => d!.User)
            .Include(p => p.Appointment)
                .ThenInclude(a => a!.Doctor)
                    .ThenInclude(d => d!.Department)
            .Include(p => p.Appointment)
                .ThenInclude(a => a!.Patient)
                    .ThenInclude(pt => pt!.User)
            .Include(p => p.CollectedByAssistant)
                .ThenInclude(ast => ast!.User)
            .Where(p => ((p.PaidAt >= startUtc && p.PaidAt <= endUtc) || (p.Appointment != null && p.Appointment.AppointmentDate == reportDate)) &&
                       p.Status == "Paid")
            .OrderBy(p => p.PaidAt)
            .ToListAsync();

        var queueAppointments = await _context.Appointments
            .Include(a => a.Payment)
            .Where(a => a.AppointmentDate == reportDate && a.Status != "Cancelled" && a.Status != "Missed")
            .ToListAsync();

        var pendingCount = queueAppointments.Count(a => a.Payment == null || a.Payment.Status != "Paid");

        decimal totalCollected = collectedPayments.Sum(p => p.Amount);
        decimal cashCollected = collectedPayments.Where(p => p.PaymentMethod.Equals("Cash", StringComparison.OrdinalIgnoreCase)).Sum(p => p.Amount);
        decimal onlineCollected = totalCollected - cashCollected;

        var existingReport = await _context.DailySettlementReports
            .FirstOrDefaultAsync(r => r.ReportDate == reportDate);

        var transactions = collectedPayments.Select(p => new PaymentReceiptDto
        {
            PaymentId = p.Id,
            ReceiptNumber = p.ReceiptNumber,
            AppointmentId = p.AppointmentId,
            AppointmentDate = p.Appointment?.AppointmentDate ?? reportDate,
            TimeSlot = p.Appointment?.TimeSlot ?? TimeOnly.MinValue,
            PatientName = p.Appointment?.Patient?.User?.Name ?? "Patient",
            PatientPhone = p.Appointment?.Patient?.PhoneNumber ?? string.Empty,
            DoctorName = p.Appointment?.Doctor?.User?.Name ?? "Doctor",
            DepartmentName = p.Appointment?.Doctor?.Department?.Name ?? "Department",
            Amount = p.Amount,
            PaymentMethod = p.PaymentMethod,
            Status = p.Status,
            TransactionReference = p.TransactionReference,
            AssistantName = p.CollectedByAssistant?.User?.Name ?? "Clinical Desk",
            PaidAt = p.PaidAt,
            Notes = p.Notes
        }).ToList();

        return new AssistantDailyFinanceSummaryDto
        {
            ReportDate = reportDate,
            TotalAppointmentsToday = collectedPayments.Count + pendingCount,
            PaidAppointmentsCount = collectedPayments.Count,
            PendingPaymentsCount = pendingCount,
            TotalCollected = totalCollected,
            CashCollected = cashCollected,
            OnlineCollected = onlineCollected,
            IsReportSubmitted = existingReport != null,
            ReportStatus = existingReport?.Status,
            ReportNumber = existingReport?.ReportNumber,
            SubmittedAt = existingReport?.SubmittedAt,
            Transactions = transactions
        };
    }

    public async Task<SettlementReportResponseDto> SubmitDailySettlement(int userId, SubmitDailySettlementDto dto)
    {
        var assistant = await _context.Assistants
            .Include(a => a.User)
            .Include(a => a.Doctor)
                .ThenInclude(d => d!.User)
            .Include(a => a.Department)
            .FirstOrDefaultAsync(a => a.UserId == userId);

        if (assistant == null)
        {
            assistant = await _context.Assistants
                .Include(a => a.User)
                .Include(a => a.Doctor)
                    .ThenInclude(d => d!.User)
                .Include(a => a.Department)
                .FirstOrDefaultAsync();

            if (assistant == null)
            {
                throw new InvalidOperationException("No assistant profile found to associate settlement report.");
            }
        }

        var reportDate = dto.ReportDate ?? GetPktToday();

        var summary = await GetAssistantDailyFinanceSummary(userId, reportDate);

        var existingReport = await _context.DailySettlementReports
            .Include(r => r.VerifiedByAdmin)
            .FirstOrDefaultAsync(r => r.AssistantId == assistant.Id && r.ReportDate == reportDate);

        if (existingReport != null && existingReport.Status == "Verified")
        {
            throw new InvalidOperationException("This daily settlement report has already been verified and closed by the Administrator.");
        }

        var reportNumber = existingReport?.ReportNumber ?? $"CF-SETTLE-{reportDate:yyyyMMdd}-AST{assistant.Id:D2}";

        if (existingReport == null)
        {
            existingReport = new DailySettlementReport
            {
                ReportNumber = reportNumber,
                ReportDate = reportDate,
                AssistantId = assistant.Id,
                TotalAppointments = summary.PaidAppointmentsCount,
                TotalAmount = summary.TotalCollected,
                CashAmount = summary.CashCollected,
                OnlineAmount = summary.OnlineCollected,
                Status = "Submitted",
                AssistantNotes = dto.Notes?.Trim(),
                SubmittedAt = DateTime.UtcNow
            };
            await _context.DailySettlementReports.AddAsync(existingReport);
        }
        else
        {
            existingReport.TotalAppointments = summary.PaidAppointmentsCount;
            existingReport.TotalAmount = summary.TotalCollected;
            existingReport.CashAmount = summary.CashCollected;
            existingReport.OnlineAmount = summary.OnlineCollected;
            existingReport.Status = "Submitted";
            existingReport.AssistantNotes = dto.Notes?.Trim();
            existingReport.SubmittedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        return new SettlementReportResponseDto
        {
            Id = existingReport.Id,
            ReportNumber = existingReport.ReportNumber,
            ReportDate = existingReport.ReportDate,
            AssistantId = assistant.Id,
            AssistantName = assistant.User?.Name ?? "Assistant",
            DoctorName = assistant.Doctor?.User?.Name,
            DepartmentName = assistant.Department?.Name,
            TotalAppointments = existingReport.TotalAppointments,
            TotalAmount = existingReport.TotalAmount,
            CashAmount = existingReport.CashAmount,
            OnlineAmount = existingReport.OnlineAmount,
            Status = existingReport.Status,
            AssistantNotes = existingReport.AssistantNotes,
            SubmittedAt = existingReport.SubmittedAt,
            Transactions = summary.Transactions
        };
    }

    public async Task<List<SettlementReportResponseDto>> GetAssistantSettlementHistory(int userId)
    {
        var assistant = await _context.Assistants.FirstOrDefaultAsync(a => a.UserId == userId);
        if (assistant == null)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user != null && (user.Role == "Admin" || user.Role == "SuperAdmin"))
            {
                return await GetAdminSettlementReports(null, null, null);
            }
            return new List<SettlementReportResponseDto>();
        }

        return await _context.DailySettlementReports
            .Include(r => r.Assistant)
                .ThenInclude(a => a!.User)
            .Include(r => r.Assistant)
                .ThenInclude(a => a!.Doctor)
                    .ThenInclude(d => d!.User)
            .Include(r => r.Assistant)
                .ThenInclude(a => a!.Department)
            .Include(r => r.VerifiedByAdmin)
            .Where(r => r.AssistantId == assistant.Id)
            .OrderByDescending(r => r.ReportDate)
            .ThenByDescending(r => r.SubmittedAt)
            .Select(r => new SettlementReportResponseDto
            {
                Id = r.Id,
                ReportNumber = r.ReportNumber,
                ReportDate = r.ReportDate,
                AssistantId = r.AssistantId,
                AssistantName = r.Assistant!.User != null ? r.Assistant.User.Name : string.Empty,
                DoctorName = r.Assistant.Doctor != null && r.Assistant.Doctor.User != null ? r.Assistant.Doctor.User.Name : null,
                DepartmentName = r.Assistant.Department != null ? r.Assistant.Department.Name : null,
                TotalAppointments = r.TotalAppointments,
                TotalAmount = r.TotalAmount,
                CashAmount = r.CashAmount,
                OnlineAmount = r.OnlineAmount,
                Status = r.Status,
                AssistantNotes = r.AssistantNotes,
                SubmittedAt = r.SubmittedAt,
                VerifiedByAdminId = r.VerifiedByAdminId,
                VerifiedByAdminName = r.VerifiedByAdmin != null ? r.VerifiedByAdmin.Name : null,
                VerifiedAt = r.VerifiedAt,
                AdminNotes = r.AdminNotes
            })
            .ToListAsync();
    }

    public async Task<List<SettlementReportResponseDto>> GetAdminSettlementReports(DateOnly? date, string? status, int? assistantId)
    {
        var query = _context.DailySettlementReports
            .Include(r => r.Assistant)
                .ThenInclude(a => a!.User)
            .Include(r => r.Assistant)
                .ThenInclude(a => a!.Doctor)
                    .ThenInclude(d => d!.User)
            .Include(r => r.Assistant)
                .ThenInclude(a => a!.Department)
            .Include(r => r.VerifiedByAdmin)
            .AsQueryable();

        if (date.HasValue)
        {
            query = query.Where(r => r.ReportDate == date.Value);
        }

        if (!string.IsNullOrWhiteSpace(status) && !status.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(r => r.Status == status);
        }

        if (assistantId.HasValue && assistantId.Value > 0)
        {
            query = query.Where(r => r.AssistantId == assistantId.Value);
        }

        var reports = await query
            .OrderByDescending(r => r.ReportDate)
            .ThenByDescending(r => r.SubmittedAt)
            .ToListAsync();

        var result = new List<SettlementReportResponseDto>();

        foreach (var r in reports)
        {
            var startUtc = r.ReportDate.ToDateTime(TimeOnly.MinValue).AddHours(-5);
            var endUtc = r.ReportDate.ToDateTime(TimeOnly.MaxValue).AddHours(-5);

            var payments = await _context.Payments
                .Include(p => p.Appointment)
                    .ThenInclude(a => a!.Doctor)
                        .ThenInclude(d => d!.User)
                .Include(p => p.Appointment)
                    .ThenInclude(a => a!.Doctor)
                        .ThenInclude(d => d!.Department)
                .Include(p => p.Appointment)
                    .ThenInclude(a => a!.Patient)
                        .ThenInclude(pt => pt!.User)
                .Where(p => (p.CollectedByAssistantId == r.AssistantId || (p.Appointment != null && r.Assistant != null && r.Assistant.DoctorId.HasValue && p.Appointment.DoctorId == r.Assistant.DoctorId.Value)) && 
                           ((p.PaidAt >= startUtc && p.PaidAt <= endUtc) || (p.Appointment != null && p.Appointment.AppointmentDate == r.ReportDate)) && 
                           p.Status == "Paid")
                .OrderBy(p => p.PaidAt)
                .Select(p => new PaymentReceiptDto
                {
                    PaymentId = p.Id,
                    ReceiptNumber = p.ReceiptNumber,
                    AppointmentId = p.AppointmentId,
                    AppointmentDate = p.Appointment != null ? p.Appointment.AppointmentDate : DateOnly.MinValue,
                    TimeSlot = p.Appointment != null ? p.Appointment.TimeSlot : TimeOnly.MinValue,
                    PatientName = p.Appointment != null && p.Appointment.Patient != null && p.Appointment.Patient.User != null ? p.Appointment.Patient.User.Name : "Patient",
                    PatientPhone = p.Appointment != null && p.Appointment.Patient != null ? p.Appointment.Patient.PhoneNumber : string.Empty,
                    DoctorName = p.Appointment != null && p.Appointment.Doctor != null && p.Appointment.Doctor.User != null ? p.Appointment.Doctor.User.Name : "Doctor",
                    DepartmentName = p.Appointment != null && p.Appointment.Doctor != null && p.Appointment.Doctor.Department != null ? p.Appointment.Doctor.Department.Name : "Department",
                    Amount = p.Amount,
                    PaymentMethod = p.PaymentMethod,
                    Status = p.Status,
                    TransactionReference = p.TransactionReference,
                    AssistantName = r.Assistant != null && r.Assistant.User != null ? r.Assistant.User.Name : "Assistant",
                    PaidAt = p.PaidAt,
                    Notes = p.Notes
                })
                .ToListAsync();

            result.Add(new SettlementReportResponseDto
            {
                Id = r.Id,
                ReportNumber = r.ReportNumber,
                ReportDate = r.ReportDate,
                AssistantId = r.AssistantId,
                AssistantName = r.Assistant?.User?.Name ?? string.Empty,
                DoctorName = r.Assistant?.Doctor?.User?.Name,
                DepartmentName = r.Assistant?.Department?.Name,
                TotalAppointments = r.TotalAppointments,
                TotalAmount = r.TotalAmount,
                CashAmount = r.CashAmount,
                OnlineAmount = r.OnlineAmount,
                Status = r.Status,
                AssistantNotes = r.AssistantNotes,
                SubmittedAt = r.SubmittedAt,
                VerifiedByAdminId = r.VerifiedByAdminId,
                VerifiedByAdminName = r.VerifiedByAdmin?.Name,
                VerifiedAt = r.VerifiedAt,
                AdminNotes = r.AdminNotes,
                Transactions = payments
            });
        }

        return result;
    }

    public async Task<SettlementReportResponseDto> GetSettlementReportById(int reportId)
    {
        var report = await _context.DailySettlementReports
            .Include(r => r.Assistant)
                .ThenInclude(a => a!.User)
            .Include(r => r.Assistant)
                .ThenInclude(a => a!.Doctor)
                    .ThenInclude(d => d!.User)
            .Include(r => r.Assistant)
                .ThenInclude(a => a!.Department)
            .Include(r => r.VerifiedByAdmin)
            .FirstOrDefaultAsync(r => r.Id == reportId);

        if (report == null)
        {
            throw new KeyNotFoundException("Daily settlement report not found.");
        }

        var startUtc = report.ReportDate.ToDateTime(TimeOnly.MinValue).AddHours(-5);
        var endUtc = report.ReportDate.ToDateTime(TimeOnly.MaxValue).AddHours(-5);

        var payments = await _context.Payments
            .Include(p => p.Appointment)
                .ThenInclude(a => a!.Doctor)
                    .ThenInclude(d => d!.User)
            .Include(p => p.Appointment)
                .ThenInclude(a => a!.Doctor)
                    .ThenInclude(d => d!.Department)
            .Include(p => p.Appointment)
                .ThenInclude(a => a!.Patient)
                    .ThenInclude(pt => pt!.User)
            .Where(p => (p.CollectedByAssistantId == report.AssistantId || (p.Appointment != null && report.Assistant != null && report.Assistant.DoctorId.HasValue && p.Appointment.DoctorId == report.Assistant.DoctorId.Value)) && 
                       ((p.PaidAt >= startUtc && p.PaidAt <= endUtc) || (p.Appointment != null && p.Appointment.AppointmentDate == report.ReportDate)) && 
                       p.Status == "Paid")
            .OrderBy(p => p.PaidAt)
            .Select(p => new PaymentReceiptDto
            {
                PaymentId = p.Id,
                ReceiptNumber = p.ReceiptNumber,
                AppointmentId = p.AppointmentId,
                AppointmentDate = p.Appointment != null ? p.Appointment.AppointmentDate : DateOnly.MinValue,
                TimeSlot = p.Appointment != null ? p.Appointment.TimeSlot : TimeOnly.MinValue,
                PatientName = p.Appointment != null && p.Appointment.Patient != null && p.Appointment.Patient.User != null ? p.Appointment.Patient.User.Name : "Patient",
                PatientPhone = p.Appointment != null && p.Appointment.Patient != null ? p.Appointment.Patient.PhoneNumber : string.Empty,
                DoctorName = p.Appointment != null && p.Appointment.Doctor != null && p.Appointment.Doctor.User != null ? p.Appointment.Doctor.User.Name : "Doctor",
                DepartmentName = p.Appointment != null && p.Appointment.Doctor != null && p.Appointment.Doctor.Department != null ? p.Appointment.Doctor.Department.Name : "Department",
                Amount = p.Amount,
                PaymentMethod = p.PaymentMethod,
                Status = p.Status,
                TransactionReference = p.TransactionReference,
                AssistantName = report.Assistant != null && report.Assistant.User != null ? report.Assistant.User.Name : "Assistant",
                PaidAt = p.PaidAt,
                Notes = p.Notes
            })
            .ToListAsync();

        return new SettlementReportResponseDto
        {
            Id = report.Id,
            ReportNumber = report.ReportNumber,
            ReportDate = report.ReportDate,
            AssistantId = report.AssistantId,
            AssistantName = report.Assistant?.User?.Name ?? "Assistant",
            DoctorName = report.Assistant?.Doctor?.User?.Name,
            DepartmentName = report.Assistant?.Department?.Name,
            TotalAppointments = report.TotalAppointments,
            TotalAmount = report.TotalAmount,
            CashAmount = report.CashAmount,
            OnlineAmount = report.OnlineAmount,
            Status = report.Status,
            AssistantNotes = report.AssistantNotes,
            SubmittedAt = report.SubmittedAt,
            VerifiedByAdminId = report.VerifiedByAdminId,
            VerifiedByAdminName = report.VerifiedByAdmin?.Name,
            VerifiedAt = report.VerifiedAt,
            AdminNotes = report.AdminNotes,
            Transactions = payments
        };
    }

    public async Task<SettlementReportResponseDto> VerifySettlementReport(int adminUserId, int reportId, VerifySettlementDto dto)
    {
        var report = await _context.DailySettlementReports
            .Include(r => r.Assistant)
                .ThenInclude(a => a!.User)
            .FirstOrDefaultAsync(r => r.Id == reportId);

        if (report == null)
        {
            throw new KeyNotFoundException("Daily settlement report not found.");
        }

        var todayPkt = GetPktToday();
        if (report.Status == "Verified" && report.ReportDate < todayPkt)
        {
            throw new InvalidOperationException("Past verified settlement reports are sealed and locked for audit integrity.");
        }

        var status = dto.Status.Equals("Rejected", StringComparison.OrdinalIgnoreCase) ? "Rejected" : "Verified";
        report.Status = status;
        report.VerifiedByAdminId = adminUserId;
        report.VerifiedAt = DateTime.UtcNow;
        report.AdminNotes = dto.AdminNotes?.Trim();

        await _context.SaveChangesAsync();

        return await GetSettlementReportById(report.Id);
    }
}
