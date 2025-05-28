using Manage_Receive_Issues_Goods.Models;
using Manage_Receive_Issues_Goods.Services;
using Microsoft.AspNetCore.SignalR;
using System.Text.Json;
using Microsoft.AspNetCore.SignalR.Client;
using log4net;
using Manage_Receive_Issues_Goods.DTO.TLIPDTO.Received;
namespace DataFetchingWorkerService
{
    public class DataTLIPWorker : BackgroundService
    {
        private static readonly ILog log = LogManager.GetLogger(typeof(DataTLIPWorker));

        private readonly ILogger<DataTLIPWorker> _logger;
        private readonly IConfiguration _configuration;
        private readonly IServiceProvider _serviceProvider;
        private HubConnection _hubConnection;

        private List<AsnInformation> previousData = new List<AsnInformation>();
        private DateOnly _lastRunDate = DateOnly.MinValue;


        public DataTLIPWorker(IServiceProvider serviceProvider, ILogger<DataTLIPWorker> logger, IConfiguration configuration)

        {
            log.Info("Init DataTLIPWorker...");

            _serviceProvider = serviceProvider;
            _logger = logger;
            _configuration = configuration;
            var hubUrl = _configuration.GetSection("HubConnection:HubUrl").Value;
            _logger.LogInformation("URL to SignalR Hub is: {hubUrl}.", hubUrl);
            _hubConnection = new HubConnectionBuilder()
                                .WithUrl(hubUrl)
                                .WithAutomaticReconnect()
                                .Build();
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            try
            {
                // Kết nối tới SignalR
                await _hubConnection.StartAsync(stoppingToken);
                _logger.LogInformation("Connected to SignalR Hub.");
                log.Info("Connected to SignalR Hub.");


                if (_hubConnection.State == HubConnectionState.Connected)
                {
                    _logger.LogInformation("SignalR Hub connection is ACTIVE. State: {State}. ", _hubConnection.State);
                }
                else
                {
                    _logger.LogWarning("SignalR Hub connection is NOT ACTIVE. State: {State}. ", _hubConnection.State);
                }

                _logger.LogInformation("Starting DataTLIPWorker...");
                log.Info("Starting DataTLIPWorker...");

                

                while (!stoppingToken.IsCancellationRequested)
                {
                    try
                    {
                        using (var scope = _serviceProvider.CreateScope())
                        {
                            var service = scope.ServiceProvider.GetRequiredService<ISchedulereceivedTLIPService>();
                            _logger.LogInformation("ExecuteAsync called at {Time}", DateTime.Now.ToString("T"));
                            _logger.LogInformation("_lastRunDate is {_lastRunDate.Date}", _lastRunDate);

                            var currentDate = DateOnly.FromDateTime(DateTime.UtcNow);

                            if (_lastRunDate != currentDate)
                            {
                                _lastRunDate = currentDate;

                                await service.AddAllPlanDetailsToHistoryAsync();
                            }

                            // Gọi các hàm xử lý logic
                            await FetchData(service);
                            await FetchDataDetail(service);
                            await FetchStorageDetail(service);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error in ExecuteAsync loop.");
                        log.Error("Error in ExecuteAsync loop.", ex);
                    }

                    // Delay trước khi gọi lại (fecth 5s 1 lần)
                    await Task.Delay(5000, stoppingToken);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to start or connect to SignalR Hub.");
                log.Error("Failed to start or connect to SignalR Hub.", ex);

            }
            finally
            {
                await _hubConnection.DisposeAsync();
            }
        }

        private async Task FetchData(ISchedulereceivedTLIPService service)
        {
            _logger.LogInformation("FetchData called at {Time}", DateTime.Now.ToString("T"));

            //Lấy dữ liệu từ API
            var now = DateTime.Now;
            var sevenDaysAgo = now.AddDays(-7);

            // Danh sách ngày từ 7 ngày trước đến hôm nay
            var dates = Enumerable.Range(0, 8) // Tạo danh sách 8 ngày (bao gồm hôm nay và 7 ngày trước)
                          .Select(offset => sevenDaysAgo.AddDays(offset))
                                  .ToList();

            // Lấy dữ liệu cho tất cả các ngày trong danh sách
            var nextData = new List<AsnInformation>(); // Đổi tên biến là nextData
            foreach (var date in dates)
            {
                var dataForDate = await service.GetAsnInformationAsync(date); // Lấy dữ liệu cho mỗi ngày
                nextData.AddRange(dataForDate); // Thêm dữ liệu của ngày vào nextData
            }

            //var nextData = await service.GetAsnInformationAsync(now);

            //***
            // ***
            // **
            // *Đoạn này dùng để test

            //var nextData = await ParseAsnInformationFromFileAsync();

            foreach (var nextItem in nextData)
            {
                //Gán dữ liệu cho biến previousItem
                var previousItem = previousData.FirstOrDefault(item =>
                    (item.AsnNumber != null && item.AsnNumber == nextItem.AsnNumber) ||
                    (item.AsnNumber == null && item.DoNumber != null && item.DoNumber == nextItem.DoNumber) ||
                    (item.AsnNumber == null && item.DoNumber == null && item.Invoice != null && item.Invoice == nextItem.Invoice)
                );
                //Kiểm tra dữ liệu đã có trong database chưa
                var exists = await service.GetActualReceivedByDetailsAsync(new ActualReceivedTLIPDTO
                {
                    SupplierCode = nextItem.SupplierCode,
                    AsnNumber = nextItem.AsnNumber,
                    DoNumber = nextItem.DoNumber,
                    Invoice = nextItem.Invoice
                });
                //Add checking supplier here
                //

                if (exists == null)
                {
                    //Nếu dữ liệu chưa có thì thêm vào database
                    if (previousItem != null && !previousItem.ReceiveStatus && nextItem.ReceiveStatus)
                    {
                        var currentPlan = await service.GetCurrentPlanAsync();
                        //Kiểm tra SupplierCode theo TagName VD: KCN, HCM,...
                        var tagNameRules = await service.GetAllTagNameRuleAsync();
                        //(Nếu không có TagName thì sẽ lấy chính SupplierCode)
                        string tagName = nextItem.SupplierCode;
                        foreach (var rule in tagNameRules)
                        {
                            if (rule.SupplierCode == nextItem.SupplierCode)
                            {
                                tagName = rule.TagName;
                                break;
                            }
                        }
                        var actualReceived = new Actualreceivedtlip
                        {
                            ActualDeliveryTime = new DateTime(DateTime.Now.Year, DateTime.Now.Month, DateTime.Now.Day, DateTime.Now.Hour, DateTime.Now.Minute, 0),
                            SupplierCode = nextItem.SupplierCode,
                            AsnNumber = nextItem.AsnNumber,
                            DoNumber = nextItem.DoNumber,
                            Invoice = nextItem.Invoice,
                            IsCompleted = nextItem.IsCompleted,
                            TagName = tagName,
                            PlanId = currentPlan.PlanId
                        };

                        try
                        {
                             await service.AddActualReceivedAsync(actualReceived);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError("Error adding actual received for supplier code: {1}",
                                nextItem.SupplierCode);
                            log.Error($"Error adding actual received for AsnNumber: {nextItem.AsnNumber}, DoNumber: {nextItem.DoNumber}, Invoice: {nextItem.Invoice}", ex);
                            continue; // Continue to the next item
                        }

                        //Phải parse ActualDeliveryTime sang dạng MM/dd/yyyy HH:mm:ss
                        var formattedDateTime = actualReceived.ActualDeliveryTime.ToString("yyyy-MM-dd HH:mm:ss");

                        var actualReceivedEntry = await service.GetActualReceivedEntryAsync(
                                                                actualReceived.SupplierCode,
                                                                 formattedDateTime,
                                                                actualReceived.AsnNumber,
                                                                actualReceived.DoNumber,
                                                                actualReceived.Invoice);


                        if (actualReceivedEntry != null)
                        {
                            //Lấy asndetail
                            //var asnDetails = await ParseAsnDetailFromFile(
                            //***
                            // ***
                            // **

                            var asnDetails = await service.GetAsnDetailAsync(
                                actualReceivedEntry.AsnNumber,
                                actualReceivedEntry.DoNumber,
                                actualReceivedEntry.Invoice
                            );

                            if (asnDetails != null && asnDetails.Any())
                            {
                                foreach (var asnDetail in asnDetails)
                                {
                                    var actualDetail = new Actualdetailtlip
                                    {
                                        ActualReceivedId = actualReceivedEntry.ActualReceivedId,
                                        PartNo = asnDetail.PartNo,
                                        Quantity = asnDetail.Quantity,
                                        QuantityRemain = asnDetail.QuantityRemain,
                                        QuantityScan = asnDetail.QuantityScan,
                                        StockInStatus = asnDetail.StockInStatus,
                                        StockInLocation = asnDetail.StockInLocation,
                                    };

                                    await service.AddActualDetailAsync(actualDetail);
                                }

                                //Đảm bảo dữ liệu đã được add vào DB và gửi tín hiệu SignalR
                                await GetActualReceivedById(actualReceivedEntry.ActualReceivedId, service);
                            }
                            else
                            {
                                _logger.LogWarning("No ASN details found for AsnNumber: {0}, DoNumber: {1}, Invoice: {2}",
                                                   actualReceivedEntry.AsnNumber, actualReceivedEntry.DoNumber, actualReceivedEntry.Invoice);
                                log.WarnFormat("No ASN details found for AsnNumber: {0}, DoNumber: {1}, Invoice: {2}",
                                                   actualReceivedEntry.AsnNumber, actualReceivedEntry.DoNumber, actualReceivedEntry.Invoice);
                            }

                        }
                        else
                        {
                            _logger.LogWarning("actualReceivedEntry is null, unable to retrieve ASN details.");
                            log.Warn("actualReceivedEntry is null, unable to retrieve ASN details.");
                        }
                        //Lưu lịch sử cho ActualReceived
                        await service.AddAllActualToHistoryAsync(actualReceivedEntry.ActualReceivedId);
                    }
                }

                //Nếu dữ liệu có tồn tại trong DB thì kiểm tra xem dữ liệu mới có ReceiveStatus = true ko (chỉ với trường hợp ko có DoNumber & Asn mà trùng Invoice)
                else if (exists != null && !nextItem.ReceiveStatus)
                {

                    if (!exists.IsCompleted)
                    {
                        await service.UpdateActualReceivedCompletionAsync(exists.ActualReceivedId, true);
                    }
                    _logger.LogInformation("object {object}", _hubConnection);
                    await _hubConnection.SendAsync("ErrorReceived", exists.ActualReceivedId, exists.SupplierCodeNavigation.SupplierName, exists.IsCompleted);
                }

                //Nếu dữ liệu đã tồn tại trong DB thì kiểm tra xem dữ liệu mới có ReceiveStatus = true ko 
                else if (exists != null && nextItem.IsCompleted)
                {
                    //var data = (await service.GetActualReceivedAsyncByInfor(nextItem.AsnNumber, nextItem.DoNumber, nextItem.Invoice)).FirstOrDefault();
                    if (!exists.IsCompleted)
                    {
                        if (exists.ActualLeadTime == null)
                        {
                            _logger.LogInformation($"Suspect: Receive completed before leadtime being calculated:\n {exists?.ActualReceivedId}; {exists?.SupplierCode}; {exists?.AsnNumber}; {exists?.DoNumber}");
                            continue; // Nếu ActualLeadTime là null thì không cần xử lý tiếp
                        }
                        await service.UpdateActualReceivedCompletionAsync(exists.ActualReceivedId, true);
                        //Xóa các actualDetail trước khi xử lý và cập nhật lại actualDetail sau khi xử lý
                        //(Tại vì ở thời điểm receive status đươc cập nhật thành true thì không có dữ liệu trả về
                        //& dữ liệu mới được cập nhật khi đã xử lý xong và là dữ liệu đã được chia pallet rồi)
                        await service.DeleteActualDetailsByReceivedIdAsync(exists.ActualReceivedId);

                        //var asnDetails = await ParseAsnDetailFromFile(
                        //***
                        //***
                        //**

                        var asnDetails = await service.GetAsnDetailAsync(
                        exists.AsnNumber,
                        exists.DoNumber,
                        exists.Invoice);

                        if (asnDetails != null && asnDetails.Any())
                        {
                            foreach (var asnDetail in asnDetails)
                            {
                                var actualDetail = new Actualdetailtlip
                                {
                                    ActualReceivedId = exists.ActualReceivedId,
                                    PartNo = asnDetail.PartNo,
                                    Quantity = asnDetail.Quantity,
                                    QuantityRemain = asnDetail.QuantityRemain,
                                    QuantityScan = asnDetail.QuantityScan,
                                    StockInStatus = asnDetail.StockInStatus,
                                    StockInLocation = asnDetail.StockInLocation,
                                };

                                await service.AddActualDetailAsync(actualDetail);
                            }
                        }


                        var actualReceivedChange = await service.GetAllActualReceivedAsyncById(exists.ActualReceivedId);
                        var actualReceivedParse = actualReceivedChange.FirstOrDefault();
                        var actualReceivedDTO = service.MapToActualReceivedTLIPDTO(actualReceivedParse);

                        await _hubConnection.SendAsync("UpdateColorScanDone", actualReceivedDTO);

                        // Sau khi đã cập nhật đươc IsCompleted = true thì cập nhật thêm event để hiển thị storage
                        //await _hubContext.Clients.All.SendAsync("UpdateStorageCalendar", actualReceivedDTO);

                    }

                }
            }
            previousData = nextData.ToList();
        }


        private async Task FetchDataDetail(ISchedulereceivedTLIPService service)
        {
            var actualReceivedList = await service.GetIncompleteActualReceived();
            foreach (var actualReceived in actualReceivedList)
            {
                //Nếu chưa xong thì tiếp tục cập nhật thời gian
                await service.UpdateActualLeadTime(actualReceived, DateTime.Now);

                try
                {
                    await _hubConnection.SendAsync("UpdateLeadtime", service.MapToActualReceivedTLIPDTO(actualReceived));
                    _logger.LogInformation("Successfully sent lead time update to SignalR hub.");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send lead time update to SignalR hub.");
                }

                //Lấy dữ liệu asnDetail từ API
                var asnDetails = await service.GetAsnDetailAsync(
                    /****
                    ***
                    **
                    */
                    //var asnDetails = await ParseAsnDetailFromFile(
                    actualReceived.AsnNumber ?? string.Empty,
                    actualReceived.DoNumber ?? string.Empty,
                    actualReceived.Invoice ?? string.Empty);

                //Lấy dữ liệu asnDetail từ DB
                var asnDetailsInDataBase = await service.GetAsnDetailInDataBaseAsync(
                            actualReceived.AsnNumber ?? string.Empty,
                            actualReceived.DoNumber ?? string.Empty,
                            actualReceived.Invoice ?? string.Empty);

                if (asnDetails != null && asnDetails.Any())
                {
                    foreach (var asnDetail in asnDetails)
                    {
                        ////////////////////////////////////////////////////////////////////
                        var matchingDetailInDatabase = asnDetailsInDataBase
                            .SelectMany(dbAd => dbAd.Actualdetailtlips)
                            .FirstOrDefault(dbDetail => dbDetail.PartNo == asnDetail.PartNo);

                        /////////////////////////////////////////////////////////////////////
                        if (asnDetail.QuantityRemain == 0 && matchingDetailInDatabase?.QuantityRemain != 0)
                        {
                            await service.UpdateActualDetailTLIPAsync(asnDetail.PartNo, actualReceived.ActualReceivedId, 0, null);
                        }

                        /////////////////////////////////////////////////////////////////
                        if ((asnDetail.QuantityScan == asnDetail.Quantity || asnDetail.QuantityScan == asnDetail.Quantity - 1)
                            && matchingDetailInDatabase?.QuantityScan != asnDetail.QuantityScan)
                        {
                            await service.UpdateActualDetailTLIPAsync(asnDetail.PartNo, actualReceived.ActualReceivedId, null, asnDetail.QuantityScan);

                            var actualReceivedChange = await service.GetAllActualReceivedAsyncById(actualReceived.ActualReceivedId);
                            var actualReceivedParse = actualReceivedChange.FirstOrDefault();
                            if (actualReceivedParse != null)
                            {
                                await _hubConnection.SendAsync("UpdatePercentage", service.MapToActualReceivedTLIPDTO(actualReceivedParse));
                            }
                        }


                    }
                }
            }
        }

        private async Task FetchStorageDetail(ISchedulereceivedTLIPService service)
        {

            var actualReceivedList = await service.GetUnstoredActualReceived();

            foreach (var actualReceived in actualReceivedList)
            {
                await service.UpdateStorageTime(actualReceived, DateTime.Now);
                //await _hubContext.Clients.All.SendAsync("UpdateStorageTime", service.MapToActualReceivedTLIPDTO(actualReceived));


                //Lấy dữ liệu asnDetail từ API
                var asnDetails = await service.GetAsnDetailAsync(
                    /****
                    ***
                    **
                    */
                    //var asnDetails = await ParseAsnDetailFromFile(
                    actualReceived.AsnNumber ?? string.Empty,
                    actualReceived.DoNumber ?? string.Empty,
                    actualReceived.Invoice ?? string.Empty);

                // Lấy dữ liệu asnDetail từ DB
                var asnDetailsInDataBase = await service.GetAsnDetailInDataBaseAsync(
                    actualReceived.AsnNumber ?? string.Empty,
                    actualReceived.DoNumber ?? string.Empty,
                    actualReceived.Invoice ?? string.Empty);

                if (asnDetails != null && asnDetails.Any())
                {
                    foreach (var asnDetail in asnDetails)
                    {
                        var matchingDetailInDatabase = asnDetailsInDataBase
                            .SelectMany(dbAd => dbAd.Actualdetailtlips)
                            .FirstOrDefault(dbDetail => dbDetail.PartNo == asnDetail.PartNo
                                                        && dbDetail.Quantity == asnDetail.Quantity
                                                        && dbDetail.QuantityScan == asnDetail.QuantityScan
                                                        && dbDetail.QuantityRemain == asnDetail.QuantityRemain
                                                        && dbDetail.ActualReceivedId == actualReceived.ActualReceivedId);


                        if (asnDetail.StockInStatus == true && matchingDetailInDatabase?.StockInStatus == false &&
                           !string.IsNullOrEmpty(asnDetail.StockInLocation) &&
                           string.IsNullOrEmpty(matchingDetailInDatabase?.StockInLocation))
                        {

                            await service.UpdateActualDetailReceivedAsync(asnDetail.PartNo, asnDetail.Quantity, asnDetail.QuantityRemain,
                                                                           asnDetail.QuantityScan, actualReceived.ActualReceivedId,
                                                                           asnDetail.StockInStatus, asnDetail.StockInLocation);

                            // Ki?m tra xem t?t c? c?c record trong DB c? trong API c? StockInLocation != null kh?ng (DB)
                            /*bool allMatchingAsnDetailsInDataBaseIsStockIn = asnDetailsInDataBase
                               .SelectMany(dbAd => dbAd.Actualdetailtlips)
                               .Where(dbDetail => asnDetails.Any(ad => ad.PartNo == dbDetail.PartNo))
                               .All(dbDetail => !string.IsNullOrEmpty(dbDetail.StockInLocation) || dbDetail.StockInStatus == true);

                            // Ki?m tra xem t?t c? c?c record trong asnDetails c? StockInLocation != null kh?ng (API)
                            bool allAsnDetailsIsStockIn = asnDetails.All(ad => !string.IsNullOrEmpty(ad.StockInLocation) || ad.StockInStatus == true);

                            if (allMatchingAsnDetailsInDataBaseIsStockIn && allAsnDetailsIsStockIn)
                            {
                                var newUpdateReceived = asnDetailsInDataBase
                             .SelectMany(dbAd => dbAd.Actualdetailtlips)
                             .FirstOrDefault(dbDetail => dbDetail.PartNo == asnDetail.PartNo
                                                         && dbDetail.Quantity == asnDetail.Quantity
                                                         && dbDetail.QuantityScan == asnDetail.QuantityScan
                                                         && dbDetail.QuantityRemain == asnDetail.QuantityRemain
                                                         && dbDetail.ActualReceivedId == actualReceived.ActualReceivedId);

                                await _hubContext.Clients.All.SendAsync("UpdateStorageColorDone", service.MapToActualReceivedTLIPDTO(actualReceived));

                            }*/
                        }
                    }
                }
            }
        }

        private async Task<List<AsnInformation>> ParseAsnInformationFromFileAsync()
        {
            // string filePath = @"F:\FU\Semester_5\PRN212\Self_Study\DS_RIG\RIG\demoTLIP.txt";
            string filePath = @"D:\Project Stock Delivery\RIG\RIG\demoTLIP.txt";
            var asnInformationList = new List<AsnInformation>();

            using (var reader = new StreamReader(filePath))
            {
                var fileContent = await reader.ReadToEndAsync();
                var jsonDocument = JsonDocument.Parse(fileContent);

                foreach (var element in jsonDocument.RootElement.GetProperty("data").GetProperty("result").EnumerateArray())
                {
                    var asnInformation = new AsnInformation
                    {
                        AsnNumber = element.GetProperty("asnNumber").GetString(),
                        DoNumber = element.GetProperty("doNumber").GetString(),
                        Invoice = element.GetProperty("invoice").GetString(),
                        SupplierCode = element.GetProperty("supplierCode").GetString(),
                        SupplierName = element.GetProperty("supplierName").GetString(),
                        EtaDate = element.GetProperty("etaDate").GetDateTime(),
                        EtaDateString = element.GetProperty("etaDateString").GetString(),
                        ReceiveStatus = element.GetProperty("receiveStatus").GetBoolean(),
                        IsCompleted = element.GetProperty("isCompleted").GetBoolean()
                    };

                    asnInformationList.Add(asnInformation);
                }
            }

            return asnInformationList;
        }

        private async Task<List<AsnDetailData>> ParseAsnDetailFromFile(string asnNumber, string doNumber, string invoice)
        {
            string filePath = @"D:\Project Stock Delivery\RIG\RIG\demoDetailTLIP.txt";
            //string filePath = @"F:\FU\Semester_5\PRN212\Self_Study\DS_RIG\RIG\demoDetailTLIP.txt";

            using (var reader = new StreamReader(filePath))
            {
                var fileContent = await reader.ReadToEndAsync();
                var jsonDocument = JsonDocument.Parse(fileContent);
                var asnDetailList = new List<AsnDetailData>();

                foreach (var element in jsonDocument.RootElement.GetProperty("data").GetProperty("result").EnumerateArray())
                {
                    // Check if the input parameters match the file data
                    var isMatching = (!string.IsNullOrEmpty(asnNumber) && element.GetProperty("asnNumber").GetString() == asnNumber) ||
                                     (string.IsNullOrEmpty(asnNumber) && !string.IsNullOrEmpty(doNumber) && element.GetProperty("doNumber").GetString() == doNumber) ||
                                     (string.IsNullOrEmpty(asnNumber) && string.IsNullOrEmpty(doNumber) && !string.IsNullOrEmpty(invoice) && element.GetProperty("invoice").GetString() == invoice);


                    if (isMatching)
                    {
                        asnDetailList.Add(new AsnDetailData
                        {
                            PartNo = element.GetProperty("partNo").GetString(),
                            AsnNumber = element.GetProperty("asnNumber").GetString(),
                            DoNumber = element.GetProperty("doNumber").GetString(),
                            Invoice = element.GetProperty("invoice").GetString(),
                            Quantity = element.GetProperty("quantiy").GetInt32(),
                            QuantityRemain = element.GetProperty("quantityRemain").GetInt32(),
                            QuantityScan = element.GetProperty("quantityScan").GetInt32(),
                            StockInStatus = element.GetProperty("stockInStatus").GetBoolean(),
                            StockInLocation = element.GetProperty("stockInLocation").GetString()
                        });
                    }
                }

                return asnDetailList;
            }
        }

        public async Task GetActualReceivedById(int actualReceivedId, ISchedulereceivedTLIPService service)
        {
            var actualReceivedList = await service.GetAllActualReceivedAsyncById(actualReceivedId);
            var actualReceivedDTO = actualReceivedList.Select(ar =>
            {
                return service.MapToActualReceivedTLIPDTO(ar);
            }).FirstOrDefault();
            if (actualReceivedDTO == null)
            {
                _logger.LogInformation("ActualReceivedDTO not found for ID: {ActualReceivedId}", actualReceivedId);
                return;
            }

            try
            {
                await _hubConnection.SendAsync("UpdateCalendar", actualReceivedDTO);
                _logger.LogInformation("Successfully sent UPDATE CALENDAR update to SignalR hub.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send lead time update to SignalR hub.");
            }
        }

    }
}
