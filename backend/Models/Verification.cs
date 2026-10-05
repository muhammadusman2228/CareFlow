

using System.ComponentModel.DataAnnotations;

namespace backend.Models;
public class Verification
{
  [Key]
  public int Id{get;set;}

  [Required]
  [MaxLength(150)]
  public string Email{get;set;}=string.Empty;

[Required]
[MaxLength(6)]
public string Code{get;set;}=string.Empty;
  public bool IsUsed{get;set;}=false;


  public DateTime ExpiresAt{get;set;}

  public DateTime CreatedAt{get;set;}=DateTime.UtcNow;

}