

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;
public class Patient
{
[Key]
public int Id{get;set;}

public int UserId{get;set;
}

[ForeignKey(nameof(UserId))]
public virtual User? User{get;set;}=null;
    [Required]
    public DateOnly DateOfBirth{get;set;}

    [Required]
    [MaxLength(6)]
    public string Gender {get;set;}=string.Empty;

    [Required]
    [MaxLength(6)]
    public string BloodGroup{get;set;}=string.Empty;

    [Required]
    [MaxLength(15)]
    public string PhoneNumber{get;set;}=string.Empty;

    [Required]
    [MaxLength(15)]
    public string EmergencyContact{get;set;}=string.Empty;

    public DateTime CreatedAt{get;set;}=DateTime.UtcNow;
    public virtual ICollection<Appointment> Appointments{get;set;}=new List<Appointment>();
    public virtual ICollection<Prescriptions> Prescriptions{get;set;}=new List<Prescriptions>();
}
