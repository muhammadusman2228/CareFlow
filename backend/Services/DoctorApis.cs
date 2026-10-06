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

            var appointments = await _context.Appointments.AsNoTracking()
                .OrderBy(u => u.AppointmentDate)
                .ThenBy(a => a.TimeSlot)
                .Where(u => u.DoctorId == doctor.Id && u.AppointmentDate >= DateOnly.FromDateTime(DateTime.UtcNow))
                .Select(u => new DoctorAppointmentsDto
                {
                    AppointmentId = u.Id,
                    PatientId = u.PatientId,
                    PatientName = u.Patient!.User!.Name,
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

            if (dto.Status != "Confirmed" && dto.Status != "Completed" && dto.Status != "Cancelled")
            {
                throw new InvalidOperationException("Invalid appointment status");
            }

            var appointment = await _context.Appointments
                .Where(a => a.Id == dto.AppointmentId && a.DoctorId == doctor.Id)
                .ExecuteUpdateAsync(setter => setter.SetProperty(a => a.Status, dto.Status));

            if (appointment == 0)
            {
                throw new InvalidOperationException("Appointment not found or does not belong to you");
            }

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
                (a.Status == "Confirmed" || a.Status == "Pending"));

            if (!hasActiveAppointment)
            {
                throw new UnauthorizedAccessException("You can only view medical history for patients with an active appointment");
            }

            var appointments = await _context.Appointments.AsNoTracking()
                .OrderBy(u => u.AppointmentDate)
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
            var records = await _context.Doctors.AsNoTracking().Where(d => d.UserId == userId).Select(doctor => new DoctorDashBoardDto
            {
                TodayAppointments = doctor.Appointments.Count(u => u.AppointmentDate == DateOnly.FromDateTime(DateTime.UtcNow)),
                PendingApprovals = doctor.Appointments.Count(a => a.Status == "Pending"),
                TodayCompletedCount = doctor.Appointments.Count(a => a.Status == "Completed" && a.AppointmentDate == DateOnly.FromDateTime(DateTime.UtcNow)),
                TotalUniquePatients = doctor.Appointments.Select(a => a.PatientId).Distinct().Count()
            }).FirstOrDefaultAsync();

            if (records is null)
            {
                throw new InvalidKeyException("Doctor does not exist");
            }

            return records;
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
}