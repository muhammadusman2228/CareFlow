



using System.Data;
using backend.DTOs;
using backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Org.BouncyCastle.Security;

namespace backend.Controllers;

[ApiController]
[Route("/api/[controller]")]
public class AdminController : ControllerBase
{
    
    private readonly IDoctor _doctorService;

    private readonly IAdminExtra _adminExtra;
    public AdminController(IDoctor doctorService,IAdminExtra adminExtra)
    {
        _doctorService=doctorService;
        _adminExtra=adminExtra;
    }
    [HttpPost]
    [Authorize(Roles ="Admin")]

    public async Task<ActionResult<DrRegResponseDto>> RegisterDoctor(DrRegRequestDto dto)
    {
        try
        {
            var response = await _doctorService.RegisterDoctor(dto);
            return CreatedAtAction(nameof(RegisterDoctor),response);
        }
        catch(DuplicateNameException ex)
        {
            return Conflict(new{message=ex.Message});
        }
        catch(InvalidKeyException ex)
        {
            return BadRequest(new {message=ex.Message});
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError,new {message=ex.Message});
        }
    }
    [HttpGet("admin")]
    [Authorize(Roles ="Admin")]
    public async Task<ActionResult<List<AdminDoctorResponse>>> AdminDoctorResponse()
    {
        try
        {
            var response = await _doctorService.GetDoctorsAdmin();
             return Ok(response);
        }
        catch (Exception)
        {
            return StatusCode(StatusCodes.Status500InternalServerError,new {message="Try agian later"});
        }
    }
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<List<FindDoctorResponse>>> FindDoctors()
    {
        try
        {
            var response = await _doctorService.FindDoctors();
            return Ok(response);
        }
        catch (Exception)
        {
            return StatusCode(StatusCodes.Status500InternalServerError,new {message="Try again later"});
        }
    }

    [HttpGet("doctor/{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<FindDoctorResponse>> GetDoctorById([FromRoute] int id)
    {
        try
        {
            var response = await _doctorService.GetDoctorById(id);
            if (response == null)
            {
                return NotFound(new { message = "Physician record not found" });
            }
            return Ok(response);
        }
        catch (Exception)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Try again later" });
        }
    }

    [HttpGet("dashboard")]
    [Authorize(Roles ="Admin")]

    public async Task<ActionResult<AdminDashboardDto>> Dashboard()
    {
        try
        {
            var response = await _adminExtra.AdminDashboard();
            return Ok(response);
        }
        catch (Exception)
        {
            return StatusCode(StatusCodes.Status500InternalServerError,new {message="Try again later"});
        }
    }
    [HttpGet("patient")]
    [Authorize(Roles ="Admin")]
    public async Task<ActionResult<AdminPatientsDto>> Patients()
    {
        try
        {
            var response = await _adminExtra.AdminPatient();
            return Ok(response);
        }
        catch (Exception)
        {
            return StatusCode(StatusCodes.Status500InternalServerError,new {message="Try again later"});
        }
    }
    [HttpGet("audit-logs")]
    [Authorize(Roles="Admin")]
    public async   Task<ActionResult<List<AdminLogsDto>>> Logs()
    {
        try
        {
          var response = await _adminExtra.AdminLogs();
          return Ok(response);  
        }
        catch (Exception)
        {
           return StatusCode(StatusCodes.Status500InternalServerError,new {message="Try again later"}); 
        }
    }

    [HttpGet("schedules")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<List<DoctorScheduleResponseDto>>> GetSchedules([FromQuery] DateOnly date)
    {
        try
        {
            if (date == default)
            {
                date = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(5));
            }
            var response = await _adminExtra.GetDoctorSchedules(date);
            return Ok(response);
        }
        catch (Exception)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Try again later" });
        }
    }

    [HttpPatch("doctor/{id}/shift")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> UpdateShift([FromRoute] int id, [FromBody] DoctorShiftUpdateDto dto)
    {
        try
        {
            var message = await _adminExtra.UpdateDoctorShift(id, dto);
            return Ok(new { message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Try again later" });
        }
    }

    [HttpPatch("doctor/{id}/availability")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> ToggleDoctorAvailability([FromRoute] int id)
    {
        try
        {
            var isAvailable = await _adminExtra.ToggleDoctorAvailability(id);
            return Ok(new { isAvailable, message = isAvailable ? "Doctor is now On Duty" : "Doctor is now Off Duty" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Try again later" });
        }
    }
}