namespace Manage_Receive_Issues_Goods.DTO.TLIPDTO.Received
{
    public class CombinedLateDeliveryTLIPDTO
    {
        public string SupplierCode { get; set; }
        public string SupplierName { get; set; }
        public int LateDeliveries { get; set; }
        public int ActualTripCount { get; set; }
    }
}
