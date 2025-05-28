namespace Manage_Receive_Issues_Goods.DTO.TLIPDTO.Received
{
    public class CombinedLeadTimeTLIPDTO
    {
        public string SupplierCode { get; set; }
        public string SupplierName { get; set; }
        public TimeSpan AverageLeadTime { get; set; }
        public TimeSpan FastestLeadTime { get; set; }
        public TimeSpan SlowestLeadTime { get; set; }
        public TimeSpan PlanLeadTime { get; set; }
    }
}
