namespace Manage_Receive_Issues_Goods.DTO.TLIPDTO.Received
{
    public class ActualDetailTLIPDTO
    {
        public int ActualDetailId { get; set; }
        public string PartNo { get; set; }
        public int ActualReceivedId { get; set; }
        public int Quantity { get; set; }
        public int QuantityRemain { get; set; }
        public int QuantityScan { get; set; }
        public bool? StockInStatus { get; set; }
        public string? StockInLocation { get; set; }
    }
}
