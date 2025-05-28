using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Manage_Receive_Issues_Goods.Models;

[Table("plandetailreceivedtlip")]
[Index("PlanId", Name = "PlanID")]
[Index("SupplierCode", Name = "SupplierCode")]
[Index("WeekdayId", Name = "WeekdayID")]
public partial class Plandetailreceivedtlip
{
    [Key]
    [Column("PlanDetailID")]
    public int PlanDetailId { get; set; }

    [Column("PlanID")]
    public int PlanId { get; set; }

    [StringLength(100)]
    [MySqlCharSet("utf8mb3")]
    [MySqlCollation("utf8mb3_general_ci")]
    public string SupplierCode { get; set; } = null!;

    [Column(TypeName = "time")]
    public TimeOnly DeliveryTime { get; set; }

    [Column("WeekdayID")]
    public int WeekdayId { get; set; }

    [Column(TypeName = "time")]
    public TimeOnly LeadTime { get; set; }

    [Column(TypeName = "enum('Weekly','Monthly','Bi-Monthly')")]
    public string PlanType { get; set; } = null!;

    public int? WeekOfMonth { get; set; }

    public int? OccurrencesPerMonth { get; set; }

    [StringLength(100)]
    public string? TagName { get; set; }

    [InverseProperty("PlanDetail")]
    public virtual ICollection<Historyplanreceivedtlip> Historyplanreceivedtlips { get; set; } = new List<Historyplanreceivedtlip>();

    [ForeignKey("PlanId")]
    [InverseProperty("Plandetailreceivedtlips")]
    public virtual Planreceivetlip Plan { get; set; } = null!;

    [ForeignKey("SupplierCode")]
    [InverseProperty("Plandetailreceivedtlips")]
    public virtual Supplier SupplierCodeNavigation { get; set; } = null!;

    [ForeignKey("WeekdayId")]
    [InverseProperty("Plandetailreceivedtlips")]
    public virtual Weekday Weekday { get; set; } = null!;
}
