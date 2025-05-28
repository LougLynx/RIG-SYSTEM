using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Manage_Receive_Issues_Goods.Data;
using Manage_Receive_Issues_Goods.DTO;
using Manage_Receive_Issues_Goods.Models;
using Microsoft.EntityFrameworkCore;

namespace Manage_Receive_Issues_Goods.Repository.Implementations
{
    public class ScheduleReceivedDensoRepository : IScheduleReceivedDensoRepository
    {
        private readonly RigContext _context;

        public ScheduleReceivedDensoRepository(RigContext context)
        {
            _context = context;
        }
       
        public async Task<IEnumerable<Planrdtddetail>> GetAllPlanDetailsAsync()
        {
            // Lấy ra danh sách tất cả các kế hoạch
            var plans = await _context.Planrdtds
                .OrderBy(p => p.EffectiveDate)
                .ToListAsync();

            if (plans == null || !plans.Any())
            {
                return Enumerable.Empty<Planrdtddetail>();
            }

            var today = DateOnly.FromDateTime(DateTime.Now);

            // Tìm kế hoạch gần nhất
            var closestPlan = plans
                .Where(p => p.EffectiveDate <= today)
                .OrderByDescending(p => p.EffectiveDate)
                .FirstOrDefault();

            if (closestPlan != null)
            {
                //Trả về danh sách các chi tiết kế hoạch của kế hoạch gần nhất
                return await _context.Planrdtddetails
                    .Where(pd => pd.PlanId == closestPlan.PlanId)
					.ToListAsync();
            }

            return Enumerable.Empty<Planrdtddetail>();
        }
    
        public async Task<IEnumerable<Planrdtddetail>> GetPlanDetails(int planId)
        {
            return await _context.Planrdtddetails
                .Where(d => d.PlanId == planId)
				.ToListAsync();
        }

        public async Task<Planrdtddetail> GetPlanDetailByIdAsync(int detailId)
        {
            return await _context.Planrdtddetails
				.FirstOrDefaultAsync(d => d.PlanDetailId == detailId);
        }


		public async Task UpdatePlanDetailAsync(Planrdtddetail detail)
        {
            _context.Planrdtddetails.Update(detail);
            await _context.SaveChangesAsync();
        }
    
        public async Task AddActualAsync(Actualsreceivedenso actual)
        {
            _context.Actualsreceivedensos.Add(actual);
            await _context.SaveChangesAsync();
        }

		public async Task DeleteActualAsync(int actualId)
		{
			var actual = await _context.Actualsreceivedensos.FindAsync(actualId);
			if (actual != null)
			{
				_context.Actualsreceivedensos.Remove(actual);
				await _context.SaveChangesAsync();
			}
		}

        public async Task AddPlanAsync(Planrdtd plan)
        {
            _context.Planrdtds.Add(plan);
            await _context.SaveChangesAsync();
        }

        public async Task AddPlanDetailAsync(Planrdtddetail planDetail)
        {
            _context.Planrdtddetails.Add(planDetail);
            await _context.SaveChangesAsync();
        }

		public async Task<int> GetPlanIdByDetailsAsync(string planName, DateOnly effectiveDate)
        {
            var plan = await _context.Planrdtds
                .FirstOrDefaultAsync(p => p.PlanName == planName && p.EffectiveDate == effectiveDate);

            if (plan != null)
            {
                return plan.PlanId;
            }

            return 0;  
        }
      
        public async Task<Planrdtd> GetCurrentPlanAsync()
        {
            var today = DateOnly.FromDateTime(DateTime.Today);
            return await _context.Planrdtds
                .Where(p => p.EffectiveDate <= today)
                .OrderByDescending(p => p.EffectiveDate)
                .FirstOrDefaultAsync();
        }

        public async Task<Planrdtd> GetNextPlanAsync()
        {
            var today = DateOnly.FromDateTime(DateTime.Today);
            return await _context.Planrdtds
                .Where(p => p.EffectiveDate > today)
                .OrderBy(p => p.EffectiveDate)
                .FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<Planrdtddetail>> GetPlanDetailsBetweenDatesAsync(DateOnly startDate, DateOnly endDate)
        {
            return await _context.Planrdtddetails
				.Include(pd => pd.Actualsreceivedensos)
                .ThenInclude(a => a.User)
                .Where(pd => pd.Plan.EffectiveDate >= startDate && pd.Plan.EffectiveDate < endDate)
                .ToListAsync();
        }
        public async Task<IEnumerable<Planrdtd>> GetFuturePlansAsync()
        {
            return await _context.Planrdtds
                .Include(p => p.Planrdtddetails)
				.Where(p => p.EffectiveDate > DateOnly.FromDateTime(DateTime.Now))
                .ToListAsync();
        }
        public async Task<IEnumerable<Planrdtddetail>> GetPastPlanDetailsAsync()
        {
            var today = DateOnly.FromDateTime(DateTime.Now);
            return await _context.Planrdtddetails
				.Include(p => p.Actualsreceivedensos)
                .ThenInclude(a => a.User)
                .Where(p => p.Plan.EffectiveDate < today)
                .ToListAsync();
        }

    }


   /* public static class DateTimeExtensions
    {
        public static DateTime StartOfWeek(this DateTime dt, DayOfWeek startOfWeek)
        {
            int diff = (7 + (dt.DayOfWeek - startOfWeek)) % 7;
            return dt.AddDays(-1 * diff).Date;
        }
    }*/
}
