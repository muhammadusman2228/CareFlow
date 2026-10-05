




using System.ComponentModel.DataAnnotations;

namespace backend.DTOs;
public class EmailDto
{
    public string To { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string HtmlBody { get; set; } = string.Empty;
    public string? FromEmail { get; set; }
    public string? FromName { get; set; }
}

public class verifEmailDTO
{
    [Required(ErrorMessage ="The Email is required")]
    [EmailAddress(ErrorMessage ="Enter Valid Email Address")]
    public string Email{get;set;}=string.Empty;

    [Required(ErrorMessage ="Enter the OTP")]
    public string Code{get;set;}=string.Empty;
}