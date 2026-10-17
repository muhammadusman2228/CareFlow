using System.Data;
using backend.Data;
using backend.DTOs;
using backend.Interfaces;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public class AppointmentService : IAppointment
{
    private readonly AppDbContext _context;

    public AppointmentService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<ResponseAppointmentDto>> GetAvailableDoctors(int departmentId, DateOnly date, TimeOnly timeSlot)
    {
        try
        {
            var todayPkt = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(5));
            var dateSchedules = await _context.DoctorDateSchedules
                .AsNoTracking()
                .Where(s => s.ScheduleDate == date)
                .ToDictionaryAsync(s => s.DoctorId);

            var doctorsQuery = await _context.Doctors
                .AsNoTracking()
                .Where(d => (d.DepartmentId == departmentId || d.DoctorDepartments.Any(dd => dd.DepartmentId == departmentId)) && d.User!.IsVerified)
                .Select(u => new
                {
                    u.Id,
                    Name = u.User!.Name,
                    u.Specialization,
                    u.IsAvailable,
                    u.DailyStatus,
                    u.DailyStatusDate,
                    u.ConsultationFee,
                    u.ShiftStart,
                    u.ShiftEnd,
                    IsSlotBooked = _context.Appointments.Any(a => 
                        a.DoctorId == u.Id && 
                        a.AppointmentDate == date && 
                        a.TimeSlot == timeSlot && 
                        (a.Status == "Booked" || a.Status == "Confirmed" || a.Status == "Pending" || a.Status == "CheckedIn" || a.Status == "Completed"))
                })
                .ToListAsync();

            var doctors = doctorsQuery
                .Where(u =>
                {
                    if (!u.IsAvailable) return false;

                    dateSchedules.TryGetValue(u.Id, out var ds);
                    var effectiveShiftStart = (ds != null && ds.ShiftStart.HasValue) ? ds.ShiftStart.Value : u.ShiftStart;
                    var effectiveShiftEnd = (ds != null && ds.ShiftEnd.HasValue) ? ds.ShiftEnd.Value : u.ShiftEnd;

                    if (timeSlot < effectiveShiftStart || timeSlot >= effectiveShiftEnd) return false;

                    if (ds != null)
                    {
                        return ds.IsAvailable && ds.DailyStatus != "OffDuty";
                    }
                    if (date == todayPkt && u.DailyStatusDate == todayPkt)
                    {
                        return u.DailyStatus != "OffDuty";
                    }
                    return true;
                })
                .Select(u => new ResponseAppointmentDto
                {
                    Id = u.Id,
                    Name = u.Name,
                    Specialization = u.Specialization,
                    IsAvailable = true,
                    ConsultationFee = u.ConsultationFee,
                    IsSlotBooked = u.IsSlotBooked
                })
                .ToList();

            return doctors;
        }
        catch
        {
            throw;
        }
    }


    public async Task<ResponseBookingDto> BookAppointment(RequestBookingDto dto, int userId)
    {
        try
        {
            var nowPkt = DateTime.UtcNow.AddHours(5);
            var todayPkt = DateOnly.FromDateTime(nowPkt);
            var nowTimePkt = TimeOnly.FromDateTime(nowPkt);

            if (dto.AppointmentDate < todayPkt)
            {
                throw new InvalidOperationException("Cannot book an appointment for a past date");
            }

            if (dto.AppointmentDate == todayPkt && dto.TimeSlot <= nowTimePkt)
            {
                throw new InvalidOperationException("Cannot book an appointment for a time slot that has already passed");
            }

            var doctor = await _context.Doctors
                .Include(d => d.User)
                .Include(d => d.Department)
                .FirstOrDefaultAsync(d => d.Id == dto.DoctorId && d.User!.IsVerified);

            if (doctor == null)
            {
                throw new KeyNotFoundException("Doctor does not exist or is not verified");
            }

            if (!doctor.IsAvailable)
            {
                throw new InvalidOperationException("Doctor is currently unavailable or inactive in the hospital registry");
            }

            var dateSchedule = await _context.DoctorDateSchedules
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.DoctorId == dto.DoctorId && s.ScheduleDate == dto.AppointmentDate);

            if (dateSchedule != null)
            {
                if (!dateSchedule.IsAvailable || dateSchedule.DailyStatus == "OffDuty")
                {
                    throw new InvalidOperationException("Doctor is Off Duty on the selected date");
                }
            }
            else if (dto.AppointmentDate == todayPkt && doctor.DailyStatusDate == todayPkt && doctor.DailyStatus == "OffDuty")
            {
                throw new InvalidOperationException("Doctor is Off Duty on the selected date");
            }

            var effectiveShiftStart = (dateSchedule != null && dateSchedule.ShiftStart.HasValue) ? dateSchedule.ShiftStart.Value : doctor.ShiftStart;
            var effectiveShiftEnd = (dateSchedule != null && dateSchedule.ShiftEnd.HasValue) ? dateSchedule.ShiftEnd.Value : doctor.ShiftEnd;

            if (dto.TimeSlot < effectiveShiftStart || dto.TimeSlot >= effectiveShiftEnd)
            {
                throw new InvalidOperationException("Selected time slot is outside the doctor's shift hours for this date");
            }

            var isAlreadyBooked = await _context.Appointments.AnyAsync(u => 
                u.DoctorId == dto.DoctorId && 
                u.AppointmentDate == dto.AppointmentDate && 
                u.TimeSlot == dto.TimeSlot && 
                (u.Status == "Booked" || u.Status == "Confirmed" || u.Status == "Pending" || u.Status == "CheckedIn" || u.Status == "Completed"));

            if (isAlreadyBooked)
            {
                throw new DuplicateNameException("This Time slot is already Booked");
            }

            var patient = await _context.Patient
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (patient == null)
            {
                throw new KeyNotFoundException("Patient profile not found");
            }

            var appointment = new Appointment
            {
                PatientId = patient.Id,
                DoctorId = dto.DoctorId,
                AppointmentDate = dto.AppointmentDate,
                TimeSlot = dto.TimeSlot,
                Symptoms = dto.Symptom,
                Status = "Booked"
            };

            await _context.Appointments.AddAsync(appointment);
            await _context.SaveChangesAsync();

            return new ResponseBookingDto
            {
                Id = appointment.Id,
                DoctorName = doctor.User!.Name,
                DepartmentName = doctor.Department!.Name,
                AppointmentDate = dto.AppointmentDate,
                TimeSlot = dto.TimeSlot,
                Status = appointment.Status
            };
        }
        catch (DuplicateNameException)
        {
            throw;
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

    public async Task<List<string>> GetBookedSlots(int doctorId, DateOnly date)
    {
        try
        {
            var bookedSlots = await _context.Appointments
                .AsNoTracking()
                .Where(a => a.DoctorId == doctorId && 
                            a.AppointmentDate == date && 
                            (a.Status == "Booked" || a.Status == "Confirmed" || a.Status == "Pending" || a.Status == "CheckedIn" || a.Status == "Completed"))
                .Select(a => a.TimeSlot.ToString("HH:mm:ss"))
                .Distinct()
                .ToListAsync();

            return bookedSlots;
        }
        catch
        {
            throw;
        }
    }
}