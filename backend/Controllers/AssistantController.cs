using System.Data;
using System.Security.Claims;
using backend.DTOs;
using backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("/api/[controller]")]
public class AssistantController : ControllerBase
{
    private readonly IAssistant _assistantService;

    public AssistantController(IAssistant assistantService)
    {
        _assistantService = assistantService;
    }

    [HttpPost("register")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ResponseAssistantDto>> Register(RegisterAssistantDto dto)
    {
        try
        {
            var result = await _assistantService.RegisterAssistant(dto);
            return StatusCode(StatusCodes.Status201Created, result);
        }
        catch (DuplicateNameException ex)
        {
            return Conflict(new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    [HttpGet("all")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<List<ResponseAssistantDto>>> GetAll()
    {
        try
        {
            var list = await _assistantService.GetAllAssistants();
            return Ok(list);
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ResponseAssistantDto>> Update(int id, UpdateAssistantDto dto)
    {
        try
        {
            var result = await _assistantService.UpdateAssistant(id, dto);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> Delete(int id)
    {
        try
        {
            var success = await _assistantService.DeleteAssistant(id);
            if (!success)
            {
                return NotFound(new { message = "Assistant not found" });
            }
            return Ok(new { message = "Assistant deleted successfully" });
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    [HttpGet("my-assistants")]
    [Authorize(Roles = "Doctor")]
    public async Task<ActionResult<List<ResponseAssistantDto>>> GetDoctorAssistants()
    {
        try
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out var doctorUserId))
            {
                return Unauthorized(new { message = "Invalid user identity" });
            }

            var list = await _assistantService.GetDoctorAssistants(doctorUserId);
            return Ok(list);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    [HttpGet("queue")]
    [Authorize(Roles = "Assistant,Admin")]
    public async Task<ActionResult<List<AssistantQueueItemDto>>> GetTodayQueue()
    {
        try
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out var assistantUserId))
            {
                return Unauthorized(new { message = "Invalid user identity" });
            }

            var queue = await _assistantService.GetTodayQueue(assistantUserId);
            return Ok(queue);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    [HttpPost("vitals")]
    [Authorize(Roles = "Assistant,Admin")]
    public async Task<ActionResult<ResponseVitalsDto>> RecordVitals(CreateVitalsDto dto)
    {
        try
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out var assistantUserId))
            {
                return Unauthorized(new { message = "Invalid user identity" });
            }

            var result = await _assistantService.RecordVitals(dto, assistantUserId);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    [HttpGet("vitals/{appointmentId:int}")]
    [Authorize(Roles = "Assistant,Doctor,Admin")]
    public async Task<ActionResult<ResponseVitalsDto>> GetVitals(int appointmentId)
    {
        try
        {
            var vitals = await _assistantService.GetVitalsByAppointment(appointmentId);
            if (vitals == null)
            {
                return NotFound(new { message = "Vitals have not been recorded for this appointment yet" });
            }
            return Ok(vitals);
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    [HttpPost("lab-order")]
    [Authorize(Roles = "Doctor,Admin")]
    public async Task<ActionResult<ResponseLabOrderDto>> CreateLabOrder(CreateLabOrderDto dto)
    {
        try
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out var doctorUserId))
            {
                return Unauthorized(new { message = "Invalid user identity" });
            }

            var result = await _assistantService.CreateLabOrder(dto, doctorUserId);
            return StatusCode(StatusCodes.Status201Created, result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    [HttpGet("lab-orders/{appointmentId:int}")]
    [Authorize(Roles = "Assistant,Doctor,Patient,Admin")]
    public async Task<ActionResult<List<ResponseLabOrderDto>>> GetLabOrders(int appointmentId)
    {
        try
        {
            var orders = await _assistantService.GetLabOrdersByAppointment(appointmentId);
            return Ok(orders);
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    [HttpGet("pending-lab-orders")]
    [Authorize(Roles = "Assistant,Admin")]
    public async Task<ActionResult<List<ResponseLabOrderDto>>> GetPendingLabOrders()
    {
        try
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out var assistantUserId))
            {
                return Unauthorized(new { message = "Invalid user identity" });
            }

            var orders = await _assistantService.GetPendingLabOrders(assistantUserId);
            return Ok(orders);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    [HttpPut("lab-order/{id:int}/status")]
    [Authorize(Roles = "Assistant,Doctor,Admin")]
    public async Task<ActionResult<ResponseLabOrderDto>> UpdateLabStatus(int id, UpdateLabStatusDto dto)
    {
        try
        {
            var result = await _assistantService.UpdateLabOrderStatus(id, dto);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    [HttpPatch("check-in/{appointmentId:int}")]
    [Authorize(Roles = "Assistant,Admin")]
    public async Task<ActionResult<AppointmentStatusResponseDto>> CheckIn(int appointmentId)
    {
        try
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out var assistantUserId))
            {
                return Unauthorized(new { message = "Invalid user identity" });
            }

            var result = await _assistantService.CheckInPatient(appointmentId, assistantUserId);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    [HttpGet("patient-lab-history/{patientId:int}")]
    [Authorize(Roles = "Doctor,Assistant,Admin")]
    public async Task<ActionResult<List<ResponseLabOrderDto>>> GetPatientLabHistory(int patientId)
    {
        try
        {
            var history = await _assistantService.GetPatientLabHistory(patientId);
            return Ok(history);
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    [HttpPost("book-appointment")]
    [Authorize(Roles = "Assistant,Admin")]
    public async Task<ActionResult<ResponseAssistantBookingDto>> BookAppointment(AssistantBookAppointmentDto dto)
    {
        try
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out var assistantUserId))
            {
                return Unauthorized(new { message = "Invalid user identity" });
            }

            var result = await _assistantService.BookAssistedAppointment(dto, assistantUserId);
            return StatusCode(StatusCodes.Status201Created, result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
        catch (DuplicateNameException ex)
        {
            return Conflict(new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    [HttpGet("schedulable-doctors")]
    [Authorize(Roles = "Assistant,Admin")]
    public async Task<ActionResult<List<FindDoctorResponse>>> GetSchedulableDoctors()
    {
        try
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out var assistantUserId))
            {
                return Unauthorized(new { message = "Invalid user identity" });
            }

            var doctors = await _assistantService.GetSchedulableDoctors(assistantUserId);
            return Ok(doctors);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }
}
