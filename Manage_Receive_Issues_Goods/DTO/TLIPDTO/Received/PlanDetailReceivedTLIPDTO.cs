namespace Manage_Receive_Issues_Goods.DTO.TLIPDTO.Received
{
    public class PlanDetailReceivedTLIPDTO
    {
        public int PlanDetailId { get; set; }
        public int PlanId { get; set; }
        public string SupplierCode { get; set; } = null!;
        public string SupplierName { get; set; } = null!;
        public string TagName { get; set; } = null!;
        public TimeOnly DeliveryTime { get; set; }
        public int WeekdayId { get; set; }
        public TimeOnly LeadTime { get; set; }
        public string PlanType { get; set; } = null!;
        public int? WeekOfMonth { get; set; }
        public int? OccurrencesPerMonth { get; set; }
        public DateTime SpecificDate { get; set; }
        public DateOnly HistoryDate { get; set; }

    }
}
