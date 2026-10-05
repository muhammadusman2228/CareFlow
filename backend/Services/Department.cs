



using System.Data;
using System.Linq.Expressions;
using backend.Data;
using backend.DTOs;
using backend.Interfaces;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public class DepartmentService : IDepartments
{

    private readonly AppDbContext _context;
    public DepartmentService(AppDbContext context)
    {
        _context=context;
    }
    public async Task<DepartmentResponseDto> registerDepartment(DeparmentRequestDto dto)
    {
        try
        {
            var normalName= dto.Name.Trim().ToLower();
        var isExist=await _context.Departments.FirstOrDefaultAsync(d=>d.Name.ToLower()==normalName);
        if (isExist!=null)
        {
            throw new DuplicateNameException("Department name is already Exists");
        }
        var department = new Departments
        {
            Name=normalName,
            Description=dto.Description
        };
        await _context.Departments.AddAsync(department);
        await _context.SaveChangesAsync();

        return new DepartmentResponseDto
        {
           Id=department.Id,
           Name=department.Name,
           Description=department.Description,
   DoctorCounts=department.Doctors.Count()
        };
        }
        catch (DuplicateNameException)
        {
            throw;
        }
        catch
        {
            throw new Exception("Try again later");
        }
    }
    public async Task<List<DepartmentResponseDto>> getDepartments()
    {
        try
        {
             var departments= await _context.Departments.AsNoTracking().OrderBy(d=>d.Name).Select(d=>new DepartmentResponseDto
        {
            Id=d.Id,
            Name=d.Name,
            Description=d.Description,
            DoctorCounts= d.Doctors.Count()
        }).ToListAsync();
        return departments;
        }
        catch
        {
            throw new Exception("Try again later");
        }
    }
}