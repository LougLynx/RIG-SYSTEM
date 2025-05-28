using System.Collections.Generic;
using System.Globalization;
using System.Numerics;
using System.Threading.Tasks;
using Manage_Receive_Issues_Goods.DTO.TLIPDTO.Received;
using Manage_Receive_Issues_Goods.Models;
using Manage_Receive_Issues_Goods.Repositories;
using Manage_Receive_Issues_Goods.Repository;
using Microsoft.EntityFrameworkCore;
using Microsoft.VisualStudio.Web.CodeGenerators.Mvc.Templates.Blazor;

namespace Manage_Receive_Issues_Goods.Services
{
    public class SchedulereceivedTLIPService : ISchedulereceivedTLIPService
    {
        private readonly ISchedulereceivedTLIPRepository _repository;
        private readonly ILogger _logger;

        public SchedulereceivedTLIPService(ISchedulereceivedTLIPRepository repository, ILogger<SchedulereceivedTLIPService> logger)
        {
            _repository = repository;
            _logger = logger;   
            _logger.LogInformation("SchedulereceivedTLIPService initialized.");
        }

        public async Task<IEnumerable<Planreceivetlip>> GetAllPlansAsync()
        {
            return await _repository.GetAllPlansAsync();
        }
        public async Task<Planreceivetlip> GetCurrentPlanAsync()
        {
            return await _repository.GetCurrentPlanAsync();
        }
        public async Task<IEnumerable<Actualreceivedtlip>> GetAllActualReceivedAsync()
        {
            return await _repository.GetAllActualReceivedAsync();
        }
        public async Task<IEnumerable<Supplier>> GetSuppliersForTodayAsync()
        {
            // Lấy thứ hiện tại (0 = Sunday, 1 = Monday, ...)
            int currentWeekday = (int)DateTime.Now.DayOfWeek; 
            // Chuyển đổi 0 (Chủ Nhật) thành 7 cho phù hợp với bảng Weekday
            if (currentWeekday == 0) currentWeekday = 7; 

            var suppliers = await _repository.GetSuppliersForTodayAsync(currentWeekday);
            return suppliers;
        }
        public async Task<IEnumerable<Supplier>> GetSuppliersByWeekdayAsync(int weekdayId)
        {
            var suppliers = await _repository.GetSuppliersForTodayAsync(weekdayId);
            return suppliers;
        }
        public async Task<IEnumerable<TripCountTLIPDTO>> GeActualTripCountForTodayAsync()
        {
            return await _repository.GeActualTripCountForTodayAsync(); ;
        }
        public async Task<IEnumerable<(Supplier Supplier, int TripCount)>> GetSuppliersWithTripCountForTodayAsync()
        {
            int currentWeekday = (int)DateTime.Now.DayOfWeek;
            if (currentWeekday == 0) currentWeekday = 7;

            var suppliers = await _repository.GetSuppliersForTodayAsync(currentWeekday);
            var supplierTripCounts = new List<(Supplier Supplier, int TripCount)>();

            foreach (var supplier in suppliers)
            {
                var tripCount = await _repository.GetSupplierTripCountAsync(supplier.SupplierCode, currentWeekday);
                supplierTripCounts.Add((supplier, tripCount));
            }

            return supplierTripCounts;
        }
        public async Task<IEnumerable<Plandetailreceivedtlip>> GetAllCurrentPlanDetailsAsync()
        {
            return await _repository.GetAllCurrentPlanDetailsAsync();
        }
        public async Task<IEnumerable<Plandetailreceivedtlip>> GetAllCurrentPlanDetailsBySupplierCodeAsync(string supplierCode)
        {
            return await _repository.GetAllCurrentPlanDetailsBySupplierCodeAsync(supplierCode);
        }

        // Hàm tính toán ngày giao hàng cụ thể cho một lịch trình nhận hàng
        public DateTime GetDateForWeekday(int year, int weekOfYear, int weekdayId)
        {
            DateTime jan1 = new DateTime(year, 1, 1); // Ngày đầu tiên của năm
            Calendar cal = CultureInfo.CurrentCulture.Calendar;

            // Tính toán số ngày cần thêm từ ngày đầu  tuần (thứ Hai)
            int daysOffset = DayOfWeek.Monday - jan1.DayOfWeek;
            DateTime firstMonday = jan1.AddDays(daysOffset);

            // Lấy số tuần đầu tiên
            int firstWeek = cal.GetWeekOfYear(jan1, CalendarWeekRule.FirstFourDayWeek, DayOfWeek.Monday);

            // Tính toán ngày đầu tuần mong muốn (tuần weekOfYear)
            DateTime targetWeekStart = firstMonday.AddDays((weekOfYear - firstWeek) * 7);

            // Thứ của tuần từ `WeekdayID` (WeekdayID: 1 = Monday, 2 = Tuesday, ...)
            DateTime targetDate = targetWeekStart.AddDays(weekdayId - 1);

            return targetDate;
        }
        public DateTime GetDateForWeekday(int weekdayId)
        {
            DateTime today = DateTime.Today;
            int currentWeekday = (int)today.DayOfWeek;

            // Calculate the target date within the next 7 days
            int daysToAdd = (weekdayId - currentWeekday + 7) % 7;
            DateTime targetDate = today.AddDays(daysToAdd);

            return targetDate;
        }


        // Hàm tính tuần trong năm
        public int GetWeekOfYear(DateTime date)
        {
            var culture = System.Globalization.CultureInfo.CurrentCulture;
            return culture.Calendar.GetWeekOfYear(date, System.Globalization.CalendarWeekRule.FirstFourDayWeek, DayOfWeek.Monday);
        }



        public async Task<bool> DelaySupplierAsync(string supplierId)
        {
            /* var schedule = await GetScheduleBySupplierIdAsync(supplierId);
             if (schedule == null) return false;

             var allSchedules = await GetSchedulesByWeekdayAsync(schedule.WeekdayId);
             var otherSchedules = allSchedules.Where(s => s.SupplierCode != supplierId).OrderBy(s => s.DeliveryTime.Time1).ToList();

             foreach (var otherSchedule in otherSchedules)
             {
                 if (otherSchedule.LeadTime <= schedule.LeadTime)
                 {
                     // Swap delivery times
                     var tempTime = schedule.DeliveryTime;
                     schedule.DeliveryTime = otherSchedule.DeliveryTime;
                     otherSchedule.DeliveryTime = tempTime;

                     await UpdateScheduleAsync(schedule);
                     await UpdateScheduleAsync(otherSchedule);
                     return true;
                 }
             }

             // If no suitable schedule found, move to end of the day
             schedule.DeliveryTime = new Time { Time1 = TimeOnly.FromDateTime(DateTime.Today.AddHours(23).AddMinutes(59)) };
             await UpdateScheduleAsync(schedule);*/
            return true;
        }

        public async Task<IEnumerable<AsnInformation>> GetAsnInformationAsync(DateTime inputDate)
        {
            return await _repository.GetAsnInformationAsync(inputDate);
        }

        public async Task<IEnumerable<AsnDetailData>> GetAsnDetailAsync(string asnNumber, string doNumber, string invoice)
        {
            return await _repository.GetAsnDetailAsync(asnNumber, doNumber, invoice);
        }

        public async Task AddActualReceivedAsync(Actualreceivedtlip actualReceived)
        {
            await _repository.AddActualReceivedAsync(actualReceived);
        }

        public async Task UpdateActualDetailTLIPAsync(string partNo, int actualReceivedId, int? quantityRemain, int? quantityScan)
        {
            await _repository.UpdateActualDetailTLIPAsync(partNo, actualReceivedId, quantityRemain, quantityScan);
        }

        public async Task<IEnumerable<Actualdetailtlip>> GetActualDetailsByReceivedIdAsync(int actualReceivedId)
        {
            return await _repository.GetActualDetailsByReceivedIdAsync(actualReceivedId);
        }

        public async Task<Actualreceivedtlip> GetActualReceivedWithSupplierAsync(int actualReceivedId)
        {
            return await _repository.GetActualReceivedWithSupplierAsync(actualReceivedId);
        }

        public async Task<Actualreceivedtlip> GetActualReceivedEntryAsync(string supplierCode, string actualDeliveryTime, string asnNumber = null, string doNumber = null, string invoice = null)
        {
            return await _repository.GetActualReceivedEntryAsync(supplierCode, actualDeliveryTime, asnNumber, doNumber, invoice);
        }
        
        public async Task AddActualDetailAsync(Actualdetailtlip actualDetail)
        {
            await _repository.AddActualDetailAsync(actualDetail);
        }

        public async Task UpdateActualReceivedAsync(Actualreceivedtlip actualReceived)
        {
            await _repository.UpdateActualReceivedAsync(actualReceived);
        }

        //public async Task<IEnumerable<Actualreceivedtlip>> GetAllActualReceivedLast7DaysAsync()
        //{
        //    return await _repository.GetAllActualReceivedLast7DaysAsync();
        //}

        public async Task<IEnumerable<Actualreceivedtlip>> GetAllActualReceivedAsyncById(int actualReceivedId)
        {
            return await _repository.GetAllActualReceivedAsyncById(actualReceivedId);
        }

        //public async Task<IEnumerable<Actualreceivedtlip>> GetActualReceivedAsyncByInfor(string asnNumber, string doNumber, string invoice)
        //{
        //    return await _repository.GetActualReceivedAsyncByInfor(asnNumber, doNumber, invoice);
        //}

        public async Task UpdateActualReceivedCompletionAsync(int actualReceivedId, bool isCompleted)
        {
            await _repository.UpdateActualReceivedCompletionAsync(actualReceivedId, isCompleted);
        }

        public async Task<Actualreceivedtlip> GetActualReceivedByDetailsAsync(ActualReceivedTLIPDTO details)
        {
            return await _repository.GetActualReceivedByDetailsAsync(details);
        }
        
        public async Task AddAllPlanDetailsToHistoryAsync()
        {
            var currentYear = DateTime.Now.Year;
            var currentWeekOfYear = GetWeekOfYear(DateTime.Now);
            var yesterday = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-1));
            var planDetails = await _repository.GetAllCurrentPlanDetailsAsync();

            foreach (var planDetail in planDetails)
            {
                var exists = await _repository.ExistsInHistoryPlanReceivedAsync(planDetail.PlanDetailId, yesterday);
                if (!exists)
                {
                    var specificDate = GetDateForWeekday(currentYear, currentWeekOfYear,planDetail.WeekdayId);
                    if (specificDate.Date == yesterday.ToDateTime(TimeOnly.MinValue).Date)
                    {
                        var historyEntry = new Historyplanreceivedtlip
                        {
                            PlanDetailId = planDetail.PlanDetailId,
                            HistoryDate = yesterday
                        };
                        await _repository.AddHistoryPlanReceivedAsync(historyEntry);
                    }
                }
            }
        }

        public async Task AddAllActualToHistoryAsync(int actualReceivedId)
        {
            var historyEntry = new Historyplanreceivedtlip
            {
                ActualReceivedId = actualReceivedId,
                HistoryDate = DateOnly.FromDateTime(DateTime.Now)
            };
            await _repository.AddHistoryPlanReceivedAsync(historyEntry);
        }

        public async Task<IEnumerable<Historyplanreceivedtlip>> GetPlanActualDetailsInHistoryAsync()
        {
            return await _repository.GetPlanActualDetailsInHistoryAsync();
        }

        public async Task<IEnumerable<Actualreceivedtlip>> GetActualReceivedBySupplierForTodayAsync(string supplierCode)
        {
            return await _repository.GetActualReceivedBySupplierForTodayAsync(supplierCode);
        }

        public async Task<IEnumerable<Actualreceivedtlip>> GetAsnDetailInDataBaseAsync(string asnNumber, string doNumber, string invoice)
        {
            return await _repository.GetAsnDetailInDataBaseAsync(asnNumber, doNumber, invoice);
        }
        public async Task<IEnumerable<Supplier>> GetAllSuppliersAsync()
        {
            return await _repository.GetAllSuppliersAsync();
        }
        public async Task<IEnumerable<Tagnamereceivetlip>> GetAllTagNameRuleAsync()
        {
            return await _repository.GetAllTagNameRuleAsync();
        }

        public async Task AddPlanAsync(Planreceivetlip plan)
        {
             await _repository.AddPlanAsync(plan);
        }
        public async Task<int> GetPlanIdByDetailsAsync(string planName, DateOnly effectiveDate)
        {
            return await _repository.GetPlanIdByDetailsAsync(planName, effectiveDate);
        }
        public async Task AddPlanDetailAsync(Plandetailreceivedtlip planDetail)
        {
            await _repository.AddPlanDetailAsync(planDetail);
        }

        public async Task UpdateActualLeadTime(Actualreceivedtlip actualReceived, DateTime leadTimeUpdate)
        {
            
            if (actualReceived == null || actualReceived.ActualReceivedId <= 0)
            {
                Console.WriteLine("Invalid ActualReceived entry.");
                return;
            }

            try
            {
                var existingActualReceived = await GetActualReceivedWithSupplierAsync(actualReceived.ActualReceivedId);

                if (existingActualReceived != null)
                {
                    var leadTime = leadTimeUpdate - existingActualReceived.ActualDeliveryTime;
                    existingActualReceived.ActualLeadTime = leadTime > TimeSpan.FromHours(830) ? TimeSpan.FromHours(830) : leadTime;
                    if (existingActualReceived.ActualLeadTime == null)
                    {
                        _logger.LogInformation($"Null value found: Leadtime update - {leadTimeUpdate}, Actual Delivery time - {existingActualReceived.ActualDeliveryTime}");
                    }
                    await UpdateActualReceivedAsync(existingActualReceived);
                }
                else { 
                    _logger.LogInformation($"Err shcedule: ActualReceived entry with ID {actualReceived.ActualReceivedId} not found.");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating ActualLeadTime: {ex.Message}");
                _logger.LogError($"Error updating ActualLeadTime: {ex.Message}");
            }
        }

        public async Task UpdateStorageTime(Actualreceivedtlip actualReceived, DateTime storageTimeUpdate)
        {
            if (actualReceived == null || actualReceived.ActualReceivedId <= 0)
            {
                Console.WriteLine("Invalid ActualReceived entry.");
                return;
            }

            try
            {
                var existingActualReceived = await _repository.GetActualReceivedWithSupplierAsync(actualReceived.ActualReceivedId);

                if (existingActualReceived != null)
                {
                    var leadTime = storageTimeUpdate - (existingActualReceived.ActualDeliveryTime + existingActualReceived.ActualLeadTime.GetValueOrDefault());
                    existingActualReceived.ActualStorageTime = leadTime > TimeSpan.FromHours(830) ? TimeSpan.FromHours(830) : leadTime;
                    await _repository.UpdateActualReceivedAsync(existingActualReceived);
                }
                else
                {
                    Console.WriteLine($"ActualReceived entry with ID {actualReceived.ActualReceivedId} not found.");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating ActualStorageTime: {ex.Message}");
            }
        }


        public async Task<List<Actualreceivedtlip>> GetIncompleteActualReceived()
        {
            var actualReceivedList = await GetAllActualReceivedAsync();
            var incompleteActualReceivedList = actualReceivedList
                .Where(actualReceived => !actualReceived.IsCompleted)
                .ToList();

            return incompleteActualReceivedList;
        }

        public async Task<List<Actualreceivedtlip>> GetUnstoredActualReceived()
        {
            var actualReceivedList = await GetAllActualReceivedAsync();

            var unstoredActualReceivedList = actualReceivedList
                .Where(actualReceived => actualReceived.IsCompleted &&
                                         actualReceived.Actualdetailtlips.Any(detail => detail.StockInStatus == false &&
                                                                                         (string.IsNullOrEmpty(detail.StockInLocation) || detail.StockInLocation == null)))
                .ToList();

            return unstoredActualReceivedList;
        }


        public async Task UpdateActualDetailReceivedAsync(string partNo, int quantity, int quantityRemain, int quantityScan, int actualReceivedId, bool? stockInStatus, string? stockInLocation)
        {
            await _repository.UpdateActualDetailReceivedAsync(partNo, quantity, quantityRemain, quantityScan, actualReceivedId, stockInStatus, stockInLocation);
        }
        public async Task<Actualdetailtlip> GetActualDetailByParametersAsync(string partNo, int quantity, int quantityRemain, int quantityScan, int actualReceivedId)
        {
            return await _repository.GetActualDetailByParametersAsync(partNo, quantity, quantityRemain, quantityScan, actualReceivedId);
        }
        public async Task DeleteActualDetailsByReceivedIdAsync(int actualReceivedId)
        {
            await _repository.DeleteActualDetailsByReceivedIdAsync(actualReceivedId);
        }
        public async Task<IEnumerable<TripCountForChartTLIPDTO>> GetTotalTripsPlanForBarChartAsync(int planId, string supplierCode = null)
        {
            return await _repository.GetTotalTripsPlanForBarChartAsync(planId, supplierCode);
        }

        public async Task<IEnumerable<TripCountForChartTLIPDTO>> GetTotalTripsActualForBarChartAsync(int planId, int? month = null, string supplierCode = null)
        {
            return await _repository.GetTotalTripsActualForBarChartAsync(planId, month, supplierCode);

        }
        public async Task<IEnumerable<AverageLeadTimeDTO>> GetAverageLeadTimePlanForChartAsync(int planId, string supplierCode = null)
        {
            return await _repository.GetAverageLeadTimePlanForChartAsync(planId, supplierCode);
        }
        public async Task<IEnumerable<AverageLeadTimeDTO>> GetFastestActualLeadTimeForChartAsync(int planId, int? month = null, string supplierCode = null)
        {
            return await _repository.GetFastestActualLeadTimeForChartAsync(planId, month, supplierCode);
        }

        public async Task<IEnumerable<AverageLeadTimeDTO>> GetSlowestActualLeadTimeForChartAsync(int planId, int? month = null, string supplierCode = null)
        {
            return await _repository.GetSlowestActualLeadTimeForChartAsync(planId, month, supplierCode);
        }

        public async Task<IEnumerable<AverageLeadTimeDTO>> GetAverageActualLeadTimeForChartAsync(int planId, int? month = null, string supplierCode = null)
        {
            return await _repository.GetAverageActualLeadTimeForChartAsync(planId, month, supplierCode);
        }

        public async Task<IEnumerable<LateDeliveryTLIPDTO>> GetLateDeliveriesForChartAsync(int month, int planId, string supplierCode = null)
        {
            return await _repository.GetLateDeliveriesForChartAsync(month, planId, supplierCode);
        }




        public async Task<IEnumerable<TagnamereceivetlipDTO>> GetAllTagNamesAsync()
        {
            return await _repository.GetAllTagNamesAsync();
        }

        public async Task AddTagNameAsync(Tagnamereceivetlip tagName)
        {
            await _repository.AddTagNameAsync(tagName);
        }
        public async Task UpdateTagNameAsync(Tagnamereceivetlip tagName)
        {
            await _repository.UpdateTagNameAsync(tagName);
        }
        public async Task DeleteTagNameAsync(string tagName)
        {
            await _repository.DeleteTagNameAsync(tagName);
        }

        public async Task AddSupplierAsync(Supplier supplier)
        {
            await _repository.AddSupplierAsync(supplier);
        }
        public async Task DeleteSupplierAsync(string supplierCode)
        {
            await _repository.DeleteSupplierAsync(supplierCode);

        }
        public async Task UpdateSupplierAsync(Supplier supplier)
        {
            await _repository.UpdateSupplierAsync(supplier);
        }

        public ActualReceivedTLIPDTO MapToActualReceivedTLIPDTO(Actualreceivedtlip entity)
        {
            return new ActualReceivedTLIPDTO
            {
                ActualReceivedId = entity.ActualReceivedId,
                ActualDeliveryTime = entity.ActualDeliveryTime,
                ActualLeadTime = entity.ActualLeadTime,
                ActualStorageTime = entity.ActualStorageTime,
                SupplierCode = entity.SupplierCode,
                SupplierName = entity.SupplierCodeNavigation?.SupplierName,
                TagName = entity.TagName,
                AsnNumber = entity.AsnNumber,
                DoNumber = entity.DoNumber,
                Invoice = entity.Invoice,
                IsCompleted = entity.IsCompleted,
                CompletionPercentage = CalculateCompletionPercentage(entity),
                OnRackCompletionPercentage = CalculateOnRackCompletionPercentage(entity),
                PlanId = entity.PlanId,
                ActualDetails = entity.Actualdetailtlips.Select(d => new ActualDetailTLIPDTO
                {
                    ActualDetailId = d.ActualDetailId,
                    PartNo = d.PartNo,
                    Quantity = d.Quantity ?? 0,
                    QuantityRemain = d.QuantityRemain ?? 0,
                    QuantityScan = d.QuantityScan ?? 0,
                    ActualReceivedId = d.ActualReceivedId,
                    StockInStatus = d.StockInStatus,
                    StockInLocation = d.StockInLocation

                }).ToList()
            };
        }
        public PlanDetailReceivedTLIPDTO MapToPlanDetailTLIPDTO(Plandetailreceivedtlip entity)
        {
            return new PlanDetailReceivedTLIPDTO
            {
                PlanDetailId = entity?.PlanDetailId ?? 0,
                PlanId = entity?.PlanId ?? 0,
                SupplierCode = entity?.SupplierCode,
                SupplierName = entity?.SupplierCodeNavigation?.SupplierName,
                TagName = entity?.TagName,
                DeliveryTime = entity?.DeliveryTime ?? default(TimeOnly),
                WeekdayId = entity?.WeekdayId ?? 0,
                LeadTime = entity?.LeadTime ?? default(TimeOnly),
                PlanType = entity?.PlanType,
                WeekOfMonth = entity?.WeekOfMonth ?? 0
            };
        }
        private double CalculateOnRackCompletionPercentage(Actualreceivedtlip actualReceived)
        {
            var totalItems = actualReceived.Actualdetailtlips.Count;
            var completedItems = actualReceived.Actualdetailtlips.Count(detail => detail.StockInStatus == true);

            if (totalItems == 0) return 0;
            return (completedItems / (double)totalItems) * 100;
        }
        private double CalculateCompletionPercentage(Actualreceivedtlip actualReceived)
        {
            if (actualReceived.IsCompleted)
            {
                return 100;
            }
            var totalItems = actualReceived.Actualdetailtlips.Count;
            var completedItems = actualReceived.Actualdetailtlips.Count(detail => detail.QuantityScan != 0);

            if (totalItems == 0) return 0;
            return (completedItems / (double)totalItems) * 100;
        }

    }
}


