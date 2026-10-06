
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
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var oneMonthAgo = DateTime.UtcNow.AddMonths(-1);

            var totalDoctors = await _context.Doctors.CountAsync(d => d.User!.IsVerified);
            var totalPatients = await _context.Patient.CountAsync(p => p.User!.IsVerified);
            var todayAppointments = await _context.Appointments.CountAsync(a => a.AppointmentDate == today && a.Status == "Confirmed");
            var monthlyTrends = await _context.Patient.CountAsync(p => p.User!.CreatedAt >= oneMonthAgo);

            var dailyRevenue = await _context.Appointments
                .Where(a => a.AppointmentDate == today && a.Status == "Completed")
                .SumAsync(a => a.Doctor!.ConsultationFee);

            var pending = await _context.Appointments.CountAsync(a => a.Status == "Pending");
            var confirmed = await _context.Appointments.CountAsync(a => a.Status == "Confirmed");
            var completed = await _context.Appointments.CountAsync(a => a.Status == "Completed");
            var cancelled = await _context.Appointments.CountAsync(a => a.Status == "Cancelled");

            var departmentWorkload = await _context.Departments.AsNoTracking().Select(d => new DepartmentWorkloadDto
            {
                DepartmentName = d.Name,
                AppointmentCount = d.Doctors.SelectMany(doc => doc.Appointments).Count()
            }).ToListAsync();

            var recentActivities = await _context.Appointments.AsNoTracking()
                .OrderByDescending(a => a.CreatedAt)
                .Take(6)
                .Select(a => new RecentActivityDto
                {
                    Time = a.CreatedAt.ToString("hh:mm tt"),
                    User = a.Patient!.User!.Name,
                    Action = a.Status == "Confirmed" ? "Scheduled Appointment" : (a.Status == "Completed" ? "Completed Consultation" : (a.Status == "Cancelled" ? "Cancelled Appointment" : "Requested Appointment")),
                    Module = "Appointments",
                    Status = a.Status == "Pending" ? "Pending" : "Success"
                })
                .ToListAsync();

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
                MonthlyTrends = monthlyTrends,
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
}