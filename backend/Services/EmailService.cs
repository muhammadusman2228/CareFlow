



using backend.DTOs;
using backend.Interfaces;
using backend.Models;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;

namespace backend.Services;

public class EmailService : IEmailService
{
   private readonly  EmailSettings _emailSetting;
   private readonly ILogger<EmailService> _logger;
   public EmailService (IOptions<EmailSettings> options,ILogger<EmailService> logger)
    {
        _emailSetting=options.Value;
        _logger=logger;
    }
    public async Task SendEmailAsync(EmailDto dto)
    {
        var message = new MimeMessage();
        var SenderEmail=!string.IsNullOrWhiteSpace(dto.FromEmail)?dto.FromEmail:_emailSetting.SenderEmail;
        var SenderName=!string.IsNullOrWhiteSpace(dto.FromName)?dto.FromName:_emailSetting.SenderName;
        message.From.Add(new MailboxAddress( SenderName,SenderEmail));
        message.To.Add( MailboxAddress.Parse(dto.To));
        message.Subject=dto.Subject;
        var builder = new BodyBuilder
        {
            HtmlBody=dto.HtmlBody
        };
        message.Body=builder.ToMessageBody();
        using var client= new SmtpClient();
        try
        {
            await client.ConnectAsync(_emailSetting.SmtpServer, _emailSetting.SmtpPort, SecureSocketOptions.StartTls);
            await client.AuthenticateAsync(_emailSetting.SenderEmail, _emailSetting.Password);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);
            _logger.LogInformation("Email sent successfully to {Recipient}", dto.To);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {Recipient}", dto.To);
            throw;
        }


    }
     public async Task SendOtpEmailAsync(string recipientEmail, string otpCode, string subject = "CareFlow - Verify Your Email Address", string purpose = "verify your email address")
    {
        string html = $@"
        <div style='font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 10px;'>
            <h2 style='color: #0284c7; text-align: center;'>CareFlow Clinical Portal</h2>
            <p style='color: #334155; font-size: 15px;'>Welcome to CareFlow. Please enter the verification code below to {purpose}:</p>
            <div style='text-align: center; margin: 30px 0;'>
                <span style='background: #f1f5f9; padding: 12px 28px; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0f172a; border-radius: 8px; display: inline-block;'>
                    {otpCode}
                </span>
            </div>
            <p style='color: #64748b; font-size: 13px; text-align: center;'>This code expires in 10 minutes. If you did not request this, please ignore this email.</p>
        </div>";
        await SendEmailAsync(new EmailDto
        {
            To = recipientEmail,
            Subject = subject,
            HtmlBody = html
        });
    }
}