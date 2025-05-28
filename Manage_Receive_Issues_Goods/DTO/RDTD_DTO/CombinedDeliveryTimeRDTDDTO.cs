namespace Manage_Receive_Issues_Goods.DTO.RDTD_DTO
{
    public class CombinedDeliveryTimeRDTDDTO
    {
        public string UserId { get; set; }
        public string UserName { get; set; }
        public int PlanDetailId { get; set; }
        public string PlanDetailName { get; set; }
        public TimeSpan AverageDeliveryTime { get; set; }
        public TimeSpan FastestDeliveryTime { get; set; }
        public TimeSpan SlowestDeliveryTime { get; set; }
    }
}
