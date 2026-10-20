



using System.Data;
using System.Security.Claims;
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
    private readonly IPaymentService _paymentService;

    public AdminController(IDoctor doctorService, IAdminExtra adminExtra, IPaymentService paymentService)
    {
        _doctorService = doctorService;
        _adminExtra = adminExtra;
        _paymentService = paymentService;
    }
    [HttpPost]
    [Authorize(Roles = "SuperAdmin,Admin")]
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
    [Authorize(Roles = "SuperAdmin,Admin")]
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
    [Authorize(Roles = "SuperAdmin,Admin")]
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
    [Authorize(Roles = "SuperAdmin,Admin")]
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
    [Authorize(Roles = "SuperAdmin,Admin")]
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
    [Authorize(Roles = "SuperAdmin,Admin")]
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
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<ActionResult> UpdateShift([FromRoute] int id, [FromBody] DoctorShiftUpdateDto dto, [FromQuery] DateOnly? date)
    {
        try
        {
            var message = await _adminExtra.UpdateDoctorShift(id, dto, date);
            return Ok(new { message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
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

    [HttpPatch("doctor/{id}/availability")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<ActionResult> ToggleDoctorAvailability([FromRoute] int id, [FromQuery] DateOnly? date)
    {
        try
        {
            var isAvailable = await _adminExtra.ToggleDoctorAvailability(id, date);
            return Ok(new { isAvailable, message = isAvailable ? "Doctor is now On Duty" : "Doctor is now Off Duty" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
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

    [HttpPost("register-admin")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult> RegisterAdmin([FromBody] RegisterAdminRequestDto dto)
    {
        try
        {
            var message = await _adminExtra.RegisterAdmin(dto);
            return Ok(new { message });
        }
        catch (DuplicateNameException ex)
        {
            return Conflict(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    [HttpPost("verify-admin-otp")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult> VerifyAdminOtp([FromBody] VerifyAdminOtpDto dto)
    {
        try
        {
            var message = await _adminExtra.VerifyAdminOtp(dto);
            return Ok(new { message });
        }
        catch (System.Security.Authentication.InvalidCredentialException ex)
        {
            return BadRequest(new { message = ex.Message });
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

    [HttpGet("admins-list")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult<List<AdminListItemDto>>> GetAdminsList()
    {
        try
        {
            var list = await _adminExtra.GetAdminsList();
            return Ok(list);
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    [HttpDelete("admin/{id:int}")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult> DeleteAdmin([FromRoute] int id)
    {
        try
        {
            var currentUserIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(currentUserIdStr) || !int.TryParse(currentUserIdStr, out var currentUserId))
            {
                return Unauthorized(new { message = "Invalid user identity" });
            }

            var message = await _adminExtra.DeleteAdmin(id, currentUserId);
            return Ok(new { message });
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

    [HttpPatch("doctor/{id}/departments")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<ActionResult> UpdateDoctorDepartments([FromRoute] int id, [FromBody] UpdateDoctorDepartmentsDto dto)
    {
        try
        {
            var message = await _doctorService.UpdateDoctorDepartments(id, dto);
            return Ok(new { message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidKeyException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Try again later" });
        }
    }

    [HttpPatch("doctor/{id}/fee")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<ActionResult> UpdateDoctorFee([FromRoute] int id, [FromBody] UpdateDoctorFeeDto dto)
    {
        try
        {
            var message = await _doctorService.UpdateDoctorFee(id, dto);
            return Ok(new { message, consultationFee = dto.ConsultationFee });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidKeyException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Try again later" });
        }
    }

    [HttpGet("diversion/candidates/{appointmentId:int}")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<ActionResult<DiversionCandidatesResponseDto>> GetDiversionCandidates([FromRoute] int appointmentId)
    {
        try
        {
            var candidates = await _adminExtra.GetAdminDiversionCandidates(appointmentId);
            return Ok(candidates);
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

    [HttpPost("divert-appointment")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<ActionResult<DivertAppointmentResponseDto>> DivertAppointment([FromBody] AdminDivertAppointmentDto dto)
    {
        try
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out var adminUserId))
            {
                return Unauthorized(new { message = "Invalid user identity" });
            }

            var response = await _adminExtra.DivertFutureAppointment(dto, adminUserId);
            return Ok(response);
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

    [HttpGet("doctor/{doctorId:int}/appointments")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<ActionResult<List<AdminDoctorAppointmentDto>>> GetDoctorAppointments([FromRoute] int doctorId, [FromQuery] DateOnly date)
    {
        try
        {
            if (date == default)
            {
                date = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(5));
            }
            var appointments = await _adminExtra.GetDoctorAppointments(doctorId, date);
            return Ok(appointments);
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    [HttpGet("monthly-appointments")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<ActionResult<MonthlyAppointmentsSummaryDto>> GetMonthlyAppointments([FromQuery] int? year, [FromQuery] int? month)
    {
        try
        {
            var todayPkt = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(5));
            int targetYear = year ?? todayPkt.Year;
            int targetMonth = month ?? todayPkt.Month;

            if (targetMonth < 1 || targetMonth > 12)
            {
                return BadRequest(new { message = "Invalid month value (1-12)" });
            }

            var summary = await _adminExtra.GetMonthlyAppointments(targetYear, targetMonth);
            return Ok(summary);
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    [HttpGet("settlement-reports")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<ActionResult<List<SettlementReportResponseDto>>> GetSettlementReports([FromQuery] DateOnly? date, [FromQuery] string? status, [FromQuery] int? assistantId)
    {
        try
        {
            var reports = await _paymentService.GetAdminSettlementReports(date, status, assistantId);
            return Ok(reports);
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    [HttpGet("settlement-reports/{id:int}")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<ActionResult<SettlementReportResponseDto>> GetSettlementReportById(int id)
    {
        try
        {
            var report = await _paymentService.GetSettlementReportById(id);
            return Ok(report);
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

    [HttpPatch("settlement-reports/{id:int}/verify")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<ActionResult<SettlementReportResponseDto>> VerifySettlementReport(int id, [FromBody] VerifySettlementDto dto)
    {
        try
        {
            var adminIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(adminIdStr) || !int.TryParse(adminIdStr, out var adminUserId))
            {
                return Unauthorized(new { message = "Invalid administrator identity" });
            }

            var verifiedReport = await _paymentService.VerifySettlementReport(adminUserId, id, dto);
            return Ok(verifiedReport);
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

    [HttpGet("bank-deposits")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<ActionResult<List<CashierBankDepositResponseDto>>> GetBankDeposits([FromQuery] DateOnly? date)
    {
        try
        {
            var deposits = await _paymentService.GetBankDeposits(date);
            return Ok(deposits);
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    [HttpGet("bank-deposits/{id:int}")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<ActionResult<CashierBankDepositResponseDto>> GetBankDepositById(int id)
    {
        try
        {
            var deposit = await _paymentService.GetBankDepositById(id);
            return Ok(deposit);
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

    [HttpPatch("bank-deposits/{id:int}/verify")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<ActionResult<CashierBankDepositResponseDto>> VerifyBankDeposit(int id, [FromBody] AdminVerifyBankDepositDto dto)
    {
        try
        {
            var adminIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(adminIdStr) || !int.TryParse(adminIdStr, out var adminUserId))
            {
                return Unauthorized(new { message = "Invalid administrator identity" });
            }

            var verifiedDeposit = await _paymentService.AdminVerifyBankDeposit(adminUserId, id, dto);
            return Ok(verifiedDeposit);
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

    [HttpGet("cashiers")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<ActionResult<List<CashierUserDto>>> GetCashiers()
    {
        try
        {
            var cashiers = await _paymentService.GetCashiers();
            return Ok(cashiers);
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    [HttpPost("cashiers")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<ActionResult<CashierUserDto>> CreateCashier([FromBody] RegisterCashierDto dto)
    {
        try
        {
            var cashier = await _paymentService.CreateCashier(dto);
            return StatusCode(StatusCodes.Status201Created, cashier);
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

    [HttpPut("cashiers/{id:int}")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<ActionResult<CashierUserDto>> UpdateCashier(int id, [FromBody] UpdateCashierDto dto)
    {
        try
        {
            var cashier = await _paymentService.UpdateCashier(id, dto);
            return Ok(cashier);
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

    [HttpDelete("cashiers/{id:int}")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<ActionResult> DeleteCashier(int id)
    {
        try
        {
            var completelyDeleted = await _paymentService.DeleteCashier(id);
            if (!completelyDeleted)
            {
                return Ok(new { message = "Cashier has recorded financial lodgements and has been deactivated to preserve audit compliance." });
            }
            return Ok(new { message = "Cashier account permanently removed." });
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