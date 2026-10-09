
using backend.Data;
using backend.DTOs;
using backend.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;


public class AdminExtraService : IAdminExtra
{

    private readonly AppDbContext _context;

    public AdminExtraService(AppDbContext context)
    {
        _context = context;
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
                .Where(a => (a.Status == "Pending" || a.Status == "Confirmed") && 
                            (a.AppointmentDate < today || (a.AppointmentDate == today && a.TimeSlot < nowTimePkt)))
                .ExecuteUpdateAsync(s => s.SetProperty(a => a.Status, "Missed"));

            var totalDoctors = await _context.Doctors.CountAsync(d => d.User!.IsVerified);
            var totalPatients = await _context.Patient.CountAsync(p => p.User!.IsVerified);
            var todayAppointments = await _context.Appointments.CountAsync(a => a.AppointmentDate == today && a.Status != "Cancelled");
            var monthlyTrends = await _context.Patient.CountAsync(p => p.User!.CreatedAt >= oneMonthAgo);

            var dailyRevenue = await _context.Appointments
                .Where(a => a.AppointmentDate == today && a.Status == "Completed")
                .SumAsync(a => a.Doctor!.ConsultationFee);

            var pending = await _context.Appointments.CountAsync(a => a.Status == "Pending");
            var confirmed = await _context.Appointments.CountAsync(a => a.Status == "Confirmed");
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
                AppointmentCount = d.Doctors.SelectMany(doc => doc.Appointments.Where(a => a.AppointmentDate == today && a.Status == "Confirmed")).Count()
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
                    Action = a.Status == "CheckedIn" ? "Checked-In at Triage" : (a.Status == "Confirmed" ? "Scheduled Appointment" : (a.Status == "Completed" ? "Completed Consultation" : (a.Status == "Cancelled" ? "Cancelled Appointment" : (a.Status == "Missed" ? "Missed Appointment" : "Requested Appointment")))),
                    Module = a.Status == "CheckedIn" ? "Triage" : "Appointments",
                    Status = a.Status == "Pending" ? "Pending" : (a.Status == "Missed" ? "Missed" : "Success")
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
                PendingAppointments = pending,
                ConfirmedAppointments = confirmed,
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
            var roster = await _context.Doctors.AsNoTracking()
                .Select(d => new DoctorScheduleResponseDto
                {
                    DoctorId = d.Id,
                    DoctorName = d.User!.Name,
                    DepartmentName = d.Department!.Name,
                    ShiftStart = d.ShiftStart,
                    ShiftEnd = d.ShiftEnd,
                    IsAvailable = d.IsAvailable,
                    BookedSlotsCount = d.Appointments.Count(a => a.AppointmentDate == date && a.Status == "Confirmed")
                })
                .ToListAsync();

            return roster;
        }
        catch (Exception)
        {
            throw new Exception("Try again later");
        }
    }

    public async Task<string> UpdateDoctorShift(int doctorId, DoctorShiftUpdateDto dto)
    {
        try
        {
            var updated = await _context.Doctors
                .Where(d => d.Id == doctorId)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(d => d.ShiftStart, dto.ShiftStart)
                    .SetProperty(d => d.ShiftEnd, dto.ShiftEnd)
                    .SetProperty(d => d.IsAvailable, dto.IsAvailable));

            if (updated == 0)
            {
                throw new KeyNotFoundException("Doctor does not exist");
            }

            return "Doctor shift updated successfully";
        }
        catch (KeyNotFoundException)
        {
            throw;
        }
        catch (Exception)
        {
            throw new Exception("Try again later");
        }
    }

    public async Task<bool> ToggleDoctorAvailability(int doctorId)
    {
        try
        {
            var doctor = await _context.Doctors.FirstOrDefaultAsync(d => d.Id == doctorId);
            if (doctor == null)
            {
                throw new KeyNotFoundException("Doctor does not exist");
            }

            doctor.IsAvailable = !doctor.IsAvailable;
            await _context.SaveChangesAsync();
            return doctor.IsAvailable;
        }
        catch (KeyNotFoundException)
        {
            throw;
        }
        catch (Exception)
        {
            throw new Exception("Try again later");
        }
    }
}