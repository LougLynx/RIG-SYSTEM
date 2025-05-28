namespace Manage_Receive_Issues_Goods.Models
{
    public class AsnDetailData
    {
        public string PartNo { get; set; }
        public string AsnNumber { get; set; }
        public string DoNumber { get; set; }
        public string Invoice { get; set; }
        public int Quantity { get; set; }
        public int QuantityRemain { get; set; }
        public int QuantityScan { get; set; }
        public bool StockInStatus { get; set; }
        public string StockInLocation { get; set; }
    }
}
