

using backend.Data;
using backend.DTOs;
using backend.Interfaces;
using backend.Models;
using Microsoft.EntityFrameworkCore;


namespace backend.Services;


public class DoctorApisService:IDoctorApis
{
    
private readonly AppDbContext _context;
public DoctorApisService(AppDbContext context)
    {
        _context=context;
    }

    public async  Task<List<DoctorAppointmentsDto>> DoctorAppointment(int userId)
    {

        try
        {
            
        var doctor = await _context.Doctors.FirstOrDefaultAsync(u=>u.UserId==userId);

        if (doctor == null)
        {
            throw new InvalidDataException("Doctor does not exist");
        }
        var appointments = await _context.Appointments.AsNoTracking().OrderBy(u=>u.AppointmentDate).ThenBy(a=>a.TimeSlot).Where(u=>u.DoctorId==doctor.Id && u.AppointmentDate>=DateOnly.FromDateTime(DateTime.UtcNow)
        ).Select(u=> new DoctorAppointmentsDto
        {
            AppointmentId=u.Id,
            PatientId=u.PatientId,
            PatientName=u.Patient!.User!.Name,
            AppointmentDate=u.AppointmentDate,
            TimeSlot=u.TimeSlot,
            Symptoms=u.Symptoms,
            Status=u.Status

        }).ToListAsync();
        return appointments;
    }
    catch(Exception)
        {
            throw new Exception("Try again later");
        }
        }

       public async  Task<AppointmentStatusResponseDto> AppointmentStatus(AppointmentStatusDto dto){

        try
        {
              var appointment = await _context.Appointments.AsNoTracking().Where(a=>a.Id==dto.AppointmentId).ExecuteUpdateAsync(setter=>setter.SetProperty(a=>a.Status,dto.Status));

        if (appointment == 0)
        {
            throw new InvalidOperationException("Appointment didnot find");
        }

        return new AppointmentStatusResponseDto
        {
            AppointmentId=dto.AppointmentId,
            Status=dto.Status

        };
        }
        catch(Exception)
        {
            throw new Exception("Try again later");
        }
        }

        public async Task<PrescriptionResponseDto> Prescriptions(PrescriptionsDto dto)
    {
        try
        {
            var appointment = await _context.Appointments
    .Include(a => a.Doctor!).ThenInclude(d => d.User)
    .Include(a => a.Patient!).ThenInclude(p => p.User)
    .FirstOrDefaultAsync(a => a.Id == dto.AppointmentId);
        if (appointment==null)
        {
            throw new InvalidDataException("No Appointement Id exists");
        }

        var prescritions = new Prescriptions
        {
            PatientId=dto.PatientId,
            DoctorId=dto.DoctorId,
            AppointmentId=dto.AppointmentId,
            Title=dto.Title,
            Note=dto.Note

        };
        await _context.Appointments.AsNoTracking().Where(a=>a.Id==dto.AppointmentId).ExecuteUpdateAsync(s=>s.SetProperty(s=>s.Status,"Completed"));
        await _context.Prescriptions.AddAsync(prescritions);
        await _context.SaveChangesAsync();

       return  new PrescriptionResponseDto
        { 
             DoctorName= appointment.Doctor!.User!.Name,
             PatientName=appointment.Patient!.User!.Name,
             Title=dto.Title,
             Note=dto.Note

        };
        }
        catch (Exception)
        {
            throw new Exception("Try again later");
        }
    }
    public async Task<HistoryResponseDto> MedicalHistory(HistoryDto dto)
    {
        var patient=await _context.Patient.FirstOrDefaultAsync(p=>p.Id==dto.PatientId);
        if(patient == null){
            throw new InvalidDataException("Patient does not exists");
        }


     var appointments = await _context.Appointments.AsNoTracking().OrderBy(u=>u.AppointmentDate).Where(a => a.PatientId == patient.Id && a.Status == "Completed").Select(a=>new HistoryResponseListDto
     {
         DoctorName=a.Doctor!.User!.Name,
         AppointmentDate=a.AppointmentDate,
         Symptoms=a.Symptoms,
         Title=a.Prescriptions!.Title,
         Note=a.Prescriptions!.Note
     }).ToListAsync();


        return new HistoryResponseDto
        {
            DateOfBirth=patient.DateOfBirth,
            Gender=patient.Gender,
            BloodGroup=patient.BloodGroup,
            PhoneNumber=patient.PhoneNumber,
            EmergencyContact=patient.EmergencyContact,
            MedicalHistory=appointments
        };
    }
    }