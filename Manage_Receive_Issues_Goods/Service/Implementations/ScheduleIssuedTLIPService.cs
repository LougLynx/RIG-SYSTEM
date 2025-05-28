using Manage_Receive_Issues_Goods.DTO.RDTD_DTO;
using Manage_Receive_Issues_Goods.Models;
using Manage_Receive_Issues_Goods.Repository;
using Microsoft.EntityFrameworkCore;
using Microsoft.VisualStudio.Web.CodeGenerators.Mvc.Templates.Blazor;
using Microsoft.VisualStudio.Web.CodeGenerators.Mvc.Templates.BlazorIdentity.Pages.Manage;
using System.Numerics;

namespace Manage_Receive_Issues_Goods.Service.Implementations
{
    public class ScheduleIssuedTLIPService : IScheduleIssuedTLIPService
	{
        private readonly IScheduleIssuedTLIPRepository _scheduleRepository;

        public ScheduleIssuedTLIPService(IScheduleIssuedTLIPRepository scheduleRepository)
		{
            _scheduleRepository = scheduleRepository;
		}

        public async Task<IEnumerable<Planrdtddetail>> GetAllPlanDetailsAsync()
        {
            return await _scheduleRepository.GetAllPlanDetailsAsync();
        }

        public async Task<IEnumerable<Planrdtddetail>> GetPlanDetails(int planId)
        {
            return await _scheduleRepository.GetPlanDetails(planId);
        }

        public async Task<Planrdtddetail> GetPlanDetailByIdAsync(int detailId)
        {
            return await _scheduleRepository.GetPlanDetailByIdAsync(detailId);
        }

        public async Task UpdatePlanDetailAsync(Planrdtddetail detail)
        {
            await _scheduleRepository.UpdatePlanDetailAsync(detail);
        }
        public async Task AddActualAsync(Actualsissuetlip actual)
        {
            await _scheduleRepository.AddActualAsync(actual);
        }

        public async Task DeleteActualAsync(int actualId)
        {
            await _scheduleRepository.DeleteActualAsync(actualId);
        }
        public async Task AddPlanAsync(Planrdtd plan)
        {
            await _scheduleRepository.AddPlanAsync(plan);
        }

        public async Task AddPlanDetailAsync(Planrdtddetail planDetail)
        {
            await _scheduleRepository.AddPlanDetailAsync(planDetail);
        }
        public async Task<int> GetPlanIdByDetailsAsync(string planName, DateOnly effectiveDate)
        {
            return await _scheduleRepository.GetPlanIdByDetailsAsync(planName, effectiveDate);
        }

        public async Task<(Planrdtd currentPlan, Planrdtd? nextPlan)> GetCurrentAndNextPlanAsync()
        {
            var currentPlan = await _scheduleRepository.GetCurrentPlanAsync();
            var nextPlan = await _scheduleRepository.GetNextPlanAsync();

            // Nếu không có kế hoạch kế tiếp, gán nextPlan là null để frontend biết cần lặp vô hạn.
            return (currentPlan, nextPlan);
        }




		//Receive Denso và Issue TLIP có chung các thuộc tính nên có thể dùng chung DTO
		public async Task<IEnumerable<PlanDetailRDTD_DTO>> GetPlanDetailsForDisplayAsync()
		{
			var (currentPlan, nextPlan) = await GetCurrentAndNextPlanAsync();

			var startDate = currentPlan?.EffectiveDate ?? DateOnly.FromDateTime(DateTime.Today);
			var endDate = nextPlan?.EffectiveDate.AddDays(-1) ?? DateOnly.FromDateTime(DateTime.Today).AddYears(100); // Nếu không có kế hoạch tiếp theo, lặp lại trong 100 năm

			var planDetails = await _scheduleRepository.GetPlanDetailsBetweenDatesAsync(startDate, endDate);
			return planDetails.Select(pd => new PlanDetailRDTD_DTO
			{
				PlanDetailId = pd.PlanDetailId,
				PlanTimeIssued = pd.PlanTimeIssued ?? TimeOnly.MinValue,
				PlanDetailName = pd.PlanDetailName ?? string.Empty, 
				Actuals = pd.Actualsissuetlips.Select(a => new ActualDetailRDTD_DTO
				{
					ActualId = a.ActualId,
					PlanDetailId = a.PlanDetailId ?? 0,
					ActualTime = a.ActualTime ?? DateTime.MinValue, 
					UserId = a.UserId,
					UserName = a.User?.UserName
				}).ToList()
			});
		}

        public async Task<IEnumerable<PlanRDTD_DTO>> GetFuturePlansAsync()
        {
            var futurePlans = await _scheduleRepository.GetFuturePlansAsync();
            return futurePlans.Select(plan => new PlanRDTD_DTO
            {
                PlanId = plan.PlanId,
                EffectiveDate = plan.EffectiveDate,
                TotalShipment = plan.TotalShipment,
                PlanName = plan.PlanName,
                PlanDetails = plan.Planrdtddetails.Select(detail => new PlanDetailRDTD_DTO
                {
                    PlanDetailId = detail.PlanDetailId,
                    PlanDetailName = detail.PlanDetailName,
                    PlanTimeIssued = detail.PlanTimeIssued ?? TimeOnly.MinValue,
					PlanTimeReceived = detail.PlanTimeReceived ?? TimeOnly.MinValue
				}).ToList()
            }).ToList();
        }
        public async Task<IEnumerable<PlanDetailRDTD_DTO>> GetPastPlanDetailsAsync()
        {
            var pastPlanDetails = await _scheduleRepository.GetPastPlanDetailsAsync();
            return pastPlanDetails.Select(pd => new PlanDetailRDTD_DTO
            {
                PlanDetailId = pd.PlanDetailId,
                PlanTimeIssued = pd.PlanTimeIssued ?? TimeOnly.MinValue,
				PlanTimeReceived = pd.PlanTimeReceived ?? TimeOnly.MinValue,
				PlanDetailName = pd.PlanDetailName,
                Actuals = pd.Actualsissuetlips.Select(a => new ActualDetailRDTD_DTO
                {
                    ActualId = a.ActualId,
                    PlanDetailId = a.PlanDetailId ?? 0,
                    ActualTime = a.ActualTime ?? DateTime.MinValue,
                    UserId = a.UserId,
                    UserName = a.User?.UserName
                }).ToList()
            }).ToList();
        }
    }
}
