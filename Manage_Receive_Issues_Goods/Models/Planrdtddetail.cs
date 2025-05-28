using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Manage_Receive_Issues_Goods.Models;

[Table("planrdtddetails")]
[Index("PlanId", Name = "PlanID")]
public partial class Planrdtddetail
{
    [Key]
    [Column("PlanDetailID")]
    public int PlanDetailId { get; set; }

    [Column("PlanID")]
    public int? PlanId { get; set; }

    [StringLength(100)]
    public string? PlanDetailName { get; set; }

    [Column(TypeName = "time")]
    public TimeOnly? PlanTimeReceived { get; set; }

    [Column(TypeName = "time")]
    public TimeOnly? PlanTimeIssued { get; set; }

    [InverseProperty("PlanDetail")]
    public virtual ICollection<Actualsissuetlip> Actualsissuetlips { get; set; } = new List<Actualsissuetlip>();

    [InverseProperty("PlanDetail")]
    public virtual ICollection<Actualsreceivedenso> Actualsreceivedensos { get; set; } = new List<Actualsreceivedenso>();

    [ForeignKey("PlanId")]
    [InverseProperty("Planrdtddetails")]
    public virtual Planrdtd? Plan { get; set; }
}
