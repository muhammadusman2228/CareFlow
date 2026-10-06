

using System.Data;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Authentication;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Transactions;
using backend.Data;
using backend.DTOs;
using backend.Interfaces;
using backend.Models;


using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Org.BouncyCastle.Asn1.Ocsp;
using Org.BouncyCastle.Tls;

namespace backend.Services;

public class AuthService : IAuth
{

    private readonly AppDbContext _context;
    private readonly IEmailService _emailService;
    private readonly IConfiguration _configuration;
    public AuthService(AppDbContext context, IEmailService emailService, IConfiguration configuration)
    {
        _context = context;
        _emailService = emailService;
        _configuration = configuration;
    }

    public async Task<PatientResponseDto> Register(RegisterDtos dto)
    {
        var normalMail = dto.Email.Trim().ToLower();
        var isExist = await _context.Users.AnyAsync(u => u.Email.ToLower() == normalMail);
        if (isExist)
        {
            throw new DuplicateWaitObjectException();
        }
        string token = RandomNumberGenerator.GetInt32(100000, 1000000).ToString();
        var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            var user = new User
            {
                Name = dto.Name,
                Email = normalMail,
                Password = BCrypt.Net.BCrypt.HashPassword(dto.Password)
            };
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            var patient = new Patient
            {
                UserId = user.Id,
                DateOfBirth = dto.DateOfBirth,
                Gender = dto.Gender,
                BloodGroup = dto.BloodGroup,
                PhoneNumber = dto.PhoneNumber,
                EmergencyContact = dto.EmergencyContact
            };
            await _context.Patient.AddAsync(patient);


            var verification = new Verification
            {
                Email = normalMail,
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
            throw;
        }

        try
        {
            await _emailService.SendOtpEmailAsync(normalMail, token);
        }
        catch
        {
            throw new DataMisalignedException();
        }
        return new PatientResponseDto
        {
            Name = dto.Name,
            Email = normalMail,
            BloodGroup = dto.BloodGroup,
            PhoneNumber = dto.PhoneNumber,
            EmergencyContact = dto.EmergencyContact
        };

    }

    public async Task<string> VerifyEmail(verifEmailDTO dto)
    {
        var normalMail = dto.Email.Trim().ToLower();
        var record = await _context.Verification
                     .Where(u => u.Email.ToLower() == normalMail && u.IsUsed == false && u.ExpiresAt > DateTime.UtcNow)
                     .OrderByDescending(v => v.CreatedAt)
                     .FirstOrDefaultAsync();

        if (record == null || dto.Code.Trim() != record.Code)
        {
            throw new InvalidCredentialException("Invalid token");
        }
        record.IsUsed = true;
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == normalMail);
        if (user == null)
        {
            throw new InvalidDataException("No User exist");
        }
        user.IsVerified = true;
        await _context.SaveChangesAsync();
        return "Congrats You are verified Successfully";


    }
    public async Task<(LoginResponseDto dto, string RefreshToken, DateTime RefreshTokenExpiresAt)> login(LoginDto dto, string ip, string userAgent)
    {
        var normalMail = dto.Email.Trim().ToLower();
        var record = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == normalMail);
        if (record == null)
        {
            throw new InvalidCredentialException("Invalid Credentials");
        }

        if (!record.IsVerified)
        {
            throw new InvalidConstraintException("Please Verify Your Accound first");

        }
        var correctedPassword = BCrypt.Net.BCrypt.Verify(dto.Password, record.Password);
        if (!correctedPassword)
        {
            throw new InvalidCredentialException("Invalid Credentials");
        }

        var role = record.Role;

  var claims = new List<Claim>
  {
      new Claim(ClaimTypes.NameIdentifier,record.Id.ToString()),
      new Claim(ClaimTypes.Email,record.Email),
      new Claim(ClaimTypes.Name,record.Name),
      new Claim(ClaimTypes.Role,record.Role),
  };
  var secretKey = _configuration["JwtSettings:SecretKey"]??"";
  var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
  var creds= new SigningCredentials(key,SecurityAlgorithms.HmacSha256);

  var accessMinutes = Convert.ToDouble(_configuration["JwtSettings:AccessTokenDurationMinutes"] ?? "10");
  var accessExpiry = DateTime.UtcNow.AddMinutes(accessMinutes);

var tokenDescriptor= new SecurityTokenDescriptor
{
   Subject=new ClaimsIdentity(claims),
   Expires=accessExpiry,
   Issuer=_configuration["JwtSettings:Issuer"],
   Audience=_configuration["JwtSettings:Audience"],
   SigningCredentials=creds 
};

 var tokenHandler= new JwtSecurityTokenHandler();
 var token = tokenHandler.CreateToken(tokenDescriptor);
 var accessToken = tokenHandler.WriteToken(token);

var refreshBytes = new byte[64];
using var rng = RandomNumberGenerator.Create();
rng.GetBytes(refreshBytes);
var refreshToken = Convert.ToBase64String(refreshBytes);
var refreshDays = Convert.ToDouble(_configuration["JwtSettings:RefreshTokenDurationDays"] ?? "30");
var refreshExpiry=DateTime.UtcNow.AddDays(refreshDays);

var session = new Session
{
  UserId=record.Id,
  RefreshToken=refreshToken,
  IP=ip,
  UserAgent=userAgent,
  IsRevoked=false,
  ExpiresAt=refreshExpiry,
  CreatedAt=DateTime.UtcNow  
};
await _context.Session.AddAsync(session);
await _context.SaveChangesAsync();

var responseDto= new LoginResponseDto
{
    UserId = record.Id,
            Name = record.Name,
            Email = record.Email,
            Role = record.Role,
            AccessToken = accessToken,
            ExpiresAt = accessExpiry
};

return (responseDto,refreshToken,refreshExpiry);

    }


    public async Task<AccessTokenDtos> refreshToken(string Token)
    {
        var session = await _context.Session.AsNoTracking()
        .Include(s=>s.User).FirstOrDefaultAsync(s=>s.RefreshToken==Token);
        if(session==null || session.IsRevoked || session.ExpiresAt <= DateTime.UtcNow)
        {
            throw new SecurityTokenException("Invalid or expired Token");
        }
           var claims = new List<Claim>
    {
        new Claim(ClaimTypes.NameIdentifier, session.User.Id.ToString()),
        new Claim(ClaimTypes.Email, session.User.Email),
        new Claim(ClaimTypes.Name, session.User.Name),
        new Claim(ClaimTypes.Role, session.User.Role)
    };
    var secretKey = _configuration["JwtSettings:SecretKey"]!;
    var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
    var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
    var accessMinutes = Convert.ToDouble(_configuration["JwtSettings:AccessTokenDurationMinutes"] ?? "10");
    var accessExpiry = DateTime.UtcNow.AddMinutes(accessMinutes);
    var tokenDescriptor = new SecurityTokenDescriptor
    {
        Subject = new ClaimsIdentity(claims),
        Expires = accessExpiry,
        Issuer = _configuration["JwtSettings:Issuer"],
        Audience = _configuration["JwtSettings:Audience"],
        SigningCredentials = creds
    };
    var tokenHandler = new JwtSecurityTokenHandler();
    var token = tokenHandler.CreateToken(tokenDescriptor);
    var newAccessToken = tokenHandler.WriteToken(token);
   
    return new AccessTokenDtos
    {
        AccessToken = newAccessToken,
        Role = session.User.Role,
        Name = session.User.Name,
        ExpiresAt = accessExpiry
    };

    }

    public async Task logout(string token)
    {
        var session = await _context.Session.FirstOrDefaultAsync(s=>s.RefreshToken==token);

        if(session!=null && !session.IsRevoked )
        {
           
        
        session.IsRevoked=true;
        await _context.SaveChangesAsync();
        }
    }
    public async Task logoutAll(string token)
    {
        var session = await _context.Session.FirstOrDefaultAsync(s=>s.RefreshToken==token && !s.IsRevoked);
        if(session!=null && !session.IsRevoked)
        {
            var sessions = await _context.Session.Where(s=>s.UserId==session.UserId &&!s.IsRevoked)
            .ExecuteUpdateAsync(s=>s.SetProperty(u=>u.IsRevoked,true));
           
        }
    }
    public async Task resendOtp(ResendOtpDtos dto)
    {
        var normalMail= dto.Email.Trim().ToLower();
        var user= await _context.Users.FirstOrDefaultAsync(u=>u.Email.ToLower()==normalMail);
        if (user == null)
        {
            throw new InvalidCredentialException("Otp is sent successfully");
        }
        if (user.IsVerified)
        {
            throw new InvalidOperationException("Already Verified. Please go to registration");
        }
        await _context.Verification.Where(u=>!u.IsUsed && u.Email.ToLower()==normalMail).ExecuteUpdateAsync(s=>s.SetProperty(u=>u.IsUsed,true));
        var token = RandomNumberGenerator.GetInt32(100000, 1000000).ToString();
        var verification = new Verification
        {
            Email = normalMail,
            Code = token,
            ExpiresAt = DateTime.UtcNow.AddMinutes(10)
        };
        await _context.Verification.AddAsync(verification);
        await _context.SaveChangesAsync();
        try
        {
            await _emailService.SendOtpEmailAsync(normalMail,token);
        }
        catch (Exception)
        {
            throw new Exception("Try again later");
        }
    }

    public async Task forgotPassword(ForgotPasswordDto dto)
    {
        var normalMail = dto.Email.Trim().ToLower();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == normalMail);
        if (user == null)
        {
            return;
        }

        await _context.Verification
            .Where(u => !u.IsUsed && u.Email.ToLower() == normalMail)
            .ExecuteUpdateAsync(s => s.SetProperty(u => u.IsUsed, true));

        var token = RandomNumberGenerator.GetInt32(100000, 1000000).ToString();
        var verification = new Verification
        {
            Email = normalMail,
            Code = token,
            ExpiresAt = DateTime.UtcNow.AddMinutes(10)
        };
        await _context.Verification.AddAsync(verification);
        await _context.SaveChangesAsync();

        await _emailService.SendOtpEmailAsync(normalMail, token, "CareFlow - Password Reset Code", "reset your password");
    }

    public async Task resetPassword(ResetPasswordDto dto)
    {
        var normalMail = dto.Email.Trim().ToLower();
        var record = await _context.Verification
            .Where(v => v.Email.ToLower() == normalMail && !v.IsUsed && v.ExpiresAt > DateTime.UtcNow)
            .OrderByDescending(v => v.CreatedAt)
            .FirstOrDefaultAsync();

        if (record == null || record.Code != dto.Code.Trim())
        {
            throw new InvalidCredentialException("Invalid or expired reset code.");
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == normalMail);
        if (user == null)
        {
            throw new InvalidDataException("User does not exist.");
        }

        record.IsUsed = true;
        user.Password = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);

        await _context.Session
            .Where(s => s.UserId == user.Id && !s.IsRevoked)
            .ExecuteUpdateAsync(s => s.SetProperty(u => u.IsRevoked, true));

        await _context.SaveChangesAsync();
    }

}