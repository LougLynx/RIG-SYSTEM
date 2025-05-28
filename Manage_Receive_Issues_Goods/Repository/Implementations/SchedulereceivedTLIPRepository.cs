using Microsoft.EntityFrameworkCore;
using Manage_Receive_Issues_Goods.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Manage_Receive_Issues_Goods.Repository;
using System.Text.Json;
using Manage_Receive_Issues_Goods.Data;
using Humanizer;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;
using Manage_Receive_Issues_Goods.DTO.TLIPDTO.Received;

namespace Manage_Receive_Issues_Goods.Repositories.Implementations
{
    public class SchedulereceivedTLIPRepository : ISchedulereceivedTLIPRepository
    {
        private readonly RigContext _context;
        private readonly HttpClient _httpClient;
        private readonly string _baseApiUrl = "http://10.73.131.20:8092/api/GetDataInfor/";

        public SchedulereceivedTLIPRepository(RigContext context, HttpClient httpClient)
        {
            _context = context;
            _httpClient = httpClient;
        }

        public async Task<IEnumerable<Planreceivetlip>> GetAllPlansAsync()
        {
            return await _context.Planreceivetlips.ToListAsync();
        }
        public async Task<Planreceivetlip> GetCurrentPlanAsync()
        {
            // Retrieve all plans ordered by EffectiveDate
            var plans = await _context.Planreceivetlips
                .OrderBy(p => p.EffectiveDate)
                .ToListAsync();

            if (!plans.Any())
            {
                return null;
            }

            var today = DateOnly.FromDateTime(DateTime.Now);

            // Find the closest plan
            var closestPlan = plans
                .Where(p => p.EffectiveDate <= today)
                .OrderByDescending(p => p.EffectiveDate)
                .FirstOrDefault();

            return closestPlan;
        }


        public async Task<IEnumerable<Plandetailreceivedtlip>> GetAllCurrentPlanDetailsAsync()
        {
            // Lấy ra danh sách tất cả các kế hoạch
            var plans = await _context.Planreceivetlips
                .OrderBy(p => p.EffectiveDate)
                .ToListAsync();

            if (!plans.Any())
            {
                return Enumerable.Empty<Plandetailreceivedtlip>();
            }

            var today = DateOnly.FromDateTime(DateTime.Now);

            // Tìm kế hoạch gần nhất
            var closestPlan = plans
                .Where(p => p.EffectiveDate <= today)
                .OrderByDescending(p => p.EffectiveDate)
                .FirstOrDefault();

            if (closestPlan != null)
            {
                // Trả về danh sách các chi tiết kế hoạch của kế hoạch gần nhất
                return await _context.Plandetailreceivedtlips
                    .AsNoTracking()
                    .Include(s => s.SupplierCodeNavigation)
                    .Include(s => s.Weekday)
                    .Where(pd => pd.PlanId == closestPlan.PlanId)
                    .ToListAsync();
            }

            return Enumerable.Empty<Plandetailreceivedtlip>();
        }

        public async Task<IEnumerable<Plandetailreceivedtlip>> GetAllCurrentPlanDetailsBySupplierCodeAsync(string supplierCode)
        {
            // Lấy ra danh sách tất cả các kế hoạch
            var plans = await _context.Planreceivetlips
                .OrderBy(p => p.EffectiveDate)
                .ToListAsync();

            if (!plans.Any())
            {
                return Enumerable.Empty<Plandetailreceivedtlip>();
            }

            var today = DateOnly.FromDateTime(DateTime.Now);

            // Tìm kế hoạch gần nhất
            var closestPlan = plans
                .Where(p => p.EffectiveDate <= today)
                .OrderByDescending(p => p.EffectiveDate)
                .FirstOrDefault();

            if (closestPlan != null)
            {
                // Trả về danh sách các chi tiết kế hoạch của kế hoạch gần nhất
                return await _context.Plandetailreceivedtlips
                    .AsNoTracking()
                    .Include(s => s.SupplierCodeNavigation)
                    .Include(s => s.Weekday)
                    .Where(pd => pd.PlanId == closestPlan.PlanId && pd.SupplierCode == supplierCode)
                    .ToListAsync();
            }

            return Enumerable.Empty<Plandetailreceivedtlip>();
        }

        public async Task<IEnumerable<Actualreceivedtlip>> GetAllActualReceivedAsync()
        {
            return await _context.Actualreceivedtlips
                                 .Include(ar => ar.SupplierCodeNavigation)
                                 .Include(ar => ar.Actualdetailtlips)
                                 .ToListAsync();
        }

        public async Task<IEnumerable<Actualreceivedtlip>> GetAllActualReceivedAsyncById(int actualReceivedId)
        {
            return await _context.Actualreceivedtlips
                         .Include(ar => ar.SupplierCodeNavigation)
                         .Include(ar => ar.Actualdetailtlips)
                         .Where(ar => ar.ActualReceivedId == actualReceivedId)
                         .ToListAsync();
        }

        //public async Task<IEnumerable<Actualreceivedtlip>> GetAllActualReceivedLast7DaysAsync()
        //{
        //    var sevenDaysAgo = DateTime.Now.AddDays(-7);
        //    return await _context.Actualreceivedtlips
        //                         .Include(ar => ar.SupplierCodeNavigation)
        //                         .Include(ar => ar.Actualdetailtlips)
        //                         .Where(ar => ar.ActualDeliveryTime >= sevenDaysAgo)
        //                         .ToListAsync();
        //}

        //public async Task<IEnumerable<Actualreceivedtlip>> GetActualReceivedAsyncByInfor(string asnNumber, string doNumber, string invoice)
        //{
        //    var query = _context.Actualreceivedtlips
        //                        .Include(ar => ar.SupplierCodeNavigation)
        //                        .Include(ar => ar.Actualdetailtlips)
        //                        .AsQueryable();

        //    if (!string.IsNullOrEmpty(asnNumber))
        //    {
        //        query = query.Where(ar => ar.AsnNumber == asnNumber);
        //    }

        //    if (!string.IsNullOrEmpty(doNumber))
        //    {
        //        query = query.Where(ar => ar.DoNumber == doNumber);
        //    }

        //    if (!string.IsNullOrEmpty(invoice))
        //    {
        //        query = query.Where(ar => ar.Invoice == invoice);
        //    }

        //    return await query.ToListAsync();
        //}



        public async Task<IEnumerable<Supplier>> GetSuppliersForTodayAsync(int weekdayId)
        {
            // Lấy tất cả các kế hoạch hiện tại
            var currentPlanDetails = await GetAllCurrentPlanDetailsAsync();

            // Lọc các kế hoạch theo weekdayId và lấy ra các Supplier
            var suppliers = currentPlanDetails
                .Where(plan => plan.WeekdayId == weekdayId)
                .OrderBy(plan => plan.DeliveryTime)
                .GroupBy(plan => plan.SupplierCode)
                .Select(group => group.First().SupplierCodeNavigation)
                .ToList();

            return suppliers;
        }

        public async Task<int> GetSupplierTripCountAsync(string supplierCode, int weekdayId)
        {
            return await _context.Plandetailreceivedtlips
                .Where(p => p.SupplierCode == supplierCode && p.WeekdayId == weekdayId)
                .CountAsync();
        }
        public async Task<IEnumerable<TripCountTLIPDTO>> GeActualTripCountForTodayAsync()
        {
            var today = DateTime.Today;
            var suppliersWithTripCount = await _context.Actualreceivedtlips
                .Where(a => a.ActualDeliveryTime.Date == today)
                .GroupBy(a => new { a.SupplierCode, a.SupplierCodeNavigation.SupplierName })
                .Select(g => new TripCountTLIPDTO
                {
                    SupplierCode = g.Key.SupplierCode,
                    SupplierName = g.Key.SupplierName,
                    ActualDeliveryTime = g.Max(a => a.ActualDeliveryTime),
                    TripCount = g.Count()
                })
                .ToListAsync();

            return suppliersWithTripCount;
        }


        public async Task<IEnumerable<AsnInformation>> GetAsnInformationAsync(DateTime inputDate)
        {
            var response = await _httpClient.GetAsync($"{_baseApiUrl}GetAsnInformation?inputDate={inputDate:yyyy-MM-dd}");
            // response.EnsureSuccessStatusCode();
            var content = await response.Content.ReadAsStringAsync();
            var jsonDocument = JsonDocument.Parse(content);
            var dataObjects = jsonDocument.RootElement.GetProperty("data").GetProperty("result");
            if (dataObjects.ValueKind != JsonValueKind.Null)
            {
                return dataObjects.EnumerateArray().Select(r => new AsnInformation
                {
                    AsnNumber = r.GetProperty("asnNumber").GetString(),
                    DoNumber = r.GetProperty("doNumber").GetString(),
                    Invoice = r.GetProperty("invoice").GetString(),
                    SupplierCode = r.GetProperty("supplierCode").GetString(),
                    SupplierName = r.GetProperty("supplierName").GetString(),
                    EtaDate = r.GetProperty("etaDate").GetDateTime(),
                    EtaDateString = r.GetProperty("etaDateString").GetString(),
                    ReceiveStatus = r.GetProperty("receiveStatus").GetBoolean(),
                    IsCompleted = r.GetProperty("isCompleted").GetBoolean()
                }).ToList();
            }
            return new List<AsnInformation>();
        }

        public async Task<IEnumerable<AsnDetailData>> GetAsnDetailAsync(string asnNumber, string doNumber, string invoice)
        {
            string queryParam = null;

            if (!string.IsNullOrEmpty(asnNumber))
            {
                queryParam = $"inputAsn={asnNumber}";
            }
            else if (!string.IsNullOrEmpty(doNumber))
            {
                queryParam = $"inputAsn={doNumber}";
            }
            else if (!string.IsNullOrEmpty(invoice))
            {
                queryParam = $"inputAsn={invoice}";
            }


            if (queryParam == null)
            {
                throw new ArgumentException("No valid parameter provided!");
            }

            var response = await _httpClient.GetAsync($"{_baseApiUrl}GetDetailDataByAsn?{queryParam}");
            // response.EnsureSuccessStatusCode();
            var content = await response.Content.ReadAsStringAsync();
            var jsonDocument = JsonDocument.Parse(content);
            var dataObjects = jsonDocument.RootElement.GetProperty("data").GetProperty("result");
            if (dataObjects.ValueKind != JsonValueKind.Null)
            {
                return dataObjects.EnumerateArray().Select(r => new AsnDetailData
                {
                    PartNo = r.GetProperty("partNo").GetString(),
                    AsnNumber = r.GetProperty("asnNumber").GetString(),
                    DoNumber = r.GetProperty("doNumber").GetString(),
                    Invoice = r.GetProperty("invoice").GetString(),
                    Quantity = r.GetProperty("quantiy").GetInt32(),
                    QuantityRemain = r.GetProperty("quantityRemain").GetInt32(),
                    QuantityScan = r.GetProperty("quantityScan").GetInt32(),
                    StockInStatus = r.GetProperty("stockInStatus").GetBoolean(),
                    StockInLocation = r.GetProperty("stockInLocation").GetString()
                }).ToList();
            }
            return new List<AsnDetailData>();
        }
        public async Task<IEnumerable<Actualreceivedtlip>> GetAsnDetailInDataBaseAsync(string asnNumber, string doNumber, string invoice)
        {
            var query = _context.Actualreceivedtlips
                                .Include(ar => ar.SupplierCodeNavigation)
                                .Include(ar => ar.Actualdetailtlips)
                                .AsQueryable();

            if (!string.IsNullOrEmpty(asnNumber))
            {
                query = query.Where(ar => ar.AsnNumber == asnNumber);
            }

            if (!string.IsNullOrEmpty(doNumber))
            {
                query = query.Where(ar => ar.DoNumber == doNumber);
            }

            if (!string.IsNullOrEmpty(invoice))
            {
                query = query.Where(ar => ar.Invoice == invoice);
            }

            return await query.ToListAsync();
        }


        public async Task AddActualReceivedAsync(Actualreceivedtlip actualReceived)
        {
            _context.Actualreceivedtlips.Add(actualReceived);
            try
            {
                await _context.SaveChangesAsync();
                Console.WriteLine("Add actual successfully in REPOSITORY!");
            }
            catch (Exception ex)
            {
                // Log the error
                Console.WriteLine("Error adding actual received: {0}", ex.Message);
                //Console.WriteLine("Failed entity: {0}", JsonSerializer.Serialize(actualReceived));

                // Clear the changes for the failed entity
                foreach (var entry in _context.ChangeTracker.Entries<Actualreceivedtlip>())
                {
                    if (entry.Entity == actualReceived)
                    {
                        entry.State = EntityState.Detached;
                    }
                }
                throw;
            }
        }

        public async Task UpdateActualDetailTLIPAsync(string partNo, int actualReceivedId, int? quantityRemain, int? quantityScan)
        {
            var actualDetail = await _context.Actualdetailtlips
                .FirstOrDefaultAsync(ad => ad.PartNo == partNo && ad.ActualReceivedId == actualReceivedId);

            if (actualDetail != null)
            {
                if (quantityRemain != null)
                {
                    actualDetail.QuantityRemain = quantityRemain;

                }
                if (quantityScan != null)
                {
                    actualDetail.QuantityScan = quantityScan;
                }
                await _context.SaveChangesAsync();
            }
        }

        public async Task UpdateActualDetailReceivedAsync(string partNo, int quantity, int quantityRemain, int quantityScan, int actualReceivedId, bool? stockInStatus, string? stockInLocation)
        {

            var actualDetail = await _context.Actualdetailtlips
                .FirstOrDefaultAsync(ad => ad.PartNo == partNo && ad.ActualReceivedId == actualReceivedId &&
                                            ad.Quantity == quantity && ad.QuantityRemain == quantityRemain && ad.QuantityScan == quantityScan);

            if (actualDetail != null)
            {
                if (stockInStatus != null)
                {
                    actualDetail.StockInStatus = stockInStatus;

                }
                if (!string.IsNullOrEmpty(stockInLocation))
                {
                    actualDetail.StockInLocation = stockInLocation;
                }
                await _context.SaveChangesAsync();
            }
        }
        public async Task<Actualdetailtlip> GetActualDetailByParametersAsync(string partNo, int quantity, int quantityRemain, int quantityScan, int actualReceivedId)
        {
            return await _context.Actualdetailtlips
                .FirstOrDefaultAsync(ad => ad.PartNo == partNo
                                           && ad.Quantity == quantity
                                           && ad.QuantityRemain == quantityRemain
                                           && ad.QuantityScan == quantityScan
                                           && ad.ActualReceivedId == actualReceivedId);
        }

        public async Task<IEnumerable<Actualdetailtlip>> GetActualDetailsByReceivedIdAsync(int actualReceivedId)
        {
            return await _context.Actualdetailtlips
                                 .Where(ad => ad.ActualReceivedId == actualReceivedId)
                                 .ToListAsync();
        }

        public async Task<Actualreceivedtlip> GetActualReceivedWithSupplierAsync(int actualReceivedId)
        {
            return await _context.Actualreceivedtlips
                .Include(a => a.SupplierCodeNavigation)
                .FirstOrDefaultAsync(a => a.ActualReceivedId == actualReceivedId);
        }

        public async Task<Actualreceivedtlip> GetActualReceivedEntryAsync(string supplierCode, string actualDeliveryTime, string asnNumber = null, string doNumber = null, string invoice = null)
        {
            return await _context.Actualreceivedtlips
                .Include(a => a.SupplierCodeNavigation)
                .Include(a => a.Actualdetailtlips)
                .Where(a => a.SupplierCode == supplierCode &&
                            a.ActualDeliveryTime == DateTime.Parse(actualDeliveryTime) &&
                            (string.IsNullOrEmpty(asnNumber) || a.AsnNumber == asnNumber) &&
                            (string.IsNullOrEmpty(doNumber) || a.DoNumber == doNumber) &&
                            (string.IsNullOrEmpty(invoice) || a.Invoice == invoice))
                .OrderByDescending(a => a.ActualReceivedId)
                .FirstOrDefaultAsync();
        }

       /* public async Task<IEnumerable<Actualdetailtlip>> GetActualDetailsAsync(string partNo, int? quantity, int? quantityRemain, int? quantityScan, int actualReceivedId)
        {
             if (actualReceivedId <= 0)
    {
        return Enumerable.Empty<Actualdetailtlip>();
    }
            return await _context.Actualdetailtlips
                .Where(ad => ad.PartNo == partNo
                             && ad.Quantity == quantity
                             && ad.QuantityRemain == quantityRemain
                             && ad.QuantityScan == quantityScan
                             && ad.ActualReceivedId == actualReceivedId)
                .ToListAsync();
        }*/


        public async Task AddActualDetailAsync(Actualdetailtlip actualDetail)
        {
            _context.Actualdetailtlips.Add(actualDetail);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateActualReceivedAsync(Actualreceivedtlip actualReceived)
        {
            _context.Actualreceivedtlips.Update(actualReceived);
            await _context.SaveChangesAsync();
        }



        public async Task UpdateActualReceivedCompletionAsync(int actualReceivedId, bool isCompleted)
        {
            var actualReceived = await _context.Actualreceivedtlips.FindAsync(actualReceivedId);
            if (actualReceived == null)
            {
                throw new KeyNotFoundException("ActualReceived not found.");
            }

            actualReceived.IsCompleted = isCompleted;
            await _context.SaveChangesAsync();
        }

        public async Task<Actualreceivedtlip> GetActualReceivedByDetailsAsync(ActualReceivedTLIPDTO details)
        {
            return await _context.Actualreceivedtlips
                .Include(ar => ar.SupplierCodeNavigation)
                .FirstOrDefaultAsync(ar =>
                    ar.SupplierCode == details.SupplierCode &&
                    (string.IsNullOrEmpty(details.AsnNumber) || ar.AsnNumber == details.AsnNumber) &&
                    (string.IsNullOrEmpty(details.DoNumber) || ar.DoNumber == details.DoNumber) &&
                    (string.IsNullOrEmpty(details.Invoice) || ar.Invoice == details.Invoice));
        }

        public async Task AddHistoryPlanReceivedAsync(Historyplanreceivedtlip historyPlanReceived)
        {
            if (historyPlanReceived == null)
            {
                throw new ArgumentNullException(nameof(historyPlanReceived));
            }

            _context.Historyplanreceivedtlips.Add(historyPlanReceived);
            await _context.SaveChangesAsync();
        }

        public async Task<bool> ExistsInHistoryPlanReceivedAsync(int planDetailId, DateOnly date)
        {
            return await _context.Historyplanreceivedtlips
                .AnyAsync(h => h.PlanDetailId == planDetailId && h.HistoryDate == date);
        }

        public async Task<IEnumerable<Historyplanreceivedtlip>> GetPlanActualDetailsInHistoryAsync()
        {
            return await _context.Historyplanreceivedtlips
                .Include(h => h.PlanDetail)
                    .ThenInclude(pd => pd.SupplierCodeNavigation)
                .ToListAsync();
        }

        public async Task<IEnumerable<Actualreceivedtlip>> GetActualReceivedBySupplierForTodayAsync(string supplierCode)
        {
            var today = DateTime.Today;
            return await _context.Actualreceivedtlips
                .Where(ar => ar.SupplierCode == supplierCode && ar.ActualDeliveryTime.Date == today)
                .ToListAsync();
        }

        public async Task<IEnumerable<Supplier>> GetAllSuppliersAsync()
        {
            return await _context.Suppliers.ToListAsync();
        }

        public async Task<IEnumerable<Tagnamereceivetlip>> GetAllTagNameRuleAsync()
        {
            return await _context.Tagnamereceivetlips.ToListAsync();
        }

        public async Task AddPlanAsync(Planreceivetlip plan)
        {
            _context.Planreceivetlips.Add(plan);
            await _context.SaveChangesAsync();
        }

        public async Task<int> GetPlanIdByDetailsAsync(string planName, DateOnly effectiveDate)
        {
            var plan = await _context.Planreceivetlips
                .FirstOrDefaultAsync(p => p.PlanName == planName && p.EffectiveDate == effectiveDate);
            if (plan != null)
            {
                return plan.PlanId;
            }
            return 0;
        }

        public async Task AddPlanDetailAsync(Plandetailreceivedtlip planDetail)
        {
            _context.Plandetailreceivedtlips.Add(planDetail);
            await _context.SaveChangesAsync();
        }

        public async Task<IEnumerable<TripCountForChartTLIPDTO>> GetTotalTripsPlanForBarChartAsync(int planId, string supplierCode = null)
        {
            var query = _context.Plandetailreceivedtlips
                .Where(p => p.PlanId == planId);

            if (!string.IsNullOrEmpty(supplierCode))
            {
                query = query.Where(p => p.SupplierCode == supplierCode);
            }

            return await query
                .GroupBy(a => new { a.SupplierCode, a.SupplierCodeNavigation.SupplierName })
                .Select(g => new TripCountForChartTLIPDTO
                {
                    SupplierCode = g.Key.SupplierCode,
                    SupplierName = g.Key.SupplierName,
                    TotalTrips = g.Count()
                })
                .ToListAsync();
        }

        public async Task<IEnumerable<TripCountForChartTLIPDTO>> GetTotalTripsActualForBarChartAsync(int planId, int? month = null, string supplierCode = null)
        {
            var query = _context.Actualreceivedtlips
                .Where(a => a.PlanId == planId);

            if (month.HasValue)
            {
                query = query.Where(a => a.ActualDeliveryTime.Month == month.Value);
            }

            if (!string.IsNullOrEmpty(supplierCode))
            {
                query = query.Where(a => a.SupplierCode == supplierCode);
            }

            return await query
                .GroupBy(a => new { a.SupplierCode, a.SupplierCodeNavigation.SupplierName })
                .Select(g => new TripCountForChartTLIPDTO
                {
                    SupplierCode = g.Key.SupplierCode,
                    SupplierName = g.Key.SupplierName,
                    TotalTrips = g.Count()
                })
                .ToListAsync();
        }

        public async Task<IEnumerable<AverageLeadTimeDTO>> GetAverageLeadTimePlanForChartAsync(int planId, string supplierCode = null)
        {
            var query = _context.Plandetailreceivedtlips
                .Include(p => p.SupplierCodeNavigation)
                .Where(p => p.PlanId == planId);

            if (!string.IsNullOrEmpty(supplierCode))
            {
                query = query.Where(p => p.SupplierCode == supplierCode);
            }

            var data = await query.ToListAsync();

            var result = data
                .GroupBy(p => new { p.SupplierCode, p.SupplierCodeNavigation.SupplierName })
                .Select(g => new AverageLeadTimeDTO
                {
                    SupplierCode = g.Key.SupplierCode,
                    SupplierName = g.Key.SupplierName,
                    AverageLeadTime = TimeSpan.FromTicks((long)g.Average(p => p.LeadTime.Ticks))
                })
                .OrderBy(dto => dto.SupplierCode)
                .ThenBy(dto => dto.SupplierName)
                .ToList();

            // Format the AverageLeadTime to HH:MM:SS
            foreach (var item in result)
            {
                item.AverageLeadTime = new TimeSpan(item.AverageLeadTime.Hours, item.AverageLeadTime.Minutes, item.AverageLeadTime.Seconds);
            }

            return result;
        }
        
        public async Task<IEnumerable<AverageLeadTimeDTO>> GetFastestActualLeadTimeForChartAsync(int planId, int? month = null, string supplierCode = null)
        {
            var query = _context.Actualreceivedtlips
                .Include(p => p.SupplierCodeNavigation)
                .Where(p => p.PlanId == planId);

            if (month.HasValue)
            {
                query = query.Where(a => a.ActualDeliveryTime.Month == month.Value);
            }

            if (!string.IsNullOrEmpty(supplierCode))
            {
                query = query.Where(p => p.SupplierCode == supplierCode);
            }

            var data = await query.ToListAsync();

            var result = data
                .GroupBy(p => new { p.SupplierCode, p.SupplierCodeNavigation.SupplierName })
                .Select(g => new AverageLeadTimeDTO
                {
                    SupplierCode = g.Key.SupplierCode,
                    SupplierName = g.Key.SupplierName,
                    AverageLeadTime = g
                        .Where(p => p.ActualLeadTime.HasValue && p.ActualLeadTime.Value != TimeSpan.Zero)
                        .OrderBy(p => p.ActualLeadTime)
                        .Select(p => p.ActualLeadTime.Value)
                        .FirstOrDefault()
                })
                .OrderBy(dto => dto.SupplierCode)
                .ThenBy(dto => dto.SupplierName)
                .ToList();

            return result;
        }

        public async Task<IEnumerable<AverageLeadTimeDTO>> GetSlowestActualLeadTimeForChartAsync(int planId, int? month = null, string supplierCode = null)
        {
            var query = _context.Actualreceivedtlips
                .Include(p => p.SupplierCodeNavigation)
                .Where(p => p.PlanId == planId);

            if (month.HasValue)
            {
                query = query.Where(a => a.ActualDeliveryTime.Month == month.Value);
            }

            if (!string.IsNullOrEmpty(supplierCode))
            {
                query = query.Where(p => p.SupplierCode == supplierCode);
            }

            var data = await query.ToListAsync();

            var result = data
                .GroupBy(p => new { p.SupplierCode, p.SupplierCodeNavigation.SupplierName })
                .Select(g => new AverageLeadTimeDTO
                {
                    SupplierCode = g.Key.SupplierCode,
                    SupplierName = g.Key.SupplierName,
                    AverageLeadTime = g
                        .Where(p => p.ActualLeadTime.HasValue && p.ActualLeadTime.Value != TimeSpan.Zero)
                        .OrderByDescending(p => p.ActualLeadTime)
                        .Select(p => p.ActualLeadTime.Value)
                        .FirstOrDefault()
                })
                .OrderBy(dto => dto.SupplierCode)
                .ThenBy(dto => dto.SupplierName)
                .ToList();

            return result;
        }

        public async Task<IEnumerable<AverageLeadTimeDTO>> GetAverageActualLeadTimeForChartAsync(int planId, int? month = null, string supplierCode = null)
        {
            var query = _context.Actualreceivedtlips
                .Include(p => p.SupplierCodeNavigation)
                .Where(p => p.PlanId == planId);

            if (month.HasValue)
            {
                query = query.Where(a => a.ActualDeliveryTime.Month == month.Value);
            }

            if (!string.IsNullOrEmpty(supplierCode))
            {
                query = query.Where(p => p.SupplierCode == supplierCode);
            }

            var data = await query.ToListAsync();

            var result = data
                .GroupBy(p => new { p.SupplierCode, p.SupplierCodeNavigation.SupplierName })
                .Select(g => new AverageLeadTimeDTO
                {
                    SupplierCode = g.Key.SupplierCode,
                    SupplierName = g.Key.SupplierName,
                    AverageLeadTime = TimeSpan.FromTicks((long)g
                        .Where(p => p.ActualLeadTime.HasValue && p.ActualLeadTime.Value != TimeSpan.Zero)
                        .Select(p => p.ActualLeadTime.Value.Ticks)
                        .DefaultIfEmpty(0)
                        .Average())
                })
                .OrderBy(dto => dto.SupplierCode)
                .ThenBy(dto => dto.SupplierName)
                .ToList();

            // Format the AverageLeadTime to HH:MM:SS
            foreach (var item in result)
            {
                item.AverageLeadTime = new TimeSpan(item.AverageLeadTime.Hours, item.AverageLeadTime.Minutes, item.AverageLeadTime.Seconds);
            }

            return result;
        }

        public async Task<IEnumerable<LateDeliveryTLIPDTO>> GetLateDeliveriesForChartAsync(int month, int planId, string supplierCode = null)
        {
            var query = _context.Actualreceivedtlips
                .Where(a => a.ActualDeliveryTime.Month == month && a.PlanId == planId);

            if (!string.IsNullOrEmpty(supplierCode))
            {
                query = query.Where(a => a.SupplierCode == supplierCode);
            }

            var actualDeliveries = await query.ToListAsync();

            var lateDeliveriesBySupplier = new Dictionary<string, LateDeliveryTLIPDTO>();

            foreach (var actual in actualDeliveries)
            {
                var weekdayId = (int)actual.ActualDeliveryTime.DayOfWeek + 1; // Sunday = 0, Monday = 1, ..., Saturday = 6
                var planDelivery = await _context.Plandetailreceivedtlips
                    .Where(p => p.WeekdayId == weekdayId && p.SupplierCode == actual.SupplierCode)
                    .FirstOrDefaultAsync();

                if (planDelivery != null)
                {
                    var deliveryTimeWithBuffer = planDelivery.DeliveryTime.AddMinutes(15).ToTimeSpan();
                    if (actual.ActualDeliveryTime.TimeOfDay > deliveryTimeWithBuffer)
                    {
                        if (!lateDeliveriesBySupplier.ContainsKey(actual.SupplierCode))
                        {
                            lateDeliveriesBySupplier[actual.SupplierCode] = new LateDeliveryTLIPDTO
                            {
                                SupplierCode = actual.SupplierCode,
                                SupplierName = actual.SupplierCodeNavigation?.SupplierName,
                                LateDeliveries = 0
                            };
                        }
                        lateDeliveriesBySupplier[actual.SupplierCode].LateDeliveries++;
                    }
                }
            }

            return lateDeliveriesBySupplier.Values;
        }

        public async Task DeleteActualDetailsByReceivedIdAsync(int actualReceivedId)
        {
            var actualDetails = await _context.Actualdetailtlips
                .Where(ad => ad.ActualReceivedId == actualReceivedId)
                .ToListAsync();

            if (actualDetails.Any())
            {
                _context.Actualdetailtlips.RemoveRange(actualDetails);
                await _context.SaveChangesAsync();
            }
        }
        public async Task<IEnumerable<TagnamereceivetlipDTO>> GetAllTagNamesAsync()
        {
            var tagNames = await _context.Tagnamereceivetlips.ToListAsync();
            var suppliers = await GetAllSuppliersAsync();

            var tagNameDTOs = tagNames.Select(tagName => new TagnamereceivetlipDTO
            {
                TagName = tagName.TagName,
                SupplierCode = tagName.SupplierCode,
                SupplierName = suppliers.FirstOrDefault(s => s.SupplierCode == tagName.SupplierCode)?.SupplierName
            });

            return tagNameDTOs;
        }
        public async Task AddTagNameAsync(Tagnamereceivetlip tagName)
        {
            await _context.Tagnamereceivetlips.AddAsync(tagName);
            await _context.SaveChangesAsync();
        }
        public async Task UpdateTagNameAsync(Tagnamereceivetlip tagName)
        {
            var existingTagName = await _context.Tagnamereceivetlips.FindAsync(tagName.TagName);
            if (existingTagName != null)
            {
                existingTagName.TagName = tagName.TagName;
                existingTagName.SupplierCode = tagName.SupplierCode;
                _context.Tagnamereceivetlips.Update(existingTagName);
                await _context.SaveChangesAsync();
            }
        }
        public async Task DeleteTagNameAsync(string tagName)
        {
            var tagNamesToDelete = await _context.Tagnamereceivetlips
                .Where(t => t.TagName == tagName)
                .ToListAsync();

            if (tagNamesToDelete.Any())
            {
                // Remove all matching tag names
                _context.Tagnamereceivetlips.RemoveRange(tagNamesToDelete);
                await _context.SaveChangesAsync();
            }
        }


        public async Task AddSupplierAsync(Supplier supplier)
        {
            if (supplier == null)
            {
                throw new ArgumentNullException(nameof(supplier));
            }

            await _context.Suppliers.AddAsync(supplier);
            await _context.SaveChangesAsync();
        }
        public async Task DeleteSupplierAsync(string supplierCode)
        {
            var supplier = await _context.Suppliers.FindAsync(supplierCode);
            if (supplier == null)
            {
                throw new KeyNotFoundException($"Supplier with code {supplierCode} not found.");
            }

            _context.Suppliers.Remove(supplier);
            await _context.SaveChangesAsync();
        }
        public async Task UpdateSupplierAsync(Supplier supplier)
        {
            if (supplier == null)
            {
                throw new ArgumentNullException(nameof(supplier));
            }

            _context.Suppliers.Update(supplier);
            await _context.SaveChangesAsync();
        }


    }
}
