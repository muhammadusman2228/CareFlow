


using System.ComponentModel.DataAnnotations;

namespace backend.Models;

public class Departments
{
    [Key]
    public int Id{get;set;}
    [Required]
    [MaxLength(100)]
    public string Name{get;set;}=string.Empty;

    [Required]
    [MaxLength(500)]
    public string Description{get;set;}=string.Empty;

    public DateTime CreatedAt{get;set;}=DateTime.UtcNow;

    public virtual ICollection<Doctor> Doctors{get;set;}=new List<Doctor>();


}