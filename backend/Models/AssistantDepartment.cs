using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

public class AssistantDepartment
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int AssistantId { get; set; }

    [ForeignKey(nameof(AssistantId))]
    public virtual Assistant? Assistant { get; set; } = null;

    [Required]
    public int DepartmentId { get; set; }

    [ForeignKey(nameof(DepartmentId))]
    public virtual Departments? Department { get; set; } = null;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
