using System.Collections.Generic;
using System.Threading.Tasks;
using Manage_Receive_Issues_Goods.DTO.RDTD_DTO;
using Manage_Receive_Issues_Goods.Models;

namespace Manage_Receive_Issues_Goods.Service
{
    public interface IScheduleReceivedDensoService
    {
        Task<IEnumerable<Planrdtddetail>> GetAllPlanDetailsAsync();
        Task<Planrdtddetail> GetPlanDetailByIdAsync(int detailId);
        Task UpdatePlanDetailAsync(Planrdtddetail detail);
        Task AddActualAsync(Actualsreceivedenso actual);
        Task DeleteActualAsync(int actualId);
        Task AddPlanAsync(Planrdtd plan);
        Task AddPlanDetailAsync(Planrdtddetail planDetail);
        Task<int> GetPlanIdByDetailsAsync(string planName,  DateOnly effectiveDate);
        Task<IEnumerable<PlanDetailRDTD_DTO>> GetPlanDetailsForDisplayAsync();
        Task<(Planrdtd currentPlan, Planrdtd nextPlan)> GetCurrentAndNextPlanAsync();
        Task<IEnumerable<PlanRDTD_DTO>> GetFuturePlansAsync();
        Task<IEnumerable<Planrdtddetail>> GetPlanDetails(int planId);
        Task<IEnumerable<PlanDetailRDTD_DTO>> GetPastPlanDetailsAsync();
    }
}
