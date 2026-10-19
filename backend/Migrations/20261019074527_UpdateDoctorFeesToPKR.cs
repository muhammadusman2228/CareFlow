using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class UpdateDoctorFeesToPKR : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("UPDATE Doctors SET ConsultationFee = 2500.00 WHERE Id = 3;");
            migrationBuilder.Sql("UPDATE Doctors SET ConsultationFee = 1500.00 WHERE Id = 101;");
            migrationBuilder.Sql("UPDATE Doctors SET ConsultationFee = 1500.00 WHERE Id = 107;");
            migrationBuilder.Sql("UPDATE Doctors SET ConsultationFee = 1500.00 WHERE ConsultationFee < 500.00;");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("UPDATE Doctors SET ConsultationFee = 160.00 WHERE Id = 3;");
            migrationBuilder.Sql("UPDATE Doctors SET ConsultationFee = 65.00 WHERE Id = 101;");
            migrationBuilder.Sql("UPDATE Doctors SET ConsultationFee = 32.00 WHERE Id = 107;");
        }
    }
}
