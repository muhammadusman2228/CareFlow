using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddCashierAndBankDeposits : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "BankDepositId",
                table: "DailySettlementReports",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CashierId",
                table: "DailySettlementReports",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CashierNotes",
                table: "DailySettlementReports",
                type: "varchar(500)",
                maxLength: 500,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<DateTime>(
                name: "CashierVerifiedAt",
                table: "DailySettlementReports",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "CashierBankDeposits",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    DepositReference = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DepositDate = table.Column<DateOnly>(type: "date", nullable: false),
                    CashierId = table.Column<int>(type: "int", nullable: false),
                    BankName = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    BankAccountNumber = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    BankDepositSlipNumber = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DepositedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    TotalHandoversIncluded = table.Column<int>(type: "int", nullable: false),
                    TotalCashDeposited = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TotalOnlineAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    GrandTotal = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Status = table.Column<string>(type: "varchar(30)", maxLength: 30, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CashierNotes = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    VerifiedByAdminId = table.Column<int>(type: "int", nullable: true),
                    AdminVerifiedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    AdminNotes = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CashierBankDeposits", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CashierBankDeposits_Users_CashierId",
                        column: x => x.CashierId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CashierBankDeposits_Users_VerifiedByAdminId",
                        column: x => x.VerifiedByAdminId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_DailySettlementReports_BankDepositId",
                table: "DailySettlementReports",
                column: "BankDepositId");

            migrationBuilder.CreateIndex(
                name: "IX_DailySettlementReports_CashierId",
                table: "DailySettlementReports",
                column: "CashierId");

            migrationBuilder.CreateIndex(
                name: "IX_CashierBankDeposits_CashierId",
                table: "CashierBankDeposits",
                column: "CashierId");

            migrationBuilder.CreateIndex(
                name: "IX_CashierBankDeposits_DepositDate",
                table: "CashierBankDeposits",
                column: "DepositDate");

            migrationBuilder.CreateIndex(
                name: "IX_CashierBankDeposits_DepositReference",
                table: "CashierBankDeposits",
                column: "DepositReference",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CashierBankDeposits_VerifiedByAdminId",
                table: "CashierBankDeposits",
                column: "VerifiedByAdminId");

            migrationBuilder.AddForeignKey(
                name: "FK_DailySettlementReports_CashierBankDeposits_BankDepositId",
                table: "DailySettlementReports",
                column: "BankDepositId",
                principalTable: "CashierBankDeposits",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_DailySettlementReports_Users_CashierId",
                table: "DailySettlementReports",
                column: "CashierId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DailySettlementReports_CashierBankDeposits_BankDepositId",
                table: "DailySettlementReports");

            migrationBuilder.DropForeignKey(
                name: "FK_DailySettlementReports_Users_CashierId",
                table: "DailySettlementReports");

            migrationBuilder.DropTable(
                name: "CashierBankDeposits");

            migrationBuilder.DropIndex(
                name: "IX_DailySettlementReports_BankDepositId",
                table: "DailySettlementReports");

            migrationBuilder.DropIndex(
                name: "IX_DailySettlementReports_CashierId",
                table: "DailySettlementReports");

            migrationBuilder.DropColumn(
                name: "BankDepositId",
                table: "DailySettlementReports");

            migrationBuilder.DropColumn(
                name: "CashierId",
                table: "DailySettlementReports");

            migrationBuilder.DropColumn(
                name: "CashierNotes",
                table: "DailySettlementReports");

            migrationBuilder.DropColumn(
                name: "CashierVerifiedAt",
                table: "DailySettlementReports");
        }
    }
}
