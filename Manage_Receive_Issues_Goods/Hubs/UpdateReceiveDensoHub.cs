using Microsoft.AspNetCore.SignalR;

namespace Manage_Receive_Issues_Goods.Hubs
{
    public class UpdateReceiveDensoHub : Hub
    {
        public async Task SendUpdate(string message)
        {
            await Clients.All.SendAsync("ReceiveUpdate", message);
        }
    }
}
