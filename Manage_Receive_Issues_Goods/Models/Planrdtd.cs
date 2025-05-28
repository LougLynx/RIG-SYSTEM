using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Manage_Receive_Issues_Goods.Models;

[Table("planrdtd")]
public partial class Planrdtd
{
    [Key]
    [Column("PlanID")]
    public int PlanId { get; set; }

    [StringLength(100)]
    public string PlanName { get; set; } = null!;

    public int TotalShipment { get; set; }

    public DateOnly EffectiveDate { get; set; }

    [InverseProperty("Plan")]
    public virtual ICollection<Planrdtddetail> Planrdtddetails { get; set; } = new List<Planrdtddetail>();
}
