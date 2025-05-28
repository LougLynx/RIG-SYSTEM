namespace Manage_Receive_Issues_Goods.Models
{
    public class ChangePlanReceivedTLIPRequest
    {
        public string PlanName { get; set; }
        public string EffectiveDate { get; set; }
        public List<Plandetailreceivedtlip> PlanDetails { get; set; }
    }
}
