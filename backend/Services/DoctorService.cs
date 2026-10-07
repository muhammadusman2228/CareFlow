


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
        var department = await _context.Departments.FirstOrDefaultAsync(d => d.Id == dto.DepartmentId);
        if (department == null)
        {
            throw new InvalidKeyException("No Department Exist with this Id");
        }
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
                DepartmentId = dto.DepartmentId,

                Specialization = dto.Specialization,
                Qualifications = dto.Qualifications,
                LicenseNumber = dto.LicenseNumber,
                ExperienceYears = dto.ExperienceYears,
                ConsultationFee = dto.ConsultationFee
            };
            await _context.Doctors.AddAsync(doctor);

            var verfication = new Verification
            {
                Email = normalEmail,
                Code = token,
                ExpiresAt = DateTime.UtcNow.AddMinutes(10)
            };

            await _context.Verification.AddAsync(verfication);
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
            DepartmentId = dto.DepartmentId,
            DepartmentName = department.Name,
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
                Specialization = u.Specialization,
                Qualifications = u.Qualifications,
                LicenseNumber = u.LicenseNumber,
                ExperienceYears = u.ExperienceYears,
                ConsultationFee = u.ConsultationFee,
                IsAvailable = u.IsAvailable,
                CreatedAt = u.CreatedAt


            }).ToListAsync();

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
                Specialization = u.Specialization,
                Qualifications = u.Qualifications,
                ExperienceYears = u.ExperienceYears,
                ConsultationFee = u.ConsultationFee,
                ShiftStart = u.ShiftStart,
                ShiftEnd = u.ShiftEnd
            }).ToListAsync();
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
                Specialization = u.Specialization,
                Qualifications = u.Qualifications,
                ExperienceYears = u.ExperienceYears,
                ConsultationFee = u.ConsultationFee,
                ShiftStart = u.ShiftStart,
                ShiftEnd = u.ShiftEnd
            }).FirstOrDefaultAsync();
            return doctor;
        }
        catch (Exception)
        {
            throw new Exception("Try Again Later");
        }
    }
}