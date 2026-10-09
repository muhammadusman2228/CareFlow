



using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;


namespace backend.Models;
public class Appointment
{
    [Key]
    public int Id{get;set;}

[Required]
    public int PatientId{get;set;}

    [ForeignKey(nameof(PatientId))]
    public virtual Patient? Patient{get;set;}=null;

    [Required]
    public int DoctorId{get;set;}
    [ForeignKey(nameof(DoctorId))]
    public virtual Doctor? Doctor{get;set;}=null;

    [Required]
    public DateOnly AppointmentDate{get;set;}

    [Required]
    public TimeOnly TimeSlot{get;set;}

    [Required]
    [MaxLength(20)]
    public string Status{get;set;}="Pending";

    [Required]
    [MaxLength(100)]
    public string Symptoms{get;set;}=string.Empty;



  
    public virtual Prescriptions? Prescriptions{get;set;}=null;
    public virtual PatientVitals? Vitals { get; set; } = null;
    public virtual ICollection<Labs> LabOrders { get; set; } = new List<Labs>();
    public DateTime CreatedAt{get;set;}=DateTime.UtcNow;
}