namespace Manage_Receive_Issues_Goods.DTO.TLIPDTO.Received
{
    public class CombinedTripCountTLIPDTO
    {
        public string SupplierCode { get; set; }
        public string SupplierName { get; set; }
        public int TotalPlanTrips { get; set; }
        public int TotalActualTrips { get; set; }
    }
}
