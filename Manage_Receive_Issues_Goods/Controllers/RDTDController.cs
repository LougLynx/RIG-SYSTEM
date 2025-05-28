using Manage_Receive_Issues_Goods.DTO;
using Manage_Receive_Issues_Goods.DTO.RDTD_DTO;
using Manage_Receive_Issues_Goods.Hubs;
using Manage_Receive_Issues_Goods.Models;
using Manage_Receive_Issues_Goods.Service;
using Manage_Receive_Issues_Goods.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Numerics;

namespace Manage_Receive_Issues_Goods.Controllers
{
    public class RDTDController : Controller
    {
        private readonly ILogger<TLIPWarehouseController> _logger;
        private readonly I_RDTDService _rdtdService;

        public RDTDController(
            ILogger<TLIPWarehouseController> logger,
            I_RDTDService rdtdService)
        {
            _logger = logger;
            _rdtdService = rdtdService;
        }

        public async Task<IActionResult> DashboardRDTD()
        {
            var drivers = await _rdtdService.GetAllDriverAsync();
            var plans = await _rdtdService.GetAllPlansAsync();
            var sortedPlans = plans.OrderBy(p => p.EffectiveDate).ToList();

            Planrdtd? currentPlan = null;
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
            ViewBag.Drivers = drivers;
            return View();
        }



        // --------------Phần thời gian giao hàng của từng lái xe--------------------------------
        [HttpGet]
        public async Task<JsonResult> GetCombinedDeliveryTimeByUserForChart(int? planId, int month,string? userId )
        {
            var averageDeliveryTimes = await _rdtdService.GetAverageDeliveryTimeAsync(userId, month, planId);
            var slowestDeliveryTimes = await _rdtdService.GetSlowestDeliveryTimeAsync(userId, month, planId);
            var fastestDeliveryTimes = await _rdtdService.GetFastestDeliveryTimeAsync(userId, month, planId);

            var combinedDeliveryTimes = averageDeliveryTimes.Select(averageDeliveryTime => new CombinedDeliveryTimeRDTDDTO
            {
                UserId = averageDeliveryTime.UserId,
                UserName = averageDeliveryTime.UserName,
                AverageDeliveryTime = averageDeliveryTime.Time ?? TimeSpan.Zero,
                FastestDeliveryTime = fastestDeliveryTimes.FirstOrDefault(f => f.UserId == averageDeliveryTime.UserId)?.Time ?? TimeSpan.Zero,
                SlowestDeliveryTime = slowestDeliveryTimes.FirstOrDefault(s => s.UserId == averageDeliveryTime.UserId)?.Time ?? TimeSpan.Zero
            }).ToList();

            return Json(combinedDeliveryTimes);
        }

        // --------------Phần thời gian giao hàng của từng chuyến--------------------------------

        [HttpGet]
        public async Task<JsonResult> GetCombinedDeliveryTimeByTripForChart(int? planId, int month, int? planDetailId)
        {
            var averageDeliveryTimes = await _rdtdService.GetAverageDeliveryTimeByPlanDetailIdAsync(planDetailId, month, planId);
            var slowestDeliveryTimes = await _rdtdService.GetSlowestDeliveryTimeByPlanDetailIdAsync(planDetailId, month, planId);
            var fastestDeliveryTimes = await _rdtdService.GetFastestDeliveryTimeByPlanDetailIdAsync(planDetailId, month, planId);

            var combinedDeliveryTimes = averageDeliveryTimes.Select(averageDeliveryTime => new CombinedDeliveryTimeRDTDDTO
            {
                PlanDetailId = averageDeliveryTime.PlanDetailId,
                PlanDetailName = averageDeliveryTime.PlanDetailName,
                AverageDeliveryTime = averageDeliveryTime.Time ?? TimeSpan.Zero,
                FastestDeliveryTime = fastestDeliveryTimes.FirstOrDefault(f => f.PlanDetailId == averageDeliveryTime.PlanDetailId)?.Time ?? TimeSpan.Zero,
                SlowestDeliveryTime = slowestDeliveryTimes.FirstOrDefault(s => s.PlanDetailId == averageDeliveryTime.PlanDetailId)?.Time ?? TimeSpan.Zero
            }).ToList();

            return Json(combinedDeliveryTimes);
        }

        [HttpGet]
        public async Task<JsonResult> GetCurrentPlanDetail(int planId)
        {
            var planDetails = await _rdtdService.GetCurrentPlanDetailAsync(planId);
            var result = planDetails.Select(detail => new
            {
                detail.PlanDetailId,
                detail.PlanDetailName
            });
            return Json(result);
        }

        // //////////////////////////////////////////////////////// Các hàm để test
        [HttpGet]
        public async Task<JsonResult> GetFastestDeliveryTime(string? planDetailId, int month, int? planId)
        {
            var result = await _rdtdService.GetFastestDeliveryTimeAsync(planDetailId, month, planId);
            return Json(result);
        }

        [HttpGet]
        public async Task<JsonResult> GetSlowestDeliveryTime(string? planDetailId, int month, int? planId)
        {
            var result = await _rdtdService.GetSlowestDeliveryTimeAsync(planDetailId, month, planId);
            return Json(result);
        }

        [HttpGet]
        public async Task<JsonResult> GetAverageDeliveryTime(string? planDetailId, int month, int? planId)
        {
            var result = await _rdtdService.GetAverageDeliveryTimeAsync(planDetailId, month, planId);
            return Json(result);
        }

        // //////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        [HttpGet]
        public async Task<JsonResult> GetFastestDeliveryTimeByTrip(int? plandetailId, int month, int? planId)
        {
            var result = await _rdtdService.GetFastestDeliveryTimeByPlanDetailIdAsync(plandetailId, month, planId);
            return Json(result);
        }

        [HttpGet]
        public async Task<JsonResult> GetSlowestDeliveryTimeByTrip(int? plandetailId, int month, int? planId)
        {
            var result = await _rdtdService.GetSlowestDeliveryTimeByPlanDetailIdAsync(plandetailId, month, planId);
            return Json(result);
        }

        [HttpGet]
        public async Task<JsonResult> GetAverageDeliveryTimeByTrip(int? plandetailId, int month, int? planId)
        {
            var result = await _rdtdService.GetAverageDeliveryTimeByPlanDetailIdAsync(plandetailId, month, planId);
            return Json(result);
        }
        // //////////////////////////////////////////////////////// Các hàm để test
    }
}
