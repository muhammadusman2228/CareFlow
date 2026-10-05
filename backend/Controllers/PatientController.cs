



using System.Security.Claims;
using backend.DTOs;
using backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]

public class PatientController :ControllerBase
{
    private readonly IPatient _patientService;
    public PatientController(IPatient patientService)
    {
        _patientService=patientService;
    }
    [HttpGet("my-appointment")]
    [Authorize(Roles ="Patient")]
    public async Task<ActionResult<List<PatientAppointmentDto>>> Appointment()
    {
        try
        {
            int userId= int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var response = await _patientService.Appointment(userId);
            return Ok(response);
            
        }
        catch(InvalidDataException ex)
        {
            return BadRequest(new {message=ex.Message});
        }
        catch (Exception)
        {
            return StatusCode(StatusCodes.Status500InternalServerError,new{message="Try again later"});
        }
    }
    [HttpGet("prescription")]
    [Authorize(Roles ="Patient")]
    public async Task<ActionResult<List<PatientPrescriptionsDto>>> Prescriptions()
    {
        try
        {
        int id = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var response = await _patientService.Prescriptions(id);
        return Ok(response); 
        }
        catch(InvalidDataException ex)
        {
            return BadRequest(new {message=ex.Message});
        }
        catch(Exception)
        {
            return StatusCode(StatusCodes.Status500InternalServerError,new{message="Try again later"});
        }
    }

    [HttpPatch("cancel-appointment/{id}")]
    [Authorize(Roles = "Patient")]
    public async Task<ActionResult> CancelAppointment([FromRoute] int id)
    {
        try
        {
            int userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var response = await _patientService.CancelAppointment(id, userId);
            return Ok(new { message = response });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Try again later" });
        }
    }
}