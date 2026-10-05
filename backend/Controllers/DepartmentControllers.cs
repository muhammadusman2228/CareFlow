



using System.Data;
using backend.DTOs;
using backend.Interfaces;
using backend.Services;
using Microsoft.AspNetCore.Authorization;

using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("/api/[controller]")]
public class DepartmentController:ControllerBase
{
    private readonly IDepartments _service;
    public DepartmentController(IDepartments service)
    {
        _service=service;
    }

    [HttpPost]
    [Authorize(Roles ="Admin")]
    public async Task<ActionResult<DepartmentResponseDto>> registerDepartment([FromBody] DeparmentRequestDto dto)
    {
        try
        {
            var response = await _service.registerDepartment(dto);
            return CreatedAtAction(nameof(registerDepartment), response);
        }
        catch(DuplicateNameException ex)
        {
            return BadRequest(new {message=ex.Message});
        }
        
        catch(Exception)
        {
            return StatusCode(StatusCodes.Status500InternalServerError,new {message="Try again later"});
        }
    }
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<List<DepartmentResponseDto>>> getDepartments()
    {
        try
        {
            var list = await _service.getDepartments();
        return Ok(list);
        }
        catch(InvalidDataException)
        {
            return Ok(new {message="No departments yet"});
        }
        catch 
        {
            return StatusCode(StatusCodes.Status500InternalServerError,new {message="Try again later"});
        }
    }
}