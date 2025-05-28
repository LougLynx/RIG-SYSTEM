using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Pomelo.EntityFrameworkCore.MySql.Scaffolding.Internal;

namespace Manage_Receive_Issues_Goods.Models;

public partial class RigContext : IdentityDbContext
{
    public RigContext()
    {
    }

    public RigContext(DbContextOptions<RigContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Actualdetailtlip> Actualdetailtlips { get; set; }

    public virtual DbSet<Actualreceivedtlip> Actualreceivedtlips { get; set; }

    public virtual DbSet<Actualsissuetlip> Actualsissuetlips { get; set; }

    public virtual DbSet<Actualsreceivedenso> Actualsreceivedensos { get; set; }

    public virtual DbSet<Aspnetrole> Aspnetroles { get; set; }

    public virtual DbSet<Aspnetroleclaim> Aspnetroleclaims { get; set; }

    public virtual DbSet<Aspnetuser> Aspnetusers { get; set; }

    public virtual DbSet<Aspnetuserclaim> Aspnetuserclaims { get; set; }

    public virtual DbSet<Aspnetuserlogin> Aspnetuserlogins { get; set; }

    public virtual DbSet<Aspnetusertoken> Aspnetusertokens { get; set; }

    public virtual DbSet<Efmigrationshistory> Efmigrationshistories { get; set; }

    public virtual DbSet<Historyplanreceivedtlip> Historyplanreceivedtlips { get; set; }

    public virtual DbSet<Plandetailreceivedtlip> Plandetailreceivedtlips { get; set; }

    public virtual DbSet<Planrdtd> Planrdtds { get; set; }

    public virtual DbSet<Planrdtddetail> Planrdtddetails { get; set; }

    public virtual DbSet<Planreceivetlip> Planreceivetlips { get; set; }

    public virtual DbSet<Supplier> Suppliers { get; set; }

    public virtual DbSet<Tagnamereceivetlip> Tagnamereceivetlips { get; set; }

    public virtual DbSet<Weekday> Weekdays { get; set; }
    public virtual DbSet<DelayReceivedTLIP> DelayReceivedTLIPs { get; set; }
    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        // Xây dựng ConfigurationBuilder để trỏ đến file sharedappsettings.json
        var sharedConfigPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "SharedConfig", "sharedappsettings.json");
        if (!File.Exists(sharedConfigPath))
        {
            throw new FileNotFoundException($"Configuration file '{sharedConfigPath}' not found.");
        }

        var builder = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile(sharedConfigPath, optional: false, reloadOnChange: true); // Sử dụng sharedappsettings.json

        IConfiguration configuration = builder.Build();

        // Lấy chuỗi kết nối từ sharedappsettings.json
        var connectionString = configuration.GetConnectionString("DefaultConnection");

        if (string.IsNullOrEmpty(connectionString))
        {
            throw new InvalidOperationException("Connection string 'DefaultConnection' not found in sharedappsettings.json.");
        }

        // Cấu hình DbContext sử dụng MySQL với chuỗi kết nối từ sharedappsettings.json
        optionsBuilder.UseMySql(connectionString, new MySqlServerVersion(new Version(8, 0, 21))); // Thay đổi phiên bản MySQL phù hợp
    }
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder
            .UseCollation("utf8mb4_0900_ai_ci")
            .HasCharSet("utf8mb4");

        modelBuilder.Entity<Actualdetailtlip>(entity =>
        {
            entity.HasKey(e => e.ActualDetailId).HasName("PRIMARY");

            entity.Property(e => e.StockInStatus).HasDefaultValueSql("'0'");

            entity.HasOne(d => d.ActualReceived).WithMany(p => p.Actualdetailtlips)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("actualdetailtlip_ibfk_1");
        });

        modelBuilder.Entity<Actualreceivedtlip>(entity =>
        {
            entity.HasKey(e => e.ActualReceivedId).HasName("PRIMARY");

            entity.HasOne(d => d.Plan).WithMany(p => p.Actualreceivedtlips)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_actualreceivedtlip_planreceivetlip");

            entity.HasOne(d => d.SupplierCodeNavigation).WithMany(p => p.Actualreceivedtlips)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("actualreceivedtlip_ibfk_1");
        });

        modelBuilder.Entity<Actualsissuetlip>(entity =>
        {
            entity.HasKey(e => e.ActualId).HasName("PRIMARY");

            entity.HasOne(d => d.PlanDetail).WithMany(p => p.Actualsissuetlips).HasConstraintName("actualsissuetlip_ibfk_1");

            entity.HasOne(d => d.User).WithMany(p => p.Actualsissuetlips).HasConstraintName("actualsissuetlip_ibfk_2");
        });

        modelBuilder.Entity<Actualsreceivedenso>(entity =>
        {
            entity.HasKey(e => e.ActualId).HasName("PRIMARY");

            entity.HasOne(d => d.PlanDetail).WithMany(p => p.Actualsreceivedensos).HasConstraintName("actualsreceivedenso_ibfk_1");

            entity.HasOne(d => d.User).WithMany(p => p.Actualsreceivedensos).HasConstraintName("actualsreceivedenso_ibfk_2");
        });

        modelBuilder.Entity<Aspnetrole>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");
        });

        modelBuilder.Entity<Aspnetroleclaim>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.HasOne(d => d.Role).WithMany(p => p.Aspnetroleclaims).HasConstraintName("FK_AspNetRoleClaims_AspNetRoles_RoleId");
        });

        modelBuilder.Entity<Aspnetuser>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.HasMany(d => d.Roles).WithMany(p => p.Users)
                .UsingEntity<Dictionary<string, object>>(
                    "Aspnetuserrole",
                    r => r.HasOne<Aspnetrole>().WithMany()
                        .HasForeignKey("RoleId")
                        .HasConstraintName("FK_AspNetUserRoles_AspNetRoles_RoleId"),
                    l => l.HasOne<Aspnetuser>().WithMany()
                        .HasForeignKey("UserId")
                        .HasConstraintName("FK_AspNetUserRoles_AspNetUsers_UserId"),
                    j =>
                    {
                        j.HasKey("UserId", "RoleId")
                            .HasName("PRIMARY")
                            .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0 });
                        j.ToTable("aspnetuserroles");
                        j.HasIndex(new[] { "RoleId" }, "IX_AspNetUserRoles_RoleId");
                    });
        });

        modelBuilder.Entity<Aspnetuserclaim>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.HasOne(d => d.User).WithMany(p => p.Aspnetuserclaims).HasConstraintName("FK_AspNetUserClaims_AspNetUsers_UserId");
        });

        modelBuilder.Entity<Aspnetuserlogin>(entity =>
        {
            entity.HasKey(e => new { e.LoginProvider, e.ProviderKey })
                .HasName("PRIMARY")
                .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0 });

            entity.HasOne(d => d.User).WithMany(p => p.Aspnetuserlogins).HasConstraintName("FK_AspNetUserLogins_AspNetUsers_UserId");
        });

        modelBuilder.Entity<Aspnetusertoken>(entity =>
        {
            entity.HasKey(e => new { e.UserId, e.LoginProvider, e.Name })
                .HasName("PRIMARY")
                .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0, 0 });

            entity.HasOne(d => d.User).WithMany(p => p.Aspnetusertokens).HasConstraintName("FK_AspNetUserTokens_AspNetUsers_UserId");
        });

        modelBuilder.Entity<Efmigrationshistory>(entity =>
        {
            entity.HasKey(e => e.MigrationId).HasName("PRIMARY");
        });

        modelBuilder.Entity<Historyplanreceivedtlip>(entity =>
        {
            entity.HasKey(e => e.HistoryId).HasName("PRIMARY");

            entity.HasOne(d => d.ActualReceived).WithMany(p => p.Historyplanreceivedtlips).HasConstraintName("historyplanreceivedtlip_ibfk_2");

            entity.HasOne(d => d.PlanDetail).WithMany(p => p.Historyplanreceivedtlips).HasConstraintName("historyplanreceivedtlip_ibfk_1");
        });

        modelBuilder.Entity<Plandetailreceivedtlip>(entity =>
        {
            entity.HasKey(e => e.PlanDetailId).HasName("PRIMARY");

            entity.HasOne(d => d.Plan).WithMany(p => p.Plandetailreceivedtlips)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("plandetailreceivedtlip_ibfk_3");

            entity.HasOne(d => d.SupplierCodeNavigation).WithMany(p => p.Plandetailreceivedtlips)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("plandetailreceivedtlip_ibfk_1");

            entity.HasOne(d => d.Weekday).WithMany(p => p.Plandetailreceivedtlips)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("plandetailreceivedtlip_ibfk_2");
        });

        modelBuilder.Entity<Planrdtd>(entity =>
        {
            entity.HasKey(e => e.PlanId).HasName("PRIMARY");
        });

        modelBuilder.Entity<Planrdtddetail>(entity =>
        {
            entity.HasKey(e => e.PlanDetailId).HasName("PRIMARY");

            entity.HasOne(d => d.Plan).WithMany(p => p.Planrdtddetails).HasConstraintName("planrdtddetails_ibfk_1");
        });

        modelBuilder.Entity<Planreceivetlip>(entity =>
        {
            entity.HasKey(e => e.PlanId).HasName("PRIMARY");
        });

        modelBuilder.Entity<Supplier>(entity =>
        {
            entity.HasKey(e => e.SupplierCode).HasName("PRIMARY");
        });

        modelBuilder.Entity<Tagnamereceivetlip>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");
        });

        modelBuilder.Entity<Weekday>(entity =>
        {
            entity.HasKey(e => e.WeekdayId).HasName("PRIMARY");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
