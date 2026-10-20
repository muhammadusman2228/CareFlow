using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();   
    public DbSet<Patient> Patient => Set<Patient>();
    public DbSet<Verification> Verification => Set<Verification>();
    public DbSet<Session> Session => Set<Session>();

    public DbSet<Departments> Departments => Set<Departments>();
    public DbSet<Doctor> Doctors => Set<Doctor>();
    public DbSet<Appointment> Appointments=>Set<Appointment>();
    public DbSet<Prescriptions> Prescriptions=>Set<Prescriptions>();
    public DbSet<Assistant> Assistants => Set<Assistant>();
    public DbSet<PatientVitals> PatientVitals => Set<PatientVitals>();
    public DbSet<Labs> Labs => Set<Labs>();
    public DbSet<DoctorDepartment> DoctorDepartments => Set<DoctorDepartment>();
    public DbSet<AssistantDepartment> AssistantDepartments => Set<AssistantDepartment>();
    public DbSet<DoctorDateSchedule> DoctorDateSchedules => Set<DoctorDateSchedule>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<DailySettlementReport> DailySettlementReports => Set<DailySettlementReport>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

    
        modelBuilder.Entity<Patient>()
            .HasOne(p => p.User)
            .WithOne(u => u.Patient)
            .HasForeignKey<Patient>(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Session>()
            .HasOne(s => s.User)
            .WithMany()
            .HasForeignKey(s => s.UserId)
            .OnDelete(DeleteBehavior.Cascade);

  
        modelBuilder.Entity<Verification>()
            .HasIndex(v => new { v.Email, v.IsUsed, v.ExpiresAt })
            .HasDatabaseName("IX_Verifications_Lookup");

        modelBuilder.Entity<Departments>()
            .HasIndex(d => d.Name)
            .IsUnique();

     
        modelBuilder.Entity<Doctor>()
            .HasOne(d => d.User)
            .WithOne(u => u.Doctor)
            .HasForeignKey<Doctor>(d => d.UserId)
            .OnDelete(DeleteBehavior.Cascade);

   
        modelBuilder.Entity<Doctor>()
            .HasOne(d => d.Department)
            .WithMany(dept => dept.Doctors)
            .HasForeignKey(d => d.DepartmentId)
            .OnDelete(DeleteBehavior.Restrict);

       
        modelBuilder.Entity<Doctor>()
            .HasIndex(d => d.LicenseNumber)
            .IsUnique();

       
        modelBuilder.Entity<Doctor>()
            .Property(d => d.ConsultationFee)
            .HasPrecision(18, 2);
      

modelBuilder.Entity<Appointment>()
    .HasOne(a => a.Patient)
    .WithMany(p => p.Appointments)
    .HasForeignKey(a => a.PatientId)
    .OnDelete(DeleteBehavior.Cascade);


modelBuilder.Entity<Appointment>()
    .HasOne(a => a.Doctor)
    .WithMany(d => d.Appointments)
    .HasForeignKey(a => a.DoctorId)
    .OnDelete(DeleteBehavior.Restrict);

modelBuilder.Entity<Appointment>()
    .HasOne(a => a.OriginalDoctor)
    .WithMany()
    .HasForeignKey(a => a.OriginalDoctorId)
    .OnDelete(DeleteBehavior.SetNull);

modelBuilder.Entity<Appointment>()
    .HasIndex(a => new { a.DoctorId, a.AppointmentDate, a.TimeSlot });





modelBuilder.Entity<Appointment>()
    .HasOne(a => a.Prescriptions)
    .WithOne(p => p.Appointment)
    .HasForeignKey<Prescriptions>(p => p.AppointmentId)
    .OnDelete(DeleteBehavior.Cascade);


modelBuilder.Entity<Prescriptions>()
    .HasOne(p => p.Patient)
    .WithMany(p => p.Prescriptions)
    .HasForeignKey(p => p.PatientId)
    .OnDelete(DeleteBehavior.Restrict);

modelBuilder.Entity<Prescriptions>()
    .HasOne(p => p.Doctor)
    .WithMany(d => d.Prescriptions)
    .HasForeignKey(p => p.DoctorId)
    .OnDelete(DeleteBehavior.Restrict);

modelBuilder.Entity<Assistant>()
    .HasOne(a => a.User)
    .WithOne(u => u.Assistant)
    .HasForeignKey<Assistant>(a => a.UserId)
    .OnDelete(DeleteBehavior.Cascade);

modelBuilder.Entity<Assistant>()
    .HasOne(a => a.Doctor)
    .WithMany(d => d.Assistants)
    .HasForeignKey(a => a.DoctorId)
    .OnDelete(DeleteBehavior.SetNull);

modelBuilder.Entity<Assistant>()
    .HasOne(a => a.Department)
    .WithMany()
    .HasForeignKey(a => a.DepartmentId)
    .OnDelete(DeleteBehavior.SetNull);

modelBuilder.Entity<PatientVitals>()
    .HasOne(v => v.Appointment)
    .WithOne(a => a.Vitals)
    .HasForeignKey<PatientVitals>(v => v.AppointmentId)
    .OnDelete(DeleteBehavior.Cascade);

modelBuilder.Entity<PatientVitals>()
    .HasOne(v => v.Assistant)
    .WithMany(a => a.RecordedVitals)
    .HasForeignKey(v => v.AssistantId)
    .OnDelete(DeleteBehavior.Restrict);

modelBuilder.Entity<Labs>()
    .HasOne(l => l.Appointment)
    .WithMany(a => a.LabOrders)
    .HasForeignKey(l => l.AppointmentId)
    .OnDelete(DeleteBehavior.Cascade);

modelBuilder.Entity<Labs>()
    .HasOne(l => l.Doctor)
    .WithMany(d => d.LabOrders)
    .HasForeignKey(l => l.DoctorId)
    .OnDelete(DeleteBehavior.Restrict);

modelBuilder.Entity<Labs>()
    .HasOne(l => l.Patient)
    .WithMany()
    .HasForeignKey(l => l.PatientId)
    .OnDelete(DeleteBehavior.Restrict);

modelBuilder.Entity<DoctorDepartment>()
    .HasIndex(dd => new { dd.DoctorId, dd.DepartmentId })
    .IsUnique();

modelBuilder.Entity<DoctorDepartment>()
    .HasOne(dd => dd.Doctor)
    .WithMany(d => d.DoctorDepartments)
    .HasForeignKey(dd => dd.DoctorId)
    .OnDelete(DeleteBehavior.Cascade);

modelBuilder.Entity<DoctorDepartment>()
    .HasOne(dd => dd.Department)
    .WithMany(dept => dept.DoctorDepartments)
    .HasForeignKey(dd => dd.DepartmentId)
    .OnDelete(DeleteBehavior.Cascade);

modelBuilder.Entity<AssistantDepartment>()
    .HasIndex(ad => new { ad.AssistantId, ad.DepartmentId })
    .IsUnique();

modelBuilder.Entity<AssistantDepartment>()
    .HasOne(ad => ad.Assistant)
    .WithMany(a => a.AssistantDepartments)
    .HasForeignKey(ad => ad.AssistantId)
    .OnDelete(DeleteBehavior.Cascade);

modelBuilder.Entity<AssistantDepartment>()
    .HasOne(ad => ad.Department)
    .WithMany(dept => dept.AssistantDepartments)
    .HasForeignKey(ad => ad.DepartmentId)
    .OnDelete(DeleteBehavior.Cascade);

modelBuilder.Entity<DoctorDateSchedule>()
    .HasIndex(ds => new { ds.DoctorId, ds.ScheduleDate })
    .IsUnique();

modelBuilder.Entity<DoctorDateSchedule>()
    .HasOne(ds => ds.Doctor)
    .WithMany(d => d.DateSchedules)
    .HasForeignKey(ds => ds.DoctorId)
    .OnDelete(DeleteBehavior.Cascade);

modelBuilder.Entity<Payment>()
    .HasOne(p => p.Appointment)
    .WithOne(a => a.Payment)
    .HasForeignKey<Payment>(p => p.AppointmentId)
    .OnDelete(DeleteBehavior.Cascade);

modelBuilder.Entity<Payment>()
    .HasOne(p => p.CollectedByAssistant)
    .WithMany(a => a.CollectedPayments)
    .HasForeignKey(p => p.CollectedByAssistantId)
    .OnDelete(DeleteBehavior.SetNull);

modelBuilder.Entity<Payment>()
    .HasIndex(p => p.ReceiptNumber)
    .IsUnique();

modelBuilder.Entity<DailySettlementReport>()
    .HasOne(r => r.Assistant)
    .WithMany(a => a.SettlementReports)
    .HasForeignKey(r => r.AssistantId)
    .OnDelete(DeleteBehavior.Cascade);

modelBuilder.Entity<DailySettlementReport>()
    .HasOne(r => r.VerifiedByAdmin)
    .WithMany()
    .HasForeignKey(r => r.VerifiedByAdminId)
    .OnDelete(DeleteBehavior.SetNull);

modelBuilder.Entity<DailySettlementReport>()
    .HasIndex(r => r.ReportNumber)
    .IsUnique();

modelBuilder.Entity<DailySettlementReport>()
    .HasIndex(r => new { r.AssistantId, r.ReportDate });
            
    }
}