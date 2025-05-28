using Manage_Receive_Issues_Goods.Hubs;
using Manage_Receive_Issues_Goods.Models;
using Manage_Receive_Issues_Goods.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using Manage_Receive_Issues_Goods.Service;
using System.Security.Claims;
using Manage_Receive_Issues_Goods.DTO.TLIPDTO.Received;
using Manage_Receive_Issues_Goods.DTO.RDTD_DTO;
using ClosedXML.Excel;


namespace Manage_Receive_Issues_Goods.Controllers
{
    //[Authorize]
    public class TLIPWarehouseController : Controller
    {
        private readonly ISchedulereceivedTLIPService _schedulereceivedService;
        private readonly IScheduleIssuedTLIPService _scheduleissuesService;
        private readonly IHubContext<UpdateIssueTLIPHub> _hubIssuedContext;
        private readonly ILogger<TLIPWarehouseController> _logger;
		private readonly I_RDTDService _rdtdService;

		private readonly RigContext _context;
        public TLIPWarehouseController(
            ISchedulereceivedTLIPService schedulereceivedService,
            IScheduleIssuedTLIPService scheduleissuesService,
            IHubContext<UpdateIssueTLIPHub> hubIssuedContext,
            ILogger<TLIPWarehouseController> logger,
			I_RDTDService rdtdService,
			RigContext context)
        {
            _schedulereceivedService = schedulereceivedService;
            _scheduleissuesService = scheduleissuesService;
            _hubIssuedContext = hubIssuedContext;
            _logger = logger;
			_rdtdService = rdtdService;
			_context = context;
        }

        //Lịch nhận
        /// <summary>
        /// Các hàm này dùng cho phần hiển thị lịch nhận
        /// </summary>

        public IActionResult ScheduleReceive()
        {
            return View();
        }

        [HttpGet]
        public async Task<JsonResult> GetSuppliersForToday()
        {
            var suppliers = await _schedulereceivedService.GetSuppliersForTodayAsync();
            var supplierList = suppliers.Select(s => new
            {
                supplierCode = s.SupplierCode,
                supplierName = s.SupplierName
            }).ToList();
            return Json(supplierList);
        }

        [HttpGet]
        public async Task<JsonResult> GetAllSuppliers()
        {
            var suppliers = await _schedulereceivedService.GetAllSuppliersAsync();
            var supplierList = suppliers.Select(s => new
            {
                supplierCode = s.SupplierCode,
                supplierName = s.SupplierName
            }).ToList();
            return Json(supplierList);
        }
        [HttpGet]
        public async Task<JsonResult> GetPlanTripCountForToday()
        {
            var suppliersWithTripCount = await _schedulereceivedService.GetSuppliersWithTripCountForTodayAsync();
            var result = suppliersWithTripCount.Select(s => new TripCountTLIPDTO
            {
                SupplierCode = s.Supplier.SupplierCode,
                SupplierName = s.Supplier.SupplierName,
                TripCount = s.TripCount
            }).ToList();

            return Json(result);
        }

        [HttpGet]
        public async Task<JsonResult> GeActualTripCountForToday()
        {
            var suppliersWithTripCount = await _schedulereceivedService.GeActualTripCountForTodayAsync();

            return Json(suppliersWithTripCount);
        }



// ////////////////////////////////////////////////////////////////////////////////////////// hàm test
        [HttpGet]
        public async Task<JsonResult> GetUnstoredActualReceived()
        {
            var suppliersWithTripCount = await _schedulereceivedService.GetUnstoredActualReceived();
            var actualReceivedDTOList = new List<ActualReceivedTLIPDTO>();

            if (suppliersWithTripCount != null && suppliersWithTripCount.Any())
            {
                actualReceivedDTOList = suppliersWithTripCount.Select(ar =>
                {
                    return _schedulereceivedService.MapToActualReceivedTLIPDTO(ar);
                }).ToList();
            }

            return Json(actualReceivedDTOList);
        }

        [HttpGet]
        public async Task<JsonResult> GetActualDetailByParameters(string partNo, int quantity, int quantityRemain, int quantityScan, int actualReceivedId)
        {
            var actualDetail = await _schedulereceivedService.GetActualDetailByParametersAsync(partNo, quantity, quantityRemain, quantityScan, actualReceivedId);
            ActualReceivedTLIPDTO? actualReceivedDTO = null;

            if (actualDetail != null)
            {
                var actualReceived = await _schedulereceivedService.GetActualReceivedWithSupplierAsync(actualDetail.ActualReceivedId);
                if (actualReceived != null)
                {
                    actualReceivedDTO = _schedulereceivedService.MapToActualReceivedTLIPDTO(actualReceived);
                }
            }

            return Json(actualReceivedDTO);
        }

        
        // ////////////////////////////////////////////////////////////////////////////////////////// hàm test


        [HttpGet]
        public async Task<JsonResult> GetCurrentPlanDetailsWithDates()
        {
            var planDetails = await _schedulereceivedService.GetAllCurrentPlanDetailsAsync();
            var planDetailsWithDates = new List<PlanDetailReceivedTLIPDTO>();

            if (planDetails != null && planDetails.Any())
            {
                planDetailsWithDates = planDetails.Select(planDetail =>
                {
                    var specificDate = _schedulereceivedService.GetDateForWeekday(planDetail.WeekdayId);
                    var dto = _schedulereceivedService.MapToPlanDetailTLIPDTO(planDetail);
                    dto.SpecificDate = specificDate;
                    return dto;
                }).ToList();
            }

            return Json(planDetailsWithDates);
        }

        [HttpGet]
        public async Task<JsonResult> GetPlanDetailsBySupplierCode(string supplierCode)
        {
            var today = DateTime.Today;
            var planDetails = await _schedulereceivedService.GetAllCurrentPlanDetailsBySupplierCodeAsync(supplierCode);
            var planDetailsWithDates = new List<PlanDetailReceivedTLIPDTO>();

            if (planDetails != null && planDetails.Any())
            {
                planDetailsWithDates = planDetails
                    .Where(planDetail => _schedulereceivedService.GetDateForWeekday(planDetail.WeekdayId).Date == today)
                    .Select(planDetail =>
                    {
                        var specificDate = _schedulereceivedService.GetDateForWeekday(planDetail.WeekdayId);

                        var dto = _schedulereceivedService.MapToPlanDetailTLIPDTO(planDetail);
                        dto.SpecificDate = specificDate;
                        return dto;
                    }).ToList();
            }

            return Json(planDetailsWithDates);
        }

        [HttpGet]
        public async Task<JsonResult> GetPlanActualDetailsInHistory()
        {
            var details = await _schedulereceivedService.GetPlanActualDetailsInHistoryAsync();
            var result = new List<PlanDetailReceivedTLIPDTO>();

            if (details != null && details.Any())
            {
                result = details.Select(d =>
                {
                    var planDetail = d.PlanDetail;

                    var deliveryTime = planDetail?.DeliveryTime ?? default(TimeOnly);
                    var historyDate = d.HistoryDate.HasValue ? d.HistoryDate.Value : default(DateOnly);
                    DateTime? specificDate = null;

                    if (d.HistoryDate.HasValue)
                    {
                        specificDate = historyDate.ToDateTime(deliveryTime);
                    }

                    var dto = _schedulereceivedService.MapToPlanDetailTLIPDTO(planDetail);
                    dto.HistoryDate = historyDate;
                    dto.SpecificDate = specificDate ?? default(DateTime);

                    return dto;
                }).ToList();
            }

            return Json(result);
        }

        [HttpGet]
        public async Task<JsonResult> GetActualReceived()
        {
            var actualReceivedList = await _schedulereceivedService.GetAllActualReceivedAsync();
            var actualReceivedDTOList = new List<ActualReceivedTLIPDTO>();

            if (actualReceivedList != null && actualReceivedList.Any())
            {
                actualReceivedDTOList = actualReceivedList.Select(ar =>
                {
                    return _schedulereceivedService.MapToActualReceivedTLIPDTO(ar);
                }).ToList();
            }
            return Json(actualReceivedDTOList);
        }

        [HttpGet]
        public async Task<IActionResult> GetActualDetailsByReceivedId(int actualReceivedId)
        {
            var actualDetails = await _schedulereceivedService.GetActualDetailsByReceivedIdAsync(actualReceivedId);
            return Json(actualDetails);
        }

        [HttpGet]
        public async Task<JsonResult> GetActualReceivedBySupplier(string supplierCode)
        {
            if (string.IsNullOrEmpty(supplierCode))
            {
                return Json(new { success = false, message = "Supplier code is required." });
            }

            try
            {
                var actualReceivedList = await _schedulereceivedService.GetActualReceivedBySupplierForTodayAsync(supplierCode);
                var result = actualReceivedList.Select(ar =>
                {
                    return _schedulereceivedService.MapToActualReceivedTLIPDTO(ar);

                });

                return Json(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching actual received data for supplier {SupplierCode}", supplierCode);
                return Json(new { success = false, message = "An error occurred while fetching data." });
            }
        }

        [HttpGet]
        public async Task<JsonResult> GetTagNameRule()
        {
            var tagnameRule = await _schedulereceivedService.GetAllTagNameRuleAsync();

            return Json(tagnameRule);
        }

        // Đổi plan
        /// <summary>
        /// Các hàm này dành cho đổi plan mới cho phần lịch nhận
        /// </summary>

        [HttpPost]
        public async Task<IActionResult> ChangePlanReceived([FromBody] ChangePlanReceivedTLIPRequest request)
        {
            try
            {
                // Parse effectiveDate from string to DateOnly
                if (!DateOnly.TryParse(request.EffectiveDate, out DateOnly effectiveDateOnly))
                {
                    return Json(new { success = false, message = "Invalid EffectiveDate format." });
                }
                // Save the plan information to the PlanRITD table
                var newPlan = new Planreceivetlip
                {
                    PlanName = request.PlanName,
                    EffectiveDate = effectiveDateOnly
                };
                await _schedulereceivedService.AddPlanAsync(newPlan);
                return Json(new { success = true });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while changing the plan.");
                return Json(new { success = false, message = ex.Message, error = ex.ToString() });
            }
        }


        //Lịch xuất
        /// <summary>
        /// Các hàm này dùng cho phần hiển thị lịch xuất
        /// </summary>
        /// <summary>
        public async Task<IActionResult> ScheduleIssued()
        {
            var planDetails = await _scheduleissuesService.GetPlanDetailsForDisplayAsync();
            var (currentPlan, nextPlan) = await _scheduleissuesService.GetCurrentAndNextPlanAsync();
            var pastPlanDetails = await _scheduleissuesService.GetPastPlanDetailsAsync();

            ViewData["PlanDetailsJson"] = JsonSerializer.Serialize(planDetails);
            ViewData["CurrentPlanEffectiveDate"] = currentPlan?.EffectiveDate.ToString("yyyy-MM-dd");
            ViewData["NextPlanEffectiveDate"] = nextPlan?.EffectiveDate.ToString("yyyy-MM-dd") ?? string.Empty; // Trả về chuỗi rỗng nếu không có nextPlan
            ViewData["PastPlanDetailsJson"] = JsonSerializer.Serialize(pastPlanDetails);
            return View(planDetails);
        }

        [HttpGet]
        public async Task<IActionResult> GetUpdatedEventsIssued()
        {
            var planDetails = await _scheduleissuesService.GetPlanDetailsForDisplayAsync();
            var (currentPlan, nextPlan) = await _scheduleissuesService.GetCurrentAndNextPlanAsync();
            var pastPlanDetails = await _scheduleissuesService.GetPastPlanDetailsAsync();

            // Filter actuals for the current day
            var today = DateTime.Today;
            var filteredPlanDetails = planDetails.Select(detail => new PlanDetailRDTD_DTO
            {
                PlanDetailId = detail.PlanDetailId,
                PlanTimeIssued = detail.PlanTimeIssued,
                PlanTimeReceived = detail.PlanTimeReceived,
				PlanDetailName = detail.PlanDetailName,
                Actuals = detail.Actuals?.Where(actual => actual.ActualTime.Date == today).ToList()
            }).ToList();

            var result = new
            {
                planDetails = filteredPlanDetails,
                currentPlanEffectiveDate = currentPlan?.EffectiveDate.ToString("yyyy-MM-dd"),
                nextPlanEffectiveDate = nextPlan?.EffectiveDate.ToString("yyyy-MM-dd") ?? string.Empty,
                pastPlanDetails
            };

            var options = new JsonSerializerOptions
            {
                PropertyNamingPolicy = null // Use null to preserve original property names (PascalCase)
            };

            return new JsonResult(result, options);
        }


        [HttpPost]
        public async Task<IActionResult> AddActualIssued([FromBody] ActualDetailRDTD_DTO actualDetailDto)
        {
            if (actualDetailDto == null || actualDetailDto.PlanDetailId <= 0)
            {
                return Json(new { success = false, message = "Invalid data" });
            }

            try
            {
                if (actualDetailDto.ActualTime == DateTime.MinValue)
                {
                    return Json(new { success = false, message = "Invalid ActualTime" });
                }
                //lấy id user đang đăng nhập hiện tại
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                var newActual = new Actualsissuetlip
                {
                    PlanDetailId = actualDetailDto.PlanDetailId,
                    ActualTime = actualDetailDto.ActualTime,
                    UserId = userId
                };

                // Lưu actual vào database
                await _scheduleissuesService.AddActualAsync(newActual);

                // Gửi cập nhật thông qua SignalR
                await _hubIssuedContext.Clients.All.SendAsync("IssuedUpdate", "New actual added");

                return Json(new { success = true });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpDelete]
        public async Task<IActionResult> DeleteActualIssued(int id)
        {
            if (id <= 0)
            {
                return Json(new { success = false, message = "Invalid Actual ID" });
            }

            try
            {
                await _scheduleissuesService.DeleteActualAsync(id);

                // Gửi cập nhật thông qua SignalR
                await _hubIssuedContext.Clients.All.SendAsync("EventIssuedDeleted", "Actual deleted");

                return Json(new { success = true });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        /// <summary>
		/// Đây là phần thay đổi kế hoạch xuất hàng
		/// /////////////////////////////////////////////////////

        public async Task<IActionResult> ChangePlanIssued()
        {
            var planDetails = await _scheduleissuesService.GetAllPlanDetailsAsync();
            return View(planDetails);
        }

        [HttpPost]
        public async Task<IActionResult> ChangePlanIssued(string planName, int totalShipment, string effectiveDate, List<PlanDetailInputModel> planDetails)
        {
            try
            {

                // Log dữ liệu planDetails để kiểm tra
                Console.WriteLine("Plan Details Received:");
                foreach (var detail in planDetails)
                {
                    Console.WriteLine($"Plan Detail - Time: {detail.PlanTime}");
                }

                // Kiểm tra nếu chuỗi effectiveDate bị null hoặc rỗng
                if (string.IsNullOrEmpty(effectiveDate))
                {
                    return Json(new { success = false, message = "EffectiveDate cannot be null or empty." });
                }
                // Chuyển đổi effectiveDate từ string sang DateOnly
                DateOnly effectiveDateOnly = DateOnly.Parse(effectiveDate);

                // Lưu thông tin Plan vào bảng PlanRITD
                var newPlan = new Planrdtd
                {
                    PlanName = planName,
                    TotalShipment = totalShipment,
                    EffectiveDate = effectiveDateOnly
                };
                Console.WriteLine(newPlan);

                await _scheduleissuesService.AddPlanAsync(newPlan);  // Lưu kế hoạch vào bảng PlanRITD

                // Lấy PlanID của kế hoạch vừa tạo
                var planId = await _scheduleissuesService.GetPlanIdByDetailsAsync(planName, effectiveDateOnly);
                Console.WriteLine(planId);


                if (planId == 0)
                {
                    Console.WriteLine("Không có PlanID");
                    return Json(new { success = false, message = "Không tìm thấy Plan mới tạo." });
                }
                // Lưu các PlanDetail vào bảng PlanRITDDetails
                foreach (var detail in planDetails)
                {
                    // Kiểm tra nếu planTime bị null hoặc rỗng
                    if (string.IsNullOrEmpty(detail.PlanTime))
                    {
                        return Json(new { success = false, message = "PlanTime cannot be null or empty." });
                    }
                    var newDetail = new Planrdtddetail
                    {
                        PlanId = planId,
                        PlanTimeIssued = TimeOnly.Parse(detail.PlanTime),  // Chuyển đổi PlanTime từ string sang TimeOnly
                        PlanDetailName = $"Số {planDetails.IndexOf(detail) + 1}"  // Đặt tên cho các PlanDetail
                    };
                    await _scheduleissuesService.AddPlanDetailAsync(newDetail);  // Lưu từng PlanDetail
                }

                return Json(new { success = true });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> UpdatePlanTimeIssued(int detailId, string planTime)
        {
            var detail = await _scheduleissuesService.GetPlanDetailByIdAsync(detailId);
            if (detail != null)
            {
                detail.PlanTimeIssued = TimeOnly.Parse(planTime);
                await _scheduleissuesService.UpdatePlanDetailAsync(detail);
                return Json(new { success = true });
            }
            return Json(new { success = false, message = "Detail not found" });
        }

        [HttpGet]
        public async Task<IActionResult> GetFuturePlansIssues()
        {
            var futurePlans = await _scheduleissuesService.GetFuturePlansAsync();
            Console.WriteLine(futurePlans);
            return Json(futurePlans);
        }
        [HttpGet]
        public async Task<IActionResult> GetPlanDetailsIssued(int planId)
        {
            var planDetails = await _scheduleissuesService.GetPlanDetails(planId);

            var result = planDetails
                .Select(d => new
                {
                    d.PlanDetailName,
                    d.PlanTimeIssued,
                    d.PlanTimeReceived
				})
                .ToList();

            return Json(result);
        }



        // Dashboard
        /// <summary>
        /// Các hàm này dành cho hiển thị dashboard
        /// </summary>
        public async Task<IActionResult> DashboardTLIP()
        {
            var plans = await _schedulereceivedService.GetAllPlansAsync();
            var suppliers = await _schedulereceivedService.GetAllSuppliersAsync();

            var sortedPlans = plans.OrderBy(p => p.EffectiveDate).ToList();

            Planreceivetlip? currentPlan = null;
            if (sortedPlans.Count > 0)
            {
                // Đoạn này đang lỗi logic lấy current plan
                if (sortedPlans[0].EffectiveDate.ToDateTime(TimeOnly.MinValue) > DateTime.Today && sortedPlans.Count > 1)
                {
                    currentPlan = sortedPlans[1];
                }
                else
                {
                    currentPlan = sortedPlans[0];
                }
            }

            ViewBag.CurrentPlanId = currentPlan?.PlanId;

            ViewBag.Plans = sortedPlans;
            ViewBag.Suppliers = suppliers;

            return View();
        }

        // -------------------------------Cho phần chart trip count------------------------------

        [HttpGet]
        public async Task<JsonResult> GetCombinedTripCounts(int planId, int? month = null, string supplierCode = null)
        {
            var tripCountsPlan = await _schedulereceivedService.GetTotalTripsPlanForBarChartAsync(planId, supplierCode);
            var tripCountsActual = await _schedulereceivedService.GetTotalTripsActualForBarChartAsync(planId, month, supplierCode);

            var combinedTripCounts = tripCountsPlan
                .Select(plan => new CombinedTripCountTLIPDTO
                {
                    SupplierCode = plan.SupplierCode,
                    SupplierName = plan.SupplierName,
                    TotalPlanTrips = plan.TotalTrips,
                    TotalActualTrips = tripCountsActual.FirstOrDefault(actual => actual.SupplierCode == plan.SupplierCode)?.TotalTrips ?? 0
                })
                .ToList();

            return Json(combinedTripCounts);
        }

        // -------------------------------Cho phần chart leadtime--------------------------------

        [HttpGet]
        public async Task<JsonResult> GetCombinedLeadTimeForChart(int planId, int? month = null, string supplierCode = null)
        {
            var averageLeadTime = await _schedulereceivedService.GetAverageActualLeadTimeForChartAsync(planId, month, supplierCode);
            var slowestLeadTime = await _schedulereceivedService.GetSlowestActualLeadTimeForChartAsync(planId, month, supplierCode);
            var fastestLeadTime = await _schedulereceivedService.GetFastestActualLeadTimeForChartAsync(planId, month, supplierCode);
            var planLeadTime = await _schedulereceivedService.GetAverageLeadTimePlanForChartAsync(planId, supplierCode);

            var combinedLeadTimeCounts = planLeadTime
                .Select(plan => new CombinedLeadTimeTLIPDTO
                {
                    SupplierCode = plan.SupplierCode,
                    SupplierName = plan.SupplierName,
                    PlanLeadTime = plan.AverageLeadTime,
                    FastestLeadTime = fastestLeadTime.FirstOrDefault(actual => actual.SupplierCode == plan.SupplierCode)?.AverageLeadTime ?? TimeSpan.Zero,
                    SlowestLeadTime = slowestLeadTime.FirstOrDefault(actual => actual.SupplierCode == plan.SupplierCode)?.AverageLeadTime ?? TimeSpan.Zero,
                    AverageLeadTime = averageLeadTime.FirstOrDefault(actual => actual.SupplierCode == plan.SupplierCode)?.AverageLeadTime ?? TimeSpan.Zero,
                })
                .ToList();

            return Json(combinedLeadTimeCounts);
        }

        // -------------------------------Cho phần chart delay------------------------------------
        [HttpGet]
        public async Task<JsonResult> GetCombinedLateDeliveryForChart(int planId, int month, string supplierCode = null)
        {
            var tripCountsActual = await _schedulereceivedService.GetTotalTripsActualForBarChartAsync(planId, month, supplierCode);
            var lateDeliveries = await _schedulereceivedService.GetLateDeliveriesForChartAsync( month, planId , supplierCode);

            var combinedLeadTimeCounts = tripCountsActual
               .Select(plan => new CombinedLateDeliveryTLIPDTO
               {
                   SupplierCode = plan.SupplierCode,
                   SupplierName = plan.SupplierName,
                   ActualTripCount = plan.TotalTrips,
                   LateDeliveries = lateDeliveries.FirstOrDefault(actual => actual.SupplierCode == plan.SupplierCode)?.LateDeliveries ?? 0,
               })
               .ToList();

            return Json(combinedLeadTimeCounts);
        }


        


        // Hiển thị danh sách các supplier 
        /// <summary>
        /// Hàm này dành cho hiển thị danh sách các supplier
        /// </summary>
        public async Task<IActionResult> SupplierList()
        {
            var suppliers = await _schedulereceivedService.GetAllSuppliersAsync();
            return View(suppliers);
        }

        [HttpPost]
        public async Task<IActionResult> AddSupplier(Supplier supplier)
        {
            if (supplier == null)
            {
                return BadRequest();
            }

            await _schedulereceivedService.AddSupplierAsync(supplier);
            return RedirectToAction("SupplierList");
        }


        [HttpPost]
        public async Task<IActionResult> UpdateSupplier(Supplier supplier)
        {
            if (supplier == null || string.IsNullOrEmpty(supplier.SupplierCode) || string.IsNullOrEmpty(supplier.SupplierName))
            {
                return BadRequest("Invalid supplier data.");
            }

            await _schedulereceivedService.UpdateSupplierAsync(supplier);
            return RedirectToAction("SupplierList");
        }


        [HttpPost]
        public async Task<IActionResult> DeleteSupplier(string supplierCode)
        {
            if (string.IsNullOrEmpty(supplierCode))
            {
                return BadRequest("Supplier code is null or empty.");
            }

            await _schedulereceivedService.DeleteSupplierAsync(supplierCode);
            return RedirectToAction("SupplierList");
        }

        // Hiển thị danh sách các plandetail cho phần lịch nhận
        /// <summary>
        /// Hàm này dành cho hiển thị được plan detail
        /// </summary>
        public async Task<IActionResult> PlanList()
        {
            var allSupplier = await _schedulereceivedService.GetAllSuppliersAsync();
            var planDetails = await _schedulereceivedService.GetAllCurrentPlanDetailsAsync();
            var planDetailsDTO = new List<PlanDetailReceivedTLIPDTO>();

            if (planDetails != null && planDetails.Any())
            {
                planDetailsDTO = planDetails.Select(planDetail =>
                {
                    return _schedulereceivedService.MapToPlanDetailTLIPDTO(planDetail); ;
                }).ToList();
            }
            ViewData["AllSuppliers"] = allSupplier;
            return View(planDetailsDTO);
        }


        // Đổi plan
        /// <summary>
        /// Các hàm này dành cho đổi plan mới cho phần lịch nhận
        /// </summary>
        /// 
        public async Task<IActionResult> ChangePlanReceived()
        {
            var supplier = await _schedulereceivedService.GetAllSuppliersAsync();
            return View(supplier);
        }

        [HttpPost]
        public async Task<IActionResult> ReadFileExcel(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("No file uploaded.");
            }

            var planDetails = new List<Plandetailreceivedtlip>();
            try
            {
                using (var stream = new MemoryStream())
                {
                    await file.CopyToAsync(stream);
                    stream.Position = 0;

                    using (var package = new XLWorkbook(stream))
                    {
                        var worksheet = package.Worksheet(1);
                        if (worksheet == null)
                        {
                            return BadRequest("No worksheet found in Excel file.");
                        }

                        var rows = worksheet.RangeUsed().RowsUsed().Skip(1);

                        // Lấy PlanId mới nhất (giả sử đã add plan mới vào DB trước khi upload file)
                        var latestPlan = await _context.Planreceivetlips
                            .OrderByDescending(p => p.PlanId)
                            .FirstOrDefaultAsync();
                        int planId = latestPlan.PlanId;

                        foreach (var row in rows)
                        {
                            var tagName = row.Cell(1).GetValue<string>();
                            var deliveryTimeValue = row.Cell(2).GetValue<DateTime>();
                            var deliveryTime = TimeOnly.FromDateTime(deliveryTimeValue);
                            var weekdayId = row.Cell(3).GetValue<int>();
                            var leadTimeValue = row.Cell(4).GetValue<DateTime>();
                            var leadTime = TimeOnly.FromDateTime(leadTimeValue);
                            var planType = row.Cell(5).GetValue<string>();
                            var weekOfMonth = row.Cell(6).GetValue<int?>();

                            //
                            var supplierCodes = (await _context.Tagnamereceivetlips.Where(sc => sc.TagName == tagName).Select(sc => sc.SupplierCode).ToListAsync()).DefaultIfEmpty(tagName).ToList();
                            foreach (var sup in supplierCodes)
                            {
                                planDetails.Add(new Plandetailreceivedtlip
                                {
                                    SupplierCode = sup,
                                    PlanId = planId,
                                    TagName = tagName,
                                    DeliveryTime = deliveryTime,
                                    WeekdayId = weekdayId,
                                    LeadTime = leadTime,
                                    PlanType = planType,
                                    WeekOfMonth = weekOfMonth
                                });
                            }
                        }
                        _context.Plandetailreceivedtlips.AddRange(planDetails);
                        _context.SaveChanges();

                    }
                }
                return Ok("Update successfully.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reading Excel file.");
                return BadRequest
                    ($"Error submitting data: {ex.Message}");
            }
        }
        //[HttpPost]
        //public async Task<IActionResult> ChangePlanReceived([FromBody] ChangePlanReceivedTLIPRequest request)
        //{
        //    try
        //    {
        //        // Parse effectiveDate from string to DateOnly
        //        if (!DateOnly.TryParse(request.EffectiveDate, out DateOnly effectiveDateOnly))
        //        {
        //            return Json(new { success = false, message = "Invalid EffectiveDate format." });
        //        }


        //        // Save the plan information to the PlanRITD table
        //        var newPlan = new Planreceivetlip
        //        {
        //            PlanName = request.PlanName,
        //            EffectiveDate = effectiveDateOnly
        //        };
        //        await _schedulereceivedService.AddPlanAsync(newPlan);

        //        // Get the PlanID of the newly created plan
        //        var planId = await _schedulereceivedService.GetPlanIdByDetailsAsync(request.PlanName, effectiveDateOnly);

        //        // Save the PlanDetails to the PlanRITDDetails table
        //        foreach (var detail in request.PlanDetails)
        //        {
        //            var tagNameRules = await _schedulereceivedService.GetAllTagNameRuleAsync();
        //            string tagName = detail.SupplierCode;
        //            foreach (var rule in tagNameRules)
        //            {
        //                if (rule.SupplierCode == detail.SupplierCode)
        //                {
        //                    tagName = rule.TagName;
        //                    break;
        //                }
        //            }
        //            var newDetail = new Plandetailreceivedtlip
        //            {
        //                PlanId = planId,
        //                SupplierCode = detail.SupplierCode,
        //                DeliveryTime = detail.DeliveryTime,
        //                WeekdayId = detail.WeekdayId,
        //                LeadTime = detail.LeadTime,
        //                PlanType = "Weekly", // Tạm thời để hết là weekly vì chưa xác định được các hàng theo tháng về tuần nào
        //                TagName = tagName
        //            };
        //            await _schedulereceivedService.AddPlanDetailAsync(newDetail);  // Save each PlanDetail
        //        }

        //        return Json(new { success = true });
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex, "Error occurred while changing the plan.");
        //        return Json(new { success = false, message = ex.Message, error = ex.ToString() });
        //    }
        //}


        // Hiển thị danh sách các tagname và edit tagname
        /// <summary>
        /// Các hàm này dành cho hiển thị danh sách các tagname và edit tagname
        /// </summary>
        public async Task<IActionResult> TagNameList()
        {
            var tagNameList = await _schedulereceivedService.GetAllTagNamesAsync();
            return View(tagNameList);
        }

        [HttpPost]
        public async Task<IActionResult> AddTagName([FromBody] Tagnamereceivetlip tagName)
        {
            if (tagName == null)
            {
                return BadRequest("Tag name cannot be null.");
            }

            await _schedulereceivedService.AddTagNameAsync(tagName);
            return Ok("Tag name added successfully.");
        }

        [HttpPut]
        public async Task<IActionResult> UpdateTagName([FromBody] Tagnamereceivetlip tagName)
        {
            if (tagName == null)
            {
                return BadRequest("Tag name cannot be null.");
            }

            await _schedulereceivedService.UpdateTagNameAsync(tagName);
            return Ok("Tag name updated successfully.");
        }

        [HttpDelete]
        public async Task<IActionResult> DeleteTagName(string tagName)
        {
            if (string.IsNullOrEmpty(tagName))
            {
                return BadRequest("Tag name cannot be null or empty.");
            }

            await _schedulereceivedService.DeleteTagNameAsync(tagName);
            return Ok("Tag name deleted successfully.");
        }



        // Đoạn này vẫn đang sử dụng trực tiếp DB Context (hãy đưa nó về Repository và Service nhé,
        // tại vì mình lười:))))))
        [HttpPut("UpdateTagNameDetail")]
        public async Task<IActionResult> UpdateTagNameDetail([FromBody] TagnamereceivetlipDTO tagNameDetail)
        {
            if (tagNameDetail == null || string.IsNullOrEmpty(tagNameDetail.TagName) || string.IsNullOrEmpty(tagNameDetail.SupplierCode))
            {
                return BadRequest("Invalid tag name detail.");
            }

            var tagName = await _context.Tagnamereceivetlips.FirstOrDefaultAsync(t => t.TagName == tagNameDetail.TagName);
            if (tagName == null)
            {
                return NotFound("Tag name not found.");
            }

            tagName.SupplierCode = tagNameDetail.SupplierCode;
            await _context.SaveChangesAsync();
            return Ok("Tag name detail updated successfully.");
        }

        [HttpDelete]
        public async Task<IActionResult> DeleteTagNameDetail(string tagName, string supplierCode)
        {
            var tagNameDetail = await _context.Tagnamereceivetlips.FirstOrDefaultAsync(t => t.TagName == tagName && t.SupplierCode == supplierCode);
            if (tagNameDetail == null)
            {
                return NotFound("Tag name detail not found.");
            }

            _context.Tagnamereceivetlips.Remove(tagNameDetail);
            await _context.SaveChangesAsync();
            return Ok("Tag name detail deleted successfully.");
        }
        //Delay Received
        [HttpPost]
        public async Task<IActionResult> DelayPlan(int planDetailId, string newDate, string newTime)
        {
            if (planDetailId <= 0 || string.IsNullOrEmpty(newDate) || string.IsNullOrEmpty(newTime))
                return BadRequest("Invalid data.");

            var planDetail = await _context.Plandetailreceivedtlips.FindAsync(planDetailId);
            if (planDetail == null)
                return BadRequest("Plan detail not found.");

            // Ngày/giờ cũ
            var oldDate = DateTime.Today.Add(planDetail.DeliveryTime.ToTimeSpan());

            // Parse ngày/tháng/năm
            if (!DateOnly.TryParseExact(newDate, "dd/MM/yyyy", null, System.Globalization.DateTimeStyles.None, out var datePart))
                return BadRequest("Sai định dạng ngày. Định dạng đúng: dd/MM/yyyy.");

            // Kiểm tra ngày hợp lệ (ví dụ: không được nhỏ hơn ngày hiện tại)
            var currentDate = DateOnly.FromDateTime(DateTime.Now);
            if (datePart < currentDate)
                return BadRequest("Ngày mới không được nhỏ hơn ngày hiện tại.");

            // Parse giờ phút giây
            if (!TimeOnly.TryParseExact(newTime, "HH:mm:ss", null, System.Globalization.DateTimeStyles.None, out var timePart))
                return BadRequest("Sai định dạng giờ. Định dạng đúng: HH:mm:ss.");

            var newDateTime = datePart.ToDateTime(timePart);

            // Lưu vào bảng delay
            var delay = new DelayReceivedTLIP
            {
                PlanDetailId = planDetailId,
                OldDate = oldDate,
                NewDate = newDateTime,
            };
            _context.DelayReceivedTLIPs.Add(delay);

            // Cập nhật lại ngày/giờ mới cho plan detail
            planDetail.DeliveryTime = TimeOnly.FromDateTime(newDateTime);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Delay recorded and plan updated." });
        }
    }
}
