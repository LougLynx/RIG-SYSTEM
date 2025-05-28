using Manage_Receive_Issues_Goods.Repositories.Implementations;
using Manage_Receive_Issues_Goods.Services;
using Manage_Receive_Issues_Goods.Models;
using Microsoft.EntityFrameworkCore;
using DataFetchingWorkerService;
using Manage_Receive_Issues_Goods.Repository;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using log4net;
using log4net.Config;
using Serilog;
using System.IO;

// Cấu hình log4net
var logRepository = LogManager.GetRepository(System.Reflection.Assembly.GetEntryAssembly());
XmlConfigurator.Configure(logRepository, new FileInfo("log4net.config"));

ILog log = LogManager.GetLogger(typeof(Program));

try
{
    // Cấu hình Serilog
    Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Override("Microsoft.EntityFrameworkCore.Database.Command", Serilog.Events.LogEventLevel.Warning) // Bỏ log SQL
    .MinimumLevel.Override("Microsoft.EntityFrameworkCore.Infrastructure", Serilog.Events.LogEventLevel.Warning) // Bỏ log cơ sở hạ tầng EF Core
    .WriteTo.Console()
    .WriteTo.File(
        Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "RIGDataFetchingService.log"),
        rollingInterval: RollingInterval.Day, // tách file log theo ngày 
        retainedFileCountLimit: 7 // giới hạn 7 ngày thì xóa file log cũ
    )
    .CreateLogger();

    log.Info("Starting Worker Service setup...");
    var builder = Host.CreateDefaultBuilder(args)
        .UseWindowsService(options =>
        {
            // Tên của Windows Service
            options.ServiceName = "RIGDataFetchingService";
        })
        .UseSerilog() // Tích hợp Serilog vào hệ thống logging
        .ConfigureAppConfiguration((hostingContext, config) =>
        {
            var env = hostingContext.HostingEnvironment;

            // Đường dẫn đến SharedConfig
            var sharedConfigPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "SharedConfig", "sharedappsettings.json");

            if (!File.Exists(sharedConfigPath))
            {
                throw new FileNotFoundException($"Configuration file '{sharedConfigPath}' not found.");
            }

            // Thêm các file cấu hình
            config
                .AddJsonFile(sharedConfigPath, optional: false, reloadOnChange: true)
                .AddJsonFile("appsettings.json", optional: true, reloadOnChange: true)
                .AddEnvironmentVariables();
        })
        .ConfigureServices((context, services) =>
        {
            // Chuỗi kết nối
            var connectionString = context.Configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

            services.AddDbContext<RigContext>(options =>
                options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

            // Đăng ký repository và service
            services.AddHttpClient();
            services.AddScoped<ISchedulereceivedTLIPRepository, SchedulereceivedTLIPRepository>();
            services.AddScoped<ISchedulereceivedTLIPService, SchedulereceivedTLIPService>();

            // Đăng ký Worker Service
            services.AddHostedService<DataTLIPWorker>();
        })
        .ConfigureLogging(logging =>
        {
            logging.ClearProviders();
            logging.AddSerilog(); // Thêm Serilog vào hệ thống logging
            logging.AddConsole();
        });

    var host = builder.Build();

    log.Info("Worker Service is starting...");
    Log.Information("Starting RIGDataFetchingService..."); // Serilog log
    await host.RunAsync();
    log.Info("Worker Service started successfully.");
    Log.Information("RIGDataFetchingService started successfully.");
}
catch (Exception ex)
{
    log.Fatal("Worker Service failed to start.", ex);
    Log.Fatal(ex, "RIGDataFetchingService failed to start.");
    throw;
}
finally
{
    // Đảm bảo Serilog được đóng khi ứng dụng kết thúc
    Log.CloseAndFlush();
}