document.addEventListener('DOMContentLoaded', async function () {
    const planDropdown = document.getElementById('planDropdown');
    const monthTripDropdown = document.getElementById('monthTripDropdown');
    const driverDropdown = document.getElementById('driverDropdown');
    const searchDriverButton = document.getElementById('searchDriverButton');
    const plandetailDropdown = document.getElementById('plandetailDropdown');

    // lấy tháng hiện tại
    var currentMonth = new Date().getMonth() + 1;
    monthTripDropdown.value = currentMonth;

    $(driverDropdown).select2({
        placeholder: 'Chọn lái xe',
        allowClear: true
    }).val(null).trigger('change');


    // Dropdown plan được chọn
    planDropdown.addEventListener('change', async function () {
        const selectedPlanId = this.value;
        const selectedMonth = monthTripDropdown.value;
        const selectedDriver = driverDropdown.value;
        const selectedTrip = plandetailDropdown.value;

        await fetchPlanDetails(selectedPlanId);
        await fetchDataActualDeliveryTimeForUser(selectedPlanId, selectedMonth, selectedDriver);
        await fetchDataActualDeliveryTimeForTrip(selectedPlanId, selectedMonth, selectedTrip);
    });
    // Fetch plan details based on selected plan
    async function fetchPlanDetails(planId) {
        const response = await fetch(`/RDTD/GetCurrentPlanDetail?planId=${planId}`);
        const data = await response.json();
        plandetailDropdown.innerHTML = '<option value="">Chọn chuyến</option>';
        data.forEach(detail => {
            const option = document.createElement('option');
            option.value = detail.PlanDetailId;
            option.textContent = detail.PlanDetailName;
            plandetailDropdown.appendChild(option);
        });
    }

    // Dropdown tháng được chọn
    monthTripDropdown.addEventListener('change', async function () {
        const selectedPlanId = planDropdown.value;
        const selectedMonth = this.value;
        const selectedDriver = driverDropdown.value;
        const selectedTrip = plandetailDropdown.value;

        await fetchDataActualDeliveryTimeForUser(selectedPlanId, selectedMonth, selectedDriver);
        await fetchDataActualDeliveryTimeForTrip(selectedPlanId, selectedMonth, selectedTrip);

    });

    // Dropdown nhà cung cấp được chọn
    driverDropdown.addEventListener('change', async function () {
        console.log("gọi driverDropdown");
        const selectedPlanId = planDropdown.value;
        const selectedMonth = monthTripDropdown.value;
        const selectedDriver = this.value;


        await fetchDataActualDeliveryTimeForUser(selectedPlanId, selectedMonth, selectedDriver);
    });

    // Search button click event
    searchDriverButton.addEventListener('click', async function () {
        const selectedPlanId = planDropdown.value;
        const selectedMonth = monthTripDropdown.value;
        const selectedDriver = driverDropdown.value;

        await fetchDataActualDeliveryTimeForUser(selectedPlanId, selectedMonth, selectedDriver);
    });


    ///////////////////////////////////////////////////////
    ///////////////////////
    // Chart phụ dùng để cố định trục Y cho Driver Chart
    var ctxBarDeliveryTimeUserYAxis = document.getElementById('barChartDeliveryTimeUserYAxis').getContext('2d');
    var barChartDeliveryTimeUserYAxis = new Chart(ctxBarDeliveryTimeUserYAxis, {
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
                    driver: []
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
                    driver: []
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
                    driver: []
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
                        text: 'Thời gian giao hàng',
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
                        text: 'Lái xe',
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



    // Biểu đồ thời gian giao hàng của lái xe
    ///////
    ////////////////////////////////////////////////////////
    var ctxBarDeliveryTime = document.getElementById('barChartDeliveryTimeUser').getContext('2d');
    var barChartDeliveryTimeUser = new Chart(ctxBarDeliveryTime, {
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
                    driver: []
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
                    driver: []
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
                    driver: []
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
                        text: 'Lái Xe:',
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
                            let driver = context.dataset.driver[context.dataIndex];
                            let timeInMinutes = context.parsed.y;
                            let timeInHHMMSS = convertToHHMMSS(timeInMinutes);

                            
                            if (timeInMinutes !== null) {
                                label += ` - ${timeInHHMMSS}`;
                            }
                            return `${label}`;
                        }
                    }
                }
            }
        }
    });

    async function fetchDataActualDeliveryTimeForUser(planId, month, driverId) {
        console.log("gọi fetchDataActualDeliveryTimeForUser");
        let url = `/RDTD/GetCombinedDeliveryTimeByUserForChart?planId=${planId}&month=${month}`;
        if (driverId !== null && driverId !== '') {
            url += `&userId=${driverId}`;
        }
        const combinedLeadTimeResponse = await fetch(url);

        const combinedLeadTimeData = await combinedLeadTimeResponse.json();
        console.log(combinedLeadTimeData);
        const labels = combinedLeadTimeData.map(item => item.UserName);
        console.log("Label: ", labels);
        const driverNames = combinedLeadTimeData.map(item => item.UserName);
        console.log("driverNames: ", driverNames);

        // Helper function to convert HH:MM:SS to minutes
        const convertToMinutes = (time) => {
            const [hours, minutes, seconds] = time.split(':').map(Number);
            return (hours * 60) + minutes + (seconds / 60);
        };

        const fastestDeliveryTime = combinedLeadTimeData.map(item => convertToMinutes(item.FastestDeliveryTime));
        const averageDeliveryTime = combinedLeadTimeData.map(item => convertToMinutes(item.AverageDeliveryTime));
        const slowestDeliveryTime = combinedLeadTimeData.map(item => convertToMinutes(item.SlowestDeliveryTime));

        // Cập nhật khi chọn value từ dropdown
        barChartDeliveryTimeUser.data.labels = labels;
        barChartDeliveryTimeUser.data.datasets[0].data = fastestDeliveryTime;
        barChartDeliveryTimeUser.data.datasets[0].driverNames = driverNames;
        barChartDeliveryTimeUser.data.datasets[1].data = averageDeliveryTime;
        barChartDeliveryTimeUser.data.datasets[1].driverNames = driverNames;
        barChartDeliveryTimeUser.data.datasets[2].data = slowestDeliveryTime;
        barChartDeliveryTimeUser.data.datasets[2].driverNames = driverNames;
        barChartDeliveryTimeUser.update();

        // Update the secondary bar chart with the same Y-axis data
        barChartDeliveryTimeUserYAxis.data.labels = labels;
        barChartDeliveryTimeUserYAxis.data.datasets[0].data = fastestDeliveryTime;
        barChartDeliveryTimeUserYAxis.data.datasets[1].data = averageDeliveryTime;
        barChartDeliveryTimeUserYAxis.data.datasets[2].data = slowestDeliveryTime;
        barChartDeliveryTimeUserYAxis.update();

        const containerBodyTrip = document.querySelector('#barChartDeliveryTimeUser').parentElement;
        if (barChartDeliveryTimeUser.data.labels.length > 5) {
            containerBodyTrip.style.width = `${barChartDeliveryTimeUser.data.labels.length * 100}px`;
        } else {
            containerBodyTrip.style.width = '100%';
        }
    }


    ///////////////////////////////////////////////////////
    ///////////////////////
    // Chart phụ dùng để cố định trục Y cho Trip Chart
    var ctxBarDeliveryTimeTripYAxis = document.getElementById('barChartDeliveryTimeTripYAxis').getContext('2d');
    var barChartDeliveryTimeTripYAxis = new Chart(ctxBarDeliveryTimeTripYAxis, {
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
                    driver: []
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
                    driver: []
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
                    driver: []
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
                        text: 'Thời gian giao hàng',
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
                        text: 'Chuyến xe',
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


    // Biểu đồ thời gian giao hàng của từng chuyến
    ///////
    ////////////////////////////////////////////////////////
    var ctxBarDeliveryTimeTrip = document.getElementById('barChartDeliveryTimeTrip').getContext('2d');
    var barChartDeliveryTimeTrip = new Chart(ctxBarDeliveryTimeTrip, {
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
                    driver: []
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
                    driver: []
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
                    driver: []
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
                        text: 'Chuyến hàng:',
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
                            let driver = context.dataset.driver[context.dataIndex];
                            let timeInMinutes = context.parsed.y;
                            let timeInHHMMSS = convertToHHMMSS(timeInMinutes);


                            if (timeInMinutes !== null) {
                                label += ` - ${timeInHHMMSS}`;
                            }
                            return `${label}`;
                        }
                    }
                }
            }
        }
    });

    async function fetchDataActualDeliveryTimeForTrip(planId, month, planDetailId) {
        let url = `/RDTD/GetCombinedDeliveryTimeByTripForChart?planId=${planId}&month=${month}`;
        if (planDetailId !== null && planDetailId !== '') {
            url += `&planDetailId=${planDetailId}`;
        }
        const combinedLeadTimeResponse = await fetch(url);

        const combinedLeadTimeData = await combinedLeadTimeResponse.json();
        const labels = combinedLeadTimeData.map(item => item.PlanDetailName);
        const driverNames = combinedLeadTimeData.map(item => item.PlanDetailName);

        // Helper function to convert HH:MM:SS to minutes
        const convertToMinutes = (time) => {
            const [hours, minutes, seconds] = time.split(':').map(Number);
            return (hours * 60) + minutes + (seconds / 60);
        };

        const fastestDeliveryTime = combinedLeadTimeData.map(item => convertToMinutes(item.FastestDeliveryTime));
        const averageDeliveryTime = combinedLeadTimeData.map(item => convertToMinutes(item.AverageDeliveryTime));
        const slowestDeliveryTime = combinedLeadTimeData.map(item => convertToMinutes(item.SlowestDeliveryTime));

        // Cập nhật khi chọn value từ dropdown
        barChartDeliveryTimeTrip.data.labels = labels;
        barChartDeliveryTimeTrip.data.datasets[0].data = fastestDeliveryTime;
        barChartDeliveryTimeTrip.data.datasets[0].driverNames = driverNames;
        barChartDeliveryTimeTrip.data.datasets[1].data = averageDeliveryTime;
        barChartDeliveryTimeTrip.data.datasets[1].driverNames = driverNames;
        barChartDeliveryTimeTrip.data.datasets[2].data = slowestDeliveryTime;
        barChartDeliveryTimeTrip.data.datasets[2].driverNames = driverNames;
        barChartDeliveryTimeTrip.update();

        // Update the secondary bar chart with the same Y-axis data
        barChartDeliveryTimeTripYAxis.data.labels = labels;
        barChartDeliveryTimeTripYAxis.data.datasets[0].data = fastestDeliveryTime;
        barChartDeliveryTimeTripYAxis.data.datasets[1].data = averageDeliveryTime;
        barChartDeliveryTimeTripYAxis.data.datasets[2].data = slowestDeliveryTime;
        barChartDeliveryTimeTripYAxis.update();


        const containerBodyTrip = document.querySelector('#barChartDeliveryTimeTrip').parentElement;
        if (barChartDeliveryTimeTrip.data.labels.length > 5) {
            containerBodyTrip.style.width = `${barChartDeliveryTimeTrip.data.labels.length * 100}px`;
        } else {
            containerBodyTrip.style.width = '100%';
        }
    }

    if (planDropdown.value && monthTripDropdown.value) {
        await fetchDataActualDeliveryTimeForUser(planDropdown.value, monthTripDropdown.value, driverDropdown.value);
        await fetchDataActualDeliveryTimeForTrip(planDropdown.value, monthTripDropdown.value, plandetailDropdown.value);

    }
    // Gọi hàm fetchPlanDetails khi trang được tải lần đầu tiên
    if (planDropdown.value) {
        await fetchPlanDetails(planDropdown.value);
    }


    // Helper function to convert minutes to HH:mm:ss
    const convertToHHMMSS = (minutes) => {
        const h = Math.floor(minutes / 60);
        const m = Math.floor(minutes % 60);
        const s = Math.round((minutes - Math.floor(minutes)) * 60);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };
  

});
