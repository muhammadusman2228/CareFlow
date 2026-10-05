

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