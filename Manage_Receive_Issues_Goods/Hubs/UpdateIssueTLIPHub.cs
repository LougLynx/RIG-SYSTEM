using Microsoft.AspNetCore.SignalR;

namespace Manage_Receive_Issues_Goods.Hubs
{
	public class UpdateIssueTLIPHub : Hub
	{
		public async Task SendUpdate(string message)
		{
			await Clients.All.SendAsync("IssuedUpdate", message);
		}
	}
}
