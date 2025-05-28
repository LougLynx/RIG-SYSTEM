using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Manage_Receive_Issues_Goods.Models;

[Table("historyplanreceivedtlip")]
[Index("ActualReceivedId", Name = "ActualReceivedID")]
[Index("PlanDetailId", Name = "PlanDetailID")]
public partial class Historyplanreceivedtlip
{
    [Key]
    [Column("HistoryID")]
    public int HistoryId { get; set; }

    [Column("PlanDetailID")]
    public int? PlanDetailId { get; set; }

    [Column("ActualReceivedID")]
    public int? ActualReceivedId { get; set; }

    public DateOnly? HistoryDate { get; set; }

    [ForeignKey("ActualReceivedId")]
    [InverseProperty("Historyplanreceivedtlips")]
    public virtual Actualreceivedtlip? ActualReceived { get; set; }

    [ForeignKey("PlanDetailId")]
    [InverseProperty("Historyplanreceivedtlips")]
    public virtual Plandetailreceivedtlip? PlanDetail { get; set; }
}
