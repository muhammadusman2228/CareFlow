




using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class User
    {
        [Key]
       public int Id{get;set;}
       [Required]
       [MaxLength(100)]
       public string Name {get;set;}=string.Empty;
      
       [Required]
       [MaxLength(255)]
       public string Password{get;set;}=string.Empty;
       [Required]
       [EmailAddress]
       [MaxLength(150)]
       public string Email{get;set;}=string.Empty;
       
       public string Role{get;set;}="Patient";
       public bool IsVerified{get;set;}=false;


       public DateTime CreatedAt{get;set;}=DateTime.UtcNow;
       public virtual Patient? Patient{get;set;}

       public virtual Doctor? Doctor{get;set;}

    }
}