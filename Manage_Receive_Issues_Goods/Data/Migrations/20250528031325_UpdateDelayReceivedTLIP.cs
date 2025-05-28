using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Manage_Receive_Issues_Goods.Data.Migrations
{
    /// <inheritdoc />
    public partial class UpdateDelayReceivedTLIP : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DelayReceivedTLIPs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    PlanDetailId = table.Column<int>(type: "int", nullable: false),
                    OldDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    NewDate = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DelayReceivedTLIPs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DelayReceivedTLIPs_plandetailreceivedtlip_PlanDetailId",
                        column: x => x.PlanDetailId,
                        principalTable: "plandetailreceivedtlip",
                        principalColumn: "PlanDetailID",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_0900_ai_ci");

            migrationBuilder.CreateIndex(
                name: "IX_DelayReceivedTLIPs_PlanDetailId",
                table: "DelayReceivedTLIPs",
                column: "PlanDetailId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DelayReceivedTLIPs");
        }
    }
}
