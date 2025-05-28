document.addEventListener('DOMContentLoaded', async function () {
    const planDropdown = document.getElementById('planDropdown');
    const monthTripDropdown = document.getElementById('monthTripDropdown');
    const supplierDropdown = document.getElementById('supplierDropdown');
    const searchSupplierButton = document.getElementById('searchSupplierButton');

    // lấy tháng hiện tại
    var currentMonth = new Date().getMonth() + 1;
    monthTripDropdown.value = currentMonth;

    $(supplierDropdown).select2({
        placeholder: 'Chọn nhà cung cấp',
        allowClear: true
    }).val(null).trigger('change');


    // Dropdown plan được chọn
    planDropdown.addEventListener('change', async function () {
        const selectedPlanId = this.value;
        const selectedMonth = monthTripDropdown.value;
        const selectedSupplier = supplierDropdown.value;
        await fetchDataTripCount(selectedPlanId, selectedMonth, selectedSupplier);
        await fetchDataActualLeadTime(selectedPlanId, selectedMonth, selectedSupplier);
        await fetchDataLateDelivery(selectedPlanId, selectedMonth, selectedSupplier);
    });

    // Dropdown tháng được chọn
    monthTripDropdown.addEventListener('change', async function () {
        const selectedPlanId = planDropdown.value;
        const selectedMonth = this.value;
        const selectedSupplier = supplierDropdown.value;
        await fetchDataTripCount(selectedPlanId, selectedMonth, selectedSupplier);
        await fetchDataActualLeadTime(selectedPlanId, selectedMonth, selectedSupplier);
        await fetchDataLateDelivery(selectedPlanId, selectedMonth, selectedSupplier);
    });

    // Dropdown nhà cung cấp được chọn
    supplierDropdown.addEventListener('change', async function () {
        console.log("gọi supplierDropdown");
        const selectedPlanId = planDropdown.value;
        const selectedMonth = monthTripDropdown.value;
        const selectedSupplier = this.value;
        await fetchDataTripCount(selectedPlanId, selectedMonth, selectedSupplier);
        await fetchDataActualLeadTime(selectedPlanId, selectedMonth, selectedSupplier);
        await fetchDataLateDelivery(selectedPlanId, selectedMonth, selectedSupplier);
    });

    // Search button click event
    searchSupplierButton.addEventListener('click', async function () {
        const selectedPlanId = planDropdown.value;
        const selectedMonth = monthTripDropdown.value;
        const selectedSupplier = supplierDropdown.value;
        await fetchDataTripCount(selectedPlanId, selectedMonth, selectedSupplier);
        await fetchDataActualLeadTime(selectedPlanId, selectedMonth, selectedSupplier);
        await fetchDataLateDelivery(selectedPlanId, selectedMonth, selectedSupplier);
    });

    ///////////////////////////////////////////////////////
    ///////////////////////
    // Chart phụ dùng để cố định trục Y cho Trip Chart
    var ctxBarTripYAxis = document.getElementById('barChartTripYAxis').getContext('2d');
    var barChartTripYAxis = new Chart(ctxBarTripYAxis, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [
                 {
                    label: 'Kế hoạch',
                    data: [],
                     backgroundColor: 'rgba(0, 0, 0, 0)',
                     borderColor: 'rgba(0, 0, 0, 0)', 
                    borderWidth: 1,
                    barThickness: 30,
                    categoryPercentage: 0.8,
                    supplierNames: []
                },
                {
                    label: 'Thực tế',
                    data: [],
                    backgroundColor: 'rgba(0, 0, 0, 0)',
                    borderColor: 'rgba(0, 0, 0, 0)', 
                    borderWidth: 1,
                    barThickness: 30,
                    categoryPercentage: 0.8,
                    supplierNames: []
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    bottom: 102
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    afterFit: (ctx) => {
                        console.log("ctx: ", ctx);
                        ctx.width = 80;
                    },
                    title: {
                        display: true,
                        text: 'Tổng số chuyến',
                        align: 'end',
                        font: {
                            weight: 'bold'
                        },
                        rotation: 0
                    }
                },
                x: {
                    ticks: {
                        display: false
                    },
                    grid: {
                        drawTicks: false
                    },
                    title: {
                        display: true,
                        text: 'Nhà cung cấp',
                        align: 'start',
                        font: {
                            weight: 'bold'
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false // Hide the legend
                },
                tooltip: {
                    enabled: false // Disable tooltips
                }
            }
        }
    });

    // Biểu đồ tổng số chuyến
    ///////
    ////////////////////////////////////////////////////////
    var ctxBarTrip = document.getElementById('barChartTrip').getContext('2d');
    var barChartTrip = new Chart(ctxBarTrip, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Kế hoạch',
                    data: [],
                    backgroundColor: '#737373',
                    borderColor: '#737373',
                    borderWidth: 1,
                    barThickness: 30,
                    categoryPercentage: 0.8,
                    supplierNames: []
                },
                {
                    label: 'Thực tế',
                    data: [],
                    backgroundColor: '#00BF13',
                    borderColor: '#00BF13',
                    borderWidth: 1,
                    barThickness: 30,
                    categoryPercentage: 0.8,
                    supplierNames: []
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 10
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        display: false
                    }
                },
                x: {
                    beginAtZero: true,
                    ticks: {
                        autoSkip: false,
                        callback: function (value) {
                            var label = this.getLabelForValue(value);
                            return label.split(' ');
                        }
                    },
                    title: {
                        display: true,
                        text: 'Nhà cung cấp',
                        align: 'start',
                        font: {
                            weight: 'bold'
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let label = context.dataset.label || '';
                            let supplierName = context.dataset.supplierNames[context.dataIndex];

                            if (label) {
                                label += ` : ${supplierName} - `;
                            }
                            if (context.parsed.y !== null) {
                                label += `${context.parsed.y} chuyến`;
                            }
                            return `${label}`;
                        }
                    }
                }
            }
        }
    });

    async function fetchDataTripCount(planId, month, supplierCode) {
        // Construct the URL with optional supplierCode
        let url = `/TLIPWarehouse/GetCombinedTripCounts?planId=${planId}&month=${month}`;
        if (supplierCode !== null && supplierCode !== '') {
            url += `&supplierCode=${supplierCode}`;
        }

        const combinedResponse = await fetch(url);
        const combinedData = await combinedResponse.json();

        const labels = combinedData.map(item => item.SupplierName);
        const supplierNames = combinedData.map(item => item.SupplierCode);
        const planTrips = combinedData.map(item => item.TotalPlanTrips);
        const actualTrips = combinedData.map(item => item.TotalActualTrips);

        // Cập nhật khi chọn value từ dropdown
        barChartTrip.data.labels = labels;
        barChartTrip.data.datasets[0].data = planTrips;
        barChartTrip.data.datasets[0].supplierNames = supplierNames;
        barChartTrip.data.datasets[1].data = actualTrips;
        barChartTrip.data.datasets[1].supplierNames = supplierNames;
        barChartTrip.update();

        // Update the secondary bar chart with the same Y-axis data
        barChartTripYAxis.data.labels = labels;
        barChartTripYAxis.data.datasets[0].data = planTrips;
        barChartTripYAxis.data.datasets[1].data = actualTrips;
        barChartTripYAxis.update();

        const containerBodyTrip = document.querySelector('#barChartTrip').parentElement;
        if (barChartTrip.data.labels.length > 5) {
            containerBodyTrip.style.width = `${barChartTrip.data.labels.length * 100}px`;
        } else {
            containerBodyTrip.style.width = '100%';
        }
    }

    ///////////////////////////////////////////////////////
    ///////////////////////
    // Chart phụ dùng để cố định trục Y cho HanldeTime Chart
    var ctxBarHandleTimeYAxis = document.getElementById('barChartHandleTimeYAxis').getContext('2d');
    var barChartHandleTimeYAxis = new Chart(ctxBarHandleTimeYAxis, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [
               
                 {
                    label: 'Nhanh nhất',
                    data: [],
                    backgroundColor: 'rgba(0, 0, 0, 0)',
                    borderColor: 'rgba(0, 0, 0, 0)',
                    borderWidth: 1,
                    barThickness: 20,
                    categoryPercentage: 1,
                    barPercentage: 0,
                    supplierNames: []
                },
                {
                    label: 'Trung bình',
                    data: [],
                    backgroundColor: 'rgba(0, 0, 0, 0)',
                    borderColor: 'rgba(0, 0, 0, 0)',
                    borderWidth: 1,
                    barThickness: 20,
                    categoryPercentage: 1,
                    barPercentage: 0,
                    supplierNames: []
                },
                {
                    label: 'Lâu nhất',
                    data: [],
                    backgroundColor: 'rgba(0, 0, 0, 0)',
                    borderColor: 'rgba(0, 0, 0, 0)',
                    borderWidth: 1,
                    barThickness: 20,
                    categoryPercentage: 1,
                    barPercentage: 0,
                    supplierNames: []
                },
                {
                    label: 'Kế hoạch',
                    data: [],
                    backgroundColor: 'rgba(0, 0, 0, 0)',
                    borderColor: 'rgba(0, 0, 0, 0)',
                    borderWidth: 1,
                    barThickness: 20,
                    categoryPercentage: 1,
                    barPercentage: 0,
                    supplierNames: []
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    bottom: 102
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    afterFit: (ctx) => {
                        console.log("ctx: ", ctx);
                        ctx.width = 80;
                    },
                    title: {
                        display: true,
                        text: 'Tổng thời gian xử lý (phút)',
                        align: 'end',
                        font: {
                            weight: 'bold'
                        },
                        rotation: 0
                    }
                },
                x: {
                    ticks: {
                        display: false
                    },
                    grid: {
                        drawTicks: false
                    },
                    title: {
                        display: true,
                        text: 'Nhà cung cấp',
                        align: 'start',
                        font: {
                            weight: 'bold'
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false // Hide the legend
                },
                tooltip: {
                    enabled: false // Disable tooltips
                }
            }
        }
    });


    // Biểu đồ thời gian xử lý
    ///////
    ////////////////////////////////////////////////////////
    var ctxBarHandleTime = document.getElementById('barChartHandleTime').getContext('2d');
    var barChartHandleTime = new Chart(ctxBarHandleTime, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Nhanh nhất',
                    data: [],
                    backgroundColor: '#41B8D5',
                    borderColor: '#41B8D5',
                    borderWidth: 1,
                    barThickness: 20,
                    categoryPercentage: 1,
                    barPercentage: 0,
                    supplierNames: []
                },
                {
                    label: 'Trung bình',
                    data: [],
                    backgroundColor: '#FFBD59',
                    borderColor: '#FFBD59',
                    borderWidth: 1,
                    barThickness: 20,
                    categoryPercentage: 1,
                    barPercentage: 0,
                    supplierNames: []
                },
                {
                    label: 'Lâu nhất',
                    data: [],
                    backgroundColor: '#FF3131',
                    borderColor: '#FF3131',
                    borderWidth: 1,
                    barThickness: 20,
                    categoryPercentage: 1,
                    barPercentage: 0,
                    supplierNames: []
                },
                {
                    label: 'Kế hoạch',
                    data: [],
                    backgroundColor: '#737373',
                    borderColor: '#737373',
                    borderWidth: 1,
                    barThickness: 20,
                    categoryPercentage: 1,
                    barPercentage: 0,
                    supplierNames: []
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        display: false
                    }
                },
                x: {
                    beginAtZero: true,
                    ticks: {
                        autoSkip: false,
                        callback: function (value) {
                            var label = this.getLabelForValue(value);
                            return label.split(' ');
                        }
                    },
                    title: {
                        display: true,
                        text: 'Nhà cung cấp',
                        align: 'start',
                        font: {
                            weight: 'bold'
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let label = context.dataset.label || '';
                            let supplierName = context.dataset.supplierNames[context.dataIndex];
                            let timeInMinutes = context.parsed.y;
                            let timeInHHMMSS = convertToHHMMSS(timeInMinutes);

                            if (label) {
                                label += ` : ${supplierName} - `;
                            }
                            if (timeInMinutes !== null) {
                                label += `${timeInHHMMSS}`;
                            }
                            return `${label}`;
                        }
                    }
                }
            }
        }
    });
    // Helper function to convert minutes to HH:mm:ss
    const convertToHHMMSS = (minutes) => {
        const h = Math.floor(minutes / 60);
        const m = Math.floor(minutes % 60);
        const s = Math.round((minutes - Math.floor(minutes)) * 60);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    async function fetchDataActualLeadTime(planId, month, supplierCode) {

        let url = `/TLIPWarehouse/GetCombinedLeadTimeForChart?planId=${planId}&month=${month}`;
        if (supplierCode !== null && supplierCode !== '') {
            url += `&supplierCode=${supplierCode}`;
        }
        const combinedLeadTimeResponse = await fetch(url);

        const combinedLeadTimeData = await combinedLeadTimeResponse.json();

        const labels = combinedLeadTimeData.map(item => item.SupplierName);
        const supplierNames = combinedLeadTimeData.map(item => item.SupplierCode);

        // Helper function to convert HH:MM:SS to minutes
        const convertToMinutes = (time) => {
            const [hours, minutes, seconds] = time.split(':').map(Number);
            return (hours * 60) + minutes + (seconds / 60);
        };

        const planTrips = combinedLeadTimeData.map(item => convertToMinutes(item.PlanLeadTime));
        const fastestLeadTime = combinedLeadTimeData.map(item => convertToMinutes(item.FastestLeadTime));
        const averageLeadTime = combinedLeadTimeData.map(item => convertToMinutes(item.AverageLeadTime));
        const slowestLeadTime = combinedLeadTimeData.map(item => convertToMinutes(item.SlowestLeadTime));

        // Cập nhật khi chọn value từ dropdown
        barChartHandleTime.data.labels = labels;
        barChartHandleTime.data.datasets[0].data = fastestLeadTime;
        barChartHandleTime.data.datasets[0].supplierNames = supplierNames;
        barChartHandleTime.data.datasets[1].data = averageLeadTime;
        barChartHandleTime.data.datasets[1].supplierNames = supplierNames;
        barChartHandleTime.data.datasets[2].data = slowestLeadTime;
        barChartHandleTime.data.datasets[2].supplierNames = supplierNames;
        barChartHandleTime.data.datasets[3].data = planTrips;
        barChartHandleTime.data.datasets[3].supplierNames = supplierNames;
        barChartHandleTime.update();

        // Update the secondary bar chart with the same Y-axis data
        barChartHandleTimeYAxis.data.labels = labels;
        barChartHandleTimeYAxis.data.datasets[0].data = fastestLeadTime;
        barChartHandleTimeYAxis.data.datasets[1].data = averageLeadTime;
        barChartHandleTimeYAxis.data.datasets[2].data = slowestLeadTime;
        barChartHandleTimeYAxis.data.datasets[3].data = planTrips;
        barChartHandleTimeYAxis.update();

        const containerBodyTrip = document.querySelector('#barChartHandleTime').parentElement;
        if (barChartHandleTime.data.labels.length > 5) {
            containerBodyTrip.style.width = `${barChartHandleTime.data.labels.length * 100}px`;
        } else {
            containerBodyTrip.style.width = '100%';
        }
    }

    ///////////////////////////////////////////////////////
    ///////////////////////
    // Chart phụ dùng để cố định trục Y cho LateDelivery Chart
    var ctxBarDeliveryYAxis = document.getElementById('barChartDeliveryYAxis').getContext('2d');
    var barChartDeliveryYAxis = new Chart(ctxBarDeliveryYAxis, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Thực tế',
                    data: [],
                    backgroundColor: 'rgba(0, 0, 0, 0)',
                    borderColor: 'rgba(0, 0, 0, 0)',
                    borderWidth: 1,
                    barThickness: 30,
                    categoryPercentage: 1,
                    supplierNames: []
                },
                {
                    label: 'Bị trễ',
                    data: [],
                    backgroundColor: 'rgba(0, 0, 0, 0)',
                    borderColor: 'rgba(0, 0, 0, 0)',
                    borderWidth: 1,
                    barThickness: 30,
                    categoryPercentage: 1,
                    supplierNames: []
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    bottom: 102
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    afterFit: (ctx) => {
                        console.log("ctx: ", ctx);
                        ctx.width = 80;
                    },
                    title: {
                        display: true,
                        text: 'Số chuyến',
                        align: 'end',
                        font: {
                            weight: 'bold'
                        },
                        rotation: 0
                    }
                },
                x: {
                    ticks: {
                        display: false
                    },
                    grid: {
                        drawTicks: false
                    },
                    title: {
                        display: true,
                        text: 'Nhà cung cấp',
                        align: 'start',
                        font: {
                            weight: 'bold'
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false // Hide the legend
                },
                tooltip: {
                    enabled: false // Disable tooltips
                }
            }
        }
    });


    // Biểu đồ tỷ lệ giao hàng đúng (trễ)
    ///////
    ////////////////////////////////////////////////////////
    var ctxBarDelivery = document.getElementById('barChartDelivery').getContext('2d');
    var barChartDelivery = new Chart(ctxBarDelivery, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Thực tế',
                    data: [],
                    backgroundColor: '#00BF63',
                    borderColor: '#00BF63',
                    borderWidth: 1,
                    barThickness: 30,
                    categoryPercentage: 1,
                    supplierNames: []
                },
                {
                    label: 'Bị trễ',
                    data: [],
                    backgroundColor: '#FFDE59',
                    borderColor: '#FFDE59',
                    borderWidth: 1,
                    barThickness: 30,
                    categoryPercentage: 1,
                    supplierNames: []
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 10
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        autoSkip: false,
                        callback: function (value) {
                            var label = this.getLabelForValue(value);
                            return label.split(' ');
                        },
                        rotation: 0
                    },
                    title: {
                        display: true,
                        text: 'Nhà cung cấp',
                        align: 'start',
                        font: {
                            weight: 'bold'
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let label = context.dataset.label || '';
                            let supplierName = context.dataset.supplierNames[context.dataIndex];

                            if (label) {
                                label += `: ${supplierName} - `;
                            }
                            if (context.parsed.y !== null) {
                                label += `${context.parsed.y} chuyến`;
                            }
                            return `${label}`;
                        }
                    }
                }
            }
        }
    });

    async function fetchDataLateDelivery(planId, month, supplierCode) {

        let url = `/TLIPWarehouse/GetCombinedLateDeliveryForChart?planId=${planId}&month=${month}`;
        if (supplierCode !== null && supplierCode !== '') {
            url += `&supplierCode=${supplierCode}`;
        }

        const combinedResponse = await fetch(url);

        const combinedData = await combinedResponse.json();

        const labels = combinedData.map(item => item.SupplierName);
        const supplierNames = combinedData.map(item => item.SupplierCode);
        const actualTrips = combinedData.map(item => item.ActualTripCount);
        const lateTrips = combinedData.map(item => item.LateDeliveries);

        // Cập nhật khi chọn value từ dropdown
        barChartDelivery.data.labels = labels;
        barChartDelivery.data.datasets[0].data = actualTrips;
        barChartDelivery.data.datasets[0].supplierNames = supplierNames;
        barChartDelivery.data.datasets[1].data = lateTrips;
        barChartDelivery.data.datasets[1].supplierNames = supplierNames;
        barChartDelivery.update();



        // Update the secondary bar chart with the same Y-axis data
        barChartDeliveryYAxis.data.labels = labels;
        barChartDeliveryYAxis.data.datasets[0].data = actualTrips;
        barChartDeliveryYAxis.data.datasets[1].data = lateTrips;
        barChartDeliveryYAxis.update();

        const containerBodyDelivery = document.querySelector('#barChartDelivery').parentElement;
        if (barChartTrip.data.labels.length > 5) {
            containerBodyDelivery.style.width = `${barChartDelivery.data.labels.length * 100}px`;
        } else {
            containerBodyDelivery.style.width = '100%';
        }
    }

    if (planDropdown.value && monthTripDropdown.value) {
        await fetchDataTripCount(planDropdown.value, monthTripDropdown.value, supplierDropdown.value);
        await fetchDataActualLeadTime(planDropdown.value, monthTripDropdown.value, supplierDropdown.value);
        await fetchDataLateDelivery(planDropdown.value, monthTripDropdown.value, supplierDropdown.value);
    }
});
