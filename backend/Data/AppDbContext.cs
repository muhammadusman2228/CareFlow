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
            
    }
}