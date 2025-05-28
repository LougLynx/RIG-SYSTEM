namespace Manage_Receive_Issues_Goods.DTO.RDTD_DTO
{
    public class ActualDetailRDTD_DTO
    {
        public int ActualId { get; set; }
        public int PlanDetailId { get; set; }
        public string? UserId { get; set; }
        public string? UserName { get; set; }
        public DateTime ActualTime { get; set; }
    }
}
