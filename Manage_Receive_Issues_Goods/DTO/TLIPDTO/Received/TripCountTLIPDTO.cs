namespace Manage_Receive_Issues_Goods.DTO.TLIPDTO.Received
{
    public class TripCountTLIPDTO
    {
        public string SupplierCode { get; set; }
        public string SupplierName { get; set; }
        public int TripCount { get; set; }
        public DateTime ActualDeliveryTime { get; set; }
    }
}
