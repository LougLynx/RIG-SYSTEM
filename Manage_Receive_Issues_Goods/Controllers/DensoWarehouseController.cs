using Manage_Receive_Issues_Goods.DTO;
using Manage_Receive_Issues_Goods.DTO.RDTD_DTO;
using Manage_Receive_Issues_Goods.Hubs;
using Manage_Receive_Issues_Goods.Models;
using Manage_Receive_Issues_Goods.Service;
using Manage_Receive_Issues_Goods.Service.Implementations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;
using System.Text.Json;

namespace Manage_Receive_Issues_Goods.Controllers
{
    //[Authorize]
    public class DensoWarehouseController : Controller
	{
		private readonly IScheduleReceivedDensoService _schedulereceivedService;
		private readonly IScheduleIssuedTLIPService _scheduleissuesService;
        
        private readonly IHubContext<UpdateReceiveDensoHub> _hubReceivedContext;
        private readonly IHubContext<UpdateIssueTLIPHub> _hubIssuedContext;
		public DensoWarehouseController(IScheduleIssuedTLIPService scheduleissuesService, 
                                        IScheduleReceivedDensoService schedulereceivedService,
                                        IHubContext<UpdateReceiveDensoHub> hubReceivedContext,
										 IHubContext<UpdateIssueTLIPHub> hubIssuedContext)
		{
			_schedulereceivedService = schedulereceivedService;
            _scheduleissuesService = scheduleissuesService;
			_hubReceivedContext = hubReceivedContext;
			_hubIssuedContext = hubIssuedContext;
		}

        /// <summary>
        /// Đây là phần hiển thị lịch nhận
        /// </summary>
        /// //////////////////////////////////////////////////
        public async Task<IActionResult> ScheduleReceive()
		{
			var planDetails = await _schedulereceivedService.GetPlanDetailsForDisplayAsync();
			var (currentPlan, nextPlan) = await _schedulereceivedService.GetCurrentAndNextPlanAsync();
            var pastPlanDetails = await _schedulereceivedService.GetPastPlanDetailsAsync();

            ViewData["PlanDetailsJson"] = JsonSerializer.Serialize(planDetails);
			ViewData["CurrentPlanEffectiveDate"] = currentPlan?.EffectiveDate.ToString("yyyy-MM-dd");
			ViewData["NextPlanEffectiveDate"] = nextPlan?.EffectiveDate.ToString("yyyy-MM-dd") ?? string.Empty; // Trả về chuỗi rỗng nếu không có nextPlan
            ViewData["PastPlanDetailsJson"] = JsonSerializer.Serialize(pastPlanDetails);
            return View(planDetails);
		}

		[HttpGet]
		public async Task<IActionResult> GetUpdatedEventsReceived()
		{
			var planDetails = await _schedulereceivedService.GetPlanDetailsForDisplayAsync();
			var (currentPlan, nextPlan) = await _schedulereceivedService.GetCurrentAndNextPlanAsync();
			var pastPlanDetails = await _schedulereceivedService.GetPastPlanDetailsAsync();

			// đoạn lấy ra plandetail và các actual đi theo plandetail đó

			var today = DateTime.Today;
			var filteredPlanDetails = planDetails.Select(detail => new PlanDetailRDTD_DTO
			{
				PlanDetailId = detail.PlanDetailId,
				PlanTimeReceived = detail.PlanTimeReceived,
				PlanTimeIssued = detail.PlanTimeIssued,
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
		public async Task<IActionResult> AddActualReceived([FromBody] ActualDetailRDTD_DTO actualDetailDto)
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

                var newActual = new Actualsreceivedenso
                {
					PlanDetailId = actualDetailDto.PlanDetailId,
					ActualTime = actualDetailDto.ActualTime,
                    UserId = userId
                };

				// Lưu actual vào database
				await _schedulereceivedService.AddActualAsync(newActual);

				// Gửi cập nhật thông qua SignalR
				await _hubReceivedContext.Clients.All.SendAsync("ReceiveUpdate", "New actual added"); 

				return Json(new { success = true });
			}
			catch (Exception ex)
			{
				return Json(new { success = false, message = ex.Message });
			}
		}

		[HttpDelete]
		public async Task<IActionResult> DeleteActualReceived(int id)
		{
			if (id <= 0)
			{
				return Json(new { success = false, message = "Invalid Actual ID" });
			}

			try
			{
				await _schedulereceivedService.DeleteActualAsync(id);

				// Gửi cập nhật thông qua SignalR
				await _hubReceivedContext.Clients.All.SendAsync("EventDeleted", "Actual deleted"); 

				return Json(new { success = true });
			}
			catch (Exception ex)
			{
				return Json(new { success = false, message = ex.Message });
			}
		}

        /// <summary>
		/// Đây là phần thay đổi kế hoạch nhận hàng
		/// /////////////////////////////////////////////////////
		public async Task<IActionResult> ChangePlanReceived()
        {
            var planDetails = await _schedulereceivedService.GetAllPlanDetailsAsync();
            return View(planDetails);
        }

        [HttpPost]
        public async Task<IActionResult> ChangePlanReceived(string planName, int totalShipment, string effectiveDate, List<PlanDetailInputModel> planDetails)
        {
            try
            {
                // Kiểm tra nếu chuỗi effectiveDate bị null hoặc rỗng
                if (string.IsNullOrEmpty(effectiveDate))
                {
                    return Json(new { success = false, message = "EffectiveDate cannot be null or empty helooo." });
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

                await _schedulereceivedService.AddPlanAsync(newPlan);  // Lưu kế hoạch vào bảng PlanRITD

                // Lấy PlanID của kế hoạch vừa tạo
                var planId = await _schedulereceivedService.GetPlanIdByDetailsAsync(planName, effectiveDateOnly);


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
                        PlanTimeReceived = TimeOnly.Parse(detail.PlanTime),  // Chuyển đổi PlanTime từ string sang TimeOnly
                        PlanTimeIssued = null,  // Chuyển đổi PlanTime từ string sang TimeOnly
						PlanDetailName = $"Số {planDetails.IndexOf(detail) + 1}"  // Đặt tên cho các PlanDetail
                    };
                    await _schedulereceivedService.AddPlanDetailAsync(newDetail);  // Lưu từng PlanDetail
                }

                return Json(new { success = true });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> UpdatePlanTime(int detailId, string planTime)
        {
            var detail = await _schedulereceivedService.GetPlanDetailByIdAsync(detailId);
            if (detail != null)
            {
                detail.PlanTimeReceived = TimeOnly.Parse(planTime);
                await _schedulereceivedService.UpdatePlanDetailAsync(detail);
                return Json(new { success = true });
            }
            return Json(new { success = false, message = "Detail not found" });
        }

        /*      public async Task<IActionResult> ScheduleReceive()
              {
                  var planDetails = await _scheduleService.GetAllPlanDetailsAsync();
                  return View(planDetails);
              }*/

        [HttpGet]
        public async Task<IActionResult> GetFuturePlans()
        {
            var futurePlans = await _schedulereceivedService.GetFuturePlansAsync();
            Console.WriteLine(futurePlans);
            return Json(futurePlans);
        }
        [HttpGet]
        public async Task<IActionResult> GetPlanDetails(int planId)
        {
            var planDetails = await _schedulereceivedService.GetPlanDetails(planId);

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


        
    }
}
