


using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

public class Prescriptions
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

     public int AppointmentId{get;set;}
     [ForeignKey(nameof(AppointmentId))]
     public virtual Appointment? Appointment{get;set;}=null;

     [Required]
     [MaxLength(100)]
     public string Title{get;set;}=string.Empty;

     [Required]
     [MaxLength(500)]
     public string Note{get;set;}=string.Empty;


     public DateTime CreatedAt{get;set;}=DateTime.UtcNow;




}