using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Manage_Receive_Issues_Goods.Models;

[Table("actualdetailtlip")]
[Index("ActualReceivedId", Name = "ActualReceivedID")]
public partial class Actualdetailtlip
{
    [Key]
    [Column("ActualDetailID")]
    public int ActualDetailId { get; set; }

    [StringLength(100)]
    public string PartNo { get; set; } = null!;

    public int? Quantity { get; set; }

    public int? QuantityRemain { get; set; }

    public int? QuantityScan { get; set; }

    [Column("ActualReceivedID")]
    public int ActualReceivedId { get; set; }

    public bool? StockInStatus { get; set; }

    [StringLength(255)]
    public string? StockInLocation { get; set; }

    [ForeignKey("ActualReceivedId")]
    [InverseProperty("Actualdetailtlips")]
    public virtual Actualreceivedtlip ActualReceived { get; set; } = null!;
}
