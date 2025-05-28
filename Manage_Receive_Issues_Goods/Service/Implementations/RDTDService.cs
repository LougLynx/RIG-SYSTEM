using Manage_Receive_Issues_Goods.DTO.RDTD_DTO;
using Manage_Receive_Issues_Goods.Models;
using Manage_Receive_Issues_Goods.Repository;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using NuGet.Protocol.Core.Types;

namespace Manage_Receive_Issues_Goods.Service.Implementations
{
    public class RDTDService : I_RDTDService
	{
		private readonly I_RDTDRepository _repository;

		public RDTDService(I_RDTDRepository repository)
		{
			_repository = repository;
		}

        public async Task<IEnumerable<Planrdtd>> GetAllPlansAsync()
        {
            return await _repository.GetAllPlansAsync();
        }

        public async Task<IEnumerable<Aspnetuser>> GetAllDriverAsync()
        {
            return await _repository.GetAllDriverAsync();
        }
        public async Task<IEnumerable<Planrdtddetail>> GetCurrentPlanDetailAsync(int planId)
        {
            return await _repository.GetCurrentPlanDetailAsync(planId);

        }

        public async Task<IEnumerable<RDTDDeliveryTimeDTO>> GetFastestDeliveryTimeAsync(string? userId, int month, int? planId)
        {
			return await _repository.GetFastestDeliveryTimeAsync(userId, month, planId);
		}

		public async Task<IEnumerable<RDTDDeliveryTimeDTO>> GetSlowestDeliveryTimeAsync(string? userId, int month, int? planId)
		{
			return await _repository.GetSlowestDeliveryTimeAsync(userId, month, planId);
		}

		public async Task<IEnumerable<RDTDDeliveryTimeDTO>> GetAverageDeliveryTimeAsync(string? userId, int month, int? planId)
		{
			return await _repository.GetAverageDeliveryTimeAsync(userId, month, planId);
		}


        public async Task<IEnumerable<RDTDDeliveryTimeDTO>> GetFastestDeliveryTimeByPlanDetailIdAsync(int? planDetailId, int month, int? planId)
        {
            return await _repository.GetFastestDeliveryTimeByPlanDetailIdAsync(planDetailId, month, planId);
        }

        public async Task<IEnumerable<RDTDDeliveryTimeDTO>> GetAverageDeliveryTimeByPlanDetailIdAsync(int? planDetailId, int month, int? planId)
        {
            return await _repository.GetAverageDeliveryTimeByPlanDetailIdAsync(planDetailId, month, planId);

        }

        public async Task<IEnumerable<RDTDDeliveryTimeDTO>> GetSlowestDeliveryTimeByPlanDetailIdAsync(int? planDetailId, int month, int? planId)
        {
            return await _repository.GetSlowestDeliveryTimeByPlanDetailIdAsync(planDetailId, month, planId);
        }


    }
}
