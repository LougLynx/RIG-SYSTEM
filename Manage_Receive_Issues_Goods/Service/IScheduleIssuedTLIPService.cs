using Manage_Receive_Issues_Goods.DTO.RDTD_DTO;
using Manage_Receive_Issues_Goods.Models;
using Microsoft.EntityFrameworkCore;

namespace Manage_Receive_Issues_Goods.Service
{
    public interface IScheduleIssuedTLIPService
    {
        Task<IEnumerable<Planrdtddetail>> GetAllPlanDetailsAsync();
        Task<IEnumerable<Planrdtddetail>> GetPlanDetails(int planId);
        Task<Planrdtddetail> GetPlanDetailByIdAsync(int detailId);
        Task UpdatePlanDetailAsync(Planrdtddetail detail);
        Task AddActualAsync(Actualsissuetlip actual);
        Task DeleteActualAsync(int actualId);
        Task AddPlanAsync(Planrdtd plan);
        Task AddPlanDetailAsync(Planrdtddetail planDetail);
        Task<int> GetPlanIdByDetailsAsync(string planName, DateOnly effectiveDate);
        Task<(Planrdtd currentPlan, Planrdtd? nextPlan)> GetCurrentAndNextPlanAsync();
        //Receive Denso và Issue TLIP có chung các thuộc tính nên có thể dùng chung DTO
        Task<IEnumerable<PlanDetailRDTD_DTO>> GetPlanDetailsForDisplayAsync();
        Task<IEnumerable<PlanRDTD_DTO>> GetFuturePlansAsync();
        Task<IEnumerable<PlanDetailRDTD_DTO>> GetPastPlanDetailsAsync();

    }
}
