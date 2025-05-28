namespace Manage_Receive_Issues_Goods.DTO.TLIPDTO.Received
{
    public class AverageLeadTimeDTO
    {
        public string SupplierCode { get; set; }
        public string SupplierName { get; set; }
        public TimeSpan AverageLeadTime { get; set; }
    }
}
