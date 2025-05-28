/*document.addEventListener('DOMContentLoaded', function () {
    var calendarEl = document.getElementById('calendar');

    const notificationConnection = new signalR.HubConnectionBuilder()
        .withUrl("/updateReceiveTLIPHub")
        .build();
    notificationConnection.start().then(function () {
        console.log("SignalR connected.");
    }).catch(function (err) {
        console.error("Failed to connect SignalR: ", err.toString());
    });


    notificationConnection.on("UpdateCalendar", function (actualReceived) {
        if (actualReceived && typeof actualReceived === 'object' && !Array.isArray(actualReceived)) {
            console.log("Received update via SignalR:", actualReceived);

            actualReceived = convertToPascalCase(actualReceived);
            console.log("actualReceived after parse:", actualReceived);

            try {
                updateActualReceivedList();
                console.log("updateActualReceivedList executed successfully.");
            } catch (error) {
                console.error("Error in updateActualReceivedList:", error);
            }

            try {
                loadSuppliersForToday();
                console.log("loadSuppliersForToday executed successfully.");
            } catch (error) {
                console.error("Error in loadSuppliersForToday:", error);
            }
            toastr.info(`Chuyến hàng của ${actualReceived.SupplierName} đã đến`, "Update thông tin ", {
                timeOut: 10000,
                extendedTimeOut: 0,
                closeButton: true,
                positionClass: 'toast-top-right',
                onclick: function () {
                    const formattedStart = new Date(actualReceived.ActualDeliveryTime).toLocaleString('vi-VN', {
                        timeZone: 'UTC',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                    });

                    const eventDetails = `
             <strong>Nhà cung cấp:</strong> ${actualReceived.SupplierName} - ${actualReceived.SupplierCode}<br>
             <i><strong>ASN Number:</strong></i> ${actualReceived.AsnNumber}<br>
             <i><strong>DO Number:</strong></i> ${actualReceived.DoNumber}<br>
            <i><strong>Invoice:</strong></i> ${actualReceived.Invoice}<br>
            <i><strong>Nhận lúc:</strong></i> ${formattedStart}`;

                    fetchAndPopulateStagesTable(actualReceived.ActualReceivedId);
                    const eventDetailsElement = document.getElementById(`eventDetails-${actualReceived.ActualReceivedId}`);
                    eventDetailsElement.innerHTML = eventDetails;

                    // Show the modal corresponding to actualReceived
                    var modalId = `#eventModal-${actualReceived.ActualReceivedId}`;
                    $(modalId).modal('show');
                }
            });


            try {
                updateCalendarEvent(actualReceived);
                console.log("updateCalendarEvent executed successfully.");
            } catch (error) {
                console.error("Error in updateCalendarEvent:", error);
            }
        } else {
            console.error("actualReceived is not a valid object:", actualReceived);
        }
    });

    notificationConnection.on("ErrorReceived", function (actualReceivedId, supplierName, isCompleted) {
        let event = calendar.getEventById(`actual-${actualReceivedId}`);
        if (event) {
            event.setProp('backgroundColor', '#B80000');
        } else {
            console.error(`Event with ID actual-${actualReceivedId} not found.`);
        }
        if (!isCompleted) {
            toastr.error(`Chuyến hàng của ${supplierName} đã có lỗi`, "Update thông tin ", {
                timeOut: 10000,
                extendedTimeOut: 0,
                closeButton: true,
                positionClass: 'toast-top-right',
                onHidden: function () {
                    notificationDismissed = true;
                    clearInterval(notificationInterval);
                }
            });
        }
    });

    notificationConnection.on("UpdateLeadtime", function (actualReceived) {
        console.log("Received update leadtime via SignalR:", actualReceived);
        actualReceived = convertToPascalCase(actualReceived);
        console.log("Received update after parse:", actualReceived);
        updateCalendarEvent(actualReceived);
    });

    notificationConnection.on("UpdateColorDone", function (actualReceivedId) {
        let event = calendar.getEventById(`actual-${actualReceivedId}`);
        if (event) {
            event.setProp('backgroundColor', '#3E7D3E');
        } else {
            console.error(`Event with ID actual-${actualReceivedId} not found.`);
        }
    });

    function convertToPascalCase(obj) {
        if (Array.isArray(obj)) {
            return obj.map(item => convertToPascalCase(item));
        } else if (obj !== null && obj.constructor === Object) {
            return Object.keys(obj).reduce((acc, key) => {
                const pascalCaseKey = key.charAt(0).toUpperCase() + key.slice(1);
                acc[pascalCaseKey] = convertToPascalCase(obj[key]);
                return acc;
            }, {});
        }
        return obj;
    }


    function updateActualReceivedList() {
        getActualReceived().then(function (data) {
            var modalsContainer = $('#modalsContainer');
            modalsContainer.empty();

            data.forEach(function (actualReceived) {
                var modalId = 'eventModal-' + actualReceived.ActualReceivedId;
                var progressBarId = 'progressBar-' + actualReceived.ActualReceivedId;
                var modalHtml = `
                        <div class="modal fade" id="${modalId}" tabindex="-1" aria-labelledby="eventModalLabel" aria-hidden="true" data-actual="">
                            <div class="modal-dialog modal-lg">
                                <div class="modal-content">
                                    <div class="modal-header">
                                        <h5 class="modal-title" id="eventModalLabel"><strong>Chi tiết chuyến hàng</strong></h5>
                                    </div>
                                    <div class="modal-body">
                                        <p id="eventDetails-${actualReceived.ActualReceivedId}"></p>
                                        	<div class="row justify-content-center"> 
                                        <h5 class="modal-title" id="completionPercentage-${actualReceived.ActualReceivedId}"></h5>
                                        <div class="container"> 
                                        <div class="progress">
                                            <div id="${progressBarId}" class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%"></div>
                                        </div>
                                        <table id="stagesTable-${actualReceived.ActualReceivedId}" class="table table-bordered">
                                            <thead>
                                                <tr>
                                                    <th>Mã sản phẩm</th>
                                                    <th>Số lượng</th>
                                                    <th>Nhận hàng và quét mã</th>
                                                    <th>Trạng thái lên rack</th>
                                                </tr>
                                            </thead>
                                            <tbody id="stagesTableBody-${actualReceived.ActualReceivedId}">
                                                <!-- Giai đoạn sẽ được hiển thị ở đây -->
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>`;
                modalsContainer.append(modalHtml);
            });


            // Fetch current plan details with dates
            getPlanDetailReceived().then(function (data) {
                data.forEach(function (planDetail) {
                    var modalId = 'planModal-' + planDetail.PlanDetailId;

                    // Calculate end time
                    var deliveryTimeParts = planDetail.DeliveryTime.split(':');
                    var leadTimeParts = planDetail.LeadTime.split(':');
                    var start = new Date(planDetail.SpecificDate);
                    start.setHours(parseInt(deliveryTimeParts[0], 10));
                    start.setMinutes(parseInt(deliveryTimeParts[1], 10));
                    start.setSeconds(parseInt(deliveryTimeParts[2], 10));

                    var end = new Date(start);
                    end.setHours(end.getHours() + parseInt(leadTimeParts[0], 10));
                    end.setMinutes(end.getMinutes() + parseInt(leadTimeParts[1], 10));
                    end.setSeconds(end.getSeconds() + parseInt(leadTimeParts[2], 10));

                    var formattedStart = start.toLocaleTimeString();
                    var formattedEnd = end.toLocaleTimeString();

                    var modalHtml = `
                <div class="modal fade" id="${modalId}" tabindex="-1" aria-labelledby="planModalLabel" aria-hidden="true" data-plan="">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="planModalLabel">Chi tiết kế hoạch</h5>
                            </div>
                            <div class="modal-body">
                                <p id="planDetails-${planDetail.PlanDetailId}"><strong>Nhà cung cấp:</strong> ${planDetail.SupplierName}<br><strong>Nhận lúc: </strong>${formattedStart}<br><strong>Kết thúc lúc: </strong>${formattedEnd}</p>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-warning" id="delayButton-${planDetail.PlanDetailId}">Delay</button>
                            </div>
                        </div>
                    </div>
                </div>`;
                    modalsContainer.append(modalHtml);
                });
            }).catch(function (error) {
                console.error("Error fetching plan details:", error);
            });
        });
    }


    function formatDateToLocalString(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function formatDateTime(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    }

    function getFormattedNow() {
        var now = new Date();
        var year = now.getFullYear();
        var month = String(now.getMonth() + 1).padStart(2, '0');
        var day = String(now.getDate()).padStart(2, '0');
        var hours = String(now.getHours()).padStart(2, '0');
        var minutes = String(now.getMinutes()).padStart(2, '0');
        var seconds = String(now.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    }
    //Lấy thời gian thực cho Indicator
    var now = getFormattedNow();
    function loadSuppliersForToday() {
        fetch('/TLIPWarehouse/GetSuppliersForToday')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok ' + response.statusText);
                }
                return response.json();
            })
            .then(data => {
                var suppliersListContent = document.getElementById('suppliersListContent');
                suppliersListContent.innerHTML = '';

                // Fetch plan trip count and actual trip count
                Promise.all([
                    fetch('/TLIPWarehouse/GetPlanTripCountForToday').then(res => res.json()),
                    fetch('/TLIPWarehouse/GeActualTripCountForToday').then(res => res.json())
                ]).then(([planTripCounts, actualTripCounts]) => {

                    data.forEach(supplier => {
                        const planTripCount = planTripCounts.find(p => p.SupplierCode === supplier.supplierCode)?.TripCount || 0;
                        const actualTripCount = actualTripCounts.find(a => a.SupplierCode === supplier.supplierCode)?.TripCount || 0;

                        let backgroundColor = '';
                        if (actualTripCount < planTripCount && actualTripCount > 0) {
                            backgroundColor = '#C7B44F';
                        } else if (actualTripCount === planTripCount || actualTripCount > planTripCount) {
                            backgroundColor = '#008000';
                        }

                        var supplierHtml = `
                <div class="supplier-block" style="background-color: ${backgroundColor};" data-supplier-code="${supplier.supplierCode}">
                    <strong style="font-size: 1.2em;">${supplier.supplierName}</strong>
                    <div>Tổng số chuyến: ${actualTripCount}/${planTripCount}</div>
                </div>`;
                        suppliersListContent.insertAdjacentHTML('beforeend', supplierHtml);
                    });

                    // Start the marquee effect
                    startMarquee();
                }).catch(error => {
                    console.error('There was a problem with fetching trip counts:', error);
                });
            })
            .catch(error => {
                console.error('There was a problem with the fetch operation:', error);
            });
    }

    function startMarquee() {
        const marqueeContent = document.querySelector('.marquee-content');
        const supplierBlocks = Array.from(document.querySelectorAll('.supplier-block'));
        let currentIndex = 0;

        function showNextBatch() {
            marqueeContent.innerHTML = '';
            const nextBatch = supplierBlocks.slice(currentIndex, currentIndex + 4);
            nextBatch.forEach(block => {
                const clonedBlock = block.cloneNode(true);
                clonedBlock.addEventListener('click', function () {
                    const supplierCode = this.getAttribute('data-supplier-code');
                    showSupplierModal(supplierCode);
                });
                marqueeContent.appendChild(clonedBlock);
            });

            currentIndex = (currentIndex + 4) % supplierBlocks.length;

            $(marqueeContent).css({ right: '100%' }).animate({ right: '40%' }, 2000, 'linear', function () {
                setTimeout(() => {
                    $(marqueeContent).animate({ right: '-100%' }, 2000, 'linear', showNextBatch);
                }, 10000);
            });
        }

        showNextBatch();
    }




    function showSupplierModal(supplierCode) {
        fetch(`/TLIPWarehouse/GetActualReceivedBySupplier?supplierCode=${supplierCode}`)
            .then(response => response.json())
            .then(result => {
                if (!result.success || !Array.isArray(result.data)) {
                    throw new Error('Expected an array but got ' + typeof result.data);
                }

                var data = result.data;
                console.log('Actual received data:', data);
                var modalContent = `
            <div class="modal fade" id="supplierModal" tabindex="-1" aria-labelledby="supplierModalLabel" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="supplierModalLabel">Chi tiết nhà cung cấp <strong>${supplierCode}</strong></h5>
                        </div>
                        <div class="modal-body">
                            <table class="table table-bordered">
                                <thead>
                                    <tr>
                                        <th>Mã ASN</th>
                                        <th>Số DO</th>
                                        <th>Invoice</th>
                                        <th>Thời gian giao hàng thực tế</th>
                                    </tr>
                                </thead>
                                <tbody>`;
                data.forEach(actual => {
                    modalContent += `
                <tr>
                    <td>${actual.AsnNumber}</td>
                    <td>${actual.DoNumber}</td>
                    <td>${actual.Invoice}</td>
                    <td>${new Date(actual.ActualDeliveryTime).toLocaleString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                    })}</td>
                </tr>`;
                });
                modalContent += `
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>`;

                // Append modal to body and show it
                document.body.insertAdjacentHTML('beforeend', modalContent);
                var supplierModal = new bootstrap.Modal(document.getElementById('supplierModal'));
                supplierModal.show();

                // Remove modal from DOM after it is hidden
                document.getElementById('supplierModal').addEventListener('hidden.bs.modal', function () {
                    this.remove();
                });
            })
            .catch(error => {
                console.error('There was a problem with fetching actual received data:', error);
            });
    }







    function getActualReceived() {
        return fetch('/TLIPWarehouse/GetActualReceived')
            .then(response => response.json());
    }
    function getPlanDetailReceived() {
        return fetch('/TLIPWarehouse/GetCurrentPlanDetailsWithDates')
            .then(response => response.json());
    }

    function getAllActualReceivedLast7Days() {
        return fetch('/TLIPWarehouse/GetAllActualReceivedLast7Days')
            .then(response => response.json());
    }
    *//* function getIncompleteActualReceived() {
         return fetch('/TLIPWarehouse/GetActualReceived')
             .then(response => response.json())
             .then(data => {
                 return data.filter(actualReceived => {
                     const completionPercentage = calculateCompletionPercentage(actualReceived.ActualDetails);
                     return completionPercentage < 100;
                 });
             });
     }*//*
    function getPlanDetailReceivedInHistory() {
        return fetch('/TLIPWarehouse/GetPlanActualDetailsInHistory')
            .then(response => response.json());
    }

    function calculateCompletionPercentage(actualDetails) {
        const completedItems = actualDetails.filter(detail => detail.QuantityRemain === 0).length;
        const totalItems = actualDetails.length;
        return (completedItems / totalItems) * 100;
    }

    function calculateOnRackCompletionPercentage(actualDetails) {
        const completedItems = actualDetails.filter(detail => detail.QuantityScan != 0).length;
        const totalItems = actualDetails.length;
        return (completedItems / totalItems) * 100;
    }


    function fetchEvents(fetchInfo, successCallback, failureCallback) {
        Promise.all([getActualReceived(), getPlanDetailReceived(), getPlanDetailReceivedInHistory()])
            .then(([actualReceivedData, planDetailData, planDetailHistoryData]) => {
                const events = [];

                // Process actual received data if not null or empty
                if (actualReceivedData && actualReceivedData.length > 0) {
                    actualReceivedData.forEach(actualReceived => {
                        //console.log("actualReceived:", actualReceived);
                        const start = new Date(actualReceived.ActualDeliveryTime);
                        let end = new Date(start);

                        const completionPercentage = calculateOnRackCompletionPercentage(actualReceived.ActualDetails);

                        let eventColor = actualReceived.IsCompleted ? '#3E7D3E' : '#C7B44F';

                        if (!actualReceived.IsCompleted) {
                            if (completionPercentage === 0 && !actualReceived.ActualLeadTime) {
                                end.setHours(end.getHours() + 1);
                            } else if (completionPercentage < 100) {
                                if (actualReceived.ActualLeadTime) {
                                    const [hours, minutes, seconds] = actualReceived.ActualLeadTime.split(':').map(Number);
                                    end.setHours(end.getHours() + hours);
                                    end.setMinutes(end.getMinutes() + minutes);
                                    end.setSeconds(end.getSeconds() + seconds);
                                }
                            }
                        } else {
                            if (actualReceived.ActualLeadTime) {
                                const [hours, minutes, seconds] = actualReceived.ActualLeadTime.split(':').map(Number);
                                end.setHours(end.getHours() + hours);
                                end.setMinutes(end.getMinutes() + minutes);
                                end.setSeconds(end.getSeconds() + seconds);
                            } else {
                                end.setHours(end.getHours() + 1);
                            }
                        }

                        const formattedStart = formatDateTime(start);
                        const formattedEnd = formatDateTime(end);
                        const modalId = `eventModal-${actualReceived.ActualReceivedId}`;

                        events.push({
                            id: `actual-${actualReceived.ActualReceivedId}`,
                            title: actualReceived.SupplierName,
                            start: formattedStart,
                            end: formattedEnd,
                            backgroundColor: eventColor,
                            resourceId: `${actualReceived.SupplierCode}_Actual`,
                            extendedProps: {
                                actualReceivedId: actualReceived.ActualReceivedId,
                                supplierCode: actualReceived.SupplierCode,
                                supplierName: actualReceived.SupplierName,
                                asnNumber: actualReceived.AsnNumber,
                                doNumber: actualReceived.DoNumber,
                                invoice: actualReceived.Invoice,
                                completionPercentage: completionPercentage,
                                modalId: modalId
                            }
                        });
                    });
                }

                // Process plan detail data if not null or empty
                if (planDetailData && planDetailData.length > 0) {
                    planDetailData.forEach(planDetail => {
                        const specificDate = new Date(planDetail.SpecificDate);
                        const deliveryTimeParts = planDetail.DeliveryTime.split(':');
                        const leadTimeParts = planDetail.LeadTime.split(':');

                        const start = new Date(specificDate);
                        start.setHours(parseInt(deliveryTimeParts[0], 10));
                        start.setMinutes(parseInt(deliveryTimeParts[1], 10));
                        start.setSeconds(parseInt(deliveryTimeParts[2], 10));

                        const end = new Date(start);
                        end.setHours(end.getHours() + parseInt(leadTimeParts[0], 10));
                        end.setMinutes(end.getMinutes() + parseInt(leadTimeParts[1], 10));
                        end.setSeconds(end.getSeconds() + parseInt(leadTimeParts[2], 10));

                        const formattedStart = formatDateTime(start);
                        const formattedEnd = formatDateTime(end);
                        const modalId = `planModal-${planDetail.PlanDetailId}`;

                        events.push({
                            id: `plan-${planDetail.PlanDetailId}`,
                            title: planDetail.SupplierName,
                            start: formattedStart,
                            end: formattedEnd,
                            resourceId: `${planDetail.SupplierCode}_Plan`,
                            extendedProps: {
                                planDetailId: planDetail.PlanDetailId,
                                supplierCode: planDetail.SupplierCode,
                                supplierName: planDetail.SupplierName,
                                planType: planDetail.PlanType,
                                modalId: modalId
                            }
                        });
                    });
                }

                // Process plan detail history data if not null or empty
                if (planDetailHistoryData && planDetailHistoryData.length > 0) {
                    planDetailHistoryData.forEach(planDetail => {
                        const specificDate = new Date(planDetail.SpecificDate);
                        const deliveryTimeParts = planDetail.DeliveryTime.split(':');
                        const leadTimeParts = planDetail.LeadTime.split(':');

                        const start = new Date(specificDate);
                        start.setHours(parseInt(deliveryTimeParts[0], 10));
                        start.setMinutes(parseInt(deliveryTimeParts[1], 10));
                        start.setSeconds(parseInt(deliveryTimeParts[2], 10));

                        const end = new Date(start);
                        end.setHours(end.getHours() + parseInt(leadTimeParts[0], 10));
                        end.setMinutes(end.getMinutes() + parseInt(leadTimeParts[1], 10));
                        end.setSeconds(end.getSeconds() + parseInt(leadTimeParts[2], 10));

                        const formattedStart = formatDateTime(start);
                        const formattedEnd = formatDateTime(end);
                        const modalId = `planModal-${planDetail.PlanDetailId}`;

                        events.push({
                            id: `plan-${planDetail.PlanDetailId}`,
                            title: planDetail.SupplierName,
                            start: formattedStart,
                            end: formattedEnd,
                            resourceId: `${planDetail.SupplierCode}_Plan`,
                            extendedProps: {
                                planDetailId: planDetail.PlanDetailId,
                                supplierCode: planDetail.SupplierCode,
                                supplierName: planDetail.SupplierName,
                                supplierName: planDetail.SupplierName,
                                planType: planDetail.PlanType,
                                modalId: modalId
                            }
                        });
                    });
                }

                successCallback(events);
            })
            .catch(error => failureCallback(error));
    }



    //KHỞI TẠO LỊCH
    var calendar = new FullCalendar.Calendar(calendarEl, {
        schedulerLicenseKey: 'CC-Attribution-NonCommercial-NoDerivatives',
        initialView: 'resourceTimelineDay',
        // Mỗi slot là 30 phút
        slotDuration: '00:30',
        // Mỗi slot cách nhau 1 tiếng
        slotLabelInterval: '00:30',
        slotLabelFormat: {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false // Sử dụng định dạng 24 giờ
        },
        // Hiển thị các ô thời gian từ 6 giờ sáng hôm trước đến 6 giờ sáng hôm sau
        slotMinTime: '00:00:00',
        slotMaxTime: '24:00:00',
        stickyFooterScrollbar: 'auto',
        resourceAreaWidth: '450px',
        //Gọi Indicator
        nowIndicator: true,
        //set Indicator với thời gian thực
        now: now,
        timeZone: 'Asia/Bangkok',
        locale: 'en-GB',
        aspectRatio: 2.0,
        themeSystem: 'bootstrap',
        headerToolbar: {
            left: 'prev,next',
            center: 'title',
            right: 'today'
        },
        editable: false,
        resourceAreaHeaderContent: 'Details',
        resources: function (fetchInfo, successCallback, failureCallback) {
            getCurrentDate(fetchInfo.startStr).then(weekdayId => {
                fetchResources(weekdayId)
                    .then(resources => successCallback(resources))
                    .catch(error => failureCallback(error));
            });
        },
        datesSet: function (dateInfo) {
            console.log('datesSet:', dateInfo.startStr);
            getCurrentDate(dateInfo.startStr).then(weekdayId => {
                fetchResources(weekdayId)
                    .then(resources => {
                        if (typeof calendar.refetchResources === 'function') {
                            calendar.refetchResources();
                        } else {
                            console.error('calendar.refetchResources is not defined or not a function');
                        }
                    })
                    .catch(error => {
                        console.error("Error fetching resources:", error);
                        if (typeof failureCallback === 'function') {
                            failureCallback(error);
                        } else {
                            console.error('failureCallback is not defined or not a function');
                        }
                    });
            }).catch(error => {
                console.error("Error getting current date:", error);
                if (typeof failureCallback === 'function') {
                    failureCallback(error);
                } else {
                    console.error('failureCallback is not defined or not a function');
                }
            });
        },
        resourceLabelContent: function (arg) {

            var parts = arg.resource.title.split('  ');
            var supplierCode = arg.resource.extendedProps.supplierCode;
            var boldPart = parts.length > 1 ? parts[1].trim() : parts[0].trim();
            var prefix = parts[0].trim();
            var backgroundColor = '';
            var textColor = 'white';
            var iconHtml = '';
            var iconWarning = '';

            if (prefix === 'Plan') {
                //iconWarning = '<i class="fas fa-exclamation-triangle"></i>';
                backgroundColor = '#1E2B37';
                iconHtml = '<i class="fas fa-calendar-alt"></i>';
                boldPart = `<b style="background-color: ${backgroundColor}; color: ${textColor}; padding: 2px 4px; margin-left: 100px" onclick="showPlanDetailModalInResource('${supplierCode}')">${boldPart}</b>`;

            } else if (prefix === 'Actual') {
                backgroundColor = '#3E7D3E';
                iconHtml = `<i class="fas fa-truck"></i>`;
                boldPart = `<b style="background-color: ${backgroundColor}; color: ${textColor}; padding: 2px 4px; margin-left: 100px" onclick="showActualModalInResource('${supplierCode}')">${boldPart}</b>`;
            }

            return {
                html: `<div style="display: flex; align-items: center;">
                <span style="width: 50px; display: inline-block;">${iconHtml} ${prefix}</span>
                <span> ${boldPart} ${iconWarning}</span>
               </div>`
            };
        },



        //Sắp xếp theo thứ tự theo order(Plan trước Actual sau)
        resourceOrder: 'order',
        events: fetchEvents,

        // Không cho phép kéo sự kiện để thay đổi thời gian bắt đầu
        eventStartEditable: false,
        // Không cho phép thay đổi độ dài (thời lượng) sự kiện
        eventDurationEditable: false,
        //Hover viền khi di chuột 
        eventMouseEnter: function (info) {
            info.el.classList.add('highlighted-event');
            var tooltip = document.createElement('div');
            tooltip.className = 'event-tooltip';
            tooltip.style.color = 'white';

            if (info.event.extendedProps.completionPercentage || info.event.extendedProps.completionPercentage === 0) {
                tooltip.innerHTML = `
        Nhà cung cấp: <strong>${info.event.extendedProps.supplierName}</strong><br>
        Đã hoàn thành được: <strong>${info.event.extendedProps.completionPercentage}%</strong>`;

                if (info.event.extendedProps.completionPercentage === 100) {
                    tooltip.style.backgroundColor = '#3E7D3E';
                } else {
                    tooltip.style.backgroundColor = '#C7B44F';
                }
            } else {
                tooltip.style.backgroundColor = '#1E2B37';

                tooltip.innerHTML = `
        Nhà cung cấp: <strong>${info.event.extendedProps.supplierName}</strong>`;
            }

            document.body.appendChild(tooltip);

            info.el.addEventListener('mousemove', function (e) {
                tooltip.style.left = e.pageX + 20 + 'px';
                tooltip.style.top = e.pageY + 20 + 'px';
            });

            info.el.addEventListener('mouseleave', function () {
                tooltip.remove();
            });
        }
        ,
        eventMouseLeave: function (info) {
            info.el.classList.remove('highlighted-event');
        },
        resourceLabelClassNames: function (arg) {
            return ['custom-resource-label'];
        },

        //HÀM XỬ LÝ KHI CLICK VÀO SỰ KIỆN
        eventClick: function (info) {
            const actualReceivedId = info.event.extendedProps.actualReceivedId;
            const planDetailReceiveId = info.event.extendedProps.planDetailId;
            const asnNumber = info.event.extendedProps.asnNumber;
            const doNumber = info.event.extendedProps.doNumber;
            const invoice = info.event.extendedProps.invoice;


            const supplierCode = info.event.extendedProps.supplierCode;
            const supplierName = info.event.title;
            const start = info.event.start;
            const end = info.event.end;

            const formattedStart = new Date(start).toLocaleString('vi-VN', {
                timeZone: 'UTC',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });

            const formattedEnd = new Date(end).toLocaleString('vi-VN', {
                timeZone: 'UTC',
                hour: '2-digit',
                second: '2-digit',
                minute: '2-digit'
            });

            const eventDetails = `
                <strong>Nhà cung cấp:</strong> ${supplierName} - ${supplierCode}<br>
                <i><strong>ASN Number:</strong></i> ${asnNumber}<br>
                <i><strong>DO Number:</strong></i> ${doNumber}<br>
                <i><strong>Invoice:</strong></i> ${invoice}<br>

                <i><strong>Nhận lúc:</strong></i> ${formattedStart}<br>
                <i><strong>Kết thúc lúc:</strong></i> ${formattedEnd}
            `;
            const eventModalElement = document.getElementById(`eventModal-${actualReceivedId}`);
            const planModalElement = document.getElementById(`planModal-${planDetailReceiveId}`);

            if (eventModalElement) {
                fetchAndPopulateStagesTable(actualReceivedId);
                const eventDetailsElement = document.getElementById(`eventDetails-${actualReceivedId}`);
                if (eventDetailsElement) {
                    eventDetailsElement.innerHTML = eventDetails;
                } else {
                    console.error(`Element with ID eventDetails-${actualReceivedId} not found.`);
                }
                var eventModal = new bootstrap.Modal(eventModalElement);
                eventModal.show();
            } else {
                console.error(`Element with id 'eventModal-${actualReceivedId}' not found.`);
            }

            if (planModalElement) {
                var eventModal = new bootstrap.Modal(planModalElement);
                eventModal.show();
            } else {
                console.error(`Element with id 'planModal-${planDetailReceiveId}' not found.`);
            }

        },
        //FOMAT NGÀY THÁNG
        views: {
            resourceTimelineDay: {
                titleFormat: { day: '2-digit', month: '2-digit', year: 'numeric' }
            },
            resourceTimelineWeek: {
                titleFormat: { day: '2-digit', month: '2-digit', year: 'numeric' }
            }
        },
        eventContent: function (arg) {
            let content = document.createElement('div');
            content.classList.add('centered-event');

            // Customize the event title
            let title = document.createElement('div');
            title.classList.add('event-title');
            title.innerHTML = `<strong>${arg.event.title}</strong>`;
            content.appendChild(title);
            *//*
                        if (arg.event.extendedProps.completionPercentage || arg.event.extendedProps.completionPercentage === 0) {
                            let supplierCode = document.createElement('div');
                            supplierCode.classList.add('event-supplier-code');
                            supplierCode.innerHTML = ` ${arg.event.extendedProps.completionPercentage}%`;
                            supplierCode.style.color = 'white';
                            supplierCode.style.fontStyle = 'italic';
                            content.appendChild(supplierCode);
                        }*//*

            return { domNodes: [content] };
        },


        resourceLaneClassNames: function (arg) {
            if (arg.resource.id.endsWith("Actual")) {
                return ['gray-background'];
            }
            return ['white-background'];
        },
        resourceLabelClassNames: function (arg) {
            if (arg.resource.id.endsWith("Actual")) {
                return ['gray-background'];
            }
            return ['white-background'];
        },
        slotLabelContent: function (arg) {
            return { html: `<i style="color: blue; text-decoration: none;">${arg.text}</i>` };
        },
        slotLabelClassNames: function (arg) {
            return ['custom-slot-label'];
        }

    });


    function populateStagesTable(asnDetails, actualReceivedId) {
        const stagesTableBodyId = `stagesTableBody-${actualReceivedId}`;
        const stagesTableBody = document.getElementById(stagesTableBodyId);

        if (stagesTableBody) {
            stagesTableBody.innerHTML = '';
            asnDetails.forEach(detail => {
                const row = document.createElement('tr');
                const isOnRackDone = detail.QuantityScan != 0;
                const isHandleDone = detail.QuantityRemain === 0;

                row.innerHTML = `
                <td>${detail.PartNo}</td>
                <td>${detail.Quantity}</td>
                <td>${isHandleDone ? 'Done' : 'Pending...'}</td>
                <td>${isOnRackDone ? 'Đã lên rack' : 'Pending...'}</td>`;

                const statusCellOnRackDone = row.querySelector('td:last-child');
                const statusCellHandleDone = row.querySelector('td:nth-last-child(2)');

                const iconHandleDone = document.createElement('i');
                const iconOnRackDone = document.createElement('i');
                // Thêm biểu tượng FontAwesome nếu trạng thái là "Done"
                if (isOnRackDone) {
                    iconOnRackDone.classList.add('fa', 'fa-check-circle');
                    iconOnRackDone.style.color = 'green';
                    iconOnRackDone.style.marginLeft = '8px';
                    statusCellOnRackDone.appendChild(iconOnRackDone);
                }
                else {
                    let gifImage = document.createElement('img');
                    gifImage.src = '/images/pending.gif';
                    statusCellOnRackDone.appendChild(gifImage);
                }

                if (isHandleDone) {
                    iconHandleDone.classList.add('fa', 'fa-check-circle');
                    iconHandleDone.style.color = 'green';
                    iconHandleDone.style.marginLeft = '8px';
                    statusCellHandleDone.appendChild(iconHandleDone);
                }
                else {
                    let gifImage = document.createElement('img');
                    gifImage.src = '/images/pending.gif';
                    statusCellHandleDone.appendChild(gifImage);
                }

                stagesTableBody.appendChild(row);
            });
        }

        // Tính toán phần trăm hoàn thành
        let completionPercentage = calculateOnRackCompletionPercentage(asnDetails);;

        // Cập nhật giao diện để hiển thị phần trăm hoàn thành
        const completionElement = document.getElementById(`completionPercentage-${actualReceivedId}`);
        let color = completionPercentage < 100 ? '#C7B44F' : '#3E7D3E';

        if (completionElement) {
            completionElement.textContent = `Đã hoàn thành được: ${completionPercentage.toFixed(2)}%`;
            completionElement.style.color = color; // Cập nhật màu sắc
        } else {
            // Nếu phần tử hiển thị chưa tồn tại, tạo mới
            const newCompletionElement = document.createElement('div');
            newCompletionElement.id = `completionPercentage-${actualReceivedId}`;
            newCompletionElement.textContent = `Đã hoàn thành được: ${completionPercentage.toFixed(2)}%`;
            newCompletionElement.style.color = color;
            document.body.appendChild(newCompletionElement);
        }
        // Cập nhật progress bar
        const progressBar = document.getElementById(`progressBar-${actualReceivedId}`);
        if (progressBar) {
            progressBar.style.width = `${completionPercentage}%`;
            progressBar.setAttribute('aria-valuenow', completionPercentage.toFixed(2));
            progressBar.style.backgroundColor = completionPercentage < 100 ? '#C7B44F' : '#3E7D3E';
        }
    }




    function fetchAndPopulateStagesTable(actualReceivedId) {
        fetch(`/TLIPWarehouse/GetActualDetailsByReceivedId?actualReceivedId=${actualReceivedId}`)
            .then(response => response.json())
            .then(asnDetails => {
                //console.log('Actual details:', data);
                populateStagesTable(asnDetails, actualReceivedId);
            })
            .catch(error => console.error('Error fetching actual details:', error));

    }


    function updateCalendarEvent(actualReceived) {
        const start = new Date(actualReceived.ActualDeliveryTime);
        const end = new Date(start);

        if (actualReceived.ActualLeadTime) {
            const leadTimeParts = actualReceived.ActualLeadTime.split(':');
            const hours = parseInt(leadTimeParts[0], 10);
            const minutes = parseInt(leadTimeParts[1], 10);
            const seconds = parseInt(leadTimeParts[2], 10);

            end.setHours(end.getHours() + hours);
            end.setMinutes(end.getMinutes() + minutes);
            end.setSeconds(end.getSeconds() + seconds);

        } else {
            end.setHours(end.getHours() + 1);
        }


        const formattedStart = formatDateTime(start);
        const formattedEnd = formatDateTime(end);

        let existingEvent = calendar.getEventById(`actual-${actualReceived.ActualReceivedId}`);

        const modalId = `eventModal-${actualReceived.ActualReceivedId}`;
        const completionPercentage = calculateOnRackCompletionPercentage(actualReceived.ActualDetails);


        if (existingEvent) {
            existingEvent.setExtendedProp({ completionPercentage: completionPercentage });
            if (completionPercentage < 100) {
                existingEvent.setEnd(formattedEnd);
            }
        } else {
            calendar.addEvent({
                id: `actual-${actualReceived.ActualReceivedId}`,
                title: actualReceived.SupplierName,
                start: formattedStart,
                end: formattedEnd,
                resourceId: `${actualReceived.SupplierCode}_Actual`,
                extendedProps: {
                    actualReceivedId: actualReceived.ActualReceivedId,
                    supplierCode: actualReceived.SupplierCode,
                    supplierName: actualReceived.SupplierName,
                    modalId: modalId,
                    asnNumber: actualReceived.AsnNumber,
                    doNumber: actualReceived.DoNumber,
                    invoice: actualReceived.Invoice,
                    completionPercentage: completionPercentage

                }
            });
        }

        updateEventDetails(actualReceived);
    }
    function updateEventDetails(actualReceived) {
        const start = new Date(actualReceived.ActualDeliveryTime);
        const end = new Date(start);
        if (actualReceived.ActualLeadTime) {
            const leadTimeParts = actualReceived.ActualLeadTime.split(':');
            const hours = parseInt(leadTimeParts[0], 10);
            const minutes = parseInt(leadTimeParts[1], 10);
            const seconds = parseInt(leadTimeParts[2], 10);

            end.setHours(end.getHours() + hours);
            end.setMinutes(end.getMinutes() + minutes);
            end.setSeconds(end.getSeconds() + seconds);

        } else {
            end.setHours(end.getHours() + 1);
        }
        const formattedStart = formatDateTime(start);
        const formattedEnd = formatDateTime(end);

        const actualReceivedId = actualReceived.ActualReceivedId;
        const supplierCode = actualReceived.SupplierCode;
        const supplierName = actualReceived.SupplierName;
        const asnNumber = actualReceived.AsnNumber;
        const doNumber = actualReceived.DoNumber;
        const invoice = actualReceived.Invoice;

        const formattedStartEvent = new Date(formattedStart).toLocaleString('vi-VN', {
            timeZone: 'Asia/Bangkok',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        const formattedEndEvent = new Date(formattedEnd).toLocaleString('vi-VN', {
            timeZone: 'Asia/Bangkok',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        const eventDetails = `
            <strong>Nhà cung cấp:</strong> ${supplierName} - ${supplierCode}<br>
             <i><strong>ASN Number:</strong></i> ${asnNumber}<br>
             <i><strong>DO Number:</strong></i> ${doNumber}<br>
             <i><strong>Invoice:</strong></i> ${invoice}<br>
            <i><strong>Nhận lúc:</strong></i> ${formattedStartEvent}<br>
            <i><strong>Kết thúc lúc:</strong></i> ${formattedEndEvent}
        `;

        if (calculateOnRackCompletionPercentage(actualReceived.ActualDetails) < 100) {
            const eventDetailsElement = document.getElementById(`eventDetails-${actualReceivedId}`);
            if (eventDetailsElement) {
                eventDetailsElement.innerHTML = eventDetails;
            } else {
                console.error(`Element with ID eventDetails-${actualReceivedId} not found.`);
            }
        }
    }



    calendar.render();

    function getCurrentDate(dateNow) {

        const today = new Date().toISOString().split('T')[0];
        const dateToUse = dateNow ? dateNow : today;
        console.log("dateToUse: ", dateToUse);
        return fetch('/api/ResourcesReceivedTLIP/GetWeekday', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ Date: dateToUse })
        })
            .then(response => response.json())
            .then(data => data.WeekdayId);
    }



    function fetchResources(weekdayId) {
        return fetch(`/api/ResourcesReceivedTLIP?weekdayId=${weekdayId}`)
            .then(response => response.json());
    }

    //Tải nhà cung cấp lên khi tải trang 
    loadSuppliersForToday();
    updateActualReceivedList();

    //HIỂN THỊ THỜI GIAN THỰC
    function updateTime() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const currentTime = `${hours}:${minutes}:${seconds}`;
        document.getElementById('currentTime').textContent = currentTime;
    }
    setInterval(updateTime, 1000);
    updateTime();

    *//*    //HÀM XỬ LÝ SỰ KIỆN KHI ẤN DELAY
        document.getElementById('delayButton').addEventListener('click', async function () {
            const supplierId = document.getElementById('eventModal').getAttribute('data-actual');
            console.log("supplierId:", supplierId);
            const response = await fetch('/api/tlipwarehouse/delaySupplier', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(supplierId)
            });
    
            const data = await response.json();
            if (data.success) {
                console.log('Delay processed successfully.');
            } else {
                console.error('Failed to process delay.');
            }
        });*//*
});
*/