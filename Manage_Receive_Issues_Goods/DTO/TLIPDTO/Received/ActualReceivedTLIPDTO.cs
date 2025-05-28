namespace Manage_Receive_Issues_Goods.DTO.TLIPDTO.Received
{
    public class ActualReceivedTLIPDTO
    {
        public int ActualReceivedId { get; set; }
        public int PlanId { get; set; }
        public DateTime ActualDeliveryTime { get; set; }
        public TimeSpan? ActualLeadTime { get; set; }
        public TimeSpan? ActualStorageTime { get; set; }
        public string SupplierCode { get; set; }
        public string SupplierName { get; set; }
        public string TagName { get; set; }
        public string? AsnNumber { get; set; }
        public string? DoNumber { get; set; }
        public string? Invoice { get; set; }
        public double CompletionPercentage { get; set; }
        public double OnRackCompletionPercentage { get; set; }
        public bool IsCompleted { get; set; }
        public List<ActualDetailTLIPDTO> ActualDetails { get; set; }
    }
}
