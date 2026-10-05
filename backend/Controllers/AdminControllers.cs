



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
    public AdminController(IDoctor doctorService)
    {
        _doctorService=doctorService;
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
            return StatusCode(StatusCodes.Status500InternalServerError,new {messsage=ex.Message});
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
}