using System.Security.Cryptography;
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
            DoctorName = payment.Appointment?.Doctor?.User?.Name ?? "Attending Doctor",
            DepartmentName = payment.Appointment?.Doctor?.Department?.Name ?? "Clinical Unit",
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
                throw new InvalidOperationException("No assistant profile found.");
            }
        }

        var reportDate = date ?? GetPktToday();
        var startUtc = reportDate.ToDateTime(TimeOnly.MinValue).AddHours(-5);
        var endUtc = reportDate.ToDateTime(TimeOnly.MaxValue).AddHours(-5);

        var doctorId = assistant.DoctorId;
        var assistantDepts = await _context.AssistantDepartments
            .Where(ad => ad.AssistantId == assistant.Id)
            .Select(ad => ad.DepartmentId)
            .ToListAsync();

        var deptIds = new HashSet<int>(assistantDepts);
        if (assistant.DepartmentId.HasValue && assistant.DepartmentId.Value > 0)
        {
            deptIds.Add(assistant.DepartmentId.Value);
        }

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
            .Include(p => p.SettlementReport)
            .Where(p => p.CollectedByAssistantId == assistant.Id &&
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

        var settledPayments = collectedPayments.Where(p => p.SettlementReportId.HasValue).ToList();
        var unsettledPayments = collectedPayments.Where(p => !p.SettlementReportId.HasValue).ToList();

        decimal prevSettledAmount = settledPayments.Sum(p => p.Amount);
        decimal prevSettledCash = settledPayments.Where(p => p.PaymentMethod.Equals("Cash", StringComparison.OrdinalIgnoreCase)).Sum(p => p.Amount);
        decimal prevSettledOnline = prevSettledAmount - prevSettledCash;

        decimal unsettledAmount = unsettledPayments.Sum(p => p.Amount);
        decimal unsettledCash = unsettledPayments.Where(p => p.PaymentMethod.Equals("Cash", StringComparison.OrdinalIgnoreCase)).Sum(p => p.Amount);
        decimal unsettledOnline = unsettledAmount - unsettledCash;

        var existingReports = await _context.DailySettlementReports
            .Include(r => r.Cashier)
            .Include(r => r.VerifiedByAdmin)
            .Where(r => r.AssistantId == assistant.Id && r.ReportDate == reportDate)
            .OrderBy(r => r.Id)
            .ToListAsync();

        var batchesToday = existingReports.Select(r => new SettlementReportResponseDto
        {
            Id = r.Id,
            ReportNumber = r.ReportNumber,
            ReportDate = r.ReportDate,
            AssistantId = r.AssistantId,
            AssistantName = assistant.User?.Name ?? "Assistant",
            DoctorName = assistant.Doctor?.User?.Name,
            DepartmentName = assistant.Department?.Name,
            TotalAppointments = r.TotalAppointments,
            TotalAmount = r.TotalAmount,
            CashAmount = r.CashAmount,
            OnlineAmount = r.OnlineAmount,
            Status = r.Status,
            AssistantNotes = r.AssistantNotes,
            SubmittedAt = r.SubmittedAt,
            CashierId = r.CashierId,
            CashierName = r.Cashier?.Name,
            CashierVerifiedAt = r.CashierVerifiedAt,
            CashierNotes = r.CashierNotes,
            BankDepositId = r.BankDepositId,
            VerifiedByAdminId = r.VerifiedByAdminId,
            VerifiedByAdminName = r.VerifiedByAdmin?.Name,
            VerifiedAt = r.VerifiedAt,
            AdminNotes = r.AdminNotes
        }).ToList();

        int nextBatchNumber = existingReports.Count + 1;
        var latestReport = existingReports.LastOrDefault();
        bool isReportSubmitted = unsettledPayments.Count == 0 && existingReports.Count > 0;

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
            AssistantName = p.CollectedByAssistant?.User?.Name ?? assistant.User?.Name ?? "Clinical Desk",
            PaidAt = p.PaidAt,
            Notes = p.Notes,
            SettlementReportId = p.SettlementReportId,
            SettlementReportNumber = p.SettlementReport?.ReportNumber,
            IsSettled = p.SettlementReportId.HasValue
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
            PreviouslySettledAmount = prevSettledAmount,
            PreviouslySettledCash = prevSettledCash,
            PreviouslySettledOnline = prevSettledOnline,
            SettledBatchesCount = existingReports.Count,
            UnsettledAmount = unsettledAmount,
            UnsettledCash = unsettledCash,
            UnsettledOnline = unsettledOnline,
            UnsettledAppointmentsCount = unsettledPayments.Count,
            NextBatchNumber = nextBatchNumber,
            IsReportSubmitted = isReportSubmitted,
            ReportStatus = latestReport?.Status,
            ReportNumber = latestReport?.ReportNumber,
            SubmittedAt = latestReport?.SubmittedAt,
            Transactions = transactions,
            BatchesToday = batchesToday
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
        var startUtc = reportDate.ToDateTime(TimeOnly.MinValue).AddHours(-5);
        var endUtc = reportDate.ToDateTime(TimeOnly.MaxValue).AddHours(-5);

        var doctorId = assistant.DoctorId;
        var assistantDepts = await _context.AssistantDepartments
            .Where(ad => ad.AssistantId == assistant.Id)
            .Select(ad => ad.DepartmentId)
            .ToListAsync();

        var deptIds = new HashSet<int>(assistantDepts);
        if (assistant.DepartmentId.HasValue && assistant.DepartmentId.Value > 0)
        {
            deptIds.Add(assistant.DepartmentId.Value);
        }

        var unsettledPayments = await _context.Payments
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
            .Where(p => p.CollectedByAssistantId == assistant.Id &&
                       ((p.PaidAt >= startUtc && p.PaidAt <= endUtc) || (p.Appointment != null && p.Appointment.AppointmentDate == reportDate)) &&
                       p.Status == "Paid" &&
                       p.SettlementReportId == null)
            .OrderBy(p => p.PaidAt)
            .ToListAsync();

        if (unsettledPayments.Count == 0)
        {
            throw new InvalidOperationException("No unsettled collections currently in your drawer to submit.");
        }

        var existingReportsCount = await _context.DailySettlementReports
            .CountAsync(r => r.AssistantId == assistant.Id && r.ReportDate == reportDate);

        var batchNumber = existingReportsCount + 1;
        var reportNumber = $"CF-SETTLE-{reportDate:yyyyMMdd}-AST{assistant.Id:D2}-{batchNumber:D2}";
        while (await _context.DailySettlementReports.AnyAsync(r => r.ReportNumber == reportNumber))
        {
            batchNumber++;
            reportNumber = $"CF-SETTLE-{reportDate:yyyyMMdd}-AST{assistant.Id:D2}-{batchNumber:D2}";
        }

        decimal totalAmount = unsettledPayments.Sum(p => p.Amount);
        decimal cashAmount = unsettledPayments.Where(p => p.PaymentMethod.Equals("Cash", StringComparison.OrdinalIgnoreCase)).Sum(p => p.Amount);
        decimal onlineAmount = totalAmount - cashAmount;

        var newReport = new DailySettlementReport
        {
            ReportNumber = reportNumber,
            ReportDate = reportDate,
            AssistantId = assistant.Id,
            TotalAppointments = unsettledPayments.Count,
            TotalAmount = totalAmount,
            CashAmount = cashAmount,
            OnlineAmount = onlineAmount,
            Status = "Submitted",
            AssistantNotes = dto.Notes?.Trim(),
            SubmittedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };

        await _context.DailySettlementReports.AddAsync(newReport);
        await _context.SaveChangesAsync();

        foreach (var p in unsettledPayments)
        {
            p.SettlementReportId = newReport.Id;
        }

        await _context.SaveChangesAsync();

        return await GetSettlementReportById(newReport.Id);
    }

    public async Task<List<SettlementReportResponseDto>> GetAssistantSettlementHistory(int userId)
    {
        var assistant = await _context.Assistants.FirstOrDefaultAsync(a => a.UserId == userId);
        if (assistant == null)
        {
            assistant = await _context.Assistants.FirstOrDefaultAsync();
            if (assistant == null)
            {
                return new List<SettlementReportResponseDto>();
            }
        }

        return await _context.DailySettlementReports
            .Include(r => r.Assistant)
                .ThenInclude(a => a!.User)
            .Include(r => r.Assistant)
                .ThenInclude(a => a!.Doctor)
                    .ThenInclude(d => d!.User)
            .Include(r => r.Assistant)
                .ThenInclude(a => a!.Department)
            .Include(r => r.Cashier)
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
                CashierId = r.CashierId,
                CashierName = r.Cashier != null ? r.Cashier.Name : null,
                CashierVerifiedAt = r.CashierVerifiedAt,
                CashierNotes = r.CashierNotes,
                BankDepositId = r.BankDepositId,
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
            .Include(r => r.Cashier)
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
                .Where(p => p.SettlementReportId == r.Id && p.Status == "Paid")
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
                    Notes = p.Notes,
                    SettlementReportId = p.SettlementReportId,
                    SettlementReportNumber = r.ReportNumber,
                    IsSettled = true
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
                CashierId = r.CashierId,
                CashierName = r.Cashier?.Name,
                CashierVerifiedAt = r.CashierVerifiedAt,
                CashierNotes = r.CashierNotes,
                BankDepositId = r.BankDepositId,
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
            .Include(r => r.Cashier)
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
            .Where(p => p.SettlementReportId == report.Id && p.Status == "Paid")
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
                Notes = p.Notes,
                SettlementReportId = p.SettlementReportId,
                SettlementReportNumber = report.ReportNumber,
                IsSettled = true
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
            CashierId = report.CashierId,
            CashierName = report.Cashier?.Name,
            CashierVerifiedAt = report.CashierVerifiedAt,
            CashierNotes = report.CashierNotes,
            BankDepositId = report.BankDepositId,
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

    public async Task<List<SettlementReportResponseDto>> GetCashierPendingHandovers(DateOnly? date)
    {
        return await GetAdminSettlementReports(date, null, null);
    }

    public async Task<SettlementReportResponseDto> CashierVerifyAssistantHandover(int cashierUserId, int reportId, CashierVerifyHandoverDto dto)
    {
        var report = await _context.DailySettlementReports
            .Include(r => r.Assistant)
                .ThenInclude(a => a!.User)
            .FirstOrDefaultAsync(r => r.Id == reportId);

        if (report == null)
        {
            throw new KeyNotFoundException("Daily settlement report not found.");
        }

        if (report.BankDepositId.HasValue && report.BankDepositId.Value > 0)
        {
            throw new InvalidOperationException("This handover has already been bundled into an executive bank deposit and cannot be altered.");
        }

        var status = dto.Status.Equals("Rejected", StringComparison.OrdinalIgnoreCase) ? "Rejected" : "CashierVerified";
        report.Status = status;
        report.CashierId = cashierUserId;
        report.CashierVerifiedAt = DateTime.UtcNow;
        report.CashierNotes = dto.CashierNotes?.Trim();

        await _context.SaveChangesAsync();

        return await GetSettlementReportById(report.Id);
    }

    public async Task<CashierDailySummaryDto> GetCashierDailySummary(int cashierUserId, DateOnly? date)
    {
        var targetDate = date ?? GetPktToday();
        var handovers = await GetAdminSettlementReports(targetDate, null, null);

        var depositsForDate = await _context.CashierBankDeposits
            .Where(b => b.DepositDate == targetDate)
            .ToListAsync();

        decimal totalDeposited = depositsForDate.Sum(b => b.TotalCashDeposited);

        var unbankedVerifiedHandovers = handovers
            .Where(h => (h.Status == "CashierVerified") && (!h.BankDepositId.HasValue || h.BankDepositId.Value == 0))
            .ToList();

        var pendingHandovers = handovers.Where(h => h.Status == "Submitted").ToList();

        decimal cashInHand = unbankedVerifiedHandovers.Sum(h => h.CashAmount);
        decimal onlineInflow = handovers.Sum(h => h.OnlineAmount);
        decimal grandTotal = handovers.Sum(h => h.TotalAmount);

        var existingDeposit = depositsForDate
            .OrderByDescending(b => b.DepositedAt)
            .FirstOrDefault();

        bool isFullyBankDeposited = depositsForDate.Count > 0 && cashInHand <= 0 && pendingHandovers.Count == 0;

        return new CashierDailySummaryDto
        {
            Date = targetDate,
            TotalHandovers = handovers.Count,
            VerifiedHandoversCount = unbankedVerifiedHandovers.Count,
            PendingHandoversCount = pendingHandovers.Count,
            TotalCashInHand = cashInHand,
            TotalOnlineInflow = onlineInflow,
            GrandTotal = grandTotal,
            TotalDepositedInBank = totalDeposited,
            IsBankDeposited = isFullyBankDeposited,
            BankDepositReference = existingDeposit?.DepositReference,
            BankDepositStatus = existingDeposit?.Status,
            Handovers = handovers
        };
    }

    public async Task<CashierBankDepositResponseDto> SubmitBankDeposit(int cashierUserId, SubmitBankDepositDto dto)
    {
        var depositDate = dto.DepositDate ?? GetPktToday();

        var eligibleHandovers = await _context.DailySettlementReports
            .Where(r => r.ReportDate == depositDate && 
                       (r.Status == "CashierVerified" || r.Status == "Submitted") &&
                       r.BankDepositId == null)
            .ToListAsync();

        if (eligibleHandovers.Count == 0)
        {
            throw new InvalidOperationException("No verified assistant handovers available to deposit for this date. Please verify OPD assistant envelopes first.");
        }

        decimal totalCash = eligibleHandovers.Sum(h => h.CashAmount);
        decimal totalOnline = eligibleHandovers.Sum(h => h.OnlineAmount);
        decimal grandTotal = totalCash + totalOnline;

        var count = await _context.CashierBankDeposits.CountAsync(b => b.DepositDate == depositDate);
        var depositReference = $"CF-BNK-{depositDate:yyyyMMdd}-{count + 1:D2}";

        var bankDeposit = new CashierBankDeposit
        {
            DepositReference = depositReference,
            DepositDate = depositDate,
            CashierId = cashierUserId,
            BankName = string.IsNullOrWhiteSpace(dto.BankName) ? "Meezan Bank" : dto.BankName.Trim(),
            BankAccountNumber = dto.BankAccountNumber?.Trim() ?? string.Empty,
            BankDepositSlipNumber = dto.BankDepositSlipNumber.Trim(),
            DepositedAt = dto.DepositedAt ?? DateTime.UtcNow,
            TotalHandoversIncluded = eligibleHandovers.Count,
            TotalCashDeposited = totalCash,
            TotalOnlineAmount = totalOnline,
            GrandTotal = grandTotal,
            Status = "SubmittedToAdmin",
            CashierNotes = dto.CashierNotes?.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        await _context.CashierBankDeposits.AddAsync(bankDeposit);
        await _context.SaveChangesAsync();

        foreach (var h in eligibleHandovers)
        {
            h.BankDepositId = bankDeposit.Id;
            h.Status = "CashierVerified";
            h.CashierId = cashierUserId;
            h.CashierVerifiedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        return await GetBankDepositById(bankDeposit.Id);
    }

    public async Task<List<CashierBankDepositResponseDto>> GetBankDeposits(DateOnly? date)
    {
        var query = _context.CashierBankDeposits
            .Include(b => b.Cashier)
            .Include(b => b.VerifiedByAdmin)
            .Include(b => b.HandoverReports)
                .ThenInclude(h => h.Assistant)
                    .ThenInclude(a => a!.User)
            .Include(b => b.HandoverReports)
                .ThenInclude(h => h.Assistant)
                    .ThenInclude(a => a!.Department)
            .AsQueryable();

        if (date.HasValue)
        {
            query = query.Where(b => b.DepositDate == date.Value);
        }

        var list = await query
            .OrderByDescending(b => b.DepositDate)
            .ThenByDescending(b => b.DepositedAt)
            .ToListAsync();

        return list.Select(b => MapBankDepositToDto(b)).ToList();
    }

    public async Task<CashierBankDepositResponseDto> GetBankDepositById(int depositId)
    {
        var deposit = await _context.CashierBankDeposits
            .Include(b => b.Cashier)
            .Include(b => b.VerifiedByAdmin)
            .Include(b => b.HandoverReports)
                .ThenInclude(h => h.Assistant)
                    .ThenInclude(a => a!.User)
            .Include(b => b.HandoverReports)
                .ThenInclude(h => h.Assistant)
                    .ThenInclude(a => a!.Department)
            .FirstOrDefaultAsync(b => b.Id == depositId);

        if (deposit == null)
        {
            throw new KeyNotFoundException("Bank deposit record not found.");
        }

        return MapBankDepositToDto(deposit);
    }

    public async Task<CashierBankDepositResponseDto> AdminVerifyBankDeposit(int adminUserId, int depositId, AdminVerifyBankDepositDto dto)
    {
        var deposit = await _context.CashierBankDeposits
            .Include(b => b.HandoverReports)
            .FirstOrDefaultAsync(b => b.Id == depositId);

        if (deposit == null)
        {
            throw new KeyNotFoundException("Bank deposit record not found.");
        }

        var todayPkt = GetPktToday();
        if (deposit.Status == "AdminApproved" && deposit.DepositDate < todayPkt)
        {
            throw new InvalidOperationException("Past approved bank deposits are sealed and locked for fiscal audit compliance.");
        }

        var status = dto.Status.Equals("Rejected", StringComparison.OrdinalIgnoreCase) ? "Rejected" : "AdminApproved";
        deposit.Status = status;
        deposit.VerifiedByAdminId = adminUserId;
        deposit.AdminVerifiedAt = DateTime.UtcNow;
        deposit.AdminNotes = dto.AdminNotes?.Trim();

        foreach (var h in deposit.HandoverReports)
        {
            h.Status = status == "AdminApproved" ? "Verified" : "Rejected";
            h.VerifiedByAdminId = adminUserId;
            h.VerifiedAt = DateTime.UtcNow;
            h.AdminNotes = dto.AdminNotes?.Trim();
        }

        await _context.SaveChangesAsync();

        return await GetBankDepositById(deposit.Id);
    }

    private static CashierBankDepositResponseDto MapBankDepositToDto(CashierBankDeposit b)
    {
        return new CashierBankDepositResponseDto
        {
            Id = b.Id,
            DepositReference = b.DepositReference,
            DepositDate = b.DepositDate,
            CashierId = b.CashierId,
            CashierName = b.Cashier?.Name ?? "Main Cashier",
            BankName = b.BankName,
            BankAccountNumber = b.BankAccountNumber,
            BankDepositSlipNumber = b.BankDepositSlipNumber,
            DepositedAt = b.DepositedAt,
            TotalHandoversIncluded = b.TotalHandoversIncluded,
            TotalCashDeposited = b.TotalCashDeposited,
            TotalOnlineAmount = b.TotalOnlineAmount,
            GrandTotal = b.GrandTotal,
            Status = b.Status,
            CashierNotes = b.CashierNotes,
            VerifiedByAdminId = b.VerifiedByAdminId,
            VerifiedByAdminName = b.VerifiedByAdmin?.Name,
            AdminVerifiedAt = b.AdminVerifiedAt,
            AdminNotes = b.AdminNotes,
            CreatedAt = b.CreatedAt,
            HandoverReports = b.HandoverReports.Select(h => new SettlementReportResponseDto
            {
                Id = h.Id,
                ReportNumber = h.ReportNumber,
                ReportDate = h.ReportDate,
                AssistantId = h.AssistantId,
                AssistantName = h.Assistant?.User?.Name ?? "Assistant",
                DepartmentName = h.Assistant?.Department?.Name,
                TotalAppointments = h.TotalAppointments,
                TotalAmount = h.TotalAmount,
                CashAmount = h.CashAmount,
                OnlineAmount = h.OnlineAmount,
                Status = h.Status,
                AssistantNotes = h.AssistantNotes,
                SubmittedAt = h.SubmittedAt,
                CashierId = h.CashierId,
                CashierVerifiedAt = h.CashierVerifiedAt,
                CashierNotes = h.CashierNotes,
                BankDepositId = h.BankDepositId,
                VerifiedByAdminId = h.VerifiedByAdminId,
                VerifiedByAdminName = h.VerifiedByAdmin?.Name,
                VerifiedAt = h.VerifiedAt,
                AdminNotes = h.AdminNotes
            }).ToList()
        };
    }

    public async Task<List<CashierUserDto>> GetCashiers()
    {
        var cashiers = await _context.Users
            .Where(u => u.Role == "Cashier")
            .OrderByDescending(u => u.CreatedAt)
            .ToListAsync();

        var cashierIds = cashiers.Select(c => c.Id).ToList();

        var deposits = await _context.CashierBankDeposits
            .Where(d => cashierIds.Contains(d.CashierId))
            .ToListAsync();

        var handovers = await _context.DailySettlementReports
            .Where(r => r.CashierId.HasValue && cashierIds.Contains(r.CashierId.Value))
            .ToListAsync();

        var today = GetPktToday();

        return cashiers.Select(c => {
            var cashierDeposits = deposits.Where(d => d.CashierId == c.Id).OrderByDescending(d => d.DepositedAt).ToList();
            var latestDeposit = cashierDeposits.FirstOrDefault();
            var todayDeposits = cashierDeposits.Where(d => d.DepositDate == today).ToList();

            return new CashierUserDto
            {
                Id = c.Id,
                Name = c.Name,
                Email = c.Email,
                IsVerified = c.IsVerified,
                CreatedAt = c.CreatedAt,
                TodayDepositsCount = todayDeposits.Count,
                TodayCashDeposited = todayDeposits.Sum(d => d.TotalCashDeposited),
                TotalDepositsCount = cashierDeposits.Count,
                TotalCashDeposited = cashierDeposits.Sum(d => d.TotalCashDeposited),
                TotalHandoversAudited = handovers.Count(r => r.CashierId == c.Id),
                LatestDepositReference = latestDeposit?.DepositReference,
                LatestBankName = latestDeposit?.BankName,
                LatestSlipNumber = latestDeposit?.BankDepositSlipNumber,
                LatestDepositDate = latestDeposit?.DepositedAt
            };
        }).ToList();
    }

    public async Task<CashierUserDto> CreateCashier(RegisterCashierDto dto)
    {
        var normalizedEmail = dto.Email.Trim().ToLowerInvariant();
        var exists = await _context.Users.AnyAsync(u => u.Email.ToLower() == normalizedEmail);
        if (exists)
        {
            throw new InvalidOperationException("A user with this email address already exists.");
        }

        var user = new User
        {
            Name = dto.Name.Trim(),
            Email = normalizedEmail,
            Password = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = "Cashier",
            IsVerified = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return new CashierUserDto
        {
            Id = user.Id,
            Name = user.Name,
            Email = user.Email,
            IsVerified = user.IsVerified,
            CreatedAt = user.CreatedAt,
            TotalDepositsCount = 0,
            TotalCashDeposited = 0,
            TotalHandoversAudited = 0
        };
    }

    public async Task<CashierUserDto> UpdateCashier(int id, UpdateCashierDto dto)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id && u.Role == "Cashier");
        if (user == null)
        {
            throw new KeyNotFoundException("Cashier user not found.");
        }

        var normalizedEmail = dto.Email.Trim().ToLowerInvariant();
        var emailTaken = await _context.Users.AnyAsync(u => u.Id != id && u.Email.ToLower() == normalizedEmail);
        if (emailTaken)
        {
            throw new InvalidOperationException("Email address is already in use by another user.");
        }

        user.Name = dto.Name.Trim();
        user.Email = normalizedEmail;
        user.IsVerified = dto.IsVerified;

        if (!string.IsNullOrWhiteSpace(dto.NewPassword))
        {
            user.Password = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword.Trim());
        }

        await _context.SaveChangesAsync();

        var depositsCount = await _context.CashierBankDeposits.CountAsync(d => d.CashierId == id);
        var cashDeposited = await _context.CashierBankDeposits.Where(d => d.CashierId == id).SumAsync(d => d.TotalCashDeposited);
        var handoversCount = await _context.DailySettlementReports.CountAsync(r => r.CashierId == id);

        return new CashierUserDto
        {
            Id = user.Id,
            Name = user.Name,
            Email = user.Email,
            IsVerified = user.IsVerified,
            CreatedAt = user.CreatedAt,
            TotalDepositsCount = depositsCount,
            TotalCashDeposited = cashDeposited,
            TotalHandoversAudited = handoversCount
        };
    }

    public async Task<bool> DeleteCashier(int id)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id && u.Role == "Cashier");
        if (user == null)
        {
            throw new KeyNotFoundException("Cashier user not found.");
        }

        var hasFinancialHistory = await _context.CashierBankDeposits.AnyAsync(d => d.CashierId == id) ||
                                  await _context.DailySettlementReports.AnyAsync(r => r.CashierId == id);

        if (hasFinancialHistory)
        {
            user.IsVerified = false;
            await _context.SaveChangesAsync();
            return false;
        }

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();
        return true;
    }
}
