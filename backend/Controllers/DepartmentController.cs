using System.Data;
using backend.DTOs;
using backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("/api/[controller]")]
public class DepartmentController : ControllerBase
{
    private readonly IDepartments _departmentService;

    public DepartmentController(IDepartments departmentService)
    {
        _departmentService = departmentService;
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<DepartmentResponseDto>> RegisterDepartment([FromBody] DeparmentRequestDto dto)
    {
        try
        {
            var response = await _departmentService.registerDepartment(dto);
            return CreatedAtAction(nameof(RegisterDepartment), response);
        }
        catch (DuplicateNameException ex)
        {
            return Conflict(new { message = ex.Message });
        }
        catch (Exception)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Try again later" });
        }
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<List<DepartmentResponseDto>>> GetDepartments()
    {
        try
        {
            var response = await _departmentService.getDepartments();
            return Ok(response);
        }
        catch (Exception)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Try again later" });
        }
    }
}
