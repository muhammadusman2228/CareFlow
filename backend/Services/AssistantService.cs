using System.Data;
using backend.Data;
using backend.DTOs;
using backend.Interfaces;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public class AssistantService : IAssistant
{
    private readonly AppDbContext _context;

    public AssistantService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ResponseAssistantDto> RegisterAssistant(RegisterAssistantDto dto)
    {
        var normalEmail = dto.Email.Trim().ToLower();
        var exists = await _context.Users.AnyAsync(u => u.Email.ToLower() == normalEmail);
        if (exists)
        {
            throw new DuplicateNameException("This email is already registered");
        }

        if (dto.DepartmentId.HasValue)
        {
            var deptExists = await _context.Departments.AnyAsync(d => d.Id == dto.DepartmentId.Value);
            if (!deptExists)
            {
                throw new KeyNotFoundException("Specified department does not exist");
            }
        }

        if (dto.DoctorId.HasValue)
        {
            var docExists = await _context.Doctors.AnyAsync(d => d.Id == dto.DoctorId.Value);
            if (!docExists)
            {
                throw new KeyNotFoundException("Specified doctor does not exist");
            }
        }

        var user = new User
        {
            Name = dto.Name.Trim(),
            Email = normalEmail,
            Password = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = "Assistant",
            IsVerified = true,
            CreatedAt = DateTime.UtcNow
        };

        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();

        var assistant = new Assistant
        {
            UserId = user.Id,
            DepartmentId = dto.DepartmentId,
            DoctorId = dto.DoctorId,
            PhoneNumber = dto.PhoneNumber?.Trim() ?? string.Empty,
            Qualifications = dto.Qualifications.Trim(),
            ShiftStart = dto.ShiftStart,
            ShiftEnd = dto.ShiftEnd,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        await _context.Assistants.AddAsync(assistant);
        await _context.SaveChangesAsync();

        return await GetAssistantById(assistant.Id);
    }

    public async Task<List<ResponseAssistantDto>> GetAllAssistants()
    {
        return await _context.Assistants
            .AsNoTracking()
            .Include(a => a.User)
            .Include(a => a.Department)
            .Include(a => a.Doctor)!.ThenInclude(d => d.User)
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new ResponseAssistantDto
            {
                Id = a.Id,
                UserId = a.UserId,
                Name = a.User!.Name,
                Email = a.User.Email,
                PhoneNumber = a.PhoneNumber,
                DepartmentId = a.DepartmentId,
                DepartmentName = a.Department != null ? a.Department.Name : null,
                DoctorId = a.DoctorId,
                DoctorName = a.Doctor != null && a.Doctor.User != null ? a.Doctor.User.Name : null,
                Qualifications = a.Qualifications,
                ShiftStart = a.ShiftStart,
                ShiftEnd = a.ShiftEnd,
                IsActive = a.IsActive,
                CreatedAt = a.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<ResponseAssistantDto> UpdateAssistant(int id, UpdateAssistantDto dto)
    {
        var assistant = await _context.Assistants
            .Include(a => a.User)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (assistant == null)
        {
            throw new KeyNotFoundException("Assistant profile not found");
        }

        if (dto.DepartmentId.HasValue)
        {
            var deptExists = await _context.Departments.AnyAsync(d => d.Id == dto.DepartmentId.Value);
            if (!deptExists)
            {
                throw new KeyNotFoundException("Specified department does not exist");
            }
        }

        if (dto.DoctorId.HasValue)
        {
            var docExists = await _context.Doctors.AnyAsync(d => d.Id == dto.DoctorId.Value);
            if (!docExists)
            {
                throw new KeyNotFoundException("Specified doctor does not exist");
            }
        }

        assistant.DepartmentId = dto.DepartmentId;
        assistant.DoctorId = dto.DoctorId;
        assistant.PhoneNumber = dto.PhoneNumber != null ? dto.PhoneNumber.Trim() : assistant.PhoneNumber;
        assistant.Qualifications = dto.Qualifications?.Trim() ?? assistant.Qualifications;
        assistant.ShiftStart = dto.ShiftStart;
        assistant.ShiftEnd = dto.ShiftEnd;
        assistant.IsActive = dto.IsActive;

        await _context.SaveChangesAsync();
        return await GetAssistantById(assistant.Id);
    }

    public async Task<bool> DeleteAssistant(int id)
    {
        var assistant = await _context.Assistants
            .Include(a => a.User)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (assistant == null)
        {
            throw new KeyNotFoundException("Assistant not found");
        }

        if (assistant.User != null)
        {
            _context.Users.Remove(assistant.User);
        }
        else
        {
            _context.Assistants.Remove(assistant);
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<ResponseAssistantDto>> GetDoctorAssistants(int doctorUserId)
    {
        var doctor = await _context.Doctors
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.UserId == doctorUserId);

        if (doctor == null)
        {
            throw new KeyNotFoundException("Doctor profile not found");
        }

        return await _context.Assistants
            .AsNoTracking()
            .Include(a => a.User)
            .Include(a => a.Department)
            .Where(a => a.DoctorId == doctor.Id)
            .OrderBy(a => a.User!.Name)
            .Select(a => new ResponseAssistantDto
            {
                Id = a.Id,
                UserId = a.UserId,
                Name = a.User!.Name,
                Email = a.User.Email,
                PhoneNumber = a.PhoneNumber,
                DepartmentId = a.DepartmentId,
                DepartmentName = a.Department != null ? a.Department.Name : null,
                DoctorId = a.DoctorId,
                DoctorName = doctor.Specialization,
                Qualifications = a.Qualifications,
                ShiftStart = a.ShiftStart,
                ShiftEnd = a.ShiftEnd,
                IsActive = a.IsActive,
                CreatedAt = a.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<List<AssistantQueueItemDto>> GetTodayQueue(int assistantUserId)
    {
        var nowPkt = DateTime.UtcNow.AddHours(5);
        var todayPkt = DateOnly.FromDateTime(nowPkt);
        var nowTimePkt = TimeOnly.FromDateTime(nowPkt);

        var assistant = await _context.Assistants
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.UserId == assistantUserId);

        if (assistant == null)
        {
            throw new KeyNotFoundException("Assistant profile not found");
        }

        await _context.Appointments
            .Where(a => (a.Status == "Pending" || a.Status == "Confirmed") &&
                        (a.AppointmentDate < todayPkt || (a.AppointmentDate == todayPkt && a.TimeSlot < nowTimePkt)))
            .ExecuteUpdateAsync(s => s.SetProperty(a => a.Status, "Missed"));

        var query = _context.Appointments
            .AsNoTracking()
            .Include(a => a.Patient)!.ThenInclude(p => p.User)
            .Include(a => a.Doctor)!.ThenInclude(d => d.User)
            .Include(a => a.Doctor)!.ThenInclude(d => d.Department)
            .Include(a => a.Vitals)!.ThenInclude(v => v.Assistant)!.ThenInclude(ast => ast.User)
            .Where(a => a.AppointmentDate == todayPkt);

        if (assistant.DoctorId.HasValue)
        {
            query = query.Where(a => a.DoctorId == assistant.DoctorId.Value);
        }
        else if (assistant.DepartmentId.HasValue)
        {
            query = query.Where(a => a.Doctor!.DepartmentId == assistant.DepartmentId.Value);
        }

        var queue = await query
            .OrderByDescending(a => a.TimeSlot)
            .ThenByDescending(a => a.Id)
            .Select(a => new AssistantQueueItemDto
            {
                AppointmentId = a.Id,
                PatientId = a.PatientId,
                PatientName = a.Patient!.User!.Name,
                DoctorId = a.DoctorId,
                DoctorName = a.Doctor!.User!.Name,
                DepartmentName = a.Doctor.Department!.Name,
                AppointmentDate = a.AppointmentDate,
                TimeSlot = a.TimeSlot,
                Status = a.Status,
                HasVitals = a.Vitals != null,
                IsPast = a.AppointmentDate < todayPkt || (a.AppointmentDate == todayPkt && a.TimeSlot < nowTimePkt),
                CanRecordVitals = !(a.AppointmentDate < todayPkt || (a.AppointmentDate == todayPkt && a.TimeSlot < nowTimePkt.AddMinutes(-30))) &&
                                  a.Status != "Completed" && a.Status != "Cancelled" && a.Status != "Missed",
                Vitals = a.Vitals != null ? new ResponseVitalsDto
                {
                    Id = a.Vitals.Id,
                    AppointmentId = a.Vitals.AppointmentId,
                    PatientId = a.Vitals.PatientId,
                    PatientName = a.Patient.User.Name,
                    AssistantName = a.Vitals.Assistant!.User!.Name,
                    BloodPressure = a.Vitals.BloodPressure,
                    HeartRate = a.Vitals.HeartRate,
                    Temperature = a.Vitals.Temperature,
                    WeightKg = a.Vitals.WeightKg,
                    HeightCm = a.Vitals.HeightCm,
                    SpO2 = a.Vitals.SpO2,
                    BloodSugar = a.Vitals.BloodSugar,
                    TriageNotes = a.Vitals.TriageNotes,
                    RecordedAt = a.Vitals.RecordedAt
                } : null
            })
            .ToListAsync();

        return queue;
    }

    public async Task<ResponseVitalsDto> RecordVitals(CreateVitalsDto dto, int assistantUserId)
    {
        var assistant = await _context.Assistants
            .Include(a => a.User)
            .FirstOrDefaultAsync(a => a.UserId == assistantUserId);

        if (assistant == null)
        {
            throw new KeyNotFoundException("Assistant profile not found");
        }

        if (!assistant.IsActive)
        {
            throw new UnauthorizedAccessException("Assistant account is deactivated");
        }

        var appointment = await _context.Appointments
            .Include(a => a.Patient)!.ThenInclude(p => p.User)
            .FirstOrDefaultAsync(a => a.Id == dto.AppointmentId);

        if (appointment == null)
        {
            throw new KeyNotFoundException("Appointment not found");
        }

        var nowPkt = DateTime.UtcNow.AddHours(5);
        var todayPkt = DateOnly.FromDateTime(nowPkt);
        var nowTimePkt = TimeOnly.FromDateTime(nowPkt);

        var isPassed = appointment.AppointmentDate < todayPkt || 
                       (appointment.AppointmentDate == todayPkt && appointment.TimeSlot < nowTimePkt.AddMinutes(-30));

        if (isPassed || appointment.Status == "Completed" || appointment.Status == "Cancelled" || appointment.Status == "Missed")
        {
            throw new InvalidOperationException("Cannot record or modify vitals for past, completed, or cancelled appointments");
        }

        if (appointment.Status == "Confirmed" || appointment.Status == "Pending")
        {
            appointment.Status = "CheckedIn";
        }

        var existing = await _context.PatientVitals
            .FirstOrDefaultAsync(v => v.AppointmentId == dto.AppointmentId);

        if (existing != null)
        {
            existing.BloodPressure = dto.BloodPressure.Trim();
            existing.HeartRate = dto.HeartRate;
            existing.Temperature = dto.Temperature;
            existing.WeightKg = dto.WeightKg;
            existing.HeightCm = dto.HeightCm;
            existing.SpO2 = dto.SpO2;
            existing.BloodSugar = dto.BloodSugar.Trim();
            existing.TriageNotes = dto.TriageNotes.Trim();
            existing.AssistantId = assistant.Id;
            existing.RecordedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return MapVitals(existing, appointment.Patient!.User!.Name, assistant.User!.Name);
        }

        var vitals = new PatientVitals
        {
            AppointmentId = dto.AppointmentId,
            PatientId = appointment.PatientId,
            AssistantId = assistant.Id,
            BloodPressure = dto.BloodPressure.Trim(),
            HeartRate = dto.HeartRate,
            Temperature = dto.Temperature,
            WeightKg = dto.WeightKg,
            HeightCm = dto.HeightCm,
            SpO2 = dto.SpO2,
            BloodSugar = dto.BloodSugar.Trim(),
            TriageNotes = dto.TriageNotes.Trim(),
            RecordedAt = DateTime.UtcNow
        };

        await _context.PatientVitals.AddAsync(vitals);
        await _context.SaveChangesAsync();

        return MapVitals(vitals, appointment.Patient!.User!.Name, assistant.User!.Name);
    }

    public async Task<ResponseVitalsDto?> GetVitalsByAppointment(int appointmentId)
    {
        var vitals = await _context.PatientVitals
            .AsNoTracking()
            .Include(v => v.Patient)!.ThenInclude(p => p.User)
            .Include(v => v.Assistant)!.ThenInclude(a => a.User)
            .FirstOrDefaultAsync(v => v.AppointmentId == appointmentId);

        if (vitals == null)
        {
            return null;
        }

        return MapVitals(vitals, vitals.Patient!.User!.Name, vitals.Assistant!.User!.Name);
    }

    public async Task<ResponseLabOrderDto> CreateLabOrder(CreateLabOrderDto dto, int doctorUserId)
    {
        var doctor = await _context.Doctors
            .Include(d => d.User)
            .FirstOrDefaultAsync(d => d.UserId == doctorUserId);

        if (doctor == null)
        {
            throw new KeyNotFoundException("Doctor profile not found");
        }

        var appointment = await _context.Appointments
            .Include(a => a.Patient)!.ThenInclude(p => p.User)
            .FirstOrDefaultAsync(a => a.Id == dto.AppointmentId);

        if (appointment == null)
        {
            throw new KeyNotFoundException("Appointment not found");
        }

        if (appointment.Status == "Completed")
        {
            throw new InvalidOperationException("Cannot order lab tests for a completed appointment");
        }

        var lab = new Labs
        {
            AppointmentId = dto.AppointmentId,
            PatientId = appointment.PatientId,
            DoctorId = doctor.Id,
            TestName = dto.TestName.Trim(),
            ClinicalNotes = dto.ClinicalNotes.Trim(),
            Status = "Ordered",
            CreatedAt = DateTime.UtcNow
        };

        await _context.Labs.AddAsync(lab);
        await _context.SaveChangesAsync();

        return new ResponseLabOrderDto
        {
            Id = lab.Id,
            AppointmentId = lab.AppointmentId,
            PatientId = lab.PatientId,
            PatientName = appointment.Patient!.User!.Name,
            DoctorId = doctor.Id,
            DoctorName = doctor.User!.Name,
            TestName = lab.TestName,
            Status = lab.Status,
            ClinicalNotes = lab.ClinicalNotes,
            ResultsSummary = null,
            CreatedAt = lab.CreatedAt,
            CompletedAt = null,
            AppointmentStatus = appointment.Status,
            IsAppointmentCompleted = appointment.Status == "Completed"
        };
    }

    public async Task<List<ResponseLabOrderDto>> GetLabOrdersByAppointment(int appointmentId)
    {
        return await _context.Labs
            .AsNoTracking()
            .Include(l => l.Appointment)
            .Include(l => l.Patient)!.ThenInclude(p => p.User)
            .Include(l => l.Doctor)!.ThenInclude(d => d.User)
            .Where(l => l.AppointmentId == appointmentId)
            .OrderByDescending(l => l.CreatedAt)
            .Select(l => new ResponseLabOrderDto
            {
                Id = l.Id,
                AppointmentId = l.AppointmentId,
                PatientId = l.PatientId,
                PatientName = l.Patient!.User!.Name,
                DoctorId = l.DoctorId,
                DoctorName = l.Doctor!.User!.Name,
                TestName = l.TestName,
                Status = l.Status,
                ClinicalNotes = l.ClinicalNotes,
                ResultsSummary = l.ResultsSummary,
                CreatedAt = l.CreatedAt,
                CompletedAt = l.CompletedAt,
                AppointmentStatus = l.Appointment != null ? l.Appointment.Status : string.Empty,
                IsAppointmentCompleted = l.Appointment != null && l.Appointment.Status == "Completed"
            })
            .ToListAsync();
    }

    public async Task<List<ResponseLabOrderDto>> GetPendingLabOrders(int assistantUserId)
    {
        var assistant = await _context.Assistants
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.UserId == assistantUserId);

        var query = _context.Labs
            .AsNoTracking()
            .Include(l => l.Appointment)
            .Include(l => l.Patient)!.ThenInclude(p => p.User)
            .Include(l => l.Doctor)!.ThenInclude(d => d.User)
            .AsQueryable();

        if (assistant != null && assistant.DoctorId.HasValue)
        {
            query = query.Where(l => l.DoctorId == assistant.DoctorId.Value);
        }
        else if (assistant != null && assistant.DepartmentId.HasValue)
        {
            query = query.Where(l => l.Doctor!.DepartmentId == assistant.DepartmentId.Value);
        }

        return await query
            .OrderByDescending(l => l.CreatedAt)
            .Select(l => new ResponseLabOrderDto
            {
                Id = l.Id,
                AppointmentId = l.AppointmentId,
                PatientId = l.PatientId,
                PatientName = l.Patient!.User!.Name,
                DoctorId = l.DoctorId,
                DoctorName = l.Doctor!.User!.Name,
                TestName = l.TestName,
                Status = l.Status,
                ClinicalNotes = l.ClinicalNotes,
                ResultsSummary = l.ResultsSummary,
                CreatedAt = l.CreatedAt,
                CompletedAt = l.CompletedAt,
                AppointmentStatus = l.Appointment != null ? l.Appointment.Status : string.Empty,
                IsAppointmentCompleted = l.Appointment != null && l.Appointment.Status == "Completed"
            })
            .ToListAsync();
    }

    public async Task<ResponseLabOrderDto> UpdateLabOrderStatus(int labOrderId, UpdateLabStatusDto dto)
    {
        var lab = await _context.Labs
            .Include(l => l.Appointment)
            .Include(l => l.Patient)!.ThenInclude(p => p.User)
            .Include(l => l.Doctor)!.ThenInclude(d => d.User)
            .FirstOrDefaultAsync(l => l.Id == labOrderId);

        if (lab == null)
        {
            throw new KeyNotFoundException("Lab order not found");
        }

        if (lab.Appointment != null && lab.Appointment.Status == "Completed")
        {
            throw new InvalidOperationException("Cannot modify lab orders for completed appointments");
        }

        lab.Status = dto.Status.Trim();
        if (!string.IsNullOrEmpty(dto.ResultsSummary))
        {
            lab.ResultsSummary = dto.ResultsSummary.Trim();
        }

        if (dto.Status == "Completed")
        {
            lab.CompletedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        return new ResponseLabOrderDto
        {
            Id = lab.Id,
            AppointmentId = lab.AppointmentId,
            PatientId = lab.PatientId,
            PatientName = lab.Patient!.User!.Name,
            DoctorId = lab.DoctorId,
            DoctorName = lab.Doctor!.User!.Name,
            TestName = lab.TestName,
            Status = lab.Status,
            ClinicalNotes = lab.ClinicalNotes,
            ResultsSummary = lab.ResultsSummary,
            CreatedAt = lab.CreatedAt,
            CompletedAt = lab.CompletedAt,
            AppointmentStatus = lab.Appointment != null ? lab.Appointment.Status : string.Empty,
            IsAppointmentCompleted = lab.Appointment != null && lab.Appointment.Status == "Completed"
        };
    }

    public async Task<List<ResponseLabOrderDto>> GetPatientLabHistory(int patientId)
    {
        return await _context.Labs
            .AsNoTracking()
            .Include(l => l.Appointment)
            .Include(l => l.Patient)!.ThenInclude(p => p.User)
            .Include(l => l.Doctor)!.ThenInclude(d => d.User)
            .Where(l => l.PatientId == patientId)
            .OrderByDescending(l => l.CreatedAt)
            .Select(l => new ResponseLabOrderDto
            {
                Id = l.Id,
                AppointmentId = l.AppointmentId,
                PatientId = l.PatientId,
                PatientName = l.Patient!.User!.Name,
                DoctorId = l.DoctorId,
                DoctorName = l.Doctor!.User!.Name,
                TestName = l.TestName,
                Status = l.Status,
                ClinicalNotes = l.ClinicalNotes,
                ResultsSummary = l.ResultsSummary,
                CreatedAt = l.CreatedAt,
                CompletedAt = l.CompletedAt,
                AppointmentStatus = l.Appointment != null ? l.Appointment.Status : string.Empty,
                IsAppointmentCompleted = l.Appointment != null && l.Appointment.Status == "Completed"
            })
            .ToListAsync();
    }

    public async Task<AppointmentStatusResponseDto> CheckInPatient(int appointmentId, int assistantUserId)
    {
        var assistant = await _context.Assistants
            .FirstOrDefaultAsync(a => a.UserId == assistantUserId);

        if (assistant == null || !assistant.IsActive)
        {
            throw new UnauthorizedAccessException("Assistant account is not active or unauthorized");
        }

        var appointment = await _context.Appointments
            .FirstOrDefaultAsync(a => a.Id == appointmentId);

        if (appointment == null)
        {
            throw new KeyNotFoundException("Appointment not found");
        }

        var nowPkt = DateTime.UtcNow.AddHours(5);
        var todayPkt = DateOnly.FromDateTime(nowPkt);
        var nowTimePkt = TimeOnly.FromDateTime(nowPkt);

        if (appointment.AppointmentDate < todayPkt || 
            (appointment.AppointmentDate == todayPkt && appointment.TimeSlot < nowTimePkt.AddMinutes(-30)))
        {
            throw new InvalidOperationException("Cannot check in a past appointment");
        }

        if (appointment.Status == "Cancelled" || appointment.Status == "Missed" || appointment.Status == "Completed")
        {
            throw new InvalidOperationException($"Cannot check in an appointment with status '{appointment.Status}'");
        }

        appointment.Status = "CheckedIn";
        await _context.SaveChangesAsync();

        return new AppointmentStatusResponseDto
        {
            AppointmentId = appointment.Id,
            Status = appointment.Status
        };
    }

    private async Task<ResponseAssistantDto> GetAssistantById(int id)
    {
        var a = await _context.Assistants
            .AsNoTracking()
            .Include(ast => ast.User)
            .Include(ast => ast.Department)
            .Include(ast => ast.Doctor)!.ThenInclude(d => d.User)
            .FirstAsync(ast => ast.Id == id);

        return new ResponseAssistantDto
        {
            Id = a.Id,
            UserId = a.UserId,
            Name = a.User!.Name,
            Email = a.User.Email,
            PhoneNumber = a.PhoneNumber,
            DepartmentId = a.DepartmentId,
            DepartmentName = a.Department != null ? a.Department.Name : null,
            DoctorId = a.DoctorId,
            DoctorName = a.Doctor != null && a.Doctor.User != null ? a.Doctor.User.Name : null,
            Qualifications = a.Qualifications,
            ShiftStart = a.ShiftStart,
            ShiftEnd = a.ShiftEnd,
            IsActive = a.IsActive,
            CreatedAt = a.CreatedAt
        };
    }

    public async Task<ResponseAssistantBookingDto> BookAssistedAppointment(AssistantBookAppointmentDto dto, int assistantUserId)
    {
        var assistant = await _context.Assistants
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.UserId == assistantUserId);

        if (assistant == null)
        {
            throw new KeyNotFoundException("Assistant profile not found");
        }

        if (!assistant.IsActive)
        {
            throw new InvalidOperationException("Inactive assistant profile cannot perform appointment booking");
        }

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

        int? allowedDeptId = assistant.DepartmentId;
        if (!allowedDeptId.HasValue && assistant.DoctorId.HasValue)
        {
            var assignedDoc = await _context.Doctors.AsNoTracking().FirstOrDefaultAsync(d => d.Id == assistant.DoctorId.Value);
            if (assignedDoc != null)
            {
                allowedDeptId = assignedDoc.DepartmentId;
            }
        }

        if (allowedDeptId.HasValue && doctor.DepartmentId != allowedDeptId.Value)
        {
            throw new UnauthorizedAccessException("You are only authorized to schedule appointments for physicians within your assigned department");
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
            throw new DuplicateNameException("This time slot is already booked");
        }

        var cleanPhone = dto.PatientPhone.Trim();
        var cleanName = dto.PatientName.Trim();

        var patient = await _context.Patient
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.PhoneNumber == cleanPhone && 
                p.User != null && p.User.Name.ToLower() == cleanName.ToLower());

        if (patient == null)
        {
            var safeDigits = cleanPhone.Replace("+", "").Replace("-", "").Replace(" ", "");
            var safeNameSlug = System.Text.RegularExpressions.Regex.Replace(cleanName.ToLower(), @"[^a-z0-9]", "");
            var cleanEmail = !string.IsNullOrWhiteSpace(dto.PatientEmail)
                ? dto.PatientEmail.Trim().ToLower()
                : $"walkin.{safeDigits}.{safeNameSlug}@careflow.hospital";

            var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == cleanEmail);
            User user;
            if (existingUser != null)
            {
                user = existingUser;
            }
            else
            {
                user = new User
                {
                    Name = cleanName,
                    Email = cleanEmail,
                    Password = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString("N")[..8]),
                    Role = "Patient",
                    IsVerified = true,
                    CreatedAt = DateTime.UtcNow
                };
                await _context.Users.AddAsync(user);
                await _context.SaveChangesAsync();
            }

            patient = await _context.Patient.FirstOrDefaultAsync(p => p.UserId == user.Id);
            if (patient == null)
            {
                patient = new Patient
                {
                    UserId = user.Id,
                    PhoneNumber = cleanPhone,
                    EmergencyContact = cleanPhone,
                    Gender = !string.IsNullOrWhiteSpace(dto.Gender) ? dto.Gender.Trim() : "Other",
                    BloodGroup = !string.IsNullOrWhiteSpace(dto.BloodGroup) ? dto.BloodGroup.Trim() : "N/A",
                    DateOfBirth = dto.DateOfBirth ?? DateOnly.FromDateTime(DateTime.UtcNow.AddYears(-30)),
                    CreatedAt = DateTime.UtcNow
                };
                await _context.Patient.AddAsync(patient);
                await _context.SaveChangesAsync();
            }
        }

        var appointment = new Appointment
        {
            PatientId = patient.Id,
            DoctorId = doctor.Id,
            AppointmentDate = dto.AppointmentDate,
            TimeSlot = dto.TimeSlot,
            Symptoms = !string.IsNullOrWhiteSpace(dto.Symptoms) ? dto.Symptoms.Trim() : "Phone Booking via Assistant",
            Status = "Confirmed"
        };

        await _context.Appointments.AddAsync(appointment);
        await _context.SaveChangesAsync();

        return new ResponseAssistantBookingDto
        {
            AppointmentId = appointment.Id,
            PatientId = patient.Id,
            PatientName = patient.User != null ? patient.User.Name : dto.PatientName.Trim(),
            PatientPhone = patient.PhoneNumber,
            DoctorId = doctor.Id,
            DoctorName = doctor.User!.Name,
            DepartmentName = doctor.Department != null ? doctor.Department.Name : string.Empty,
            AppointmentDate = appointment.AppointmentDate,
            TimeSlot = appointment.TimeSlot,
            Status = appointment.Status,
            Symptoms = appointment.Symptoms
        };
    }

    public async Task<List<FindDoctorResponse>> GetSchedulableDoctors(int assistantUserId)
    {
        var assistant = await _context.Assistants
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.UserId == assistantUserId);

        if (assistant == null)
        {
            throw new KeyNotFoundException("Assistant profile not found");
        }

        var query = _context.Doctors
            .AsNoTracking()
            .Include(d => d.User)
            .Include(d => d.Department)
            .Where(d => d.User!.IsVerified);

        int? allowedDeptId = assistant.DepartmentId;
        if (!allowedDeptId.HasValue && assistant.DoctorId.HasValue)
        {
            var assignedDoc = await _context.Doctors.AsNoTracking().FirstOrDefaultAsync(d => d.Id == assistant.DoctorId.Value);
            if (assignedDoc != null)
            {
                allowedDeptId = assignedDoc.DepartmentId;
            }
        }

        if (allowedDeptId.HasValue)
        {
            query = query.Where(d => d.DepartmentId == allowedDeptId.Value);
        }

        return await query
            .OrderBy(d => d.User!.Name)
            .Select(d => new FindDoctorResponse
            {
                Id = d.Id,
                Name = d.User!.Name,
                DepartmentId = d.DepartmentId,
                DepartmentName = d.Department != null ? d.Department.Name : string.Empty,
                Specialization = d.Specialization,
                Qualifications = d.Qualifications,
                ExperienceYears = d.ExperienceYears,
                ConsultationFee = d.ConsultationFee,
                ShiftStart = d.ShiftStart,
                ShiftEnd = d.ShiftEnd
            })
            .ToListAsync();
    }

    private static ResponseVitalsDto MapVitals(PatientVitals v, string patientName, string assistantName) =>
        new ResponseVitalsDto
        {
            Id = v.Id,
            AppointmentId = v.AppointmentId,
            PatientId = v.PatientId,
            PatientName = patientName,
            AssistantName = assistantName,
            BloodPressure = v.BloodPressure,
            HeartRate = v.HeartRate,
            Temperature = v.Temperature,
            WeightKg = v.WeightKg,
            HeightCm = v.HeightCm,
            SpO2 = v.SpO2,
            BloodSugar = v.BloodSugar,
            TriageNotes = v.TriageNotes,
            RecordedAt = v.RecordedAt
        };
}
