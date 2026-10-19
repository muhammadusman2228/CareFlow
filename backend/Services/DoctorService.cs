


using System.Data;
using System.Security.Cryptography;
using backend.Data;
using backend.DTOs;
using backend.Interfaces;
using backend.Models;
using Microsoft.EntityFrameworkCore;
using Org.BouncyCastle.Security;

namespace backend.Services;

public class DoctorService : IDoctor
{

    private readonly AppDbContext _context;
    private readonly IEmailService _emailService;
    public DoctorService(AppDbContext context, IEmailService emailService)
    {
        _context = context;
        _emailService = emailService;
    }

    public async Task<DrRegResponseDto> RegisterDoctor(DrRegRequestDto dto)
    {
        var normalEmail = dto.Email.Trim().ToLower();
        var isExist = await _context.Users.AnyAsync(u => u.Email.ToLower() == normalEmail);
        if (isExist)
        {
            throw new DuplicateNameException("This Email is already registered. Please login.");
        }

        var departmentIds = (dto.DepartmentIds != null && dto.DepartmentIds.Count > 0)
            ? dto.DepartmentIds.Distinct().ToList()
            : new List<int> { dto.DepartmentId };

        var departments = await _context.Departments
            .Where(d => departmentIds.Contains(d.Id))
            .ToListAsync();

        if (departments.Count != departmentIds.Count)
        {
            throw new InvalidKeyException("One or more selected departments do not exist.");
        }

        var primaryDept = departments.FirstOrDefault(d => d.Id == dto.DepartmentId) ?? departments.First();

        string token = RandomNumberGenerator.GetInt32(100000, 1000000).ToString();
        var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var user = new User
            {
                Name = dto.Name,
                Email = normalEmail,
                Password = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Role = "Doctor"
            };
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            var doctor = new Doctor
            {
                UserId = user.Id,
                DepartmentId = primaryDept.Id,
                Specialization = dto.Specialization,
                Qualifications = dto.Qualifications,
                LicenseNumber = dto.LicenseNumber,
                ExperienceYears = dto.ExperienceYears,
                ConsultationFee = dto.ConsultationFee
            };
            await _context.Doctors.AddAsync(doctor);
            await _context.SaveChangesAsync();

            foreach (var deptId in departmentIds)
            {
                var docDept = new DoctorDepartment
                {
                    DoctorId = doctor.Id,
                    DepartmentId = deptId,
                    IsPrimary = (deptId == primaryDept.Id)
                };
                await _context.DoctorDepartments.AddAsync(docDept);
            }

            var verification = new Verification
            {
                Email = normalEmail,
                Code = token,
                ExpiresAt = DateTime.UtcNow.AddMinutes(10)
            };

            await _context.Verification.AddAsync(verification);
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw new Exception("Error occured while registering the Doctor Try again later");
        }

        try
        {
            await _emailService.SendOtpEmailAsync(normalEmail, token);
        }
        catch
        {
            throw new Exception("Failed to send verification code");
        }

        return new DrRegResponseDto
        {
            Name = dto.Name,
            Email = normalEmail,
            DepartmentId = primaryDept.Id,
            DepartmentName = primaryDept.Name,
            DepartmentIds = departments.Select(d => d.Id).ToList(),
            DepartmentNames = departments.Select(d => d.Name).ToList(),
            Specialization = dto.Specialization,
            ConsultationFee = dto.ConsultationFee
        };
    }

    public async Task<List<AdminDoctorResponse>> GetDoctorsAdmin()
    {
        try
        {
            var doctors = await _context.Doctors.AsNoTracking().Select(u => new AdminDoctorResponse
            {
                Id = u.Id,
                Name = u.User!.Name,
                Email = u.User.Email,
                DepartmentId = u.DepartmentId,
                DepartmentName = u.Department!.Name,
                DepartmentIds = u.DoctorDepartments.Select(dd => dd.DepartmentId).ToList(),
                DepartmentNames = u.DoctorDepartments.Select(dd => dd.Department!.Name).ToList(),
                Specialization = u.Specialization,
                Qualifications = u.Qualifications,
                LicenseNumber = u.LicenseNumber,
                ExperienceYears = u.ExperienceYears,
                ConsultationFee = u.ConsultationFee,
                IsAvailable = u.IsAvailable,
                CreatedAt = u.CreatedAt
            }).ToListAsync();

            foreach (var doc in doctors)
            {
                if (doc.DepartmentIds.Count == 0 && doc.DepartmentId > 0)
                {
                    doc.DepartmentIds.Add(doc.DepartmentId);
                    if (!string.IsNullOrEmpty(doc.DepartmentName))
                    {
                        doc.DepartmentNames.Add(doc.DepartmentName);
                    }
                }
            }

            return doctors;
        }
        catch (Exception)
        {
            throw new Exception("Try again later");
        }
    }

    public async Task<List<FindDoctorResponse>> FindDoctors()
    {
        try
        {
            var doctors = await _context.Doctors.AsNoTracking().Where(u => u.IsAvailable && u.User!.IsVerified).Select(u => new FindDoctorResponse
            {
                Id = u.Id,
                Name = u.User!.Name,
                DepartmentId = u.DepartmentId,
                DepartmentName = u.Department!.Name,
                DepartmentIds = u.DoctorDepartments.Select(dd => dd.DepartmentId).ToList(),
                DepartmentNames = u.DoctorDepartments.Select(dd => dd.Department!.Name).ToList(),
                Specialization = u.Specialization,
                Qualifications = u.Qualifications,
                ExperienceYears = u.ExperienceYears,
                ConsultationFee = u.ConsultationFee,
                ShiftStart = u.ShiftStart,
                ShiftEnd = u.ShiftEnd,
                AssistantName = u.Assistants.Where(a => a.IsActive).Select(a => a.User!.Name).FirstOrDefault(),
                AssistantPhone = u.Assistants.Where(a => a.IsActive).Select(a => a.PhoneNumber).FirstOrDefault()
            }).ToListAsync();

            var deptAssistants = await _context.Assistants.AsNoTracking()
                .Where(a => a.IsActive && !string.IsNullOrEmpty(a.PhoneNumber))
                .Select(a => new
                {
                    Name = a.User != null ? a.User.Name : "Clinical Assistant",
                    a.PhoneNumber,
                    a.DepartmentId,
                    DeptIds = a.AssistantDepartments.Select(ad => ad.DepartmentId).ToList()
                })
                .ToListAsync();

            foreach (var doc in doctors)
            {
                if (doc.DepartmentIds.Count == 0 && doc.DepartmentId > 0)
                {
                    doc.DepartmentIds.Add(doc.DepartmentId);
                    if (!string.IsNullOrEmpty(doc.DepartmentName))
                    {
                        doc.DepartmentNames.Add(doc.DepartmentName);
                    }
                }

                if (string.IsNullOrEmpty(doc.AssistantPhone))
                {
                    var matchedAssistant = deptAssistants.FirstOrDefault(a => 
                        (a.DepartmentId.HasValue && doc.DepartmentIds.Contains(a.DepartmentId.Value)) ||
                        a.DeptIds.Any(did => doc.DepartmentIds.Contains(did))
                    );
                    if (matchedAssistant != null)
                    {
                        doc.AssistantName = matchedAssistant.Name;
                        doc.AssistantPhone = matchedAssistant.PhoneNumber;
                    }
                }
            }

            return doctors;
        }
        catch (Exception)
        {
            throw new Exception("Try Again Later");
        }
    }

    public async Task<FindDoctorResponse?> GetDoctorById(int id)
    {
        try
        {
            var doctor = await _context.Doctors.AsNoTracking().Where(u => u.Id == id && u.User!.IsVerified).Select(u => new FindDoctorResponse
            {
                Id = u.Id,
                Name = u.User!.Name,
                DepartmentId = u.DepartmentId,
                DepartmentName = u.Department!.Name,
                DepartmentIds = u.DoctorDepartments.Select(dd => dd.DepartmentId).ToList(),
                DepartmentNames = u.DoctorDepartments.Select(dd => dd.Department!.Name).ToList(),
                Specialization = u.Specialization,
                Qualifications = u.Qualifications,
                ExperienceYears = u.ExperienceYears,
                ConsultationFee = u.ConsultationFee,
                ShiftStart = u.ShiftStart,
                ShiftEnd = u.ShiftEnd,
                AssistantName = u.Assistants.Where(a => a.IsActive).Select(a => a.User!.Name).FirstOrDefault(),
                AssistantPhone = u.Assistants.Where(a => a.IsActive).Select(a => a.PhoneNumber).FirstOrDefault()
            }).FirstOrDefaultAsync();

            if (doctor != null && doctor.DepartmentIds.Count == 0 && doctor.DepartmentId > 0)
            {
                doctor.DepartmentIds.Add(doctor.DepartmentId);
                if (!string.IsNullOrEmpty(doctor.DepartmentName))
                {
                    doctor.DepartmentNames.Add(doctor.DepartmentName);
                }
            }

            if (doctor != null && string.IsNullOrEmpty(doctor.AssistantPhone))
            {
                var matchedAssistant = await _context.Assistants.AsNoTracking()
                    .Where(a => a.IsActive && !string.IsNullOrEmpty(a.PhoneNumber) &&
                        ((a.DepartmentId.HasValue && doctor.DepartmentIds.Contains(a.DepartmentId.Value)) ||
                         a.AssistantDepartments.Any(ad => doctor.DepartmentIds.Contains(ad.DepartmentId))))
                    .Select(a => new
                    {
                        Name = a.User != null ? a.User.Name : "Clinical Assistant",
                        a.PhoneNumber
                    })
                    .FirstOrDefaultAsync();

                if (matchedAssistant != null)
                {
                    doctor.AssistantName = matchedAssistant.Name;
                    doctor.AssistantPhone = matchedAssistant.PhoneNumber;
                }
            }

            return doctor;
        }
        catch (Exception)
        {
            throw new Exception("Try Again Later");
        }
    }

    public async Task<string> UpdateDoctorDepartments(int doctorId, UpdateDoctorDepartmentsDto dto)
    {
        try
        {
            var doctor = await _context.Doctors.FirstOrDefaultAsync(d => d.Id == doctorId);
            if (doctor == null)
            {
                throw new KeyNotFoundException("Doctor does not exist.");
            }

            if (dto.DepartmentIds == null || dto.DepartmentIds.Count == 0)
            {
                throw new InvalidKeyException("Doctor must be assigned to at least one department.");
            }

            var cleanDeptIds = dto.DepartmentIds.Distinct().ToList();
            var existingDeptCount = await _context.Departments.CountAsync(d => cleanDeptIds.Contains(d.Id));
            if (existingDeptCount != cleanDeptIds.Count)
            {
                throw new InvalidKeyException("One or more selected departments do not exist.");
            }

            var currentLinks = await _context.DoctorDepartments.Where(dd => dd.DoctorId == doctorId).ToListAsync();
            _context.DoctorDepartments.RemoveRange(currentLinks);

            doctor.DepartmentId = cleanDeptIds.First();

            foreach (var deptId in cleanDeptIds)
            {
                var docDept = new DoctorDepartment
                {
                    DoctorId = doctorId,
                    DepartmentId = deptId,
                    IsPrimary = (deptId == cleanDeptIds.First())
                };
                await _context.DoctorDepartments.AddAsync(docDept);
            }

            await _context.SaveChangesAsync();
            return "Doctor departments updated successfully.";
        }
        catch (KeyNotFoundException)
        {
            throw;
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

    public async Task<string> UpdateDoctorFee(int doctorId, UpdateDoctorFeeDto dto)
    {
        try
        {
            var doctor = await _context.Doctors.FirstOrDefaultAsync(d => d.Id == doctorId);
            if (doctor == null)
            {
                throw new KeyNotFoundException("Doctor does not exist.");
            }

            if (dto.ConsultationFee < 0)
            {
                throw new InvalidKeyException("Consultation fee cannot be negative.");
            }

            doctor.ConsultationFee = dto.ConsultationFee;
            await _context.SaveChangesAsync();
            return "Doctor consultation fee updated successfully.";
        }
        catch (KeyNotFoundException)
        {
            throw;
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