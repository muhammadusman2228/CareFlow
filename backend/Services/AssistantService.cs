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

        var departmentIds = (dto.DepartmentIds != null && dto.DepartmentIds.Count > 0)
            ? dto.DepartmentIds.Distinct().ToList()
            : (dto.DepartmentId.HasValue ? new List<int> { dto.DepartmentId.Value } : new List<int>());

        if (departmentIds.Count == 0 && !dto.DoctorId.HasValue)
        {
            throw new KeyNotFoundException("Please select at least one department for the assistant");
        }

        if (departmentIds.Count > 0)
        {
            var validDeptsCount = await _context.Departments.CountAsync(d => departmentIds.Contains(d.Id));
            if (validDeptsCount != departmentIds.Count)
            {
                throw new KeyNotFoundException("One or more specified departments do not exist");
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

        var primaryDeptId = departmentIds.Count > 0 ? departmentIds.First() : (int?)null;

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
            DepartmentId = primaryDeptId,
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

        foreach (var dId in departmentIds)
        {
            await _context.AssistantDepartments.AddAsync(new AssistantDepartment
            {
                AssistantId = assistant.Id,
                DepartmentId = dId
            });
        }
        await _context.SaveChangesAsync();

        return await GetAssistantById(assistant.Id);
    }

    public async Task<List<ResponseAssistantDto>> GetAllAssistants()
    {
        var list = await _context.Assistants
            .AsNoTracking()
            .Include(a => a.User)
            .Include(a => a.Department)
            .Include(a => a.AssistantDepartments).ThenInclude(ad => ad.Department)
            .Include(a => a.Doctor)!.ThenInclude(d => d.User)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();

        var allDocsRaw = await _context.Doctors
            .AsNoTracking()
            .Where(d => d.User!.IsVerified)
            .Select(d => new
            {
                d.Id,
                Name = d.User!.Name,
                d.DepartmentId,
                OtherDeptIds = d.DoctorDepartments.Select(dd => dd.DepartmentId).ToList()
            })
            .ToListAsync();

        var allDocs = allDocsRaw.Select(d => new
        {
            d.Id,
            d.Name,
            DeptIds = d.OtherDeptIds.Append(d.DepartmentId).Distinct().ToList()
        }).ToList();

        return list.Select(a =>
        {
            var deptIds = a.AssistantDepartments.Select(ad => ad.DepartmentId).ToList();
            if (a.DepartmentId.HasValue && !deptIds.Contains(a.DepartmentId.Value))
            {
                deptIds.Add(a.DepartmentId.Value);
            }

            var deptNames = a.AssistantDepartments
                .Where(ad => ad.Department != null)
                .Select(ad => ad.Department!.Name)
                .ToList();
            if (a.Department != null && !deptNames.Contains(a.Department.Name))
            {
                deptNames.Add(a.Department.Name);
            }

            var assignedDoctors = allDocs
                .Where(d => deptIds.Any(did => d.DeptIds.Contains(did)) || (a.DoctorId.HasValue && d.Id == a.DoctorId.Value))
                .Select(d => d.Name)
                .Distinct()
                .ToList();

            return new ResponseAssistantDto
            {
                Id = a.Id,
                UserId = a.UserId,
                Name = a.User!.Name,
                Email = a.User.Email,
                PhoneNumber = a.PhoneNumber,
                DepartmentId = a.DepartmentId,
                DepartmentName = a.Department != null ? a.Department.Name : (deptNames.FirstOrDefault()),
                DepartmentIds = deptIds,
                DepartmentNames = deptNames,
                DoctorId = a.DoctorId,
                DoctorName = a.Doctor != null && a.Doctor.User != null ? a.Doctor.User.Name : null,
                AssignedDoctorNames = assignedDoctors,
                AssignedDoctorsCount = assignedDoctors.Count,
                Qualifications = a.Qualifications,
                ShiftStart = a.ShiftStart,
                ShiftEnd = a.ShiftEnd,
                IsActive = a.IsActive,
                CreatedAt = a.CreatedAt
            };
        }).ToList();
    }

    public async Task<ResponseAssistantDto> UpdateAssistant(int id, UpdateAssistantDto dto)
    {
        var assistant = await _context.Assistants
            .Include(a => a.User)
            .Include(a => a.AssistantDepartments)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (assistant == null)
        {
            throw new KeyNotFoundException("Assistant profile not found");
        }

        var departmentIds = (dto.DepartmentIds != null && dto.DepartmentIds.Count > 0)
            ? dto.DepartmentIds.Distinct().ToList()
            : (dto.DepartmentId.HasValue ? new List<int> { dto.DepartmentId.Value } : new List<int>());

        if (departmentIds.Count > 0)
        {
            var validDeptsCount = await _context.Departments.CountAsync(d => departmentIds.Contains(d.Id));
            if (validDeptsCount != departmentIds.Count)
            {
                throw new KeyNotFoundException("One or more specified departments do not exist");
            }

            assistant.DepartmentId = departmentIds.First();

            _context.AssistantDepartments.RemoveRange(assistant.AssistantDepartments);
            foreach (var dId in departmentIds)
            {
                assistant.AssistantDepartments.Add(new AssistantDepartment
                {
                    AssistantId = assistant.Id,
                    DepartmentId = dId
                });
            }
        }
        else if (dto.DepartmentId.HasValue)
        {
            var deptExists = await _context.Departments.AnyAsync(d => d.Id == dto.DepartmentId.Value);
            if (!deptExists)
            {
                throw new KeyNotFoundException("Specified department does not exist");
            }
            assistant.DepartmentId = dto.DepartmentId;
        }

        if (dto.DoctorId.HasValue)
        {
            var docExists = await _context.Doctors.AnyAsync(d => d.Id == dto.DoctorId.Value);
            if (!docExists)
            {
                throw new KeyNotFoundException("Specified doctor does not exist");
            }
        }

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
            var sessions = await _context.Session.Where(s => s.UserId == assistant.User.Id).ToListAsync();
            if (sessions.Any())
            {
                _context.Session.RemoveRange(sessions);
            }

            var verifications = await _context.Verification.Where(v => v.Email == assistant.User.Email).ToListAsync();
            if (verifications.Any())
            {
                _context.Verification.RemoveRange(verifications);
            }

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
            .Include(a => a.AssistantDepartments)
            .FirstOrDefaultAsync(a => a.UserId == assistantUserId);

        if (assistant == null)
        {
            throw new KeyNotFoundException("Assistant profile not found");
        }

        await _context.Appointments
            .Where(a => (a.Status == "Booked" || a.Status == "Pending" || a.Status == "Confirmed") &&
                        (a.AppointmentDate < todayPkt || (a.AppointmentDate == todayPkt && a.TimeSlot < nowTimePkt)))
            .ExecuteUpdateAsync(s => s.SetProperty(a => a.Status, "Missed"));

        var deptIds = assistant.AssistantDepartments.Select(ad => ad.DepartmentId).ToList();
        if (assistant.DepartmentId.HasValue && !deptIds.Contains(assistant.DepartmentId.Value))
        {
            deptIds.Add(assistant.DepartmentId.Value);
        }

        var query = _context.Appointments
            .AsNoTracking()
            .Include(a => a.Patient)!.ThenInclude(p => p.User)
            .Include(a => a.Doctor)!.ThenInclude(d => d.User)
            .Include(a => a.Doctor)!.ThenInclude(d => d.Department)
            .Include(a => a.Doctor)!.ThenInclude(d => d.DoctorDepartments)
            .Include(a => a.OriginalDoctor)!.ThenInclude(od => od.User)
            .Include(a => a.Vitals)!.ThenInclude(v => v.Assistant)!.ThenInclude(ast => ast.User)
            .Where(a => a.AppointmentDate == todayPkt);

        if (assistant.DoctorId.HasValue)
        {
            query = query.Where(a => a.DoctorId == assistant.DoctorId.Value || deptIds.Contains(a.Doctor!.DepartmentId) || a.Doctor!.DoctorDepartments.Any(dd => deptIds.Contains(dd.DepartmentId)));
        }
        else if (deptIds.Count > 0)
        {
            query = query.Where(a => deptIds.Contains(a.Doctor!.DepartmentId) || a.Doctor!.DoctorDepartments.Any(dd => deptIds.Contains(dd.DepartmentId)));
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
                IsDoctorLateToday = a.Doctor != null && a.Doctor.DailyStatusDate == todayPkt && a.Doctor.IsLateToday,
                DoctorDelayMinutes = a.Doctor != null && a.Doctor.DailyStatusDate == todayPkt && a.Doctor.IsLateToday ? a.Doctor.DelayMinutes : 0,
                DoctorDelayReason = a.Doctor != null && a.Doctor.DailyStatusDate == todayPkt ? a.Doctor.DelayReason : null,
                DoctorDailyStatus = a.Doctor != null && a.Doctor.DailyStatusDate == todayPkt ? a.Doctor.DailyStatus : "OnDuty",
                IsDiverted = a.IsDiverted,
                OriginalDoctorId = a.OriginalDoctorId,
                OriginalDoctorName = a.OriginalDoctor != null && a.OriginalDoctor.User != null ? a.OriginalDoctor.User.Name : null,
                DiversionReason = a.DiversionReason,
                DivertedBy = a.DivertedBy,
                DivertedAt = a.DivertedAt,
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

        if (appointment.Status == "Booked" || appointment.Status == "Confirmed" || appointment.Status == "Pending")
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
            .Include(a => a.AssistantDepartments)
            .FirstOrDefaultAsync(a => a.UserId == assistantUserId);

        var deptIds = assistant != null
            ? assistant.AssistantDepartments.Select(ad => ad.DepartmentId).ToList()
            : new List<int>();
        if (assistant != null && assistant.DepartmentId.HasValue && !deptIds.Contains(assistant.DepartmentId.Value))
        {
            deptIds.Add(assistant.DepartmentId.Value);
        }

        var query = _context.Labs
            .AsNoTracking()
            .Include(l => l.Appointment)
            .Include(l => l.Patient)!.ThenInclude(p => p.User)
            .Include(l => l.Doctor)!.ThenInclude(d => d.User)
            .Include(l => l.Doctor)!.ThenInclude(d => d.DoctorDepartments)
            .AsQueryable();

        if (assistant != null && assistant.DoctorId.HasValue)
        {
            query = query.Where(l => l.DoctorId == assistant.DoctorId.Value || deptIds.Contains(l.Doctor!.DepartmentId) || l.Doctor!.DoctorDepartments.Any(dd => deptIds.Contains(dd.DepartmentId)));
        }
        else if (deptIds.Count > 0)
        {
            query = query.Where(l => deptIds.Contains(l.Doctor!.DepartmentId) || l.Doctor!.DoctorDepartments.Any(dd => deptIds.Contains(dd.DepartmentId)));
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
            .Include(ast => ast.AssistantDepartments).ThenInclude(ad => ad.Department)
            .Include(ast => ast.Doctor)!.ThenInclude(d => d.User)
            .FirstAsync(ast => ast.Id == id);

        var deptIds = a.AssistantDepartments.Select(ad => ad.DepartmentId).ToList();
        if (a.DepartmentId.HasValue && !deptIds.Contains(a.DepartmentId.Value))
        {
            deptIds.Add(a.DepartmentId.Value);
        }

        var deptNames = a.AssistantDepartments
            .Where(ad => ad.Department != null)
            .Select(ad => ad.Department!.Name)
            .ToList();
        if (a.Department != null && !deptNames.Contains(a.Department.Name))
        {
            deptNames.Add(a.Department.Name);
        }

        var assignedDoctors = await _context.Doctors
            .AsNoTracking()
            .Include(d => d.User)
            .Include(d => d.DoctorDepartments)
            .Where(d => d.User!.IsVerified && (deptIds.Contains(d.DepartmentId) || d.DoctorDepartments.Any(dd => deptIds.Contains(dd.DepartmentId)) || (a.DoctorId.HasValue && d.Id == a.DoctorId.Value)))
            .Select(d => d.User!.Name)
            .Distinct()
            .ToListAsync();

        return new ResponseAssistantDto
        {
            Id = a.Id,
            UserId = a.UserId,
            Name = a.User!.Name,
            Email = a.User.Email,
            PhoneNumber = a.PhoneNumber,
            DepartmentId = a.DepartmentId,
            DepartmentName = a.Department != null ? a.Department.Name : (deptNames.FirstOrDefault()),
            DepartmentIds = deptIds,
            DepartmentNames = deptNames,
            DoctorId = a.DoctorId,
            DoctorName = a.Doctor != null && a.Doctor.User != null ? a.Doctor.User.Name : null,
            AssignedDoctorNames = assignedDoctors,
            AssignedDoctorsCount = assignedDoctors.Count,
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
            .Include(a => a.AssistantDepartments)
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
            .Include(d => d.DoctorDepartments)
            .FirstOrDefaultAsync(d => d.Id == dto.DoctorId && d.User!.IsVerified);

        if (doctor == null)
        {
            throw new KeyNotFoundException("Doctor does not exist or is not verified");
        }

        var allowedDeptIds = assistant.AssistantDepartments.Select(ad => ad.DepartmentId).ToList();
        if (assistant.DepartmentId.HasValue && !allowedDeptIds.Contains(assistant.DepartmentId.Value))
        {
            allowedDeptIds.Add(assistant.DepartmentId.Value);
        }
        if (allowedDeptIds.Count == 0 && assistant.DoctorId.HasValue)
        {
            var assignedDoc = await _context.Doctors.AsNoTracking().FirstOrDefaultAsync(d => d.Id == assistant.DoctorId.Value);
            if (assignedDoc != null)
            {
                allowedDeptIds.Add(assignedDoc.DepartmentId);
            }
        }

        var isDoctorInAllowedDept = allowedDeptIds.Count == 0 ||
                                    allowedDeptIds.Contains(doctor.DepartmentId) ||
                                    doctor.DoctorDepartments.Any(dd => allowedDeptIds.Contains(dd.DepartmentId));

        if (!isDoctorInAllowedDept)
        {
            throw new UnauthorizedAccessException("You are only authorized to schedule appointments for physicians within your assigned department pool");
        }

        if (dto.TimeSlot < doctor.ShiftStart || dto.TimeSlot >= doctor.ShiftEnd)
        {
            throw new InvalidOperationException("Selected time slot is outside the doctor's shift hours");
        }

        var isAlreadyBooked = await _context.Appointments.AnyAsync(u => 
            u.DoctorId == dto.DoctorId && 
            u.AppointmentDate == dto.AppointmentDate && 
            u.TimeSlot == dto.TimeSlot && 
            (u.Status == "Booked" || u.Status == "Confirmed" || u.Status == "Pending" || u.Status == "CheckedIn" || u.Status == "Completed"));

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
            Status = "Booked"
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
            .Include(a => a.AssistantDepartments)
            .FirstOrDefaultAsync(a => a.UserId == assistantUserId);

        if (assistant == null)
        {
            throw new KeyNotFoundException("Assistant profile not found");
        }

        var deptIds = assistant.AssistantDepartments.Select(ad => ad.DepartmentId).ToList();
        if (assistant.DepartmentId.HasValue && !deptIds.Contains(assistant.DepartmentId.Value))
        {
            deptIds.Add(assistant.DepartmentId.Value);
        }

        if (deptIds.Count == 0 && assistant.DoctorId.HasValue)
        {
            var assignedDoc = await _context.Doctors.AsNoTracking().FirstOrDefaultAsync(d => d.Id == assistant.DoctorId.Value);
            if (assignedDoc != null)
            {
                deptIds.Add(assignedDoc.DepartmentId);
            }
        }

        var query = _context.Doctors
            .AsNoTracking()
            .Include(d => d.User)
            .Include(d => d.Department)
            .Include(d => d.DoctorDepartments).ThenInclude(dd => dd.Department)
            .Where(d => d.User!.IsVerified);

        if (deptIds.Count > 0)
        {
            query = query.Where(d => deptIds.Contains(d.DepartmentId) || d.DoctorDepartments.Any(dd => deptIds.Contains(dd.DepartmentId)));
        }

        return await query
            .OrderBy(d => d.User!.Name)
            .Select(d => new FindDoctorResponse
            {
                Id = d.Id,
                Name = d.User!.Name,
                DepartmentId = d.DepartmentId,
                DepartmentName = d.Department != null ? d.Department.Name : string.Empty,
                DepartmentIds = d.DoctorDepartments.Select(dd => dd.DepartmentId).ToList(),
                DepartmentNames = d.DoctorDepartments.Select(dd => dd.Department!.Name).ToList(),
                Specialization = d.Specialization,
                Qualifications = d.Qualifications,
                ExperienceYears = d.ExperienceYears,
                ConsultationFee = d.ConsultationFee,
                ShiftStart = d.ShiftStart,
                ShiftEnd = d.ShiftEnd
            })
            .ToListAsync();
    }

    public async Task<List<AssistantDepartmentDoctorDto>> GetDepartmentDoctors(int assistantUserId)
    {
        var assistant = await _context.Assistants
            .AsNoTracking()
            .Include(a => a.AssistantDepartments)
            .FirstOrDefaultAsync(a => a.UserId == assistantUserId);

        if (assistant == null)
        {
            throw new KeyNotFoundException("Assistant profile not found");
        }

        var deptIds = assistant.AssistantDepartments.Select(ad => ad.DepartmentId).ToList();
        if (assistant.DepartmentId.HasValue && !deptIds.Contains(assistant.DepartmentId.Value))
        {
            deptIds.Add(assistant.DepartmentId.Value);
        }
        if (deptIds.Count == 0 && assistant.DoctorId.HasValue)
        {
            var assignedDoc = await _context.Doctors.AsNoTracking().FirstOrDefaultAsync(d => d.Id == assistant.DoctorId.Value);
            if (assignedDoc != null)
            {
                deptIds.Add(assignedDoc.DepartmentId);
            }
        }

        var nowPkt = DateTime.UtcNow.AddHours(5);
        var todayPkt = DateOnly.FromDateTime(nowPkt);

        var query = _context.Doctors
            .AsNoTracking()
            .Include(d => d.User)
            .Include(d => d.Department)
            .Include(d => d.DoctorDepartments).ThenInclude(dd => dd.Department)
            .Where(d => d.User!.IsVerified);

        if (deptIds.Count > 0)
        {
            query = query.Where(d => deptIds.Contains(d.DepartmentId) || d.DoctorDepartments.Any(dd => deptIds.Contains(dd.DepartmentId)));
        }

        return await query
            .OrderBy(d => d.User!.Name)
            .Select(d => new AssistantDepartmentDoctorDto
            {
                DoctorId = d.Id,
                DoctorName = d.User!.Name,
                DepartmentName = d.Department != null ? d.Department.Name : string.Empty,
                Specialization = d.Specialization,
                ShiftStart = d.ShiftStart,
                ShiftEnd = d.ShiftEnd,
                IsAvailable = d.IsAvailable,
                TodayAppointmentsCount = d.Appointments.Count(a => a.AppointmentDate == todayPkt && a.Status != "Cancelled"),
                DailyStatus = d.DailyStatusDate == todayPkt ? d.DailyStatus : "OnDuty",
                IsLateToday = d.DailyStatusDate == todayPkt && d.IsLateToday,
                DelayMinutes = d.DailyStatusDate == todayPkt && d.IsLateToday ? d.DelayMinutes : 0,
                DelayReason = d.DailyStatusDate == todayPkt ? d.DelayReason : null
            })
            .ToListAsync();
    }

    public async Task<DiversionCandidatesResponseDto> GetDiversionCandidates(int appointmentId, int assistantUserId)
    {
        var assistant = await _context.Assistants
            .AsNoTracking()
            .Include(a => a.AssistantDepartments)
            .FirstOrDefaultAsync(a => a.UserId == assistantUserId);

        if (assistant == null)
        {
            throw new KeyNotFoundException("Assistant profile not found");
        }

        var deptIds = assistant.AssistantDepartments.Select(ad => ad.DepartmentId).ToList();
        if (assistant.DepartmentId.HasValue && !deptIds.Contains(assistant.DepartmentId.Value))
        {
            deptIds.Add(assistant.DepartmentId.Value);
        }

        var appointment = await _context.Appointments
            .AsNoTracking()
            .Include(a => a.Patient)!.ThenInclude(p => p.User)
            .Include(a => a.Doctor)!.ThenInclude(d => d.User)
            .Include(a => a.Doctor)!.ThenInclude(d => d.Department)
            .Include(a => a.Doctor)!.ThenInclude(d => d.DoctorDepartments)
            .FirstOrDefaultAsync(a => a.Id == appointmentId);

        if (appointment == null)
        {
            throw new KeyNotFoundException("Appointment not found");
        }

        var nowPkt = DateTime.UtcNow.AddHours(5);
        var todayPkt = DateOnly.FromDateTime(nowPkt);
        var nowTimePkt = TimeOnly.FromDateTime(nowPkt);

        if (appointment.AppointmentDate != todayPkt)
        {
            throw new InvalidOperationException("Live diversion is only allowed for today's appointments. Future appointments must be rescheduled by the administrator.");
        }

        var docDepts = new List<int> { appointment.Doctor!.DepartmentId };
        docDepts.AddRange(appointment.Doctor.DoctorDepartments.Select(dd => dd.DepartmentId));
        docDepts = docDepts.Distinct().ToList();

        if (deptIds.Count > 0 && !deptIds.Intersect(docDepts).Any())
        {
            throw new UnauthorizedAccessException("You do not have permission to manage appointments for this doctor's department");
        }

        var sameDocBooked = await _context.Appointments
            .AsNoTracking()
            .Where(a => a.DoctorId == appointment.DoctorId &&
                        a.AppointmentDate == todayPkt &&
                        a.Id != appointment.Id &&
                        (a.Status == "Booked" || a.Status == "Confirmed" || a.Status == "Pending" || a.Status == "Completed" || a.Status == "CheckedIn"))
            .Select(a => a.TimeSlot)
            .ToListAsync();

        var sameDocAllSlots = GenerateSlots(appointment.Doctor.ShiftStart, appointment.Doctor.ShiftEnd);
        var sameDocAltSlots = sameDocAllSlots
            .Where(s => s > nowTimePkt && !sameDocBooked.Contains(s))
            .ToList();

        var peerDoctorsList = await _context.Doctors
            .AsNoTracking()
            .Include(d => d.User)
            .Include(d => d.Department)
            .Include(d => d.DoctorDepartments).ThenInclude(dd => dd.Department)
            .Where(d => d.Id != appointment.DoctorId && d.User!.IsVerified &&
                        (docDepts.Contains(d.DepartmentId) || d.DoctorDepartments.Any(dd => docDepts.Contains(dd.DepartmentId))))
            .OrderBy(d => d.User!.Name)
            .ToListAsync();

        var peerDoctorIds = peerDoctorsList.Select(d => d.Id).ToList();
        var peerBookings = await _context.Appointments
            .AsNoTracking()
            .Where(a => peerDoctorIds.Contains(a.DoctorId) &&
                        a.AppointmentDate == todayPkt &&
                        (a.Status == "Booked" || a.Status == "Confirmed" || a.Status == "Pending" || a.Status == "Completed" || a.Status == "CheckedIn"))
            .Select(a => new { a.DoctorId, a.TimeSlot })
            .ToListAsync();

        var peerCandidates = new List<DiversionCandidateDoctorDto>();
        foreach (var peer in peerDoctorsList)
        {
            var isPeerToday = peer.DailyStatusDate == todayPkt;
            var peerDailyStatus = isPeerToday ? peer.DailyStatus : "OnDuty";
            var isOnDuty = peer.IsAvailable && peerDailyStatus != "OffDuty";

            var bookedForPeer = peerBookings
                .Where(b => b.DoctorId == peer.Id)
                .Select(b => b.TimeSlot)
                .ToHashSet();

            var isFreeAtCurrentSlot = isOnDuty &&
                                      appointment.TimeSlot >= peer.ShiftStart &&
                                      appointment.TimeSlot < peer.ShiftEnd &&
                                      !bookedForPeer.Contains(appointment.TimeSlot);

            var peerSlots = GenerateSlots(peer.ShiftStart, peer.ShiftEnd)
                .Where(s => (s > nowTimePkt || s == appointment.TimeSlot) && !bookedForPeer.Contains(s))
                .ToList();

            peerCandidates.Add(new DiversionCandidateDoctorDto
            {
                DoctorId = peer.Id,
                DoctorName = peer.User != null ? peer.User.Name : string.Empty,
                Specialization = peer.Specialization,
                DepartmentName = peer.Department != null ? peer.Department.Name : string.Empty,
                IsFreeAtTargetSlot = isFreeAtCurrentSlot,
                IsOnDuty = isOnDuty,
                DailyStatus = peerDailyStatus,
                AvailableSlots = isOnDuty ? peerSlots : new List<TimeOnly>()
            });
        }

        var isDocToday = appointment.Doctor.DailyStatusDate == todayPkt;
        return new DiversionCandidatesResponseDto
        {
            AppointmentId = appointment.Id,
            PatientId = appointment.PatientId,
            PatientName = appointment.Patient != null && appointment.Patient.User != null ? appointment.Patient.User.Name : "Patient",
            CurrentDoctorId = appointment.DoctorId,
            CurrentDoctorName = appointment.Doctor.User != null ? appointment.Doctor.User.Name : string.Empty,
            DepartmentName = appointment.Doctor.Department != null ? appointment.Doctor.Department.Name : string.Empty,
            AppointmentDate = appointment.AppointmentDate,
            CurrentTimeSlot = appointment.TimeSlot,
            IsCurrentDoctorLate = isDocToday && appointment.Doctor.IsLateToday,
            CurrentDoctorDelayMinutes = isDocToday && appointment.Doctor.IsLateToday ? appointment.Doctor.DelayMinutes : 0,
            CurrentDoctorDelayReason = isDocToday ? appointment.Doctor.DelayReason : null,
            SameDoctorAlternativeSlots = sameDocAltSlots,
            PeerDoctors = peerCandidates
        };
    }

    public async Task<DivertAppointmentResponseDto> DivertTodayAppointment(DivertAppointmentDto dto, int assistantUserId)
    {
        var assistant = await _context.Assistants
            .Include(a => a.User)
            .Include(a => a.AssistantDepartments)
            .FirstOrDefaultAsync(a => a.UserId == assistantUserId);

        if (assistant == null)
        {
            throw new KeyNotFoundException("Assistant profile not found");
        }

        if (!assistant.IsActive)
        {
            throw new UnauthorizedAccessException("Assistant account is deactivated");
        }

        var deptIds = assistant.AssistantDepartments.Select(ad => ad.DepartmentId).ToList();
        if (assistant.DepartmentId.HasValue && !deptIds.Contains(assistant.DepartmentId.Value))
        {
            deptIds.Add(assistant.DepartmentId.Value);
        }

        var appointment = await _context.Appointments
            .Include(a => a.Patient)!.ThenInclude(p => p.User)
            .Include(a => a.Doctor)!.ThenInclude(d => d.User)
            .Include(a => a.Doctor)!.ThenInclude(d => d.DoctorDepartments)
            .FirstOrDefaultAsync(a => a.Id == dto.AppointmentId);

        if (appointment == null)
        {
            throw new KeyNotFoundException("Appointment not found");
        }

        if (appointment.Status == "Completed" || appointment.Status == "Cancelled" || appointment.Status == "Missed")
        {
            throw new InvalidOperationException($"Cannot divert an appointment with status '{appointment.Status}'");
        }

        var nowPkt = DateTime.UtcNow.AddHours(5);
        var todayPkt = DateOnly.FromDateTime(nowPkt);
        var nowTimePkt = TimeOnly.FromDateTime(nowPkt);

        if (appointment.AppointmentDate != todayPkt)
        {
            throw new InvalidOperationException("Live diversion is only allowed for today's appointments. Future appointments must be diverted by the administrator.");
        }

        var docDepts = new List<int> { appointment.Doctor!.DepartmentId };
        docDepts.AddRange(appointment.Doctor.DoctorDepartments.Select(dd => dd.DepartmentId));
        docDepts = docDepts.Distinct().ToList();

        if (deptIds.Count > 0 && !deptIds.Intersect(docDepts).Any())
        {
            throw new UnauthorizedAccessException("You do not have permission to manage appointments for this department");
        }

        var targetDoctor = await _context.Doctors
            .Include(d => d.User)
            .Include(d => d.Department)
            .Include(d => d.DoctorDepartments)
            .FirstOrDefaultAsync(d => d.Id == dto.TargetDoctorId);

        if (targetDoctor == null || targetDoctor.User == null || !targetDoctor.User.IsVerified)
        {
            throw new KeyNotFoundException("Target doctor not found or is not verified");
        }

        var targetDocDepts = new List<int> { targetDoctor.DepartmentId };
        targetDocDepts.AddRange(targetDoctor.DoctorDepartments.Select(dd => dd.DepartmentId));
        targetDocDepts = targetDocDepts.Distinct().ToList();

        if (!docDepts.Intersect(targetDocDepts).Any())
        {
            throw new InvalidOperationException("Target doctor must belong to the same department pool");
        }

        var isTargetToday = targetDoctor.DailyStatusDate == todayPkt;
        var targetDailyStatus = isTargetToday ? targetDoctor.DailyStatus : "OnDuty";
        if (!targetDoctor.IsAvailable || targetDailyStatus == "OffDuty")
        {
            throw new InvalidOperationException($"Target doctor is currently {targetDailyStatus} or unavailable");
        }

        if (dto.NewTimeSlot < targetDoctor.ShiftStart || dto.NewTimeSlot >= targetDoctor.ShiftEnd)
        {
            throw new InvalidOperationException("Selected time slot is outside target doctor's shift hours");
        }

        if (dto.NewTimeSlot <= nowTimePkt)
        {
            throw new InvalidOperationException("Cannot divert to a time slot that has already passed");
        }

        var isSlotBooked = await _context.Appointments.AnyAsync(a =>
            a.DoctorId == targetDoctor.Id &&
            a.AppointmentDate == todayPkt &&
            a.TimeSlot == dto.NewTimeSlot &&
            a.Id != appointment.Id &&
            (a.Status == "Booked" || a.Status == "Confirmed" || a.Status == "Pending" || a.Status == "Completed" || a.Status == "CheckedIn"));

        if (isSlotBooked)
        {
            throw new InvalidOperationException("Selected time slot is already booked for target doctor");
        }

        var prevDoctorId = appointment.DoctorId;
        var prevDoctorName = appointment.Doctor.User != null ? appointment.Doctor.User.Name : string.Empty;
        var prevTimeSlot = appointment.TimeSlot;

        if (!appointment.IsDiverted)
        {
            appointment.OriginalDoctorId = prevDoctorId;
        }

        appointment.DoctorId = targetDoctor.Id;
        appointment.TimeSlot = dto.NewTimeSlot;
        appointment.IsDiverted = true;
        appointment.DiversionReason = string.IsNullOrWhiteSpace(dto.DiversionReason) ? "Clinical diversion" : dto.DiversionReason.Trim();
        appointment.DivertedAt = DateTime.UtcNow;
        appointment.DivertedBy = $"Assistant ({assistant.User!.Name})";
        appointment.Status = "Booked";

        await _context.SaveChangesAsync();

        return new DivertAppointmentResponseDto
        {
            AppointmentId = appointment.Id,
            PatientId = appointment.PatientId,
            PatientName = appointment.Patient != null && appointment.Patient.User != null ? appointment.Patient.User.Name : "Patient",
            PreviousDoctorId = prevDoctorId,
            PreviousDoctorName = prevDoctorName,
            NewDoctorId = targetDoctor.Id,
            NewDoctorName = targetDoctor.User.Name,
            AppointmentDate = appointment.AppointmentDate,
            PreviousTimeSlot = prevTimeSlot,
            NewTimeSlot = appointment.TimeSlot,
            DiversionReason = appointment.DiversionReason,
            DivertedBy = appointment.DivertedBy,
            DivertedAt = appointment.DivertedAt.Value,
            Status = appointment.Status
        };
    }

    private static List<TimeOnly> GenerateSlots(TimeOnly start, TimeOnly end)
    {
        var slots = new List<TimeOnly>();
        var current = start;
        while (current < end)
        {
            slots.Add(current);
            current = current.AddMinutes(30);
        }
        return slots;
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
