using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Manage_Receive_Issues_Goods.Models;

[Table("supplier")]
public partial class Supplier
{
    [Key]
    [StringLength(100)]
    [MySqlCharSet("utf8mb3")]
    [MySqlCollation("utf8mb3_general_ci")]
    public string SupplierCode { get; set; } = null!;

    [StringLength(100)]
    public string? SupplierName { get; set; }

    [InverseProperty("SupplierCodeNavigation")]
    public virtual ICollection<Actualreceivedtlip> Actualreceivedtlips { get; set; } = new List<Actualreceivedtlip>();

    [InverseProperty("SupplierCodeNavigation")]
    public virtual ICollection<Plandetailreceivedtlip> Plandetailreceivedtlips { get; set; } = new List<Plandetailreceivedtlip>();
}
