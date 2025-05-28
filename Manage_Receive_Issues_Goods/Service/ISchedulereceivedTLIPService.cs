using System.Collections.Generic;
using System.Threading.Tasks;
using Manage_Receive_Issues_Goods.DTO.TLIPDTO.Received;
using Manage_Receive_Issues_Goods.Models;

namespace Manage_Receive_Issues_Goods.Services
{
    public interface ISchedulereceivedTLIPService
    {
        Task<IEnumerable<Planreceivetlip>> GetAllPlansAsync();
        Task<Planreceivetlip> GetCurrentPlanAsync();
        Task<IEnumerable<Actualreceivedtlip>> GetAllActualReceivedAsync();
        //DateTime GetDateForWeekday(int year, int weekOfYear, int weekdayId);
        DateTime GetDateForWeekday(int weekdayId);
        int GetWeekOfYear(DateTime date);
        Task<IEnumerable<Supplier>> GetSuppliersForTodayAsync();
        Task<bool> DelaySupplierAsync(string supplierId);//(pending)
        Task<IEnumerable<AsnInformation>> GetAsnInformationAsync(DateTime inputDate);
        Task<IEnumerable<AsnDetailData>> GetAsnDetailAsync(string asnNumber, string doNumber, string invoice);
        Task AddActualReceivedAsync(Actualreceivedtlip actualReceived);
        Task UpdateActualDetailTLIPAsync(string partNo, int actualReceivedId, int? quantityRemain, int? quantityScan);
        Task<IEnumerable<Actualdetailtlip>> GetActualDetailsByReceivedIdAsync(int actualReceivedId);
        Task<Actualreceivedtlip> GetActualReceivedWithSupplierAsync(int actualReceivedId);
        Task<Actualreceivedtlip> GetActualReceivedEntryAsync(string supplierCode, string actualDeliveryTime, string asnNumber = null, string doNumber = null, string invoice = null);
        Task AddActualDetailAsync(Actualdetailtlip actualDetail);
        Task UpdateActualReceivedAsync(Actualreceivedtlip actualReceived);
        //Task<IEnumerable<Actualreceivedtlip>> GetAllActualReceivedLast7DaysAsync();
        Task<IEnumerable<Actualreceivedtlip>> GetAllActualReceivedAsyncById(int actualReceivedId);
        Task<IEnumerable<Plandetailreceivedtlip>> GetAllCurrentPlanDetailsAsync();
        Task<IEnumerable<Supplier>> GetSuppliersByWeekdayAsync(int weekdayId);
        //Task<IEnumerable<Actualreceivedtlip>> GetActualReceivedAsyncByInfor(string asnNumber, string doNumber, string invoice);
        Task UpdateActualReceivedCompletionAsync(int actualReceivedId, bool isCompleted);
        Task<Actualreceivedtlip> GetActualReceivedByDetailsAsync(ActualReceivedTLIPDTO details);
        Task AddAllPlanDetailsToHistoryAsync();
        Task AddAllActualToHistoryAsync(int actualReceivedId);
        Task<IEnumerable<Historyplanreceivedtlip>> GetPlanActualDetailsInHistoryAsync();
        Task<IEnumerable<(Supplier Supplier, int TripCount)>> GetSuppliersWithTripCountForTodayAsync();
        Task<IEnumerable<TripCountTLIPDTO>> GeActualTripCountForTodayAsync();
        Task<IEnumerable<Actualreceivedtlip>> GetActualReceivedBySupplierForTodayAsync(string supplierCode);
        Task<IEnumerable<Plandetailreceivedtlip>> GetAllCurrentPlanDetailsBySupplierCodeAsync(string supplierCode);
        Task<IEnumerable<Actualreceivedtlip>> GetAsnDetailInDataBaseAsync(string asnNumber, string doNumber, string invoice);
        Task<IEnumerable<Supplier>> GetAllSuppliersAsync();
        Task UpdateActualLeadTime(Actualreceivedtlip actualReceived, DateTime leadTimeUpdate);
        Task<List<Actualreceivedtlip>> GetIncompleteActualReceived();
        ActualReceivedTLIPDTO MapToActualReceivedTLIPDTO(Actualreceivedtlip entity);
        PlanDetailReceivedTLIPDTO MapToPlanDetailTLIPDTO(Plandetailreceivedtlip entity);
        Task<IEnumerable<Tagnamereceivetlip>> GetAllTagNameRuleAsync();
        Task AddPlanAsync(Planreceivetlip plan);
        Task<int> GetPlanIdByDetailsAsync(string planName, DateOnly effectiveDate);
        Task AddPlanDetailAsync(Plandetailreceivedtlip planDetail);
        Task<IEnumerable<TripCountForChartTLIPDTO>> GetTotalTripsPlanForBarChartAsync(int planId, string supplierCode = null);
        Task<IEnumerable<TripCountForChartTLIPDTO>> GetTotalTripsActualForBarChartAsync(int planId, int? month = null, string supplierCode = null);
        Task<IEnumerable<AverageLeadTimeDTO>> GetAverageLeadTimePlanForChartAsync(int planId, string supplierCode = null);
        Task<IEnumerable<AverageLeadTimeDTO>> GetFastestActualLeadTimeForChartAsync(int planId, int? month = null, string supplierCode = null);
        Task<IEnumerable<AverageLeadTimeDTO>> GetSlowestActualLeadTimeForChartAsync(int planId, int? month = null, string supplierCode = null);
        Task<IEnumerable<AverageLeadTimeDTO>> GetAverageActualLeadTimeForChartAsync(int planId, int? month = null, string supplierCode = null);
        Task<IEnumerable<LateDeliveryTLIPDTO>> GetLateDeliveriesForChartAsync(int month, int planId, string supplierCode = null);
        Task<List<Actualreceivedtlip>> GetUnstoredActualReceived();
        Task UpdateStorageTime(Actualreceivedtlip actualReceived, DateTime storageTimeUpdate);
        Task DeleteActualDetailsByReceivedIdAsync(int actualReceivedId);
        Task UpdateActualDetailReceivedAsync(string partNo, int quantity, int quantityRemain, int quantityScan, int actualReceivedId, bool? stockInStatus, string? stockInLocation);
        Task<Actualdetailtlip> GetActualDetailByParametersAsync(string partNo, int quantity, int quantityRemain, int quantityScan, int actualReceivedId);
        Task<IEnumerable<TagnamereceivetlipDTO>> GetAllTagNamesAsync();
        Task AddTagNameAsync(Tagnamereceivetlip tagName);
        Task UpdateTagNameAsync(Tagnamereceivetlip tagName);
        Task DeleteTagNameAsync(string tagName);

        Task AddSupplierAsync(Supplier supplier);
        Task UpdateSupplierAsync(Supplier supplier);
        Task DeleteSupplierAsync(string supplierCode);
    }
}
