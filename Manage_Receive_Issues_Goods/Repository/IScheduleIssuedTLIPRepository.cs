using Manage_Receive_Issues_Goods.Models;
using Microsoft.EntityFrameworkCore;

namespace Manage_Receive_Issues_Goods.Repository
{
    public interface IScheduleIssuedTLIPRepository
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
        Task<Planrdtd> GetCurrentPlanAsync();
        Task<Planrdtd> GetNextPlanAsync();
        Task<IEnumerable<Planrdtddetail>> GetPlanDetailsBetweenDatesAsync(DateOnly startDate, DateOnly endDate);
        Task<IEnumerable<Planrdtd>> GetFuturePlansAsync();
        Task<IEnumerable<Planrdtddetail>> GetPastPlanDetailsAsync();

    }
}
