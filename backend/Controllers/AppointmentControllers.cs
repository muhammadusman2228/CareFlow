



using System.Data;
using backend.DTOs;
using backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
namespace backend.Controllers;
[ApiController]
[Route("/api/[controller]")]

public class AppointmentController : ControllerBase
{
    
    private readonly IAppointment _appointmentService;
    public AppointmentController(IAppointment appointmentService)
    {
        _appointmentService=appointmentService;
    } 

    [HttpGet("availability")]
    [AllowAnonymous]
    public async Task<ActionResult<List<ResponseAppointmentDto>>> DoctorAvailability( [FromQuery] DateOnly date,[FromQuery] TimeOnly time,[FromQuery] int departmentId)
    {
        try
        {
            var doctors=await _appointmentService.GetAvailableDoctors(departmentId,date,time);
            return Ok(doctors);
        }
        catch
        {
            return StatusCode(StatusCodes.Status500InternalServerError,new {message="Try again later"});
        }
    }

    [HttpPost("booking")]
    [Authorize(Roles ="Patient")]

    public async Task<ActionResult<ResponseBookingDto>> BookAppointment(RequestBookingDto dto)
    {
        try
        {
            var response = await _appointmentService.BookAppointment(dto);
            return CreatedAtAction(nameof(BookAppointment),response);
        }
        catch(KeyNotFoundException ex)
        {
            return BadRequest(new {message=ex.Message});
        }
        catch(DuplicateNameException ex)
        {
            return BadRequest(new {message=ex.Message});
        }
        catch
        {
            return StatusCode(StatusCodes.Status500InternalServerError,new {message="Try again later"});
        }
    }
}