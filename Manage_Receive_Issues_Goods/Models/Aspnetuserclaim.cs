using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Manage_Receive_Issues_Goods.Models;

[Table("aspnetuserclaims")]
[Index("UserId", Name = "IX_AspNetUserClaims_UserId")]
public partial class Aspnetuserclaim
{
    [Key]
    public int Id { get; set; }

    public string UserId { get; set; } = null!;

    public string? ClaimType { get; set; }

    public string? ClaimValue { get; set; }

    [ForeignKey("UserId")]
    [InverseProperty("Aspnetuserclaims")]
    public virtual Aspnetuser User { get; set; } = null!;
}
