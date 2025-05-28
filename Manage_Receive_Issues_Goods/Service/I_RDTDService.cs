using Manage_Receive_Issues_Goods.DTO.RDTD_DTO;
using Manage_Receive_Issues_Goods.Models;

namespace Manage_Receive_Issues_Goods.Service
{
    public interface I_RDTDService
	{
        Task<IEnumerable<RDTDDeliveryTimeDTO>> GetFastestDeliveryTimeAsync(string? userId, int month, int? planId);
        Task<IEnumerable<RDTDDeliveryTimeDTO>> GetSlowestDeliveryTimeAsync(string? userId, int month, int? planId);
        Task<IEnumerable<RDTDDeliveryTimeDTO>> GetAverageDeliveryTimeAsync(string? userId, int month, int? planId);
        Task<IEnumerable<Aspnetuser>> GetAllDriverAsync();
        Task<IEnumerable<Planrdtd>> GetAllPlansAsync();
        Task<IEnumerable<Planrdtddetail>> GetCurrentPlanDetailAsync(int planId);
        Task<IEnumerable<RDTDDeliveryTimeDTO>> GetFastestDeliveryTimeByPlanDetailIdAsync(int? planDetailId, int month, int? planId);
        Task<IEnumerable<RDTDDeliveryTimeDTO>> GetAverageDeliveryTimeByPlanDetailIdAsync(int? planDetailId, int month, int? planId);
        Task<IEnumerable<RDTDDeliveryTimeDTO>> GetSlowestDeliveryTimeByPlanDetailIdAsync(int? planDetailId, int month, int? planId);
    }
}
