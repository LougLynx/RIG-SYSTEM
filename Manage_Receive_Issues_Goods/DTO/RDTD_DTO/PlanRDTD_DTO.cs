namespace Manage_Receive_Issues_Goods.DTO.RDTD_DTO
{
    public class PlanRDTD_DTO
    {
        public int PlanId { get; set; }
        public string PlanName { get; set; }
        public int TotalShipment { get; set; }
        public DateOnly EffectiveDate { get; set; }
        public List<PlanDetailRDTD_DTO> PlanDetails { get; set; } = new List<PlanDetailRDTD_DTO>();
    }
}
