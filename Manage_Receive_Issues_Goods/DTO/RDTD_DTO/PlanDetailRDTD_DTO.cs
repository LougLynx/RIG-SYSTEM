namespace Manage_Receive_Issues_Goods.DTO.RDTD_DTO
{
    public class PlanDetailRDTD_DTO
    {
        public int PlanDetailId { get; set; }
        public TimeOnly PlanTimeReceived { get; set; }
        public TimeOnly PlanTimeIssued { get; set; }
        public string PlanDetailName { get; set; }
        public List<ActualDetailRDTD_DTO> Actuals { get; set; } = new List<ActualDetailRDTD_DTO>();
    }
}
