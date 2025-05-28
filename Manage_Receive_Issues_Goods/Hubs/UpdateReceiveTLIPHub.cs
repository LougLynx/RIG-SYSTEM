using Manage_Receive_Issues_Goods.DTO.TLIPDTO.Received;
using Manage_Receive_Issues_Goods.Models;
using Manage_Receive_Issues_Goods.Services;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace Manage_Receive_Issues_Goods.Hubs
{
    public class UpdateReceiveTLIPHub : Hub
    {
        private readonly ILogger<UpdateReceiveTLIPHub> _logger;
        private readonly ISchedulereceivedTLIPService _schedulereceivedService;


        public UpdateReceiveTLIPHub(ILogger<UpdateReceiveTLIPHub> logger, ISchedulereceivedTLIPService schedulereceivedService)
        {
            _logger = logger;
            _schedulereceivedService = schedulereceivedService;
        }

        public async Task UpdateCalendar(ActualReceivedTLIPDTO actualReceived)
        {
            await Clients.All.SendAsync("UpdateCalendar", actualReceived);

        }

        public async Task ErrorReceived( int actualReceivedId,string supplierName,bool isCompleted)
        {
            await Clients.All.SendAsync("ErrorReceived", actualReceivedId, supplierName , isCompleted);

        }

        public async Task UpdateLeadtime(ActualReceivedTLIPDTO actualReceived)
        {
            _logger.LogInformation("Received signal to update lead time for ActualReceivedId: {ActualReceivedId}", actualReceived);

            await Clients.All.SendAsync("UpdateLeadtime", actualReceived);

        }
        public async Task UpdateColorScanDone(ActualReceivedTLIPDTO actualReceived)
        {
            await Clients.All.SendAsync("UpdateColorScanDone", actualReceived);

        }
        public async Task UpdatePercentage(ActualReceivedTLIPDTO actualReceived)
        {
            await Clients.All.SendAsync("UpdatePercentage", actualReceived);

        }
        
    }
}
