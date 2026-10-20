using System.Security.Claims;
using backend.DTOs;
using backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("/api/[controller]")]
[Authorize(Roles = "Cashier,SuperAdmin,Admin")]
public class CashierController : ControllerBase
{
    private readonly IPaymentService _paymentService;

    public CashierController(IPaymentService paymentService)
    {
        _paymentService = paymentService;
    }

    [HttpGet("handovers")]
    public async Task<ActionResult<List<SettlementReportResponseDto>>> GetHandovers([FromQuery] DateOnly? date)
    {
        try
        {
            var result = await _paymentService.GetCashierPendingHandovers(date);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPost("verify-handover/{reportId}")]
    public async Task<ActionResult<SettlementReportResponseDto>> VerifyHandover([FromRoute] int reportId, [FromBody] CashierVerifyHandoverDto dto)
    {
        try
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdStr, out int userId))
            {
                return Unauthorized();
            }

            var result = await _paymentService.CashierVerifyAssistantHandover(userId, reportId, dto);
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
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpGet("daily-summary")]
    public async Task<ActionResult<CashierDailySummaryDto>> GetDailySummary([FromQuery] DateOnly? date)
    {
        try
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            int.TryParse(userIdStr, out int userId);

            var result = await _paymentService.GetCashierDailySummary(userId, date);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPost("submit-bank-deposit")]
    public async Task<ActionResult<CashierBankDepositResponseDto>> SubmitBankDeposit([FromBody] SubmitBankDepositDto dto)
    {
        try
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdStr, out int userId))
            {
                return Unauthorized();
            }

            var result = await _paymentService.SubmitBankDeposit(userId, dto);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpGet("bank-deposits")]
    public async Task<ActionResult<List<CashierBankDepositResponseDto>>> GetBankDeposits([FromQuery] DateOnly? date)
    {
        try
        {
            var result = await _paymentService.GetBankDeposits(date);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpGet("bank-deposit/{depositId}")]
    public async Task<ActionResult<CashierBankDepositResponseDto>> GetBankDepositById([FromRoute] int depositId)
    {
        try
        {
            var result = await _paymentService.GetBankDepositById(depositId);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }
}
