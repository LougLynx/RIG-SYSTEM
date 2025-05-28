using System.ComponentModel.DataAnnotations.Schema;

namespace Manage_Receive_Issues_Goods.Models
{
    public class DelayReceivedTLIP
    {
        public int Id { get; set; }
        public int PlanDetailId { get; set; }
        public DateTime OldDate { get; set; }
        public DateTime NewDate { get; set; }

        [ForeignKey("PlanDetailId")]
        public Plandetailreceivedtlip Plandetailreceivedtlip { get; set; }
    }
}
