namespace Manage_Receive_Issues_Goods.Models
{
    public class AsnInformation
    {
        public string AsnNumber { get; set; }
        public string DoNumber { get; set; }
        public string Invoice { get; set; }
        public string SupplierCode { get; set; }
        public string SupplierName { get; set; }
        public DateTime EtaDate { get; set; }
        public string EtaDateString { get; set; }
        public bool ReceiveStatus { get; set; }
        public bool IsCompleted { get; set; }
    }
}
