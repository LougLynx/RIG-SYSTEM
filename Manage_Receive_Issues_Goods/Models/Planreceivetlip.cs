using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Manage_Receive_Issues_Goods.Models;

[Table("planreceivetlip")]
public partial class Planreceivetlip
{
    [Key]
    [Column("PlanID")]
    public int PlanId { get; set; }

    [StringLength(100)]
    public string PlanName { get; set; } = null!;

    public DateOnly EffectiveDate { get; set; }

    [InverseProperty("Plan")]
    public virtual ICollection<Actualreceivedtlip> Actualreceivedtlips { get; set; } = new List<Actualreceivedtlip>();

    [InverseProperty("Plan")]
    public virtual ICollection<Plandetailreceivedtlip> Plandetailreceivedtlips { get; set; } = new List<Plandetailreceivedtlip>();
}
