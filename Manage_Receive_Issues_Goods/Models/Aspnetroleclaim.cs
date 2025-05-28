using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Manage_Receive_Issues_Goods.Models;

[Table("aspnetroleclaims")]
[Index("RoleId", Name = "IX_AspNetRoleClaims_RoleId")]
public partial class Aspnetroleclaim
{
    [Key]
    public int Id { get; set; }

    public string RoleId { get; set; } = null!;

    public string? ClaimType { get; set; }

    public string? ClaimValue { get; set; }

    [ForeignKey("RoleId")]
    [InverseProperty("Aspnetroleclaims")]
    public virtual Aspnetrole Role { get; set; } = null!;
}
