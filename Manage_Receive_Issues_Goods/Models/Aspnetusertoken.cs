using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Manage_Receive_Issues_Goods.Models;

[PrimaryKey("UserId", "LoginProvider", "Name")]
[Table("aspnetusertokens")]
public partial class Aspnetusertoken
{
    [Key]
    public string UserId { get; set; } = null!;

    [Key]
    [StringLength(128)]
    public string LoginProvider { get; set; } = null!;

    [Key]
    [StringLength(128)]
    public string Name { get; set; } = null!;

    public string? Value { get; set; }

    [ForeignKey("UserId")]
    [InverseProperty("Aspnetusertokens")]
    public virtual Aspnetuser User { get; set; } = null!;
}
