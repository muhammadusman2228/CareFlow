
using System.Data;
using System.Security.Authentication;
using System.Security.Cryptography;
using backend.Data;
using backend.DTOs;
using backend.Interfaces;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public class AdminExtraService : IAdminExtra
{
    private readonly AppDbContext _context;
    private readonly IEmailService _emailService;

    public AdminExtraService(AppDbContext context, IEmailService emailService)
    {
        _context = context;
        _emailService = emailService;
    }


    public async Task<AdminDashboardDto> AdminDashboard()
    {
        try
        {
            var nowPkt = DateTime.UtcNow.AddHours(5);
            var today = DateOnly.FromDateTime(nowPkt);
            var nowTimePkt = TimeOnly.FromDateTime(nowPkt);
            var oneMonthAgo = nowPkt.AddMonths(-1);

            await _context.Appointments
                .Where(a => (a.Status == "Pending" || a.Status == "Confirmed" || a.Status == "Booked") && 
                            (a.AppointmentDate < today || (a.AppointmentDate == today && a.TimeSlot < nowTimePkt)))
                .ExecuteUpdateAsync(s => s.SetProperty(a => a.Status, "Missed"));

            var totalDoctors = await _context.Doctors.CountAsync(d => d.User!.IsVerified);
            var totalPatients = await _context.Patient.CountAsync(p => p.User!.IsVerified);
            var todayAppointments = await _context.Appointments.CountAsync(a => a.AppointmentDate == today && a.Status != "Cancelled");
            var monthlyTrends = await _context.Patient.CountAsync(p => p.User!.CreatedAt >= oneMonthAgo);

            var dailyRevenue = await _context.Appointments
                .Where(a => a.AppointmentDate == today && a.Status == "Completed")
                .SumAsync(a => a.Doctor!.ConsultationFee);

            var booked = await _context.Appointments.CountAsync(a => a.Status == "Booked" || a.Status == "Confirmed" || a.Status == "Pending");
            var completed = await _context.Appointments.CountAsync(a => a.Status == "Completed");
            var cancelled = await _context.Appointments.CountAsync(a => a.Status == "Cancelled");
            var missed = await _context.Appointments.CountAsync(a => a.Status == "Missed");

            var weeklyCompleted = new List<int>();
            for (int i = 6; i >= 0; i--)
            {
                var d = today.AddDays(-i);
                var startUtc = d.ToDateTime(TimeOnly.MinValue).AddHours(-5);
                var endUtc = d.ToDateTime(TimeOnly.MaxValue).AddHours(-5);
                var presCount = await _context.Prescriptions.CountAsync(p => p.CreatedAt >= startUtc && p.CreatedAt <= endUtc);
                var otherCount = await _context.Appointments.CountAsync(a => a.AppointmentDate == d && a.Status == "Completed" && !_context.Prescriptions.Any(p => p.AppointmentId == a.Id));
                weeklyCompleted.Add(presCount + otherCount);
            }

            var departmentWorkload = await _context.Departments.AsNoTracking().Select(d => new DepartmentWorkloadDto
            {
                DepartmentName = d.Name,
                AppointmentCount = d.Doctors.SelectMany(doc => doc.Appointments.Where(a => a.AppointmentDate == today && (a.Status == "Booked" || a.Status == "Confirmed" || a.Status == "CheckedIn"))).Count()
            }).ToListAsync();

            var todayStartUtc = today.ToDateTime(TimeOnly.MinValue).AddHours(-5);
            var todayEndUtc = today.ToDateTime(TimeOnly.MaxValue).AddHours(-5);

            var apptActivities = await _context.Appointments.AsNoTracking()
                .Where(a => a.CreatedAt >= todayStartUtc && a.CreatedAt <= todayEndUtc)
                .Select(a => new
                {
                    Timestamp = a.CreatedAt,
                    Time = a.CreatedAt.AddHours(5).ToString("hh:mm tt"),
                    User = a.Patient != null && a.Patient.User != null ? a.Patient.User.Name : "Patient",
                    Action = a.Status == "CheckedIn" ? "Checked-In at Triage" : ((a.Status == "Booked" || a.Status == "Confirmed") ? "Booked Consultation" : (a.Status == "Completed" ? "Completed Consultation" : (a.Status == "Cancelled" ? "Cancelled Appointment" : (a.Status == "Missed" ? "Missed Appointment" : "Booked Appointment")))),
                    Module = a.Status == "CheckedIn" ? "Triage" : "Appointments",
                    Status = a.Status == "Missed" ? "Missed" : "Success"
                })
                .ToListAsync();

            var vitalsActivities = await _context.PatientVitals.AsNoTracking()
                .Where(v => v.RecordedAt >= todayStartUtc && v.RecordedAt <= todayEndUtc)
                .Select(v => new
                {
                    Timestamp = v.RecordedAt,
                    Time = v.RecordedAt.AddHours(5).ToString("hh:mm tt"),
                    User = v.Assistant != null && v.Assistant.User != null ? v.Assistant.User.Name : "Assistant",
                    Action = "Recorded Patient Triage Vitals",
                    Module = "Triage / Vitals",
                    Status = "Success"
                })
                .ToListAsync();

            var labActivities = await _context.Labs.AsNoTracking()
                .Where(l => l.CreatedAt >= todayStartUtc && l.CreatedAt <= todayEndUtc)
                .Select(l => new
                {
                    Timestamp = l.CreatedAt,
                    Time = l.CreatedAt.AddHours(5).ToString("hh:mm tt"),
                    User = l.Doctor != null && l.Doctor.User != null ? l.Doctor.User.Name : "Doctor",
                    Action = "Ordered Lab: " + l.TestName,
                    Module = "Laboratory",
                    Status = l.Status
                })
                .ToListAsync();

            var completedLabActivities = await _context.Labs.AsNoTracking()
                .Where(l => l.CompletedAt != null && l.CompletedAt.Value >= todayStartUtc && l.CompletedAt.Value <= todayEndUtc)
                .Select(l => new
                {
                    Timestamp = l.CompletedAt!.Value,
                    Time = l.CompletedAt!.Value.AddHours(5).ToString("hh:mm tt"),
                    User = l.Patient != null && l.Patient.User != null ? l.Patient.User.Name : "Patient",
                    Action = "Completed Lab: " + l.TestName,
                    Module = "Laboratory",
                    Status = "Completed"
                })
                .ToListAsync();

            var assistantRegActivities = await _context.Assistants.AsNoTracking()
                .Where(ast => ast.CreatedAt >= todayStartUtc && ast.CreatedAt <= todayEndUtc)
                .Select(ast => new
                {
                    Timestamp = ast.CreatedAt,
                    Time = ast.CreatedAt.AddHours(5).ToString("hh:mm tt"),
                    User = ast.User != null ? ast.User.Name : "Assistant",
                    Action = "Assistant Registered",
                    Module = "Staff",
                    Status = "Active"
                })
                .ToListAsync();

            var recentActivities = apptActivities
                .Concat(vitalsActivities)
                .Concat(labActivities)
                .Concat(completedLabActivities)
                .Concat(assistantRegActivities)
                .OrderByDescending(x => x.Timestamp)
                .Take(25)
                .Select(x => new RecentActivityDto
                {
                    Time = x.Time,
                    User = x.User,
                    Action = x.Action,
                    Module = x.Module,
                    Status = x.Status
                })
                .ToList();

            return new AdminDashboardDto
            {
                TotalDoctors = totalDoctors,
                TotalPatients = totalPatients,
                TodayAppointments = todayAppointments,
                DailyRevenue = dailyRevenue,
                PendingAppointments = booked,
                ConfirmedAppointments = booked,
                CompletedAppointments = completed,
                CancelledAppointments = cancelled,
                MissedAppointments = missed,
                MonthlyTrends = monthlyTrends,
                WeeklyCompletedTrends = weeklyCompleted,
                DepartmentWorkload = departmentWorkload,
                RecentActivities = recentActivities
            };
        }
        catch (Exception)
        {
            throw new Exception("Try again later");
        }
    }

    public async Task<AdminPatientsDto> AdminPatient()
    {
        try
        {
            var patients = await _context.Patient.AsNoTracking().Where(p => p.User!.IsVerified).Select(p =>
            new AdminPatientDataDto
            {
                Name = p.User!.Name,
                Email = p.User!.Email,
                RegistrationDate = p.CreatedAt,
                PhoneNumber = p.PhoneNumber,
                VisitCount = p.Appointments.Count(a => a.Status == "Completed")
            }).ToListAsync();

            return new AdminPatientsDto
            {
                TotalPatients = patients.Count,
                Details = patients
            };
        }
        catch (Exception)
        {
            throw new Exception("Try again later");
        }
    }

    public async Task<List<AdminLogsDto>> AdminLogs()
    {
        try
        {
            var sessions = await _context.Session.AsNoTracking().OrderByDescending(u => u.CreatedAt).Take(100).Select(u =>
            new AdminLogsDto
            {
                SessionId = u.Id,
                UserName = u.User!.Name,
                UserEmail = u.User!.Email,
                Role = u.User!.Role,
                IP = u.IP,
                UserAgent = u.UserAgent,
                LoginTime = u.CreatedAt,
                IsActive = !u.IsRevoked && u.ExpiresAt > DateTime.UtcNow
            }).ToListAsync();

            return sessions;
        }
        catch (Exception)
        {
            throw new Exception("Try again later");
        }
    }

    public async Task<List<DoctorScheduleResponseDto>> GetDoctorSchedules(DateOnly date)
    {
        try
        {
            var todayPkt = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(5));
            var dateSchedules = await _context.DoctorDateSchedules
                .AsNoTracking()
                .Where(s => s.ScheduleDate == date)
                .ToDictionaryAsync(s => s.DoctorId);

            var doctors = await _context.Doctors.AsNoTracking()
                .Select(d => new
                {
                    d.Id,
                    DoctorName = d.User != null ? d.User.Name : string.Empty,
                    DepartmentName = d.Department != null ? d.Department.Name : string.Empty,
                    d.ShiftStart,
                    d.ShiftEnd,
                    d.IsAvailable,
                    d.DailyStatus,
                    d.DailyStatusDate,
                    BookedSlotsCount = d.Appointments.Count(a => a.AppointmentDate == date && a.Status != "Cancelled"),
                    CompletedSlotsCount = d.Appointments.Count(a => a.AppointmentDate == date && a.Status == "Completed")
                })
                .ToListAsync();

            var roster = doctors.Select(d =>
            {
                bool isAvail;
                if (dateSchedules.TryGetValue(d.Id, out var dateSchedule))
                {
                    isAvail = dateSchedule.IsAvailable;
                }
                else if (date == todayPkt && d.DailyStatusDate == todayPkt)
                {
                    isAvail = d.DailyStatus != "OffDuty" && d.IsAvailable;
                }
                else
                {
                    isAvail = d.IsAvailable;
                }

                return new DoctorScheduleResponseDto
                {
                    DoctorId = d.Id,
                    DoctorName = d.DoctorName,
                    DepartmentName = d.DepartmentName,
                    ShiftStart = d.ShiftStart,
                    ShiftEnd = d.ShiftEnd,
                    IsAvailable = isAvail,
                    BookedSlotsCount = d.BookedSlotsCount,
                    CompletedSlotsCount = d.CompletedSlotsCount
                };
            }).ToList();

            return roster;
        }
        catch (Exception)
        {
            throw new Exception("Try again later");
        }
    }

    public async Task<string> UpdateDoctorShift(int doctorId, DoctorShiftUpdateDto dto, DateOnly? date = null)
    {
        try
        {
            var doctor = await _context.Doctors.FirstOrDefaultAsync(d => d.Id == doctorId);
            if (doctor == null)
            {
                throw new KeyNotFoundException("Doctor does not exist");
            }

            var todayPkt = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(5));
            var targetDate = date ?? todayPkt;

            doctor.ShiftStart = dto.ShiftStart;
            doctor.ShiftEnd = dto.ShiftEnd;

            var existingSchedule = await _context.DoctorDateSchedules
                .FirstOrDefaultAsync(s => s.DoctorId == doctorId && s.ScheduleDate == targetDate);

            bool currentIsAvailable;
            if (existingSchedule != null)
            {
                currentIsAvailable = existingSchedule.IsAvailable;
            }
            else if (targetDate == todayPkt && doctor.DailyStatusDate == todayPkt)
            {
                currentIsAvailable = doctor.DailyStatus != "OffDuty" && doctor.IsAvailable;
            }
            else
            {
                currentIsAvailable = doctor.IsAvailable;
            }

            if (currentIsAvailable && !dto.IsAvailable)
            {
                var activeBookings = await _context.Appointments.CountAsync(a =>
                    a.DoctorId == doctorId &&
                    a.AppointmentDate == targetDate &&
                    a.Status != "Cancelled" &&
                    a.Status != "Completed");

                if (activeBookings > 0)
                {
                    throw new InvalidOperationException($"Cannot set doctor Off Duty on {targetDate:yyyy-MM-dd}. Doctor has {activeBookings} active appointment(s) that must be diverted first.");
                }
            }

            if (existingSchedule != null)
            {
                existingSchedule.IsAvailable = dto.IsAvailable;
                existingSchedule.DailyStatus = dto.IsAvailable ? "OnDuty" : "OffDuty";
                if (!dto.IsAvailable)
                {
                    existingSchedule.IsLate = false;
                    existingSchedule.DelayMinutes = 0;
                    existingSchedule.DelayReason = "Turned off by administration";
                }
                else
                {
                    existingSchedule.IsLate = false;
                    existingSchedule.DelayMinutes = 0;
                    existingSchedule.DelayReason = null;
                }
                existingSchedule.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                existingSchedule = new DoctorDateSchedule
                {
                    DoctorId = doctorId,
                    ScheduleDate = targetDate,
                    IsAvailable = dto.IsAvailable,
                    DailyStatus = dto.IsAvailable ? "OnDuty" : "OffDuty",
                    IsLate = false,
                    DelayMinutes = 0,
                    DelayReason = dto.IsAvailable ? null : "Turned off by administration",
                    UpdatedAt = DateTime.UtcNow
                };
                _context.DoctorDateSchedules.Add(existingSchedule);
            }

            if (targetDate == todayPkt)
            {
                doctor.DailyStatusDate = todayPkt;
                doctor.DailyStatus = dto.IsAvailable ? "OnDuty" : "OffDuty";
                if (!dto.IsAvailable)
                {
                    doctor.IsLateToday = false;
                    doctor.DelayMinutes = 0;
                    doctor.DelayReason = "Turned off by administration";
                }
                else
                {
                    doctor.IsLateToday = false;
                    doctor.DelayMinutes = 0;
                    doctor.DelayReason = null;
                }
            }

            await _context.SaveChangesAsync();
            return "Doctor shift updated successfully";
        }
        catch (KeyNotFoundException)
        {
            throw;
        }
        catch (InvalidOperationException)
        {
            throw;
        }
        catch (Exception)
        {
            throw new Exception("Try again later");
        }
    }

    public async Task<bool> ToggleDoctorAvailability(int doctorId, DateOnly? date = null)
    {
        try
        {
            var doctor = await _context.Doctors.FirstOrDefaultAsync(d => d.Id == doctorId);
            if (doctor == null)
            {
                throw new KeyNotFoundException("Doctor does not exist");
            }

            var todayPkt = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(5));
            var targetDate = date ?? todayPkt;

            var existingSchedule = await _context.DoctorDateSchedules
                .FirstOrDefaultAsync(s => s.DoctorId == doctorId && s.ScheduleDate == targetDate);

            bool currentIsAvailable;
            if (existingSchedule != null)
            {
                currentIsAvailable = existingSchedule.IsAvailable;
            }
            else if (targetDate == todayPkt && doctor.DailyStatusDate == todayPkt)
            {
                currentIsAvailable = doctor.DailyStatus != "OffDuty" && doctor.IsAvailable;
            }
            else
            {
                currentIsAvailable = doctor.IsAvailable;
            }

            if (currentIsAvailable)
            {
                var activeBookings = await _context.Appointments.CountAsync(a =>
                    a.DoctorId == doctorId &&
                    a.AppointmentDate == targetDate &&
                    a.Status != "Cancelled" &&
                    a.Status != "Completed");

                if (activeBookings > 0)
                {
                    throw new InvalidOperationException($"Cannot set doctor Off Duty on {targetDate:yyyy-MM-dd}. Doctor has {activeBookings} active appointment(s) that must be diverted first.");
                }
            }

            var newStatus = !currentIsAvailable;

            if (existingSchedule != null)
            {
                existingSchedule.IsAvailable = newStatus;
                existingSchedule.DailyStatus = newStatus ? "OnDuty" : "OffDuty";
                if (!newStatus)
                {
                    existingSchedule.IsLate = false;
                    existingSchedule.DelayMinutes = 0;
                    existingSchedule.DelayReason = "Turned off by administration";
                }
                else
                {
                    existingSchedule.IsLate = false;
                    existingSchedule.DelayMinutes = 0;
                    existingSchedule.DelayReason = null;
                }
                existingSchedule.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                existingSchedule = new DoctorDateSchedule
                {
                    DoctorId = doctorId,
                    ScheduleDate = targetDate,
                    IsAvailable = newStatus,
                    DailyStatus = newStatus ? "OnDuty" : "OffDuty",
                    IsLate = false,
                    DelayMinutes = 0,
                    DelayReason = newStatus ? null : "Turned off by administration",
                    UpdatedAt = DateTime.UtcNow
                };
                _context.DoctorDateSchedules.Add(existingSchedule);
            }

            if (targetDate == todayPkt)
            {
                doctor.DailyStatusDate = todayPkt;
                doctor.DailyStatus = newStatus ? "OnDuty" : "OffDuty";
                if (!newStatus)
                {
                    doctor.IsLateToday = false;
                    doctor.DelayMinutes = 0;
                    doctor.DelayReason = "Turned off by administration";
                }
                else
                {
                    doctor.IsLateToday = false;
                    doctor.DelayMinutes = 0;
                    doctor.DelayReason = null;
                }
            }

            await _context.SaveChangesAsync();
            return newStatus;
        }
        catch (KeyNotFoundException)
        {
            throw;
        }
        catch (InvalidOperationException)
        {
            throw;
        }
        catch (Exception)
        {
            throw new Exception("Try again later");
        }
    }

    public async Task<string> RegisterAdmin(RegisterAdminRequestDto dto)
    {
        try
        {
            var normalEmail = dto.Email.Trim().ToLower();
            var isExist = await _context.Users.AnyAsync(u => u.Email.ToLower() == normalEmail);
            if (isExist)
            {
                throw new DuplicateNameException("An account with this email address already exists.");
            }

            string token = RandomNumberGenerator.GetInt32(100000, 1000000).ToString();
            var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var user = new User
                {
                    Name = dto.Name,
                    Email = normalEmail,
                    Password = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                    Role = "Admin",
                    IsVerified = false
                };
                await _context.Users.AddAsync(user);
                await _context.SaveChangesAsync();

                var verification = new Verification
                {
                    Email = normalEmail,
                    Code = token,
                    ExpiresAt = DateTime.UtcNow.AddMinutes(10)
                };
                await _context.Verification.AddAsync(verification);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }

            try
            {
                await _emailService.SendOtpEmailAsync(
                    normalEmail,
                    token,
                    "CareFlow - Administrator Account Verification",
                    "verify the new administrator account"
                );
            }
            catch
            {
                throw new Exception("Administrator account registered, but verification email could not be sent. Please retry verification.");
            }

            return "Administrator registered successfully. Verification OTP has been dispatched to their email.";
        }
        catch (DuplicateNameException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new Exception(ex.Message);
        }
    }

    public async Task<string> VerifyAdminOtp(VerifyAdminOtpDto dto)
    {
        try
        {
            var normalEmail = dto.Email.Trim().ToLower();
            var record = await _context.Verification
                .Where(u => u.Email.ToLower() == normalEmail && !u.IsUsed && u.ExpiresAt > DateTime.UtcNow)
                .OrderByDescending(v => v.CreatedAt)
                .FirstOrDefaultAsync();

            if (record == null || dto.Code.Trim() != record.Code)
            {
                throw new InvalidCredentialException("Invalid or expired verification code.");
            }

            record.IsUsed = true;
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == normalEmail);
            if (user == null)
            {
                throw new KeyNotFoundException("Administrator account not found.");
            }

            user.IsVerified = true;
            await _context.SaveChangesAsync();
            return "Administrator account verified successfully.";
        }
        catch (InvalidCredentialException)
        {
            throw;
        }
        catch (KeyNotFoundException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new Exception(ex.Message);
        }
    }

    public async Task<List<AdminListItemDto>> GetAdminsList()
    {
        try
        {
            var list = await _context.Users.AsNoTracking()
                .Where(u => u.Role == "Admin" || u.Role == "SuperAdmin")
                .OrderByDescending(u => u.CreatedAt)
                .Select(u => new AdminListItemDto
                {
                    Id = u.Id,
                    Name = u.Name,
                    Email = u.Email,
                    Role = u.Role,
                    IsVerified = u.IsVerified,
                    CreatedAt = u.CreatedAt
                })
                .ToListAsync();

            return list;
        }
        catch (Exception)
        {
            throw new Exception("Try again later");
        }
    }

    public async Task<string> DeleteAdmin(int adminId, int currentUserId)
    {
        if (adminId == currentUserId)
        {
            throw new InvalidOperationException("You cannot delete your own SuperAdmin account.");
        }

        var adminUser = await _context.Users.FirstOrDefaultAsync(u => u.Id == adminId);
        if (adminUser == null)
        {
            throw new KeyNotFoundException("Administrator account not found.");
        }

        if (adminUser.Role == "SuperAdmin")
        {
            throw new InvalidOperationException("SuperAdmin accounts cannot be deleted.");
        }

        if (adminUser.Role != "Admin")
        {
            throw new InvalidOperationException("Only administrator accounts can be deleted through this governance portal.");
        }

        var sessions = await _context.Session.Where(s => s.UserId == adminId).ToListAsync();
        if (sessions.Any())
        {
            _context.Session.RemoveRange(sessions);
        }

        var verifications = await _context.Verification.Where(v => v.Email == adminUser.Email).ToListAsync();
        if (verifications.Any())
        {
            _context.Verification.RemoveRange(verifications);
        }

        _context.Users.Remove(adminUser);
        await _context.SaveChangesAsync();

        return $"Administrator {adminUser.Name} ({adminUser.Email}) was permanently deleted from the database.";
    }

    public async Task<DiversionCandidatesResponseDto> GetAdminDiversionCandidates(int appointmentId)
    {
        var appointment = await _context.Appointments
            .AsNoTracking()
            .Include(a => a.Patient)!.ThenInclude(p => p.User)
            .Include(a => a.Doctor)!.ThenInclude(d => d.User)
            .Include(a => a.Doctor)!.ThenInclude(d => d.Department)
            .Include(a => a.Doctor)!.ThenInclude(d => d.DoctorDepartments)
            .FirstOrDefaultAsync(a => a.Id == appointmentId);

        if (appointment == null)
        {
            throw new KeyNotFoundException("Appointment not found");
        }

        var nowPkt = DateTime.UtcNow.AddHours(5);
        var todayPkt = DateOnly.FromDateTime(nowPkt);
        var nowTimePkt = TimeOnly.FromDateTime(nowPkt);
        var appDate = appointment.AppointmentDate;

        var docDepts = new List<int> { appointment.Doctor!.DepartmentId };
        docDepts.AddRange(appointment.Doctor.DoctorDepartments.Select(dd => dd.DepartmentId));
        docDepts = docDepts.Distinct().ToList();

        var sameDocBooked = await _context.Appointments
            .AsNoTracking()
            .Where(a => a.DoctorId == appointment.DoctorId &&
                        a.AppointmentDate == appDate &&
                        a.Id != appointment.Id &&
                        (a.Status == "Booked" || a.Status == "Confirmed" || a.Status == "Pending" || a.Status == "Completed" || a.Status == "CheckedIn"))
            .Select(a => a.TimeSlot)
            .ToListAsync();

        var sameDocAllSlots = GenerateSlots(appointment.Doctor.ShiftStart, appointment.Doctor.ShiftEnd);
        var sameDocAltSlots = sameDocAllSlots
            .Where(s => (appDate > todayPkt || s > nowTimePkt) && !sameDocBooked.Contains(s))
            .ToList();

        var peerDoctorsList = await _context.Doctors
            .AsNoTracking()
            .Include(d => d.User)
            .Include(d => d.Department)
            .Include(d => d.DoctorDepartments).ThenInclude(dd => dd.Department)
            .Where(d => d.Id != appointment.DoctorId && d.User!.IsVerified &&
                        (docDepts.Contains(d.DepartmentId) || d.DoctorDepartments.Any(dd => docDepts.Contains(dd.DepartmentId))))
            .OrderBy(d => d.User!.Name)
            .ToListAsync();

        var peerDoctorIds = peerDoctorsList.Select(d => d.Id).ToList();
        var peerBookings = await _context.Appointments
            .AsNoTracking()
            .Where(a => peerDoctorIds.Contains(a.DoctorId) &&
                        a.AppointmentDate == appDate &&
                        (a.Status == "Booked" || a.Status == "Confirmed" || a.Status == "Pending" || a.Status == "Completed" || a.Status == "CheckedIn"))
            .Select(a => new { a.DoctorId, a.TimeSlot })
            .ToListAsync();

        var peerCandidates = new List<DiversionCandidateDoctorDto>();
        foreach (var peer in peerDoctorsList)
        {
            var isPeerToday = appDate == todayPkt && peer.DailyStatusDate == todayPkt;
            var peerDailyStatus = isPeerToday ? peer.DailyStatus : "OnDuty";
            var isOnDuty = peer.IsAvailable && peerDailyStatus != "OffDuty";

            var bookedForPeer = peerBookings
                .Where(b => b.DoctorId == peer.Id)
                .Select(b => b.TimeSlot)
                .ToHashSet();

            var isFreeAtCurrentSlot = isOnDuty &&
                                      appointment.TimeSlot >= peer.ShiftStart &&
                                      appointment.TimeSlot < peer.ShiftEnd &&
                                      !bookedForPeer.Contains(appointment.TimeSlot);

            var peerSlots = GenerateSlots(peer.ShiftStart, peer.ShiftEnd)
                .Where(s => (appDate > todayPkt || s > nowTimePkt || s == appointment.TimeSlot) && !bookedForPeer.Contains(s))
                .ToList();

            peerCandidates.Add(new DiversionCandidateDoctorDto
            {
                DoctorId = peer.Id,
                DoctorName = peer.User != null ? peer.User.Name : string.Empty,
                Specialization = peer.Specialization,
                DepartmentName = peer.Department != null ? peer.Department.Name : string.Empty,
                IsFreeAtTargetSlot = isFreeAtCurrentSlot,
                IsOnDuty = isOnDuty,
                DailyStatus = peerDailyStatus,
                AvailableSlots = isOnDuty ? peerSlots : new List<TimeOnly>()
            });
        }

        var isDocToday = appDate == todayPkt && appointment.Doctor.DailyStatusDate == todayPkt;
        return new DiversionCandidatesResponseDto
        {
            AppointmentId = appointment.Id,
            PatientId = appointment.PatientId,
            PatientName = appointment.Patient != null && appointment.Patient.User != null ? appointment.Patient.User.Name : "Patient",
            CurrentDoctorId = appointment.DoctorId,
            CurrentDoctorName = appointment.Doctor.User != null ? appointment.Doctor.User.Name : string.Empty,
            DepartmentName = appointment.Doctor.Department != null ? appointment.Doctor.Department.Name : string.Empty,
            AppointmentDate = appointment.AppointmentDate,
            CurrentTimeSlot = appointment.TimeSlot,
            IsCurrentDoctorLate = isDocToday && appointment.Doctor.IsLateToday,
            CurrentDoctorDelayMinutes = isDocToday && appointment.Doctor.IsLateToday ? appointment.Doctor.DelayMinutes : 0,
            CurrentDoctorDelayReason = isDocToday ? appointment.Doctor.DelayReason : null,
            SameDoctorAlternativeSlots = sameDocAltSlots,
            PeerDoctors = peerCandidates
        };
    }

    public async Task<DivertAppointmentResponseDto> DivertFutureAppointment(AdminDivertAppointmentDto dto, int adminUserId)
    {
        var adminUser = await _context.Users.FirstOrDefaultAsync(u => u.Id == adminUserId);
        if (adminUser == null)
        {
            throw new KeyNotFoundException("Admin account not found");
        }

        var appointment = await _context.Appointments
            .Include(a => a.Patient)!.ThenInclude(p => p.User)
            .Include(a => a.Doctor)!.ThenInclude(d => d.User)
            .Include(a => a.Doctor)!.ThenInclude(d => d.DoctorDepartments)
            .FirstOrDefaultAsync(a => a.Id == dto.AppointmentId);

        if (appointment == null)
        {
            throw new KeyNotFoundException("Appointment not found");
        }

        if (appointment.Status == "Completed" || appointment.Status == "Cancelled" || appointment.Status == "Missed")
        {
            throw new InvalidOperationException($"Cannot divert an appointment with status '{appointment.Status}'");
        }

        var nowPkt = DateTime.UtcNow.AddHours(5);
        var todayPkt = DateOnly.FromDateTime(nowPkt);
        var nowTimePkt = TimeOnly.FromDateTime(nowPkt);
        var targetDate = dto.NewDate ?? appointment.AppointmentDate;

        if (targetDate < todayPkt || (targetDate == todayPkt && dto.NewTimeSlot <= nowTimePkt))
        {
            throw new InvalidOperationException("Cannot divert to a date or time slot that has already passed");
        }

        var docDepts = new List<int> { appointment.Doctor!.DepartmentId };
        docDepts.AddRange(appointment.Doctor.DoctorDepartments.Select(dd => dd.DepartmentId));
        docDepts = docDepts.Distinct().ToList();

        var targetDoctor = await _context.Doctors
            .Include(d => d.User)
            .Include(d => d.Department)
            .Include(d => d.DoctorDepartments)
            .FirstOrDefaultAsync(d => d.Id == dto.TargetDoctorId);

        if (targetDoctor == null || targetDoctor.User == null || !targetDoctor.User.IsVerified)
        {
            throw new KeyNotFoundException("Target doctor not found or is not verified");
        }

        var targetDocDepts = new List<int> { targetDoctor.DepartmentId };
        targetDocDepts.AddRange(targetDoctor.DoctorDepartments.Select(dd => dd.DepartmentId));
        targetDocDepts = targetDocDepts.Distinct().ToList();

        if (!docDepts.Intersect(targetDocDepts).Any())
        {
            throw new InvalidOperationException("Target doctor must belong to the same department pool");
        }

        if (targetDate == todayPkt)
        {
            var isTargetToday = targetDoctor.DailyStatusDate == todayPkt;
            var targetDailyStatus = isTargetToday ? targetDoctor.DailyStatus : "OnDuty";
            if (!targetDoctor.IsAvailable || targetDailyStatus == "OffDuty")
            {
                throw new InvalidOperationException($"Target doctor is currently {targetDailyStatus} or unavailable");
            }
        }
        else if (!targetDoctor.IsAvailable)
        {
            throw new InvalidOperationException("Target doctor is currently marked unavailable");
        }

        if (dto.NewTimeSlot < targetDoctor.ShiftStart || dto.NewTimeSlot >= targetDoctor.ShiftEnd)
        {
            throw new InvalidOperationException("Selected time slot is outside target doctor's shift hours");
        }

        var isSlotBooked = await _context.Appointments.AnyAsync(a =>
            a.DoctorId == targetDoctor.Id &&
            a.AppointmentDate == targetDate &&
            a.TimeSlot == dto.NewTimeSlot &&
            a.Id != appointment.Id &&
            (a.Status == "Booked" || a.Status == "Confirmed" || a.Status == "Pending" || a.Status == "Completed" || a.Status == "CheckedIn"));

        if (isSlotBooked)
        {
            throw new InvalidOperationException("Selected time slot is already booked for target doctor on this date");
        }

        var prevDoctorId = appointment.DoctorId;
        var prevDoctorName = appointment.Doctor.User != null ? appointment.Doctor.User.Name : string.Empty;
        var prevTimeSlot = appointment.TimeSlot;

        if (!appointment.IsDiverted)
        {
            appointment.OriginalDoctorId = prevDoctorId;
        }

        appointment.DoctorId = targetDoctor.Id;
        appointment.AppointmentDate = targetDate;
        appointment.TimeSlot = dto.NewTimeSlot;
        appointment.IsDiverted = true;
        appointment.DiversionReason = string.IsNullOrWhiteSpace(dto.DiversionReason) ? "Administrative diversion" : dto.DiversionReason.Trim();
        appointment.DivertedAt = DateTime.UtcNow;
        appointment.DivertedBy = $"Admin ({adminUser.Name})";
        appointment.Status = "Booked";

        await _context.SaveChangesAsync();

        return new DivertAppointmentResponseDto
        {
            AppointmentId = appointment.Id,
            PatientId = appointment.PatientId,
            PatientName = appointment.Patient != null && appointment.Patient.User != null ? appointment.Patient.User.Name : "Patient",
            PreviousDoctorId = prevDoctorId,
            PreviousDoctorName = prevDoctorName,
            NewDoctorId = targetDoctor.Id,
            NewDoctorName = targetDoctor.User.Name,
            AppointmentDate = appointment.AppointmentDate,
            PreviousTimeSlot = prevTimeSlot,
            NewTimeSlot = appointment.TimeSlot,
            DiversionReason = appointment.DiversionReason,
            DivertedBy = appointment.DivertedBy,
            DivertedAt = appointment.DivertedAt.Value,
            Status = appointment.Status
        };
    }

    private static List<TimeOnly> GenerateSlots(TimeOnly start, TimeOnly end)
    {
        var slots = new List<TimeOnly>();
        var current = start;
        while (current < end)
        {
            slots.Add(current);
            current = current.AddMinutes(30);
        }
        return slots;
    }

    public async Task<List<AdminDoctorAppointmentDto>> GetDoctorAppointments(int doctorId, DateOnly date)
    {
        var appointments = await _context.Appointments
            .AsNoTracking()
            .Include(a => a.Patient)!.ThenInclude(p => p.User)
            .Include(a => a.Doctor)!.ThenInclude(d => d.User)
            .Include(a => a.Doctor)!.ThenInclude(d => d.Department)
            .Where(a => a.DoctorId == doctorId && a.AppointmentDate == date)
            .OrderBy(a => a.TimeSlot)
            .ToListAsync();

        var originalDoctorIds = appointments
            .Where(a => a.OriginalDoctorId.HasValue)
            .Select(a => a.OriginalDoctorId!.Value)
            .Distinct()
            .ToList();

        var origDoctors = await _context.Doctors
            .AsNoTracking()
            .Include(d => d.User)
            .Where(d => originalDoctorIds.Contains(d.Id))
            .ToDictionaryAsync(d => d.Id, d => d.User != null ? d.User.Name : string.Empty);

        return appointments.Select(a => new AdminDoctorAppointmentDto
        {
            AppointmentId = a.Id,
            PatientId = a.PatientId,
            PatientName = a.Patient != null && a.Patient.User != null ? a.Patient.User.Name : "Patient",
            PatientPhone = a.Patient != null ? a.Patient.PhoneNumber : string.Empty,
            DoctorId = a.DoctorId,
            DoctorName = a.Doctor != null && a.Doctor.User != null ? a.Doctor.User.Name : string.Empty,
            DepartmentName = a.Doctor != null && a.Doctor.Department != null ? a.Doctor.Department.Name : string.Empty,
            AppointmentDate = a.AppointmentDate,
            TimeSlot = a.TimeSlot,
            Status = a.Status,
            IsDiverted = a.IsDiverted,
            OriginalDoctorName = a.OriginalDoctorId.HasValue && origDoctors.TryGetValue(a.OriginalDoctorId.Value, out var oname) ? oname : null,
            DiversionReason = a.DiversionReason
        }).ToList();
    }
}