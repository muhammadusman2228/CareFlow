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
            .Where(d => d.DepartmentId == departmentId && d.User!.IsVerified)
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
                    a.Status == "Confirmed")
            })
            .ToListAsync();

        return doctors;
        }
        catch
        {
            throw ;
        }
    }


    public async Task<ResponseBookingDto> BookAppointment(RequestBookingDto dto)
    {
        try
        {
            var doctor = await _context.Doctors
                .Include(d => d.User)
                .Include(d => d.Department)
                .FirstOrDefaultAsync(d => d.Id == dto.DoctorId && d.User!.IsVerified);

            if (doctor == null)
            {
                throw new KeyNotFoundException("Doctor does not exist or is not verified");
            }

            var isAlreadyBooked = await _context.Appointments.AnyAsync(u => 
                u.DoctorId == dto.DoctorId && 
                u.AppointmentDate == dto.AppointmentDate && 
                u.TimeSlot == dto.TimeSlot && 
                u.Status == "Confirmed");

            if (isAlreadyBooked)
            {
                throw new DuplicateNameException("This Time slot is already Booked");
            }

            var patient = await _context.Patient
                .FirstOrDefaultAsync(p => p.Id == dto.PatientId || p.UserId == dto.PatientId);

            if (patient == null)
            {
                throw new KeyNotFoundException("Patient does not exist");
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
        catch (Exception)
        {
            throw new Exception("Try again later");
        }
    }
}