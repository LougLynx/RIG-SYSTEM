using Manage_Receive_Issues_Goods.Models;
using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using Microsoft.AspNetCore.Identity;
using Manage_Receive_Issues_Goods.DTO.RDTD_DTO;

namespace Manage_Receive_Issues_Goods.Repository.Implementations
{
    public class RDTDRepository : I_RDTDRepository
    {
        private readonly RigContext _context;
        private readonly UserManager<IdentityUser> _userManager;

        public RDTDRepository(RigContext context, UserManager<IdentityUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        public async Task<IEnumerable<Planrdtd>> GetAllPlansAsync()
        {
            return await _context.Planrdtds.ToListAsync();
        }

        public async Task<IEnumerable<Aspnetuser>> GetAllDriverAsync()
        {
            var usersInRole = await _userManager.GetUsersInRoleAsync("Driver Staff");
            var userIdsInRole = usersInRole.Select(user => user.Id).ToList();

            var drivers = await _context.Aspnetusers
                .Where(user => userIdsInRole.Contains(user.Id))
                .ToListAsync();

            return drivers;
        }

        public async Task<IEnumerable<Planrdtddetail>> GetCurrentPlanDetailAsync(int planId)
        {
            return await _context.Planrdtddetails
                .Where(p => p.PlanId == planId)
                .ToListAsync();
        }

        public async Task<IEnumerable<RDTDDeliveryTimeDTO>> GetFastestDeliveryTimeAsync(string? userId, int month, int? planId)
        {
            var usersInRole = await _userManager.GetUsersInRoleAsync("Driver Staff");
            var userIdsInRole = usersInRole.Select(user => user.Id).ToList();

            var query = _context.Actualsreceivedensos
                .Where(received => received.ActualTime.HasValue && received.ActualTime.Value.Month == month)
                .Join(_context.Actualsissuetlips,
                      received => new { received.UserId, received.PlanDetailId, Date = received.ActualTime.Value.Date },
                      issued => new { issued.UserId, issued.PlanDetailId, Date = issued.ActualTime.Value.Date },
                      (received, issued) => new { ReceivedTime = received.ActualTime, IssuedTime = issued.ActualTime, received.UserId, received.PlanDetailId, ActualReceivedID = received.ActualId, ActualIssuedID = issued.ActualId })
                .Join(_context.Planrdtddetails,
                      joined => joined.PlanDetailId,
                      planDetail => planDetail.PlanDetailId,
                      (joined, planDetail) => new { joined.ReceivedTime, joined.IssuedTime, joined.UserId, planDetail.PlanId, joined.ActualReceivedID, joined.ActualIssuedID })
                .Join(_context.Planrdtds,
                      joined => joined.PlanId,
                      plan => plan.PlanId,
                      (joined, plan) => new { joined.ReceivedTime, joined.IssuedTime, joined.UserId, plan.PlanId, joined.ActualReceivedID, joined.ActualIssuedID })
                .Where(joined => (string.IsNullOrEmpty(userId) ? userIdsInRole.Contains(joined.UserId!) : joined.UserId == userId) && (!planId.HasValue || joined.PlanId == planId));

            var result = await query.ToListAsync();

            var fastestDeliveries = result
                .GroupBy(x => x.UserId)
                .Select(g => g
                    .Select(x => new { DeliveryTime = x.ReceivedTime - x.IssuedTime, x.ReceivedTime, x.IssuedTime, UserName = usersInRole.First(user => user.Id == x.UserId).UserName, x.UserId, x.ActualReceivedID, x.ActualIssuedID })
                    .OrderBy(x => x.DeliveryTime)
                    .FirstOrDefault())
                .ToList();

            return fastestDeliveries.Select(fastestDelivery => new RDTDDeliveryTimeDTO
            {
                Time = fastestDelivery?.DeliveryTime,
                TimeReceived = fastestDelivery?.ReceivedTime?.TimeOfDay,
                TimeIssued = fastestDelivery?.IssuedTime?.TimeOfDay,
                UserName = fastestDelivery?.UserName ?? string.Empty,
                UserId = fastestDelivery?.UserId ?? string.Empty,
                ActualReceivedID = fastestDelivery?.ActualReceivedID ?? 0,
                ActualIssuedID = fastestDelivery?.ActualIssuedID ?? 0
            });
        }

        public async Task<IEnumerable<RDTDDeliveryTimeDTO>> GetSlowestDeliveryTimeAsync(string? userId, int month, int? planId)
        {
            var usersInRole = await _userManager.GetUsersInRoleAsync("Driver Staff");
            var userIdsInRole = usersInRole.Select(user => user.Id).ToList();

            var query = _context.Actualsreceivedensos
                .Where(received => received.ActualTime.HasValue && received.ActualTime.Value.Month == month)
                .Join(_context.Actualsissuetlips,
                      received => new { received.UserId, received.PlanDetailId, Date = received.ActualTime.Value.Date },
                      issued => new { issued.UserId, issued.PlanDetailId, Date = issued.ActualTime.Value.Date },
                      (received, issued) => new { ReceivedTime = received.ActualTime, IssuedTime = issued.ActualTime, received.UserId, received.PlanDetailId, ActualReceivedID = received.ActualId, ActualIssuedID = issued.ActualId })
                .Join(_context.Planrdtddetails,
                      joined => joined.PlanDetailId,
                      planDetail => planDetail.PlanDetailId,
                      (joined, planDetail) => new { joined.ReceivedTime, joined.IssuedTime, joined.UserId, planDetail.PlanId, joined.ActualReceivedID, joined.ActualIssuedID })
                .Join(_context.Planrdtds,
                      joined => joined.PlanId,
                      plan => plan.PlanId,
                      (joined, plan) => new { joined.ReceivedTime, joined.IssuedTime, joined.UserId, plan.PlanId, joined.ActualReceivedID, joined.ActualIssuedID })
                .Where(joined => (string.IsNullOrEmpty(userId) ? userIdsInRole.Contains(joined.UserId!) : joined.UserId == userId) && (!planId.HasValue || joined.PlanId == planId));

            var result = await query.ToListAsync();

            var slowestDeliveries = result
                .GroupBy(x => x.UserId)
                .Select(g => g
                    .Select(x => new { DeliveryTime = x.ReceivedTime - x.IssuedTime, x.ReceivedTime, x.IssuedTime, UserName = usersInRole.First(user => user.Id == x.UserId).UserName, x.UserId, x.ActualReceivedID, x.ActualIssuedID })
                    .OrderByDescending(x => x.DeliveryTime)
                    .FirstOrDefault())
                .ToList();

            return slowestDeliveries.Select(slowestDelivery => new RDTDDeliveryTimeDTO
            {
                Time = slowestDelivery?.DeliveryTime,
                TimeReceived = slowestDelivery?.ReceivedTime?.TimeOfDay,
                TimeIssued = slowestDelivery?.IssuedTime?.TimeOfDay,
                UserName = slowestDelivery?.UserName ?? string.Empty,
                UserId = slowestDelivery?.UserId ?? string.Empty,
                ActualReceivedID = slowestDelivery?.ActualReceivedID ?? 0,
                ActualIssuedID = slowestDelivery?.ActualIssuedID ?? 0
            });
        }


        public async Task<IEnumerable<RDTDDeliveryTimeDTO>> GetAverageDeliveryTimeAsync(string? userId, int month, int? planId)
        {
            var usersInRole = await _userManager.GetUsersInRoleAsync("Driver Staff");
            var userIdsInRole = usersInRole.Select(user => user.Id).ToList();

            var query = _context.Actualsreceivedensos
                .Where(received => received.ActualTime.HasValue && received.ActualTime.Value.Month == month)
                .Join(_context.Actualsissuetlips,
                      received => new { received.UserId, received.PlanDetailId, Date = received.ActualTime.Value.Date },
                      issued => new { issued.UserId, issued.PlanDetailId, Date = issued.ActualTime.Value.Date },
                      (received, issued) => new { ReceivedTime = received.ActualTime, IssuedTime = issued.ActualTime, received.UserId, received.PlanDetailId, ActualReceivedID = received.ActualId, ActualIssuedID = issued.ActualId })
                .Join(_context.Planrdtddetails,
                      joined => joined.PlanDetailId,
                      planDetail => planDetail.PlanDetailId,
                      (joined, planDetail) => new { joined.ReceivedTime, joined.IssuedTime, joined.UserId, planDetail.PlanId, joined.ActualReceivedID, joined.ActualIssuedID })
                .Join(_context.Planrdtds,
                      joined => joined.PlanId,
                      plan => plan.PlanId,
                      (joined, plan) => new { joined.ReceivedTime, joined.IssuedTime, joined.UserId, plan.PlanId, joined.ActualReceivedID, joined.ActualIssuedID })
                .Where(joined => (string.IsNullOrEmpty(userId) ? userIdsInRole.Contains(joined.UserId!) : joined.UserId == userId) && (!planId.HasValue || joined.PlanId == planId));

            var result = await query.ToListAsync();

            var averageDeliveries = result
                .GroupBy(x => x.UserId)
                .Select(g => new
                {
                    UserId = g.Key,
                    UserName = usersInRole.First(user => user.Id == g.Key).UserName,
                    AverageDeliveryTime = g.Average(x => (x.ReceivedTime - x.IssuedTime)?.TotalSeconds)
                })
                .ToList();

            return averageDeliveries.Select(averageDelivery => new RDTDDeliveryTimeDTO
            {
                Time = TimeSpan.FromSeconds(averageDelivery.AverageDeliveryTime ?? 0),
                UserName = averageDelivery.UserName ?? string.Empty,
                UserId = averageDelivery.UserId ?? string.Empty
            });
        }

        public async Task<IEnumerable<RDTDDeliveryTimeDTO>> GetFastestDeliveryTimeByPlanDetailIdAsync(int? planDetailId, int month, int? planId)
        {
            var query = _context.Planrdtddetails
                .Join(_context.Actualsreceivedensos, planDetail => planDetail.PlanDetailId, actualReceived => actualReceived.PlanDetailId, (planDetail, actualReceived) => new { planDetail, actualReceived })
                .Join(_context.Actualsissuetlips, combined => combined.planDetail.PlanDetailId, actualIssued => actualIssued.PlanDetailId, (combined, actualIssued) => new { combined.planDetail, combined.actualReceived, actualIssued })
                .Where(x => x.actualReceived.ActualTime.HasValue && x.actualIssued.ActualTime.HasValue
                            && x.actualReceived.ActualTime.Value.Month == month
                            && x.actualIssued.ActualTime.Value.Month == month
                            && x.actualReceived.ActualTime.Value.Day == x.actualIssued.ActualTime.Value.Day
                            && (planDetailId == null || x.planDetail.PlanDetailId == planDetailId)
                            && x.planDetail.PlanId == planId);

            var data = await query.ToListAsync();

            var result = data
                .GroupBy(x => new { x.planDetail.PlanDetailId, x.planDetail.PlanDetailName })
                .Select(g => new RDTDDeliveryTimeDTO
                {
                    PlanDetailId = g.Key.PlanDetailId,
                    PlanDetailName = g.Key.PlanDetailName,
                    Time = g
                        .Where(x => x.actualReceived.ActualTime.HasValue && x.actualIssued.ActualTime.HasValue)
                        .Select(x => (TimeSpan?)(x.actualReceived.ActualTime.Value - x.actualIssued.ActualTime.Value))
                        .OrderBy(time => time)
                        .FirstOrDefault()
                })
                .OrderBy(dto => dto.PlanDetailId)
                .ThenBy(dto => dto.PlanDetailName)
                .ToList();

            return result;
        }

        public async Task<IEnumerable<RDTDDeliveryTimeDTO>> GetAverageDeliveryTimeByPlanDetailIdAsync(int? planDetailId, int month, int? planId)
        {
            var query = _context.Planrdtddetails
                .Join(_context.Actualsreceivedensos, planDetail => planDetail.PlanDetailId, actualReceived => actualReceived.PlanDetailId, (planDetail, actualReceived) => new { planDetail, actualReceived })
                .Join(_context.Actualsissuetlips, combined => combined.planDetail.PlanDetailId, actualIssued => actualIssued.PlanDetailId, (combined, actualIssued) => new { combined.planDetail, combined.actualReceived, actualIssued })
                .Where(x => x.actualReceived.ActualTime.HasValue && x.actualIssued.ActualTime.HasValue
                            && x.actualReceived.ActualTime.Value.Month == month
                            && x.actualIssued.ActualTime.Value.Month == month
                            && x.actualReceived.ActualTime.Value.Day == x.actualIssued.ActualTime.Value.Day
                            && (planDetailId == null || x.planDetail.PlanDetailId == planDetailId)
                            && x.planDetail.PlanId == planId);

            var data = await query.ToListAsync();

            var result = data
                .GroupBy(x => new { x.planDetail.PlanDetailId, x.planDetail.PlanDetailName })
                .Select(g => new RDTDDeliveryTimeDTO
                {
                    PlanDetailId = g.Key.PlanDetailId,
                    PlanDetailName = g.Key.PlanDetailName,
                    Time = g
                        .Where(x => x.actualReceived.ActualTime.HasValue && x.actualIssued.ActualTime.HasValue)
                        .Select(x => (TimeSpan?)(x.actualReceived.ActualTime.Value - x.actualIssued.ActualTime.Value))
                        .Average(time => time?.TotalSeconds) != null ? TimeSpan.FromSeconds(g.Average(x => (x.actualReceived.ActualTime.Value - x.actualIssued.ActualTime.Value).TotalSeconds)) : (TimeSpan?)null
                })
                .OrderBy(dto => dto.PlanDetailId)
                .ThenBy(dto => dto.PlanDetailName)
                .ToList();

            return result;
        }


        public async Task<IEnumerable<RDTDDeliveryTimeDTO>> GetSlowestDeliveryTimeByPlanDetailIdAsync(int? planDetailId, int month, int? planId)
        {
            var query = _context.Planrdtddetails
                .Join(_context.Actualsreceivedensos, planDetail => planDetail.PlanDetailId, actualReceived => actualReceived.PlanDetailId, (planDetail, actualReceived) => new { planDetail, actualReceived })
                .Join(_context.Actualsissuetlips, combined => combined.planDetail.PlanDetailId, actualIssued => actualIssued.PlanDetailId, (combined, actualIssued) => new { combined.planDetail, combined.actualReceived, actualIssued })
                .Where(x => x.actualReceived.ActualTime.HasValue && x.actualIssued.ActualTime.HasValue
                            && x.actualReceived.ActualTime.Value.Month == month
                            && x.actualIssued.ActualTime.Value.Month == month
                            && x.actualReceived.ActualTime.Value.Day == x.actualIssued.ActualTime.Value.Day
                            && (planDetailId == null || x.planDetail.PlanDetailId == planDetailId)
                            && x.planDetail.PlanId == planId);

            var data = await query.ToListAsync();

            var result = data
                .GroupBy(x => new { x.planDetail.PlanDetailId, x.planDetail.PlanDetailName })
                .Select(g => new RDTDDeliveryTimeDTO
                {
                    PlanDetailId = g.Key.PlanDetailId,
                    PlanDetailName = g.Key.PlanDetailName,
                    Time = g
                        .Where(x => x.actualReceived.ActualTime.HasValue && x.actualIssued.ActualTime.HasValue)
                        .Select(x => (TimeSpan?)(x.actualReceived.ActualTime.Value - x.actualIssued.ActualTime.Value))
                        .OrderByDescending(time => time)
                        .FirstOrDefault()
                })
                .OrderBy(dto => dto.PlanDetailId)
                .ThenBy(dto => dto.PlanDetailName)
                .ToList();

            return result;
        }



    }
}
