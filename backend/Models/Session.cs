




using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

public class Session
{
    [Key]
    public int Id{get;set;}

    public int UserId{get;set;}
    [ForeignKey(nameof(UserId))]
    public virtual User User{get;set;}=null!;

    [Required]
    [MaxLength(255)]
    public string RefreshToken{get;set;}=string.Empty;

    [Required]
    [MaxLength(500)]
    public string UserAgent{get;set;}=string.Empty;

    [Required]
    [MaxLength(100)]
    public string IP{get;set;}=string.Empty;

    public bool IsRevoked{get;set;}=false;

    public DateTime ExpiresAt{get;set;}

    public DateTime CreatedAt{get;set;}=DateTime.UtcNow;

}