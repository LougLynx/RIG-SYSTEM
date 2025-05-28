namespace Manage_Receive_Issues_Goods.DTO.RDTD_DTO
{
    public class RDTDDeliveryTimeDTO
    {
        public TimeSpan? Time { get; set; }
        public TimeSpan? TimeReceived { get; set; }
        public TimeSpan? TimeIssued { get; set; }
        public int ActualIssuedID { get; set; }
        public int ActualReceivedID { get; set; }
        public int PlanDetailId { get; set; }
        public string UserName { get; set; }
        public string UserId { get; set; }
        public string PlanDetailName { get; set; }
    }
}
