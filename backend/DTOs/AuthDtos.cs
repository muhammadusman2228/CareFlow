

using System.ComponentModel.DataAnnotations;

namespace  backend.DTOs;


public class RegisterDtos
{
    [Key]
    public int Id{get;set;}

    [Required]
    [EmailAddress(ErrorMessage ="Valid Email Address is required")]
    public string Email {get;set;}=string.Empty;
    [Required]
    public string Name {get;set;}=string.Empty;

    [Required]
    
    public string EmergencyContact{get;set;}=string.Empty;

    [Required]
    public string PhoneNumber{get;set;}=string.Empty;

    [Required]
    [MinLength(8,ErrorMessage ="The password must be of atleast 8 characters")]
    public string Password{get;set;}=string.Empty;
[Required]
public string BloodGroup{get;set;}=string.Empty;
[Required]
public string Gender{get;set;}=string.Empty;
[Required]
public DateOnly DateOfBirth{get;set;}


}

public class PatientResponseDto
{
    
    public string Name{get;set;}=string.Empty;
    public string Email{get;set;}=string.Empty;
    public DateOnly DateOfBirth{get;set;}
    public string BloodGroup{get;set;}=string.Empty;
    public string PhoneNumber{get;set;}=string.Empty;
    public string EmergencyContact{get;set;}=string.Empty;

}

public class LoginDto
{
    [Required]
    [EmailAddress]
    public string Email{get;set;}=string.Empty;
    [Required]
    public string Password{get;set;}=string.Empty;
}

public class LoginResponseDto
{
    public int UserId{get;set;}
    public string Name{get;set;}=string.Empty;
    public string Email{get;set;}=string.Empty;
    public string Role {get;set;}=string.Empty;
    public string AccessToken{get;set;}=string.Empty;

    public DateTime ExpiresAt{get;set;}
}


public class AccessTokenDtos
{
    public string AccessToken{get;set;}=string.Empty;
    public string Role{get;set;}=string.Empty;
    public string Name{get;set;}=string.Empty;
    public DateTime ExpiresAt{get;set;}
}

public class ResendOtpDtos
{
    [Required]
    [EmailAddress]
    public string Email{get;set;}=string.Empty;
}

public class ForgotPasswordDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
}

public class ResetPasswordDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Code { get; set; } = string.Empty;

    [Required]
    [MinLength(8)]
    public string NewPassword { get; set; } = string.Empty;
}