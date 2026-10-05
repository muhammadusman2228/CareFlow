


using System.Collections.Specialized;
using backend.Data;
using backend.DTOs;
using backend.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public class PatientService : IPatient
{
    private readonly AppDbContext _context;
    public PatientService(AppDbContext context)
    {
        _context=context;
    }

    public async Task<List<PatientAppointmentDto>>Appointment(int userId)
    {

        try
        {
             var patient= await _context.Patient.FirstOrDefaultAsync(p=>p.UserId==userId);
        if (patient == null)
        {
            throw new InvalidDataException("Patient did not exists");
        }

        var list=await _context.Appointments.AsNoTracking().OrderBy(a=>a.AppointmentDate).Where(a=>a.PatientId==patient.Id).Select(u=>new PatientAppointmentDto
        {
           AppointmentId=u.Id,
           DoctorName=u.Doctor!.User!.Name,
           Department=u.Doctor!.Department!.Name,
           AppointmentDate=u.AppointmentDate,
           TimeSlot=u.TimeSlot,
           Status=u.Status 
        }).ToListAsync();
        return list;
        }
        catch (Exception)
        {
            throw new Exception("Try again later");
        }
    }


    public async Task<List<PatientPrescriptionsDto>> Prescriptions(int userId)
    {
        try
        {
            var patient= await _context.Patient.FirstOrDefaultAsync(a=>a.UserId==userId);
            if (patient == null)
            {
                throw new InvalidDataException("Patient didnot exist");
            }
            var list=await  _context.Prescriptions.AsNoTracking().OrderByDescending(d=>d.Appointment!.AppointmentDate).Where(p=>p.PatientId==patient.Id).Select(r=>new PatientPrescriptionsDto
            {
                DoctorName=r.Doctor!.User!.Name,
                Title=r.Title,
                Note=r.Note,
                AppointmentDate=r.Appointment!.AppointmentDate
            }).ToListAsync();
            return list;
        }
        catch(Exception)
        {
            throw new Exception("Try again later");
        }
    }
    public async Task<string> CancelAppointment(int appointmentId, int userId)
    {
        try
        {
            var patient = await _context.Patient.FirstOrDefaultAsync(a => a.UserId == userId);
            if (patient == null)
            {
                throw new KeyNotFoundException("Patient does not exist");
            }

            var appointment = await _context.Appointments.FirstOrDefaultAsync(a => a.Id == appointmentId);
            if (appointment == null)
            {
                throw new KeyNotFoundException("Appointment does not exist");
            }

            if (appointment.PatientId != patient.Id)
            {
                throw new UnauthorizedAccessException("You are not authorized to cancel this appointment");
            }

            if (appointment.AppointmentDate < DateOnly.FromDateTime(DateTime.UtcNow) || appointment.Status == "Completed" || appointment.Status == "Cancelled")
            {
                throw new InvalidOperationException("Unable to cancel the appointment");
            }

            appointment.Status = "Cancelled";
            await _context.SaveChangesAsync();

            return "Appointment cancelled successfully";
        }
        catch (KeyNotFoundException)
        {
            throw;
        }
        catch (UnauthorizedAccessException)
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
}