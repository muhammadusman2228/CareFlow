using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddSettlementReportIdToPayment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "SettlementReportId",
                table: "Payments",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Payments_SettlementReportId",
                table: "Payments",
                column: "SettlementReportId");

            migrationBuilder.AddForeignKey(
                name: "FK_Payments_DailySettlementReports_SettlementReportId",
                table: "Payments",
                column: "SettlementReportId",
                principalTable: "DailySettlementReports",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Payments_DailySettlementReports_SettlementReportId",
                table: "Payments");

            migrationBuilder.DropIndex(
                name: "IX_Payments_SettlementReportId",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "SettlementReportId",
                table: "Payments");
        }
    }
}
