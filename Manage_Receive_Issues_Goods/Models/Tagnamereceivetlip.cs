using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Manage_Receive_Issues_Goods.Models;

[Table("tagnamereceivetlip")]
public partial class Tagnamereceivetlip
{
    [Key]
    public int Id { get; set; }

    [StringLength(100)]
    public string TagName { get; set; } = null!;

    [StringLength(100)]
    public string SupplierCode { get; set; } = null!;
}
