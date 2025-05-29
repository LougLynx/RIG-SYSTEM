using Manage_Receive_Issues_Goods.Models;

namespace Manage_Receive_Issues_Goods.DTO.TLIPDTO.Received
{
    public class DelayPlanRequest
    {
        public int PlanDetailId { get; set; }
        public DateTime OldDate { get; set; } = DateTime.Now;
        public DateTime NewDate { get; set; }
    }
}
