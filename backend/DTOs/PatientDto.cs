

namespace backend.DTOs;

public class PatientAppointmentDto
{
    public int AppointmentId{get;set;}
    public string DoctorName{get;set;}=string.Empty;
    public string Department{get;set;}=string.Empty;
    public DateOnly AppointmentDate{get;set;}
    public TimeOnly TimeSlot{get;set;}
    public string Status{get;set;}=string.Empty;

}

public class PatientPrescriptionsDto
{
    
    public string DoctorName{get;set;}=string.Empty;
    public string Title {get;set;}=string.Empty;
    public string Note{get;set;}=string.Empty;

    public DateOnly AppointmentDate{get;set;}
}

public class ProfileResponseDto
{
    
    public string Name{get;set;}=string.Empty;
    public string Email{get;set;}=string.Empty;
    public string PhoneNumber{get;set;}=string.Empty;

    public string EmergencyContact {get;set;}=string.Empty;
    public string BloodGroup{get;set;}=string.Empty;
    public string Gender {get;set;}=string.Empty;
    public DateOnly DateOfBirth{get;set;}

}