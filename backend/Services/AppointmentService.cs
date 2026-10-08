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
             var doctors = await _context.Doctors
            .AsNoTracking()
            .Where(d => d.DepartmentId == departmentId && d.IsAvailable && d.ShiftStart <= timeSlot && timeSlot < d.ShiftEnd && d.User!.IsVerified)
            .Select(u => new ResponseAppointmentDto
            {
                Id = u.Id,
                Name = u.User!.Name,
                Specialization = u.Specialization,
                IsAvailable = u.IsAvailable,
                ConsultationFee = u.ConsultationFee,
                IsSlotBooked = _context.Appointments.Any(a => 
                    a.DoctorId == u.Id && 
                    a.AppointmentDate == date && 
                    a.TimeSlot == timeSlot && 
                    (a.Status == "Confirmed" || a.Status == "Pending" || a.Status == "Completed"))
            })
            .ToListAsync();

        return doctors;
        }
        catch
        {
            throw ;
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

            if (dto.TimeSlot < doctor.ShiftStart || dto.TimeSlot >= doctor.ShiftEnd)
            {
                throw new InvalidOperationException("Selected time slot is outside the doctor's shift hours");
            }

            var isAlreadyBooked = await _context.Appointments.AnyAsync(u => 
                u.DoctorId == dto.DoctorId && 
                u.AppointmentDate == dto.AppointmentDate && 
                u.TimeSlot == dto.TimeSlot && 
                (u.Status == "Confirmed" || u.Status == "Pending" || u.Status == "Completed"));

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
                Status = "Pending"
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
                            (a.Status == "Confirmed" || a.Status == "Pending" || a.Status == "Completed"))
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