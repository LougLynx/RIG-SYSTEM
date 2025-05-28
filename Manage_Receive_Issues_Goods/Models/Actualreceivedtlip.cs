using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Manage_Receive_Issues_Goods.Models;

[Table("actualreceivedtlip")]
[Index("PlanId", Name = "FK_actualreceivedtlip_planreceivetlip")]
[Index("SupplierCode", Name = "SupplierCode")]
public partial class Actualreceivedtlip
{
    [Key]
    [Column("ActualReceivedID")]
    public int ActualReceivedId { get; set; }

    [Column(TypeName = "datetime")]
    public DateTime ActualDeliveryTime { get; set; }

    [Column(TypeName = "time")]
    public TimeSpan? ActualLeadTime { get; set; }

    [Column(TypeName = "time")]
    public TimeSpan? ActualStorageTime { get; set; }

    [StringLength(100)]
    [MySqlCharSet("utf8mb3")]
    [MySqlCollation("utf8mb3_general_ci")]
    public string SupplierCode { get; set; } = null!;

    [StringLength(100)]
    [MySqlCharSet("utf8mb3")]
    [MySqlCollation("utf8mb3_general_ci")]
    public string? AsnNumber { get; set; }

    [StringLength(100)]
    public string? DoNumber { get; set; }

    [StringLength(100)]
    public string? Invoice { get; set; }

    public bool IsCompleted { get; set; }

    [StringLength(100)]
    public string? TagName { get; set; }

    public int PlanId { get; set; }

    [InverseProperty("ActualReceived")]
    public virtual ICollection<Actualdetailtlip> Actualdetailtlips { get; set; } = new List<Actualdetailtlip>();

    [InverseProperty("ActualReceived")]
    public virtual ICollection<Historyplanreceivedtlip> Historyplanreceivedtlips { get; set; } = new List<Historyplanreceivedtlip>();

    [ForeignKey("PlanId")]
    [InverseProperty("Actualreceivedtlips")]
    public virtual Planreceivetlip Plan { get; set; } = null!;

    [ForeignKey("SupplierCode")]
    [InverseProperty("Actualreceivedtlips")]
    public virtual Supplier SupplierCodeNavigation { get; set; } = null!;
}
