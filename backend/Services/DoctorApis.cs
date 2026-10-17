using backend.Data;
using backend.DTOs;
using backend.Interfaces;
using backend.Models;
using Microsoft.EntityFrameworkCore;
using Org.BouncyCastle.Security;

namespace backend.Services;

public class DoctorApisService : IDoctorApis
{
    private readonly AppDbContext _context;

    public DoctorApisService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<DoctorAppointmentsDto>> DoctorAppointment(int userId)
    {
        try
        {
            var doctor = await _context.Doctors.FirstOrDefaultAsync(u => u.UserId == userId);

            if (doctor == null)
            {
                throw new InvalidDataException("Doctor does not exist");
            }

            var nowPkt = DateTime.UtcNow.AddHours(5);
            var todayPkt = DateOnly.FromDateTime(nowPkt);
            var nowTimePkt = TimeOnly.FromDateTime(nowPkt);

            await _context.Appointments
                .Where(u => u.DoctorId == doctor.Id && 
                            (u.Status == "Booked" || u.Status == "Confirmed" || u.Status == "Pending") && 
                            (u.AppointmentDate < todayPkt || (u.AppointmentDate == todayPkt && u.TimeSlot < nowTimePkt)))
                .ExecuteUpdateAsync(s => s.SetProperty(a => a.Status, "Missed"));

            var appointments = await _context.Appointments.AsNoTracking()
                .Where(u => u.DoctorId == doctor.Id)
                .OrderByDescending(u => u.AppointmentDate)
                .ThenByDescending(a => a.TimeSlot)
                .ThenByDescending(u => u.Id)
                .Select(u => new DoctorAppointmentsDto
                {
                    AppointmentId = u.Id,
                    PatientId = u.PatientId,
                    PatientName = u.Patient != null && u.Patient.User != null ? u.Patient.User.Name : "Patient",
                    AppointmentDate = u.AppointmentDate,
                    TimeSlot = u.TimeSlot,
                    Symptoms = u.Symptoms,
                    Status = u.Status
                }).ToListAsync();

            return appointments;
        }
        catch (Exception)
        {
            throw new Exception("Try again later");
        }
    }

    public async Task<AppointmentStatusResponseDto> AppointmentStatus(AppointmentStatusDto dto, int userId)
    {
        try
        {
            var doctor = await _context.Doctors.FirstOrDefaultAsync(u => u.UserId == userId);

            if (doctor == null)
            {
                throw new InvalidDataException("Doctor does not exist");
            }

            if (dto.Status != "Booked" && dto.Status != "Confirmed" && dto.Status != "CheckedIn" && dto.Status != "Completed" && dto.Status != "Cancelled" && dto.Status != "Missed")
            {
                throw new InvalidOperationException("Invalid appointment status");
            }

            var existingAppointment = await _context.Appointments.FirstOrDefaultAsync(a => a.Id == dto.AppointmentId && a.DoctorId == doctor.Id);
            if (existingAppointment == null)
            {
                throw new InvalidOperationException("Appointment not found or does not belong to you");
            }

            if (existingAppointment.Status == "Missed" && dto.Status != "Missed")
            {
                throw new InvalidOperationException("Cannot change the status of a missed appointment");
            }

            if (existingAppointment.Status == "Cancelled" && dto.Status != "Cancelled")
            {
                throw new InvalidOperationException("Cannot change the status of a cancelled appointment");
            }

            if (existingAppointment.Status == "Completed")
            {
                throw new InvalidOperationException("Cannot change the status of a completed appointment");
            }

            existingAppointment.Status = dto.Status;
            await _context.SaveChangesAsync();

            return new AppointmentStatusResponseDto
            {
                AppointmentId = dto.AppointmentId,
                Status = dto.Status
            };
        }
        catch (InvalidOperationException)
        {
            throw;
        }
        catch (InvalidDataException)
        {
            throw;
        }
        catch (Exception)
        {
            throw new Exception("Try again later");
        }
    }

    public async Task<PrescriptionResponseDto> Prescriptions(PrescriptionsDto dto, int userId)
    {
        try
        {
            var doctor = await _context.Doctors.FirstOrDefaultAsync(u => u.UserId == userId);

            if (doctor == null)
            {
                throw new InvalidDataException("Doctor does not exist");
            }

            var appointment = await _context.Appointments
                .Include(a => a.Doctor!).ThenInclude(d => d.User)
                .Include(a => a.Patient!).ThenInclude(p => p.User)
                .FirstOrDefaultAsync(a => a.Id == dto.AppointmentId && a.DoctorId == doctor.Id);

            if (appointment == null)
            {
                throw new InvalidDataException("Appointment does not exist or does not belong to you");
            }

            if (appointment.Status == "Cancelled" || appointment.Status == "Missed")
            {
                throw new InvalidOperationException("Cannot prescribe medicine for a cancelled or missed appointment");
            }

            var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var prescritions = new Prescriptions
                {
                    PatientId = appointment.PatientId,
                    DoctorId = doctor.Id,
                    AppointmentId = appointment.Id,
                    Title = dto.Title,
                    Note = dto.Note
                };

                appointment.Status = "Completed";
                await _context.Prescriptions.AddAsync(prescritions);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return new PrescriptionResponseDto
                {
                    DoctorName = appointment.Doctor!.User!.Name,
                    PatientName = appointment.Patient!.User!.Name,
                    Title = dto.Title,
                    Note = dto.Note
                };
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
        catch (InvalidDataException)
        {
            throw;
        }
        catch (Exception)
        {
            throw new Exception("Try again later");
        }
    }

    public async Task<HistoryResponseDto> MedicalHistory(int patientId, int userId)
    {
        try
        {
            var doctor = await _context.Doctors.FirstOrDefaultAsync(u => u.UserId == userId);

            if (doctor == null)
            {
                throw new InvalidDataException("Doctor does not exist");
            }

            var patient = await _context.Patient.FirstOrDefaultAsync(p => p.Id == patientId);

            if (patient == null)
            {
                throw new InvalidDataException("Patient does not exist");
            }

            var hasActiveAppointment = await _context.Appointments.AnyAsync(a => 
                a.DoctorId == doctor.Id && 
                a.PatientId == patient.Id && 
                (a.Status == "Booked" || a.Status == "Confirmed" || a.Status == "Pending" || a.Status == "CheckedIn"));

            if (!hasActiveAppointment)
            {
                throw new UnauthorizedAccessException("You can only view medical history for patients with an active appointment");
            }

            var appointments = await _context.Appointments.AsNoTracking()
                .OrderByDescending(u => u.AppointmentDate)
                .Where(a => a.PatientId == patient.Id && a.Status == "Completed")
                .Select(a => new HistoryResponseListDto
                {
                    DoctorName = a.Doctor!.User!.Name,
                    AppointmentDate = a.AppointmentDate,
                    Symptoms = a.Symptoms,
                    Title = a.Prescriptions!.Title,
                    Note = a.Prescriptions!.Note
                }).ToListAsync();

            return new HistoryResponseDto
            {
                DateOfBirth = patient.DateOfBirth,
                Gender = patient.Gender,
                BloodGroup = patient.BloodGroup,
                PhoneNumber = patient.PhoneNumber,
                EmergencyContact = patient.EmergencyContact,
                MedicalHistory = appointments
            };
        }
        catch (UnauthorizedAccessException)
        {
            throw;
        }
        catch (InvalidDataException)
        {
            throw;
        }
        catch (Exception)
        {
            throw new Exception("Try again later");
        }
    }

    public async Task<DoctorDashBoardDto> DoctorDashBoard(int userId)
    {
        try
        {
            var doctor = await _context.Doctors.FirstOrDefaultAsync(d => d.UserId == userId);
            if (doctor == null)
            {
                throw new InvalidKeyException("Doctor does not exist");
            }

            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            var todayAppointments = await _context.Appointments
                .CountAsync(u => u.DoctorId == doctor.Id && u.AppointmentDate == today);

            var pendingApprovals = await _context.Appointments
                .CountAsync(a => a.DoctorId == doctor.Id && (a.Status == "Booked" || a.Status == "Confirmed" || a.Status == "Pending") && a.AppointmentDate == today);

            var todayCompletedCount = await _context.Appointments
                .CountAsync(a => a.DoctorId == doctor.Id && a.Status == "Completed" && a.AppointmentDate == today);

            var totalUniquePatients = await _context.Appointments
                .Where(a => a.DoctorId == doctor.Id)
                .Select(a => a.PatientId)
                .Distinct()
                .CountAsync();

            return new DoctorDashBoardDto
            {
                TodayAppointments = todayAppointments,
                PendingApprovals = pendingApprovals,
                TodayCompletedCount = todayCompletedCount,
                TotalUniquePatients = totalUniquePatients
            };
        }
        catch (InvalidKeyException)
        {
            throw;
        }
        catch (Exception)
        {
            throw new Exception("Try again later");
        }
    }

    public async Task<DoctorDailyStatusResponseDto> GetDoctorDailyStatus(int userId)
    {
        var doctor = await _context.Doctors
            .Include(d => d.User)
            .FirstOrDefaultAsync(d => d.UserId == userId);

        if (doctor == null)
        {
            throw new InvalidDataException("Doctor does not exist");
        }

        var todayPkt = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(5));
        var isToday = doctor.DailyStatusDate.HasValue && doctor.DailyStatusDate.Value == todayPkt;

        var todaySchedule = await _context.DoctorDateSchedules
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.DoctorId == doctor.Id && s.ScheduleDate == todayPkt);

        var effectiveStatus = todaySchedule != null
            ? todaySchedule.DailyStatus
            : (!doctor.IsAvailable ? "OffDuty" : (isToday ? doctor.DailyStatus : "OnDuty"));
        var effectiveAvailable = todaySchedule != null
            ? todaySchedule.IsAvailable
            : (doctor.IsAvailable && effectiveStatus != "OffDuty");

        var isLateToday = todaySchedule != null
            ? (effectiveStatus == "Delayed" && todaySchedule.IsLate)
            : (effectiveStatus == "Delayed" && isToday && doctor.IsLateToday);
        var delayMinutes = todaySchedule != null
            ? (effectiveStatus == "Delayed" ? todaySchedule.DelayMinutes : 0)
            : (effectiveStatus == "Delayed" && isToday ? doctor.DelayMinutes : 0);
        var delayReason = todaySchedule != null
            ? (effectiveStatus == "Delayed" ? todaySchedule.DelayReason : (effectiveStatus == "OffDuty" ? (todaySchedule.DelayReason ?? "Doctor is marked off duty") : null))
            : (effectiveStatus == "Delayed" && isToday ? doctor.DelayReason : (effectiveStatus == "OffDuty" ? (doctor.DelayReason ?? "Doctor is marked off duty") : null));

        var effectiveShiftStart = (todaySchedule != null && todaySchedule.ShiftStart.HasValue) ? todaySchedule.ShiftStart.Value : doctor.ShiftStart;
        var effectiveShiftEnd = (todaySchedule != null && todaySchedule.ShiftEnd.HasValue) ? todaySchedule.ShiftEnd.Value : doctor.ShiftEnd;

        return new DoctorDailyStatusResponseDto
        {
            DoctorId = doctor.Id,
            DoctorName = doctor.User != null ? doctor.User.Name : string.Empty,
            DailyStatus = effectiveStatus,
            IsLateToday = isLateToday,
            DelayMinutes = delayMinutes,
            DelayReason = delayReason,
            StatusDate = todayPkt,
            IsAvailable = effectiveAvailable,
            ShiftStart = effectiveShiftStart,
            ShiftEnd = effectiveShiftEnd
        };
    }

    public async Task<string> SetDoctorDailyStatus(int userId, DoctorDailyStatusDto dto)
    {
        var doctor = await _context.Doctors.FirstOrDefaultAsync(d => d.UserId == userId);
        if (doctor == null)
        {
            throw new InvalidDataException("Doctor does not exist");
        }

        if (!doctor.IsAvailable)
        {
            throw new InvalidOperationException("Doctor profile is currently deactivated by hospital administration. You cannot update daily shift status.");
        }

        var status = dto.DailyStatus?.Trim() ?? "OnDuty";
        if (status != "OnDuty" && status != "Delayed" && status != "OffDuty")
        {
            throw new InvalidOperationException("Invalid daily status. Allowed values: OnDuty, Delayed, OffDuty");
        }

        var todayPkt = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(5));

        if (status == "Delayed")
        {
            doctor.DailyStatus = "Delayed";
            doctor.IsLateToday = true;
            doctor.DelayMinutes = dto.DelayMinutes <= 0 ? 30 : dto.DelayMinutes;
            doctor.DelayReason = string.IsNullOrWhiteSpace(dto.DelayReason) ? "Doctor is delayed" : dto.DelayReason.Trim();
            doctor.DailyStatusDate = todayPkt;
        }
        else if (status == "OffDuty")
        {
            doctor.DailyStatus = "OffDuty";
            doctor.IsLateToday = false;
            doctor.DelayMinutes = 0;
            doctor.DelayReason = string.IsNullOrWhiteSpace(dto.DelayReason) ? "Off duty today" : dto.DelayReason.Trim();
            doctor.DailyStatusDate = todayPkt;
        }
        else
        {
            doctor.DailyStatus = "OnDuty";
            doctor.IsLateToday = false;
            doctor.DelayMinutes = 0;
            doctor.DelayReason = null;
            doctor.DailyStatusDate = todayPkt;
        }

        var dateSchedule = await _context.DoctorDateSchedules
            .FirstOrDefaultAsync(s => s.DoctorId == doctor.Id && s.ScheduleDate == todayPkt);

        var isTodayAvailable = status != "OffDuty";

        if (dateSchedule == null)
        {
            dateSchedule = new DoctorDateSchedule
            {
                DoctorId = doctor.Id,
                ScheduleDate = todayPkt,
                ShiftStart = doctor.ShiftStart,
                ShiftEnd = doctor.ShiftEnd,
                IsAvailable = isTodayAvailable,
                DailyStatus = doctor.DailyStatus,
                IsLate = doctor.IsLateToday,
                DelayMinutes = doctor.DelayMinutes,
                DelayReason = doctor.DelayReason,
                UpdatedAt = DateTime.UtcNow
            };
            _context.DoctorDateSchedules.Add(dateSchedule);
        }
        else
        {
            dateSchedule.IsAvailable = isTodayAvailable;
            dateSchedule.DailyStatus = doctor.DailyStatus;
            dateSchedule.IsLate = doctor.IsLateToday;
            dateSchedule.DelayMinutes = doctor.DelayMinutes;
            dateSchedule.DelayReason = doctor.DelayReason;
            dateSchedule.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return $"Doctor status updated to {doctor.DailyStatus}";
    }

    public async Task<DoctorMyScheduleDto> GetDoctorMySchedule(int userId)
    {
        var doctor = await _context.Doctors
            .Include(d => d.User)
            .Include(d => d.Department)
            .Include(d => d.DoctorDepartments).ThenInclude(dd => dd.Department)
            .FirstOrDefaultAsync(d => d.UserId == userId);

        if (doctor == null)
        {
            throw new InvalidDataException("Doctor does not exist");
        }

        var todayPkt = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(5));
        var isToday = doctor.DailyStatusDate.HasValue && doctor.DailyStatusDate.Value == todayPkt;

        var allDeptNames = new List<string>();
        if (doctor.Department != null)
        {
            allDeptNames.Add(doctor.Department.Name);
        }
        foreach (var dd in doctor.DoctorDepartments)
        {
            if (dd.Department != null && !allDeptNames.Contains(dd.Department.Name))
            {
                allDeptNames.Add(dd.Department.Name);
            }
        }

        var endDate = todayPkt.AddDays(6);
        var appointments = await _context.Appointments
            .AsNoTracking()
            .Where(a => a.DoctorId == doctor.Id && a.AppointmentDate >= todayPkt && a.AppointmentDate <= endDate)
            .Select(a => new { a.AppointmentDate, a.Status })
            .ToListAsync();

        var upcomingDateSchedules = await _context.DoctorDateSchedules
            .AsNoTracking()
            .Where(s => s.DoctorId == doctor.Id && s.ScheduleDate >= todayPkt && s.ScheduleDate <= endDate)
            .ToDictionaryAsync(s => s.ScheduleDate);

        var upcomingDays = new List<DoctorDailyRosterDayDto>();
        for (int i = 0; i < 7; i++)
        {
            var dayDate = todayPkt.AddDays(i);
            var dayApps = appointments.Where(a => a.AppointmentDate == dayDate).ToList();

            bool dayAvail;
            string dayStatus;
            TimeOnly dayShiftStart = doctor.ShiftStart;
            TimeOnly dayShiftEnd = doctor.ShiftEnd;

            if (!doctor.IsAvailable)
            {
                dayAvail = false;
                dayStatus = "OffDuty";
            }
            else if (upcomingDateSchedules.TryGetValue(dayDate, out var ds))
            {
                dayAvail = ds.IsAvailable && ds.DailyStatus != "OffDuty";
                dayStatus = ds.DailyStatus;
                if (ds.ShiftStart.HasValue) dayShiftStart = ds.ShiftStart.Value;
                if (ds.ShiftEnd.HasValue) dayShiftEnd = ds.ShiftEnd.Value;
            }
            else if (dayDate == todayPkt && isToday)
            {
                dayAvail = doctor.DailyStatus != "OffDuty";
                dayStatus = doctor.DailyStatus;
            }
            else
            {
                dayAvail = true;
                dayStatus = "OnDuty";
            }

            upcomingDays.Add(new DoctorDailyRosterDayDto
            {
                Date = dayDate,
                DayOfWeek = dayDate.DayOfWeek.ToString(),
                TotalAppointments = dayApps.Count,
                ConfirmedCount = dayApps.Count(a => a.Status == "Confirmed"),
                CompletedCount = dayApps.Count(a => a.Status == "Completed"),
                IsAvailable = dayAvail,
                DailyStatus = dayStatus,
                ShiftStart = dayShiftStart,
                ShiftEnd = dayShiftEnd
            });
        }

        var todayDateSchedule = upcomingDateSchedules.TryGetValue(todayPkt, out var tds) ? tds : null;
        var todayShiftStart = (todayDateSchedule != null && todayDateSchedule.ShiftStart.HasValue) ? todayDateSchedule.ShiftStart.Value : doctor.ShiftStart;
        var todayShiftEnd = (todayDateSchedule != null && todayDateSchedule.ShiftEnd.HasValue) ? todayDateSchedule.ShiftEnd.Value : doctor.ShiftEnd;

        var effectiveStatus = !doctor.IsAvailable
            ? "OffDuty"
            : (todayDateSchedule != null
                ? todayDateSchedule.DailyStatus
                : (isToday ? doctor.DailyStatus : "OnDuty"));
        var effectiveAvailable = !doctor.IsAvailable
            ? false
            : (todayDateSchedule != null
                ? (todayDateSchedule.IsAvailable && todayDateSchedule.DailyStatus != "OffDuty")
                : (effectiveStatus != "OffDuty"));
        var isLateToday = todayDateSchedule != null
            ? (effectiveStatus == "Delayed" && todayDateSchedule.IsLate)
            : (effectiveStatus == "Delayed" && isToday && doctor.IsLateToday);
        var delayMinutes = todayDateSchedule != null
            ? (effectiveStatus == "Delayed" ? todayDateSchedule.DelayMinutes : 0)
            : (effectiveStatus == "Delayed" && isToday ? doctor.DelayMinutes : 0);
        var delayReason = todayDateSchedule != null
            ? (effectiveStatus == "Delayed" ? todayDateSchedule.DelayReason : (effectiveStatus == "OffDuty" ? (todayDateSchedule.DelayReason ?? "Doctor is marked off duty") : null))
            : (effectiveStatus == "Delayed" && isToday ? doctor.DelayReason : (effectiveStatus == "OffDuty" ? (doctor.DelayReason ?? "Doctor is marked off duty") : null));

        return new DoctorMyScheduleDto
        {
            DoctorId = doctor.Id,
            DoctorName = doctor.User != null ? doctor.User.Name : string.Empty,
            DepartmentName = doctor.Department != null ? doctor.Department.Name : string.Empty,
            DepartmentNames = allDeptNames,
            ShiftStart = todayShiftStart,
            ShiftEnd = todayShiftEnd,
            IsAvailable = effectiveAvailable,
            DailyStatus = effectiveStatus,
            IsLateToday = isLateToday,
            DelayMinutes = delayMinutes,
            DelayReason = delayReason,
            UpcomingDays = upcomingDays
        };
    }
}