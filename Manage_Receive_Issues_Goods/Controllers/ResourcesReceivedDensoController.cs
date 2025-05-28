using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Manage_Receive_Issues_Goods.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ResourcesReceivedDensoController : ControllerBase
    {
        // GET: api/Resources
        [HttpGet]
        public IActionResult GetResources()
        {
            var resources = new List<dynamic>();

            for (int i = 1; i <= 100; i++)
            {
                resources.Add(new
                {
                    id = i.ToString(),
                    title = i % 2 != 0 ? "Plan" : "Actual",
                    eventColor = i % 2 != 0 ? "#1E2B37" : "#3E7D3E",
                    order = i,
                    cssClass = i % 2 != 0 ? "" : "gray-background"
                });
            }

            // Trả về đúng thứ tự Plan trước Actual 
            return Ok(resources.OrderBy(r => r.order));
        }

    }
}

