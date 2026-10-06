
//this service will be used in the AdminController.cs



using backend.Data;
using backend.DTOs;
using backend.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;


public class AdminExtraService : IAdminExtra
{
    
    private readonly AppDbContext _context;

    public AdminExtraService(AppDbContext context)
    {
        _context=context;
    }


    public async Task<AdminDashboardDto> AdminDashboard()
    {

        try
        {
            var totalDoctors= await _context.Doctors.CountAsync(d=>d.User!.IsVerified);
      var totalPatients= await _context.Patient.CountAsync(p=>p.User!.IsVerified);
      var todayAppointments= await _context.Appointments.CountAsync(a=>a.AppointmentDate==DateOnly.FromDateTime(DateTime.UtcNow) && a.Status=="Confirmed");
      var monthlyTrends= await _context.Patient.CountAsync(p=>p.User!.CreatedAt<=DateTime.UtcNow && p.User!.CreatedAt>=DateTime.UtcNow.AddMonths(-1));

      return new AdminDashboardDto{
            TotalDoctors=totalDoctors,
            TotalPatients=totalPatients,
            TodayAppointments=todayAppointments,
            MonthlyTrends=monthlyTrends
        };
        }
        catch (Exception)
        {
            throw new Exception("Try again later");
        }
    }
    public async Task<AdminPatientsDto> AdminPatient()
    {
        try
        {
            var totalPatients= await _context.Patient.CountAsync(p=>p.User!.IsVerified);

     var patients= await _context.Patient.AsNoTracking().Where(p=>p.User!.IsVerified).Select(p=>
     new AdminPatientDataDto
     {
         Name=p.User!.Name,
         Email=p.User!.Email,
         RegistrationDate=p.CreatedAt,
         PhoneNumber=p.PhoneNumber,
         VisitCount=p.Appointments.Count(a=>a.Status=="Completed")

     }).ToListAsync();

       return new AdminPatientsDto
       {
         TotalPatients=totalPatients,
         Details=patients  
       };
        }
        catch (Exception)
        {
            throw new Exception("Try again later");
        }
    }
}