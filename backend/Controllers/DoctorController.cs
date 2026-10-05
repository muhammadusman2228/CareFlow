




using System.Security.Claims;
using backend.DTOs;
using backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;



namespace backend.Controllers;
[ApiController]
[Route("/api/[controller]")]
public class DoctorController : ControllerBase
{
    
    private readonly IDoctorApis _doctorService;

    public DoctorController(IDoctorApis doctorService)
    {
        _doctorService=doctorService;
    }

    [HttpGet("doctor-appointments")]
    [Authorize(Roles ="Doctor")]

    public async Task<ActionResult<List<DoctorAppointmentsDto>>> DoctorAppointment()
    {
        try
        {
            var userId= int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var appointments=await _doctorService.DoctorAppointment(userId);
            return Ok(appointments);
        }
        catch(InvalidDataException ex)
        {
            return BadRequest(new {message=ex.Message});
        }
        catch (Exception)
        {
            return StatusCode(StatusCodes.Status500InternalServerError,new {message="Try again later"});
        }
    }

    [HttpPatch("appointment-status")]
    [Authorize(Roles ="Doctor")]
    public async Task<ActionResult<AppointmentStatusResponseDto>> AppointmentStatus(AppointmentStatusDto dto)
    {
        try
        {
            var response = await _doctorService.AppointmentStatus(dto);
        return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new {message=ex.Message});
        }
        catch(Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError,new {message=ex.Message});
        }

    }
    [HttpPost("prescription")]
    [Authorize(Roles ="Doctor")]

    public async Task<ActionResult<PrescriptionResponseDto>> Prescriptions(PrescriptionsDto dto)
    {
        try
        {
            var response = await _doctorService.Prescriptions(dto);
            return CreatedAtAction(nameof(Prescriptions),response);
        }
        catch(InvalidDataException ex)
        {
            return BadRequest(new {message=ex.Message});
        }
        catch(Exception)
        {
            return StatusCode(StatusCodes.Status500InternalServerError,new {message="Try again later"});
        }
    }
    [HttpGet("medical-history")]
    [Authorize(Roles ="Doctor")]
    public async Task<ActionResult<HistoryResponseDto>> MedicalHistory(HistoryDto dto)
    {
        try
        {
            var response = await _doctorService.MedicalHistory(dto);
            return Ok(response);
            
        }
        catch(InvalidDataException ex)
        {
            return BadRequest(new {message=ex.Message});
        }
        catch(Exception)
        {
           return StatusCode(StatusCodes.Status500InternalServerError,new {message="Try again later"}); 
        }
    }
}