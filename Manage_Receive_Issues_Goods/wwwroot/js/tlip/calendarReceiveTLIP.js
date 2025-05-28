document.addEventListener('DOMContentLoaded', function () {
    var calendarEl = document.getElementById('calendar');

    const notificationConnection = new signalR.HubConnectionBuilder()
        .withUrl("/updateReceiveTLIPHub")
        .withAutomaticReconnect()
        .build();
    notificationConnection.start().then(function () {
        console.log("SignalR connected.");
    }).catch(function (err) {
        console.error("Failed to connect SignalR: ", err.toString());
    });
    notificationConnection.onclose(error => {
        if (error) {
            console.error("SignalR connection closed with error: ", error);
        }
    });
    notificationConnection.onreconnecting(error => {
        console.assert(notificationConnection.state === signalR.HubConnectionState.Reconnecting);
        console.log("Try to reconnecting to SignalR...");
        alert("reconnecting");
    });
    notificationConnection.onreconnected(connectionId => {
        console.assert(notificationConnection.state === signalR.HubConnectionState.Connected);
        console.log("SignalR reconnect successfully.");
    });
    /**
     * Cập nhật sự kiện của lịch
     */
    notificationConnection.on("UpdateCalendar", function (actualReceived) {
        if (actualReceived && typeof actualReceived === 'object' && !Array.isArray(actualReceived)) {

            actualReceived = convertToPascalCase(actualReceived);
            //console.log("Update Calendar được gọi: ", actualReceived);

            toastr.info(`Chuyến hàng của ${actualReceived.SupplierName} đã đến`, "Update thông tin ", {
                timeOut: 10000,
                extendedTimeOut: 0,
                closeButton: true,
                positionClass: 'toast-top-right',
            });

            try {
                updateCalendarEventScan(actualReceived);
                //console.log("updateCalendarEvent executed successfully.");
            } catch (error) {
                console.error("Error in updateCalendarEvent:", error);
            }


            try {
                updateActualReceivedList();
                //console.log("updateActualReceivedList executed successfully.");
            } catch (error) {
                console.error("Error in updateActualReceivedList:", error);
            }

            try {
                loadSuppliersForToday();
                //console.log("loadSuppliersForToday executed successfully.");
            } catch (error) {
                console.error("Error in loadSuppliersForToday:", error);
            }
        } else {
            console.error("actualReceived is not a valid object:", actualReceived);
        }

    });



    /**
     * Cập nhật sự kiện bị lỗi
     */
    notificationConnection.on("ErrorReceived", function (actualReceivedId, supplierName, isCompleted) {
        let event = calendar.getEvents().find(event => {
            return event.id.replace('actual-', '').split('+').some(id => id === actualReceivedId.toString());
        });

        if (event) {
            event.setProp('backgroundColor', '#B80000');
        } else {
            console.error(`Event with ID actual-${actualReceivedId} not found.`);
        }
    });



    /**
     * Cập nhật thời gian xử lý của sự kiện
     */
    notificationConnection.on("UpdateLeadtime", function (actualReceived) {
        actualReceived = convertToPascalCase(actualReceived);
        //console.log("UpdateLeadtime được gọi: ", actualReceived);
        let existingEvent = calendar.getEvents().find(event => {
            if (event.id.startsWith('actual-')) {
                return event.id.replace('actual-', '').split('+').some(id => id === actualReceived.ActualReceivedId.toString());
            }
            return false;
        });

        if (existingEvent) {
            let events = existingEvent.extendedProps.events || [];
            const eventIndex = events.findIndex(e => e.ActualReceivedId === actualReceived.ActualReceivedId);
            if (eventIndex !== -1) {
                events[eventIndex] = actualReceived;
            } else {
                events.push(actualReceived);
            }
            existingEvent.setExtendedProp('events', events);
        } else {
            console.error(`Event with ActualReceivedId ${actualReceived.ActualReceivedId} not found.`);
        }

        updateCalendarEventScan(actualReceived);
    });

    /**
    * Cập nhật thời gian storage của sự kiện
    */
    /*notificationConnection.on("UpdateStorageTime", function (actualReceived) {
        actualReceived = convertToPascalCase(actualReceived);
        if (actualReceived.ActualStorageTime) {
            let existingActualEvent = calendar.getEvents().find(event => {
                if (event.id.startsWith('actual-')) {
                    let ids = event.id.replace('actual-', '').split('+');
                    return ids.includes(actualReceived.ActualReceivedId.toString());
                }
                return false;
            });


            if (existingActualEvent) {
                let existingEvent = calendar.getEvents().find(event => {
                    if (event.id.startsWith('storage-')) {
                        let ids = event.id.replace('storage-', '').split('+');
                        return ids.includes(actualReceived.ActualReceivedId.toString());
                    }
                    return false;
                });

                if (existingEvent) {
                    let events = existingEvent.extendedProps.events || [];
                    const eventIndex = events.findIndex(e => e.ActualReceivedId === actualReceived.ActualReceivedId);
                    if (eventIndex !== -1) {
                        events[eventIndex] = actualReceived;
                    } else {
                        events.push(actualReceived);
                    }
                    existingEvent.setExtendedProp('events', events);

                } else {
                    console.error(`Event with ActualReceivedId ${actualReceived.ActualReceivedId} not found.`);
                }

                let events = existingEvent.extendedProps.events || [];
                const allCompleted = events.every(event => event.IsCompleted === true);
                if (allCompleted) {
                    updateCalendarEventStorage(actualReceived);
                }
            }
        }
        

    });*/

    /**
    * Cập nhật event storage 
    */
    /* notificationConnection.on("UpdateStorageCalendar", function (actualReceived) {
         if (actualReceived && typeof actualReceived === 'object' && !Array.isArray(actualReceived)) {
             actualReceived = convertToPascalCase(actualReceived);
 
             let existingActualEvent = calendar.getEvents().find(event => {
                 if (event.id.startsWith('actual-')) {
                     let ids = event.id.replace('actual-', '').split('+');
                     return ids.includes(actualReceived.ActualReceivedId.toString());
                 }
                 return false;
             });
 
             if (existingActualEvent) {
                 let events = existingActualEvent.extendedProps.events || [];
                 const allCompleted = events.every(event => event.IsCompleted === true);
                 if (allCompleted) {
                     try {
                         updateActualReceivedList();
                         console.log("updateActualReceivedList executed successfully.");
                     } catch (error) {
                         console.error("Error in updateActualReceivedList:", error);
                     }
 
 
                     try {
                         updateCalendarEventStorage(actualReceived);
                         console.log("updateCalendarEvent executed successfully.");
                     } catch (error) {
                         console.error("Error in updateCalendarEvent:", error);
                     }
                 }
             }
 
 
         } else {
             console.error("actualReceived is not a valid object:", actualReceived);
         }
     });*/

    /**
     * Cập nhật màu xanh đối sự kiện đã IsCompleted
     */
    notificationConnection.on("UpdateColorScanDone", function (actualReceived) {
        actualReceived = convertToPascalCase(actualReceived);

        let existingEvent = calendar.getEvents().find(event => {
            if (event.id.startsWith('actual-')) {
                return event.id.replace('actual-', '').split('+').some(id => id === actualReceived.ActualReceivedId.toString());
            }
            return false;
        });


        if (existingEvent) {
            let events = existingEvent.extendedProps.events || [];

            const eventIndex = events.findIndex(e => e.ActualReceivedId === actualReceived.ActualReceivedId);
            if (eventIndex !== -1) {
                events[eventIndex] = actualReceived;
            } else {
                events.push(actualReceived);
            }
            existingEvent.setExtendedProp('events', events);

            const allComplete = events.every(event => event.IsCompleted === true);
            if (allComplete) {
                existingEvent.setProp('backgroundColor', '#3E7D3E');
                //console.log(`Đổi màu thành công.`);
            } else {
                //console.log(`Chưa được đổi màu ở Scan.`);
            }
        } else {
            console.error(`Event with ActualReceivedId ${actualReceived.ActualReceivedId} not found.`);
        }

    });

    /**
     * Cập nhật màu xanh đối sự kiện đã lên Rack hết
     */
    /*notificationConnection.on("UpdateStorageColorDone", function (actualReceived) {
        actualReceived = convertToPascalCase(actualReceived);

        let existingEvent = calendar.getEvents().find(event => {
            if (event.id.startsWith('storage-')) {
                return event.id.replace('storage-', '').split('+').some(id => id === actualReceived.ActualReceivedId.toString());
            }
            return false;
        });


        if (existingEvent) {
            let events = existingEvent.extendedProps.events || [];

            const eventIndex = events.findIndex(e => e.ActualReceivedId === actualReceived.ActualReceivedId);
            if (eventIndex !== -1) {
                events[eventIndex] = actualReceived;
            } else {
                events.push(actualReceived);
            }
            existingEvent.setExtendedProp('events', events);

            const allComplete = events.every(event =>
                event.ActualDetails && event.ActualDetails.every(detail => detail.StockInStatus === true)
            );

            if (allComplete) {
                existingEvent.setProp('backgroundColor', '#0091F7');
                console.log(`Đổi màu thành công.`);
            } else {
                console.log(`Chưa được đổi màu ở  storage.`);
            }
        } else {
            console.error(`Event with ActualReceivedId ${actualReceived.ActualReceivedId} not found.`);
        }

    });*/

    /**
     * Cập nhật phần percentage extendprops
     */
    notificationConnection.on("UpdatePercentage", function (actualReceived) {
        actualReceived = convertToPascalCase(actualReceived);

        let existingEvent = calendar.getEvents().find(event => {
            if (event.id.startsWith('actual-')) {
                return event.id.replace('actual-', '').split('+').some(id => id === actualReceived.ActualReceivedId.toString());
            }
            return false;
        });

        if (existingEvent) {
            let events = existingEvent.extendedProps.events || [];

            const eventIndex = events.findIndex(e => e.ActualReceivedId === actualReceived.ActualReceivedId);
            if (eventIndex !== -1) {
                events[eventIndex] = actualReceived;
            } else {
                events.push(actualReceived);
            }
            existingEvent.setExtendedProp('events', events);

        } else {
            console.error(`Event with ActualReceivedId ${actualReceived.ActualReceivedId} not found.`);
        }
    });


    //(Chắc sau này dùng đc cho gì đó)
    /*    function groupEventsById(events) {
            const groupedEvents = {};
    
            events.forEach(event => {
                if (event.id.startsWith('actual-') || event.id.startsWith('storage-')) {
                    const id = event.id.replace(/^(actual-|storage-)/, '').split('+')[0];
                    if (!groupedEvents[id]) {
                        groupedEvents[id] = [];
                    }
                    groupedEvents[id].push(event);
                }
            });
    
            return groupedEvents;
        }*/



    /**
     * Parse các thuộc tính của object về dạng PascalCase (viết hoa chữ cái đầu)
     */
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



    /**
     * Cập nhật các sự kiện actual + plan lại từ db (chủ yếu được gọi để tạo modal)
     */
    function updateActualReceivedList() {
        //getActualReceived().then(function (data) {
        //console.log("updateActualReceivedList được gọi");
        groupByTagNameInActualReceived().then(function (data) {
            var modalsContainer = $('#modalsContainer');
            modalsContainer.empty();
            data.forEach(function (actualReceived) {
                if (actualReceived.Events.length > 0) {
                    var modalId = 'eventModal-' + actualReceived.Events[0].ActualReceivedId;
                    var progressBarId = 'progressBar-' + actualReceived.Events[0].ActualReceivedId;
                    var eventDetailsId = 'eventDetails-' + actualReceived.Events[0].ActualReceivedId;
                    var completionPercentageId = 'completionPercentage-' + actualReceived.Events[0].ActualReceivedId;
                    var stagesTableBodyId = 'stagesTableBody-' + actualReceived.Events[0].ActualReceivedId;
                    var stagesTableId = 'stagesTable-' + actualReceived.Events[0].ActualReceivedId;

                    if (actualReceived.Events.length > 1) {
                        var combinedIds = actualReceived.Events.map(event => event.ActualReceivedId).join('+');
                        var modalId = 'eventModal-' + combinedIds;
                        var modalHtml = `
                        <div class="modal fade" id="${modalId}" tabindex="-1" aria-labelledby="eventModalLabel" aria-hidden="true" data-actual="">
                            <div class="modal-dialog modal-lg">
                                <div class="modal-content">
                                    <div class="modal-header">
                                        <h5 class="modal-title" id="eventModalLabel"><strong>Chi tiết chuyến hàng</strong></h5>
                                    </div>
                                    <div class="modal-body">
                                        ${actualReceived.Events.map((event, index) => {
                            var dynamicSuffix = `_${index + 1}`;
                            var eventDetailsId = `eventDetails-${combinedIds}${dynamicSuffix}`;
                            var progressBarId = `progressBar-${combinedIds}${dynamicSuffix}`;
                            var completionPercentageId = `completionPercentage-${combinedIds}${dynamicSuffix}`;
                            var stagesTableBodyId = `stagesTableBody-${combinedIds}${dynamicSuffix}`;
                            var stagesTableId = `stagesTable-${combinedIds}${dynamicSuffix}`;
                            return `
                                            <div style="border: 4px solid black; padding: 10px; margin-bottom: 10px;">
                                                <p id="${eventDetailsId}"></p>
                                                <div class="row justify-content-center"> 
                                                    <h5 class="modal-title" id="${completionPercentageId}"></h5>
                                                    <div class="container"> 
                                                        <div class="progress">
                                                            <div id="${progressBarId}" class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%"></div>
                                                        </div>
                                                        <table id="${stagesTableId}" class="table table-bordered">
                                                            <thead>
                                                                <tr>
                                                                    <th>Mã sản phẩm</th>
                                                                    <th>Số lượng</th>
                                                                    <th>Nhận hàng và quét mã</th>
                                                                    <th>Trạng thái lên rack</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody id="${stagesTableBodyId}">
                                                                <!-- Giai đoạn sẽ được hiển thị ở đây -->
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>`;
                        }).join('')}
                                    </div>
                                </div>
                            </div>
                        </div>`;


                        modalsContainer.append(modalHtml);
                        //console.log("Modal appended:", modalHtml);


                    } else {
                        var modalHtml = `
                <div class="modal fade" id="${modalId}" tabindex="-1" aria-labelledby="eventModalLabel" aria-hidden="true" data-actual="">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="eventModalLabel"><strong>Chi tiết chuyến hàng</strong></h5>
                            </div>
                            <div class="modal-body">
                                <p id="${eventDetailsId}"></p>
                                <div class="row justify-content-center"> 
                                    <h5 class="modal-title" id="${completionPercentageId}"></h5>
                                    <div class="container"> 
                                        <div class="progress">
                                            <div id="${progressBarId}" class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%"></div>
                                        </div>
                                        <table id="${stagesTableId}" class="table table-bordered">
                                            <thead>
                                                <tr>
                                                    <th>Mã sản phẩm</th>
                                                    <th>Số lượng</th>
                                                    <th>Nhận hàng và quét mã</th>
                                                    <th>Trạng thái lên rack</th>
                                                </tr>
                                            </thead>
                                            <tbody id="${stagesTableBodyId}">
                                                <!-- Giai đoạn sẽ được hiển thị ở đây -->
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`;
                        modalsContainer.append(modalHtml);
                    }
                }
            });


            // Fetch current plan details with dates
            groupByTagNameInPlanReceived().then(function (groupedData) {
                groupedData.forEach(function (planDetail) {

                    if (planDetail.Events.length > 0) {
                        var supplierNames = planDetail.Events.map(event => event.SupplierName).join(', ');

                        var modalId = 'planModal-' + planDetail.Events[0].PlanDetailId;
                        var planDetailsId = 'planDetails-' + planDetail.Events[0].PlanDetailId;

                        // Calculate end time for the first event
                        var firstEvent = planDetail.Events[0];
                        var deliveryTimeParts = firstEvent.DeliveryTime.split(':');
                        var leadTimeParts = firstEvent.LeadTime.split(':');
                        var start = new Date(firstEvent.SpecificDate);
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
                                            <p id="${planDetailsId}"><strong>Nhà cung cấp:</strong> ${supplierNames}<br><strong>Nhận lúc: </strong>${formattedStart}<br><strong>Kết thúc lúc: </strong>${formattedEnd}</p>
                                        </div>
                                        <div class="modal-footer">
                                            <button type="button" class="btn btn-warning" id="delayButton-${firstEvent.PlanDetailId}">Delay</button>
                                        </div>
                                    </div>
                                </div>
                            </div>`;
                        modalsContainer.append(modalHtml);
                    }
                });
            }).catch(function (error) {
                console.error("Error fetching plan details:", error);
            });

        });

    }



    /**
     * Parse thời gian về dạng YY-MM-DDTHH:mm:ss
     */
    function formatDateTime(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    }



    /**
     * Lấy thời gian thực cho indicator (cái dòng cột màu đỏ)
     */
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

    /**
     * Parse thười gian về giây
     */
    function parseTimeToSeconds(time) {
        const parts = time.split(':');
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        const seconds = parseInt(parts[2], 10);
        return (hours * 3600) + (minutes * 60) + seconds;
    }

    /**
     * Lấy các supplier trong ngày hôm nay
     */
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
                <div class="supplier-block" style="background-color: ${backgroundColor};" data-supplier-code="${supplier.supplierCode}" data-supplier-name="${supplier.supplierName}">
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


    /**
     * Chạy các block supplier theo kiểu marquee
     */
    function startMarquee() {
        const marquee = document.querySelector('.marquee');
        const marqueeContent = document.querySelector('.marquee-content');
        const supplierBlocks = Array.from(document.querySelectorAll('.supplier-block'));
        const blockPerBatch = 4; // Số block hiển thị mỗi lần
        let currentIndex = 0;

        function showNextBatch() {
            marqueeContent.innerHTML = ''; // Xóa nội dung cũ
            const nextBatch = supplierBlocks.slice(currentIndex, currentIndex + blockPerBatch);

            // Clone các block để hiển thị
            nextBatch.forEach(block => {
                const clonedBlock = block.cloneNode(true);
                clonedBlock.addEventListener('click', function () {
                    const supplierCode = this.getAttribute('data-supplier-code');
                    const supplierName = this.getAttribute('data-supplier-name');
                    showSupplierModal(supplierCode, supplierName);
                });
                marqueeContent.appendChild(clonedBlock);
            });

            // Tăng chỉ số lặp (vòng quanh nếu vượt quá danh sách)
            currentIndex = (currentIndex + blockPerBatch) % supplierBlocks.length;

            // Tính toán vị trí:
            const marqueeWidth = marquee.offsetWidth; // Chiều rộng của marquee
            const contentWidth = marqueeContent.scrollWidth; // Chiều rộng của nội dung
            const startPosition = -contentWidth; // Bắt đầu ngoài bên trái
            const centerPosition = (marqueeWidth - contentWidth) / 2; // Vị trí giữa màn hình
            const endPosition = marqueeWidth; // Kết thúc ngoài bên phải

            // Đặt vị trí ban đầu (ngoài bên trái)
            marqueeContent.style.transform = `translateX(${startPosition}px)`;
            marqueeContent.style.transition = 'none'; // Không có animation khi khởi tạo

            // Bắt đầu animation từ bên trái đến giữa
            setTimeout(() => {
                marqueeContent.style.transition = 'transform 3s linear'; // 3 giây để đến giữa
                marqueeContent.style.transform = `translateX(${centerPosition}px)`;

                // Dừng lại ở giữa màn hình trong 5 giây
                setTimeout(() => {
                    // Tiếp tục di chuyển ra khỏi màn hình bên phải
                    marqueeContent.style.transition = 'transform 3s linear'; // 3 giây để chạy ra bên phải
                    marqueeContent.style.transform = `translateX(${endPosition}px)`;

                    // Gọi batch tiếp theo sau khi animation kết thúc
                    setTimeout(showNextBatch, 5000); // 3 giây để ra khỏi màn hình
                }, 10000); // Dừng trong 5 giây
            }, 50); // Bắt đầu di chuyển sau 50ms
        }

        // Khởi chạy lần đầu
        showNextBatch();
    }

    /**
     * Hiển thị modal khi ấn vào block supplier
     */
    function showSupplierModal(supplierCode, supplierName) {
        var existingModal = document.getElementById('supplierModal');
        if (existingModal) {
            existingModal.remove();
        }
        fetch(`/TLIPWarehouse/GetActualReceivedBySupplier?supplierCode=${supplierCode}`)
            .then(response => response.json())
            .then(result => {
                if (!result.success || !Array.isArray(result.data)) {
                    throw new Error('Expected an array but got ' + typeof result.data);
                }

                var data = result.data;
                //console.log('Actual received data:', data);
                var modalContent = `
            <div class="modal fade" id="supplierModal" tabindex="-1" aria-labelledby="supplierModalLabel" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="supplierModalLabel">Chi tiết nhà cung cấp <strong>${supplierCode} - ${supplierName}</strong></h5>
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

    function getPlanDetailReceivedInHistory() {
        return fetch('/TLIPWarehouse/GetPlanActualDetailsInHistory')
            .then(response => response.json())
            .then(data => {
                return data;
            })
            .catch(error => {
                console.error('Error in getPlanDetailReceived:', error);
            });
    }
    function getTagNameRules() {
        return fetch('/TLIPWarehouse/GetTagNameRule')
            .then(response => response.json());
    }

    /**
     * Tính phần trăm hoàn thành được cấp lên rack
     */
    function calculateOnRackCompletionPercentage(actualDetails) {
        const completedItems = actualDetails.filter(detail => detail.StockInStatus === true).length;
        const totalItems = actualDetails.length;
        return (completedItems / totalItems) * 100;
    }

    /**
     * Nhóm các sự kiện actual theo TagName
     */
    function groupByTagNameActual(data) {
        const grouped = data.reduce((acc, item) => {
            const tagName = item.TagName || 'Unknown';
            const date = new Date(item.ActualDeliveryTime).toISOString().split('T')[0];
            const time = new Date(item.ActualDeliveryTime).getTime();

            if (!acc[date]) {
                acc[date] = {};
            }
            if (!acc[date][tagName]) {
                acc[date][tagName] = [];
            }

            // Kiểm tra khoảng cách thời gian giữa các sự kiện
            const lastGroup = acc[date][tagName][acc[date][tagName].length - 1];
            //Sự kiện sau xử lý chậm hơn sự kiện trước 10p thì gộp chung thành 1 tag (vì theo dự kiến hàng từ 1 xe về thì xử lý nhanh)
            if (lastGroup && (time - new Date(lastGroup.Events[lastGroup.Events.length - 1].ActualDeliveryTime).getTime()) <= 10 * 60 * 1000) {
                lastGroup.Events.push(item);
            } else {
                acc[date][tagName].push({
                    TagName: tagName,
                    Date: date,
                    Events: [item]
                });
            }
            return acc;
        }, {});

        // Chuyển đổi đối tượng nhóm thành mảng
        const result = [];
        for (const date in grouped) {
            for (const tagName in grouped[date]) {
                result.push(...grouped[date][tagName]);
            }
        }

        return result;
    }

    /**
    * Nhóm các sự kiện plan theo TagName
    */
    function groupByTagNamePlan(data) {
        const grouped = data.reduce((acc, item) => {
            const tagName = item.TagName || 'Unknown';
            const date = new Date(item.SpecificDate); // Lấy phần ngày (YYYY-MM-DD)
            const deliveryTimeISO = item.DeliveryTime;

            if (!acc[tagName]) {
                acc[tagName] = {};
            }
            if (!acc[tagName][date]) {
                acc[tagName][date] = [];
            }

            // Kiểm tra nếu đã có sự kiện với cùng DeliveryTime
            const existingGroup = acc[tagName][date].find(group => group.DeliveryTime === deliveryTimeISO);
            if (existingGroup) {
                existingGroup.Events.push(item);
            } else {
                acc[tagName][date].push({
                    TagName: tagName,
                    Date: formatDateTime(date),
                    DeliveryTime: deliveryTimeISO,
                    Events: [item]
                });
            }

            return acc;
        }, {});

        // Chuyển đổi đối tượng nhóm thành mảng
        const result = [];
        for (const tagName in grouped) {
            for (const date in grouped[tagName]) {
                result.push(...grouped[tagName][date]);
            }
        }

        return result;
    }

    /**
     * Nhóm các sự kiện theo TagName trong ActualReceived
     */
    function groupByTagNameInActualReceived() {
        return getActualReceived().then(data => {
            return groupByTagNameActual(data);
        });
    }
    /**
     * Nhóm các sự kiện theo TagName trong PlanDetailReceived
     */
    function groupByTagNameInPlanReceived() {
        return getPlanDetailReceived().then(data => {
            return groupByTagNamePlan(data);
        });
    }
    /**
     * Nhóm các sự kiện theo TagName trong PlanDetailReceivedHistory
     */
    function groupByTagNameInPlanReceivedHistory() {
        return getPlanDetailReceivedInHistory().then(data => {
            return groupByTagNamePlan(data);
        });
    }

    //const colors = ['gray-background', 'white-background'];
    //let colorIndex = 0;
    //const supplierColors = {};

    ///**
    // * Trả về màu tương ứng cho từng nhà cung cấp, thứ tự sole
    // * @param {any} supplierCode
    // * @returns
    // */
    //function getSupplierColor(supplierCode) {
    //    if (!supplierColors[supplierCode]) {
    //        supplierColors[supplierCode] = colors[colorIndex];
    //        colorIndex = (colorIndex + 1) % colors.length;
    //    }
    //    return supplierColors[supplierCode];
    //}

    /**
     * Khởi tạo sự kiện để hiển thị lên lịch
     */
    function fetchEvents(fetchInfo, successCallback, failureCallback) {
        updateActualReceivedList();

        //console.log("fetchEVent được gọi");
        Promise.all([groupByTagNameInActualReceived(), groupByTagNameInPlanReceived(), groupByTagNameInPlanReceivedHistory(), getTagNameRules()])
            .then(([groupedDataActual, groupDataPlan, groupDataPlanHistory, tagNameRules]) => {
                const events = [];

                if (groupedDataActual && groupedDataActual.length > 0) {
                    // Nhóm các sự kiện theo TagName
                    groupedDataActual.forEach(group => {
                        //Start của Scan
                        const start = new Date(group.Events[0].ActualDeliveryTime);
                        //End của Scan
                        let end = new Date(start);

                        // Đổi màu xanh nếu tất cà các event đều IsCompleted
                        let eventColor = group.Events.every(event => event.IsCompleted) ? '#3E7D3E' : '#C7B44F';

                        /*  // Đổi màu cho storage event
                          let eventStorageColor = group.Events.every(event =>
                              event.ActualDetails.every(detail => detail.StockInStatus === true)
                          ) ? '#0091F7' : '#9570AF';*/


                        let maxLeadTimeEvent = group.Events.reduce((maxEvent, currentEvent) => {
                            if (currentEvent.ActualLeadTime) {
                                // Tách thời gian thành giờ, phút và giây cho sự kiện hiện tại và sự kiện có thời gian lớn nhất hiện tại
                                const [maxHours, maxMinutes, maxSeconds] = maxEvent.ActualLeadTime ? maxEvent.ActualLeadTime.split(':').map(Number) : [0, 0, 0];
                                const [currentHours, currentMinutes, currentSeconds] = currentEvent.ActualLeadTime.split(':').map(Number);

                                // Tính tổng số giây cho cả hai sự kiện
                                const maxTotalSeconds = maxHours * 3600 + maxMinutes * 60 + maxSeconds;
                                const currentTotalSeconds = currentHours * 3600 + currentMinutes * 60 + currentSeconds;

                                // So sánh tổng số giây và trả về sự kiện có thời gian lớn hơn
                                return currentTotalSeconds > maxTotalSeconds ? currentEvent : maxEvent;
                            }
                            return maxEvent;
                        }, group.Events[0]);

                        // Tính toán thời gian kết thúc dựa trên sự kiện có ActualLeadTime lớn nhất
                        if (maxLeadTimeEvent.ActualLeadTime) {
                            const [hours, minutes, seconds] = maxLeadTimeEvent.ActualLeadTime.split(':').map(Number);
                            end.setHours(end.getHours() + hours);
                            end.setMinutes(end.getMinutes() + minutes);
                            end.setSeconds(end.getSeconds() + seconds);
                        } else {
                            end.setHours(end.getHours() + 1);
                        }
                        const supplierCodeInRules = tagNameRules.some(rule => rule.SupplierCode === group.Events[0].SupplierCode);

                        events.push({
                            id: group.Events.length > 1
                                ? `actual-${group.Events.map(e => e.ActualReceivedId).join('+')}`
                                : `actual-${group.Events[0].ActualReceivedId}`,
                            title: supplierCodeInRules ? group.TagName : group.Events[0].SupplierName,
                            start: formatDateTime(start),
                            end: formatDateTime(end),
                            backgroundColor: eventColor,
                            resourceId: `${group.TagName}_Actual`,
                            extendedProps: {
                                events: group.Events
                            }
                        });

                        ///////////////////////
                        //End của storage
                        /*    let endStorage = new Date(end);
    
                            let maxStorageTimeEvent = group.Events.reduce((maxEvent, currentEvent) => {
                                if (currentEvent.ActualStorageTime) {
                                    // Tách thời gian thành giờ, phút và giây cho sự kiện hiện tại và sự kiện có thời gian lớn nhất hiện tại
                                    const [maxHours, maxMinutes, maxSeconds] = maxEvent.ActualStorageTime ? maxEvent.ActualStorageTime.split(':').map(Number) : [0, 0, 0];
                                    const [currentHours, currentMinutes, currentSeconds] = currentEvent.ActualStorageTime.split(':').map(Number);
    
                                    // Tính tổng số giây cho cả hai sự kiện
                                    const maxTotalSeconds = maxHours * 3600 + maxMinutes * 60 + maxSeconds;
                                    const currentTotalSeconds = currentHours * 3600 + currentMinutes * 60 + currentSeconds;
    
                                    // So sánh tổng số giây và trả về sự kiện có thời gian lớn hơn
                                    return currentTotalSeconds > maxTotalSeconds ? currentEvent : maxEvent;
                                }
                                return maxEvent;
                            }, group.Events[0]);
    
    
                            if (maxStorageTimeEvent.ActualStorageTime) {
                                const [hours, minutes, seconds] = maxStorageTimeEvent.ActualStorageTime.split(':').map(Number);
                                endStorage.setHours(endStorage.getHours() + hours);
                                endStorage.setMinutes(endStorage.getMinutes() + minutes);
                                endStorage.setSeconds(endStorage.getSeconds() + seconds);
                            }
    
                            if (maxLeadTimeEvent.IsCompleted == true) {
                                //Cộng thêm 4 phút để event storage ko bị trùng với event scan(hiển thị thôi chứ dữ liệ DB vẫn đúng)
                                let endDate = new Date(end);
                                endDate.setMinutes(endDate.getMinutes() + 2);
    
                                events.push({
                                    id: group.Events.length > 1
                                        ? `storage-${group.Events.map(e => e.ActualReceivedId).join('+')}`
                                        : `storage-${group.Events[0].ActualReceivedId}`,
                                    title: supplierCodeInRules ? group.TagName : group.Events[0].SupplierName,
                                    start: formatDateTime(endDate),
                                    end: formatDateTime(endStorage),
                                    backgroundColor: eventStorageColor,
                                    resourceId: `${group.TagName}_Actual`,
                                    extendedProps: {
                                        events: group.Events
                                    }
                                });
                            }*/
                    });
                }

                if (groupDataPlan && groupDataPlan.length > 0) {
                    // Nhóm các sự kiện theo TagName
                    groupDataPlan.forEach(group => {
                        const deliveryTimeParts = group.DeliveryTime.split(':');
                        const start = new Date(group.Date);
                        start.setHours(deliveryTimeParts[0], deliveryTimeParts[1], deliveryTimeParts[2], 0);
                        let end = new Date(start);

                        // Tính toán thời gian kết thúc dựa trên sự kiện đầu tiên trong nhóm

                        let maxLeadTimeEvent = group.Events.reduce((maxEvent, currentEvent) => {
                            if (currentEvent.LeadTime) {
                                const [maxHours, maxMinutes, maxSeconds] = maxEvent.LeadTime ? maxEvent.LeadTime.split(':').map(Number) : [0, 0, 0];
                                const [currentHours, currentMinutes, currentSeconds] = currentEvent.LeadTime.split(':').map(Number);

                                const maxTotalSeconds = maxHours * 3600 + maxMinutes * 60 + maxSeconds;
                                const currentTotalSeconds = currentHours * 3600 + currentMinutes * 60 + currentSeconds;

                                return currentTotalSeconds > maxTotalSeconds ? currentEvent : maxEvent;
                            }
                            return maxEvent;
                        }, group.Events[0]);

                        // Tính toán thời gian kết thúc dựa trên sự kiện có LeadTime lớn nhất
                        if (maxLeadTimeEvent.LeadTime) {
                            const [hours, minutes, seconds] = maxLeadTimeEvent.LeadTime.split(':').map(Number);
                            end.setHours(end.getHours() + hours, end.getMinutes() + minutes, end.getSeconds() + seconds);
                        }

                        events.push({
                            id: group.Events.length > 1 ? `plan-${group.Events.map(e => e.PlanReceivedId).join('+')}`
                                : `plan-${group.Events[0].PlanReceivedId}`,
                            title: group.Events.length > 1 ? group.TagName : group.Events[0].SupplierName,
                            start: formatDateTime(start),
                            end: formatDateTime(end),
                            resourceId: `${group.TagName}_Plan`,
                            extendedProps: {
                                events: group.Events
                            }
                        });
                    });
                }

                // Process plan detail history data if not null or empty
                if (groupDataPlanHistory && groupDataPlanHistory.length > 0) {
                    // Nhóm các sự kiện theo TagName
                    groupDataPlanHistory.forEach(group => {
                        const deliveryTimeParts = group.DeliveryTime.split(':');
                        const start = new Date(group.Date);
                        start.setHours(deliveryTimeParts[0], deliveryTimeParts[1], deliveryTimeParts[2], 0);
                        let end = new Date(start);


                        // Tính toán thời gian kết thúc dựa trên sự kiện đầu tiên trong nhóm

                        let maxLeadTimeEvent = group.Events.reduce((maxEvent, currentEvent) => {
                            if (currentEvent.LeadTime) {
                                const [maxHours, maxMinutes, maxSeconds] = maxEvent.LeadTime ? maxEvent.LeadTime.split(':').map(Number) : [0, 0, 0];
                                const [currentHours, currentMinutes, currentSeconds] = currentEvent.LeadTime.split(':').map(Number);

                                const maxTotalSeconds = maxHours * 3600 + maxMinutes * 60 + maxSeconds;
                                const currentTotalSeconds = currentHours * 3600 + currentMinutes * 60 + currentSeconds;

                                return currentTotalSeconds > maxTotalSeconds ? currentEvent : maxEvent;
                            }
                            return maxEvent;
                        }, group.Events[0]);

                        // Tính toán thời gian kết thúc dựa trên sự kiện có LeadTime lớn nhất
                        if (maxLeadTimeEvent.LeadTime) {
                            const [hours, minutes, seconds] = maxLeadTimeEvent.LeadTime.split(':').map(Number);
                            end.setHours(end.getHours() + hours, end.getMinutes() + minutes, end.getSeconds() + seconds);
                        }


                        events.push({
                            id: group.Events.length > 1 ? `plan-${group.Events.map(e => e.PlanReceivedId).join('+')}`
                                : `plan-${group.Events[0].PlanReceivedId}`,
                            title: group.Events.length > 1 ? group.TagName : group.Events[0].SupplierName,
                            start: formatDateTime(start),
                            end: formatDateTime(end),
                            resourceId: `${group.TagName}_Plan`,
                            extendedProps: {
                                events: group.Events
                            }
                        });
                    });
                }


                successCallback(events);
            })
            .catch(error => failureCallback(error));
    }

    // Hàm tính toán thời gian hiện tại và scrollTime
    function getScrollTime() {
        const now = new Date();
        now.setHours(now.getHours() - 4); // Trừ đi 4 giờ để trông giống indicator nằm ở giữa
        const hours = now.getHours();
        const minutes = now.getMinutes();
        // Chuyển giờ và phút thành định dạng "HH:mm:ss"
        return `${hours < 10 ? '0' : ''}${hours}:${minutes < 10 ? '0' : ''}${minutes}:00`;
    }


    let isUserInteracting = false;
    let autoScrollInterval;

    // Hàm tự động cuộn để đưa thời gian hiện tại vào giữa màn hình
    function autoScrollToCurrentTime(calendarEl) {
        if (!isUserInteracting) {
            const scrollContainer = calendarEl.querySelector('.fc-scroller.fc-timegrid-body'); // Vùng cuộn ngang
            const nowIndicator = calendarEl.querySelector('.fc-now-indicator-line'); // Dòng đỏ hiện tại

            if (scrollContainer && nowIndicator) {
                const indicatorPosition = nowIndicator.offsetLeft; // Vị trí ngang của dòng đỏ
                const containerWidth = scrollContainer.offsetWidth; // Chiều rộng vùng hiển thị
                scrollContainer.scrollLeft = indicatorPosition - containerWidth / 2; // Đưa dòng đỏ vào giữa
            }
        }
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
        // Hiển thị các ô thời gian
        slotMinTime: '00:00:00',
        slotMaxTime: '24:00:00',
        //slotMinTime: timeRange.minTime,
        //slotMaxTime: timeRange.maxTime,
        stickyFooterScrollbar: 'auto',
        resourceAreaWidth: '300px',
        scrollTime: getScrollTime(),
        //Gọi Indicator
        nowIndicator: true,
        //set Indicator với thời gian thực
        now: getFormattedNow(),
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
                backgroundColor = '#1E2B37';
                iconHtml = '<i class="fas fa-calendar-alt"></i>';
                boldPart = `<b style="background-color: ${backgroundColor}; color: ${textColor}; padding: 2px 4px; margin-left: 100px" onclick="showPlanDetailModalInResource('${supplierCode}')">${boldPart}</b>`;

            } else if (prefix === 'Actual') {
                backgroundColor = '#3E7D3E';
                iconHtml = `<i class="fas fa-truck"></i>`;
                boldPart = `<b style="background-color: ${backgroundColor}; color: ${textColor}; padding: 2px 4px; margin-left: 100px" onclick="showActualModalInResource('${supplierCode}')">${boldPart}</b>`;
            }

            return {
                html: `<div style="display: flex; align-items: center; gap: 10px;">
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
            // Xóa tất cả tooltip cũ để tránh tooltip bị treo
            document.querySelectorAll('.event-tooltip').forEach(tooltip => tooltip.remove());

            var tooltip = document.createElement('div');
            tooltip.className = 'event-tooltip';
            tooltip.style.color = 'white';

            const events = info.event.extendedProps.events;
            // Giữ nguyên logic hiển thị nội dung của bạn
            if (info.event.id.startsWith('actual-') && events && events.length > 0 && events[0].CompletionPercentage !== undefined) {
                tooltip.innerHTML = events.map(event => {
                    let completionPercentageScan = event.CompletionPercentage || 0;
                    let completionPercentageStorage = event.OnRackCompletionPercentage || 0;
                    let backgroundColor;
                    let completionPercentage;

                    if (completionPercentageScan === 100 && completionPercentageStorage === 100) {
                        backgroundColor = '#0091F7';
                        completionPercentage = completionPercentageStorage;
                    } else if (completionPercentageScan === 100 && completionPercentageStorage !== 100) {
                        backgroundColor = '#9570AF';
                        completionPercentage = completionPercentageStorage;
                    } else if (completionPercentageScan === 100) {
                        backgroundColor = '#3E7D3E';
                        completionPercentage = completionPercentageScan;
                    } else {
                        backgroundColor = '#C7B44F';
                        completionPercentage = completionPercentageScan;
                    }

                    return `
                        <div style="background-color: ${backgroundColor}; padding: 5px; margin-bottom: 5px;">
                            Nhà cung cấp: <strong>${event.SupplierName}</strong><br>
                            Đã hoàn thành được: <strong>${completionPercentage}%</strong>
                        </div>`;
                }).join('');
            }
/* else if (info.event.id.startsWith('storage-') && events && events.length > 0 && events[0].OnRackCompletionPercentage !== undefined) {
                tooltip.innerHTML = events.map(event => {
                    let completionPercentage = event.OnRackCompletionPercentage || 0;
                    let backgroundColor = completionPercentage === 100 ? '#0091F7' : '#9570AF';
                    return `
                <div style="background-color: ${backgroundColor}; padding: 5px; margin-bottom: 5px;">
                    Nhà cung cấp: <strong>${event.SupplierName}</strong><br>
                    Đã hoàn thành được: <strong>${completionPercentage}%</strong>
                </div>`;
                }).join('');
            }*/ else {
                tooltip.style.backgroundColor = '#1E2B37';
                tooltip.innerHTML = `
            Nhà cung cấp: <strong>${events[0].TagName}</strong>`;
            }

            // Thêm tooltip vào document
            document.body.appendChild(tooltip);

            // Đặt vị trí tooltip theo con trỏ chuột
            function moveTooltip(e) {
                tooltip.style.left = e.pageX + 20 + 'px';
                tooltip.style.top = e.pageY + 20 + 'px';
            }

            info.el.addEventListener('mousemove', moveTooltip);

            // Lưu tham chiếu tooltip để xóa khi chuột rời đi
            info.el.tooltipElement = tooltip;
            info.el.tooltipMoveHandler = moveTooltip;
        },

        eventMouseLeave: function (info) {
            // Xóa tooltip khi chuột rời khỏi sự kiện
            if (info.el.tooltipElement) {
                info.el.tooltipElement.remove();
                info.el.tooltipElement = null;
            }

            // Hủy gắn sự kiện di chuyển chuột
            if (info.el.tooltipMoveHandler) {
                info.el.removeEventListener('mousemove', info.el.tooltipMoveHandler);
                info.el.tooltipMoveHandler = null;
            }
        },
        resourceLabelClassNames: function (arg) {
            return ['custom-resource-label'];
        },

        //HÀM XỬ LÝ KHI CLICK VÀO SỰ KIỆN
        eventClick: function (info) {
            //Đoạn này cần tối ưu lại bằng cách khi ấn vào mới tạo các element cùng với modal
            // chứ không phải tạo modal trước nữa
            //id modal thì lấy trùng luôn id của event nhé (tại lúc mới viết thì đang tập làm quen với framework này nên viết được theo ý như thế)
            const events = info.event.extendedProps.events;
            //console.log('Event clicked end:', info.event);
            if (events && events.length > 0) {
                let eventDetails = '';

                if (events.length > 1) {
                    let combinedActualReceivedIds = events.map(event => event.ActualReceivedId).join('+');

                    events.forEach((actualReceived, index) => {

                        const eventDetailsElement = document.getElementById(`eventDetails-${combinedActualReceivedIds}_${index + 1}`);
                        const stagesTableBodyId = document.getElementById(`stagesTableBody-${combinedActualReceivedIds}_${index + 1}`);
                        const completionElement = document.getElementById(`completionPercentage-${combinedActualReceivedIds}_${index + 1}`);
                        const progressBar = document.getElementById(`progressBar-${combinedActualReceivedIds}_${index + 1}`);

                        if (eventDetailsElement) {
                            eventDetailsElement.innerHTML = eventDetails;
                            fetchAndPopulateStagesTable(actualReceived, stagesTableBodyId, completionElement, progressBar, eventDetailsElement);
                        } else {
                            console.error(`Element with ID eventDetails-${combinedActualReceivedIds}_${index + 1} not found.`);
                        }
                    });

                    const eventModalElement = document.getElementById(`eventModal-${combinedActualReceivedIds}`);
                    if (eventModalElement) {
                        var eventModal = new bootstrap.Modal(eventModalElement);
                        eventModal.show();
                    } else {
                        console.error(`Element with id 'eventModal-${combinedActualReceivedIds}' not found.`);
                    }
                }


                else {
                    events.forEach((actualReceived, index) => {
                        const actualReceivedId = actualReceived.ActualReceivedId;

                        const eventDetailsElement = document.getElementById(`eventDetails-${actualReceivedId}`);
                        const eventModalElement = document.getElementById(`eventModal-${actualReceivedId}`);
                        const stagesTableBodyId = document.getElementById(`stagesTableBody-${actualReceivedId}`);
                        const completionElement = document.getElementById(`completionPercentage-${actualReceivedId}`);
                        const progressBar = document.getElementById(`progressBar-${actualReceivedId}`);

                        if (eventModalElement) {
                            if (eventDetailsElement) {
                                eventDetailsElement.innerHTML = eventDetails;
                                fetchAndPopulateStagesTable(actualReceived, stagesTableBodyId, completionElement, progressBar, eventDetailsElement);
                            } else {
                                console.error(`Element with ID eventDetails-${actualReceivedId} not found.`);
                            }
                            var eventModal = new bootstrap.Modal(eventModalElement);
                            eventModal.show();
                        } else {
                            console.error(`Element with id 'eventModal-${actualReceivedId}' not found.`);
                        }
                    });
                }

                const planModalElement = document.getElementById(`planModal-${events[0].PlanDetailId}`);
                if (planModalElement) {
                    var planModal = new bootstrap.Modal(planModalElement);
                    planModal.show();
                } else {
                    console.error(`Element with id 'planModal-${events[0].PlanDetailId}' not found.`);
                }
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
            return { domNodes: [content] };
        },


        resourceLaneClassNames: function (arg) {
            if (arg.resource.id.endsWith("Actual")) {
                return ['gray-background'];
            }
            return ['white-background'];
            //const supplierColor = getSupplierColor(arg.resource.extendedProps.supplierCode);
            //return [supplierColor];
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

    // Theo dõi sự kiện cuộn ngang/dọc của người dùng
    document.addEventListener('scroll', () => {
        isUserInteracting = true; // Ghi nhận người dùng đang thao tác
        // Tắt chế độ tự động cuộn nếu có thao tác
        clearTimeout(autoScrollInterval);
        autoScrollInterval = setTimeout(() => {
            isUserInteracting = false; // Kích hoạt lại chế độ tự động cuộn sau 10 giây không thao tác
        }, 10000);
    });


    /**
    * Hiển thị được các chi tiết ASN trong bảng modal
    */
    function populateStagesTable(asnDetails, actualReceived, stagesTableBody, completionElement, progressBar, eventDetailsElement) {
        if (stagesTableBody) {
            stagesTableBody.innerHTML = '';
            asnDetails.forEach(detail => {
                const row = document.createElement('tr');
                const isOnRackDone = detail.StockInStatus === true;
                const isHandleDone = detail.QuantityScan !== 0;
                const rackLocation = detail.StockInLocation;

                let handleStatus = isHandleDone ? 'Done' : 'Pending...';

                let rackStatus = null;
                if (rackLocation !== null && rackLocation !== '' && isOnRackDone) {
                    rackStatus = `Đã lên rack ở ${rackLocation}`;
                } else {
                    rackStatus = 'Pending...';
                }


                if (actualReceived.IsCompleted && !isOnRackDone && !isHandleDone) {
                    handleStatus = 'Đã chuyển về kho trong';
                    rackStatus = 'Đã chuyển về kho trong';
                }

                row.innerHTML = `
            <td>${detail.PartNo}</td>
            <td>${detail.Quantity}</td>
            <td>${handleStatus}</td>
            <td>${rackStatus}</td>`;

                const statusCellOnRackDone = row.querySelector('td:last-child');
                const statusCellHandleDone = row.querySelector('td:nth-last-child(2)');

                const iconHandleDone = document.createElement('i');
                iconHandleDone.classList.add('fa', 'fa-check-circle');
                iconHandleDone.style.color = 'green';
                iconHandleDone.style.marginLeft = '8px';

                const iconOnRackDone = document.createElement('i');
                iconOnRackDone.classList.add('fa', 'fa-check-circle');
                iconOnRackDone.style.color = 'green';
                iconOnRackDone.style.marginLeft = '8px';

                const iconWarehouse = document.createElement('i');
                iconWarehouse.classList.add('fa', 'fa-warehouse');
                iconWarehouse.style.color = 'blue';
                iconWarehouse.style.marginLeft = '8px';

                // Thêm biểu tượng FontAwesome cho các trạng thái
                if (isHandleDone) {
                    statusCellHandleDone.appendChild(iconHandleDone);
                } else if (!actualReceived.IsCompleted) {
                    let gifImage = document.createElement('img');
                    gifImage.src = '/images/pending.gif';
                    statusCellHandleDone.appendChild(gifImage);
                } else {
                    statusCellHandleDone.appendChild(iconWarehouse);
                }

                if (isOnRackDone) {
                    statusCellOnRackDone.appendChild(iconOnRackDone);
                } else if (!actualReceived.IsCompleted && !isOnRackDone) {
                    let gifImage = document.createElement('img');
                    gifImage.src = '/images/pending.gif';
                    statusCellOnRackDone.appendChild(gifImage);
                } else {
                    let gifImage = document.createElement('img');
                    gifImage.src = '/images/pending.gif';
                    statusCellOnRackDone.appendChild(gifImage);
                }
                stagesTableBody.appendChild(row);
            });

            if (!asnDetails || asnDetails.length === 0 && actualReceived.IsCompleted) {
                const row = document.createElement('tr');
                row.innerHTML = `
        <td colspan="4" style="text-align: center; font-weight: bold; font-style: italic; color: #0091F7;">
            Tất cả các hàng đã chuyển về kho trong
        </td>`;
                stagesTableBody.appendChild(row);
            }

        }

        // Tính toán phần trăm hoàn thành
        let completionPercentage = 0;
        if (asnDetails && asnDetails.length > 0) {
            const allStockedIn = asnDetails.every(detail => detail.StockInStatus === true);
            if (allStockedIn) {
                completionPercentage = 100;
            } else {
                completionPercentage = calculateOnRackCompletionPercentage(asnDetails);
            }
        }



        // Cập nhật giao diện để hiển thị phần trăm hoàn thành
        let color = completionPercentage < 100 ? '#C7B44F' : '#3E7D3E';

        if (completionElement) {
            completionElement.textContent = `Đã hoàn thành được: ${completionPercentage.toFixed(2)}%`;
            completionElement.style.color = color; // Cập nhật màu sắc
        } else {
            // Nếu phần tử hiển thị chưa tồn tại, tạo mới
            const newCompletionElement = document.createElement('div');
            newCompletionElement.id = `completionPercentage-${actualReceived.ActualReceivedId}`;
            newCompletionElement.textContent = `Đã hoàn thành được: ${completionPercentage.toFixed(2)}%`;
            newCompletionElement.style.color = color;
            document.body.appendChild(newCompletionElement);
        }
        // Cập nhật progress bar
        if (progressBar) {
            progressBar.style.width = `${completionPercentage}%`;
            progressBar.setAttribute('aria-valuenow', completionPercentage.toFixed(2));
            progressBar.style.backgroundColor = completionPercentage < 100 ? '#C7B44F' : '#3E7D3E';
        }
        ///////////////////////////////////////////////////////////////
        const startScan = new Date(actualReceived.ActualDeliveryTime);
        const endScan = new Date(startScan);
        let leadTime = null;
        let storageTime = null;

        if (actualReceived.ActualLeadTime) {
            const leadTimeParts = actualReceived.ActualLeadTime.split(':');
            const hours = parseInt(leadTimeParts[0], 10);
            const minutes = parseInt(leadTimeParts[1], 10);
            const seconds = parseInt(leadTimeParts[2], 10);

            // đay là lead time
            leadTime = new Date();
            leadTime.setHours(hours, minutes, seconds, 0);

            endScan.setHours(endScan.getHours() + hours);
            endScan.setMinutes(endScan.getMinutes() + minutes);
            endScan.setSeconds(endScan.getSeconds() + seconds);
        } else {
            endScan.setHours(endScan.getHours() + 1);
        }
        const formattedStart = formatDateTime(startScan);
        const formattedEnd = formatDateTime(endScan);

        const fomatedLeadTime = leadTime ? formatDateTime(leadTime) : null;

        //////////////////
        let endStorage;
        let formattedEndStorage;
        let formattedStorageTime;


        if (actualReceived && actualReceived.IsCompleted) {
            const actualStorageTime = actualReceived.ActualStorageTime;
            if (actualStorageTime) {
                const [hours, minutes, seconds] = actualStorageTime.split(':').map(Number);
                if (!isNaN(hours) && !isNaN(minutes) && !isNaN(seconds)) {
                    // Create a new Date object and set the time
                    storageTime = new Date();
                    storageTime.setHours(hours, minutes, seconds, 0);

                    // Assuming endScan is a Date object and you want to add the storage time to it
                    const leadTimeInMilliseconds = (hours * 3600 + minutes * 60 + seconds) * 1000;
                    const start = new Date(endScan.getTime() + leadTimeInMilliseconds);
                    endStorage = new Date(start);
                }
            }
        }

        if (endStorage !== null && endStorage !== undefined) {
            formattedEndStorage = formatDateTime(endStorage);
            formattedStorageTime = formatDateTime(storageTime);
        }

        const isOnRackDone = asnDetails.every(item => item.StockInStatus === true);
        const isHandleDone = actualReceived.IsCompleted;

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
        }) + " (" + new Date(formattedStart).toLocaleDateString('vi-VN', {
            timeZone: 'Asia/Bangkok',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }) + ")";

        const formattedEndEvent = new Date(formattedEnd).toLocaleString('vi-VN', {
            timeZone: 'Asia/Bangkok',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }) + " (" + new Date(formattedEnd).toLocaleDateString('vi-VN', {
            timeZone: 'Asia/Bangkok',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }) + ")";

        let formattedEndStorageEvent;
        let formattedStorageTimeEvent;
        if (formattedEndStorage !== null && formattedEndStorage !== '') {
            formattedEndStorageEvent = new Date(formattedEndStorage).toLocaleString('vi-VN', {
                timeZone: 'Asia/Bangkok',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }) + " (" + new Date(formattedEndStorage).toLocaleDateString('vi-VN', {
                timeZone: 'Asia/Bangkok',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }) + ")";


            formattedStorageTimeEvent = new Date(formattedStorageTime).toLocaleString('vi-VN', {
                timeZone: 'Asia/Bangkok',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }) ;
        }

        let formattedLeadTimeEvent;
        if (fomatedLeadTime !== null && fomatedLeadTime !== '') {
            formattedLeadTimeEvent = new Date(fomatedLeadTime).toLocaleString('vi-VN', {
                timeZone: 'Asia/Bangkok',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }) ;
        }

        let eventDetails = `
    <table border="1" style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;">
        <thead style="background-color: #f2f2f2;">
            <tr>
                <th style="border: 1px solid gray; text-align: center; padding: 8px;">Nhà cung cấp:</th>
                <th colspan="2" style="border: 1px solid gray; text-align: center; padding: 8px;">${supplierName} - ${supplierCode}</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td style="border: 1px solid gray; text-align: center; padding: 8px;"><strong>ASN Number:</strong></td>
                <td style="border: 1px solid gray; text-align: center; padding: 8px;"><strong>DO Number:</strong></td>
                <td style="border: 1px solid gray; text-align: center; padding: 8px;"><strong>Invoice:</strong></td>
            </tr>
            <tr>
                <td style="border: 1px solid gray; text-align: center; padding: 8px;">${asnNumber}</td>
                <td style="border: 1px solid gray; text-align: center; padding: 8px;">${doNumber}</td>
                <td style="border: 1px solid gray; text-align: center; padding: 8px;">${invoice}</td>
            </tr>
            <tr>
                <td style="border: 1px solid gray; text-align: center; padding: 8px;"><strong>Nhận lúc:</strong></td>
                <td style="border: 1px solid gray; text-align: center; padding: 8px;"><strong>Kết thúc xử lý lúc:</strong></td>
                <td style="border: 1px solid gray; text-align: center; padding: 8px;"><strong>Kết thúc lên rack lúc:</strong></td>
            </tr>
            <tr>
                <td style="border: 1px solid gray; text-align: center; padding: 8px;">${formattedStartEvent}</td>
                <td style="border: 1px solid gray; text-align: center; padding: 8px;">${isHandleDone ? formattedEndEvent : `Đang xử lý`}</td>
                                <td style="border: 1px solid gray; text-align: center; padding: 8px;">
                    ${isHandleDone && isOnRackDone ? (formattedEndStorageEvent ? formattedEndStorageEvent : 'Đang xử lý') : 'Đang xử lý'}
                </td>

            </tr>
             <tr>
                <td style="border: 1px solid gray; text-align: center; padding: 8px;"><strong>-</strong></td>
                <td style="border: 1px solid gray; text-align: center; padding: 8px;"><strong>Tổng thời gian xử lý:</strong></td>
                <td style="border: 1px solid gray; text-align: center; padding: 8px;"><strong>Tổng thời gian lên rack:</strong></td>
            </tr>
            <tr>
                <td style="border: 1px solid gray; text-align: center; padding: 8px;">-</td>
                <td style="border: 1px solid gray; text-align: center; padding: 8px;">${isHandleDone ? formattedLeadTimeEvent : `Đang xử lý`}</td>
                <td style="border: 1px solid gray; text-align: center; padding: 8px;">${isHandleDone && isOnRackDone ? formattedStorageTimeEvent : `Đang xử lý`}</td>
            </tr>
            <tr>
                <td colspan="3" style="border: 1px solid gray; text-align: center; padding: 8px; background-color: #f9f9f9;">
                    <strong>Trạng thái:</strong> 
                    ${!isHandleDone ? '<span style="color: #C7B450; font-weight: bold;">Đang xử lý</span>' : isHandleDone && !isOnRackDone ? '<span style="color: purple; font-weight: bold;">Đang đưa lên Rack</span>' : '<span style="color: green; font-weight: bold;">Đã hoàn tất</span>'}
                </td>
            </tr>
        </tbody>
    </table>
`;




        if (eventDetailsElement) {
            eventDetailsElement.innerHTML = eventDetails;
        } else {
            console.error(`Element with ID eventDetails-${actualReceivedId} not found.`);
        }

    }



    /**
     * Lấy chi tiết thực tế và hiển thị lên bảng modal
     */
    function fetchAndPopulateStagesTable(actualReceived, stagesTableBodyId, completionElement, progressBar, eventDetailsElement) {
        fetch(`/TLIPWarehouse/GetActualDetailsByReceivedId?actualReceivedId=${actualReceived.ActualReceivedId}`)
            .then(response => response.json())
            .then(asnDetails => {
                console.log('Actual details:', asnDetails);
                populateStagesTable(asnDetails, actualReceived, stagesTableBodyId, completionElement, progressBar, eventDetailsElement);
            })
            .catch(error => console.error('Error fetching actual details:', error));

    }


    /**
     * Cập nhật sự kiện actual khi các thông tin thay đổi (Phần xử lý)
     */
    function updateCalendarEventScan(actualReceived) {
        const start = new Date(actualReceived.ActualDeliveryTime);
        const end = new Date(start);
        //Tính phần kết thúc bằng start + leadtime (else) start + 1 tiếng
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
            toastr.warning(`Không nhận được leadtime, mã nhà cung cấp: ${actualReceived.SupplierName}`, null, {
                timeOut: 10000,
                extendedTimeOut: 0,
                closeButton: true,
                progressBar: true,
                positionClass: 'toast-top-center'
            })
        }
        //Fomat lại start và end có dạng YYYY-MM-DDTHH:MM:SS
        const formattedStart = formatDateTime(start);
        const formattedEnd = formatDateTime(end);
        //Tìm event đã tồn tại trong lịch
        let existingEvent = calendar.getEvents().find(event => {
            if (event.id.startsWith('actual-')) {
                return event.id.replace('actual-', '').split('+').some(id => id === actualReceived.ActualReceivedId.toString());
            }
            return false;
        });

        //Lấy ra tagNameRules (VD:KCN,HCM,..)
        getTagNameRules().then(tagNameRules => {
            //Tìm xem code của actualReceived có trong tagNameRules không
            const tagNameRule = tagNameRules.find(rule => rule.SupplierCode === actualReceived.SupplierCode);
            let tagName = actualReceived.SupplierCode;

            //Không có thì làm như bình thường
            if (!tagNameRule) {
                if (existingEvent) {
                    existingEvent.setEnd(formattedEnd);
                } else {
                    calendar.addEvent({
                        id: `actual-${actualReceived.ActualReceivedId}`,
                        title: actualReceived.SupplierName,
                        start: formattedStart,
                        end: formattedEnd,
                        resourceId: `${tagName}_Actual`,
                        extendedProps: {
                            events: [actualReceived]
                        }
                    });
                    //console.log('tạo lịch mới nè trong trường hợp không có tagrule');

                }
            }
            //Có tagrule
            else {
                tagName = tagNameRule.TagName;
                //Lấy ra tất cả các event có cùng TagName trong ngày hiện tại

                /*const allEvents = calendar.getEvents().filter(event => {
                    const eventDate = new Date(event.start);
                    const today = new Date();
                    return event.id.startsWith('actual-') &&
                        event.extendedProps.events.some(e => e.TagName === tagName) &&
                        eventDate.getDate() === today.getDate() &&
                        eventDate.getMonth() === today.getMonth() &&
                        eventDate.getFullYear() === today.getFullYear();
                });*/

                const allEvents = calendar.getEvents().filter(event => {
                    // Lấy ngày bắt đầu của sự kiện và tính toán khoảng thời gian
                    const eventDate = new Date(event.start);
                    const today = new Date();
                    const sevenDaysAgo = new Date();
                    sevenDaysAgo.setDate(today.getDate() - 7);

                    // Tính toán ngày mai
                    const tomorrow = new Date();
                    tomorrow.setDate(today.getDate() + 1);

                    // Kiểm tra xem event có phải là loại "actual-"
                    const isActualEvent = event.id && event.id.startsWith('actual-');

                    // Kiểm tra TagName có khớp hay không (trong extendedProps.events)
                    const hasMatchingTagName = event.extendedProps?.events?.some(e => e.TagName === tagName);

                    // Kiểm tra xem ngày sự kiện có nằm trong khoảng thời gian không
                    const isWithinDateRange = eventDate >= sevenDaysAgo && eventDate <= tomorrow;

                    // Kết quả cuối cùng
                    return isActualEvent && hasMatchingTagName && isWithinDateRange;
                });


                //Tìm kiếm event có cùng TagName phía trước
                const previousEvent = allEvents
                    .filter(event => event.extendedProps.events.some(e => e.ActualReceivedId < actualReceived.ActualReceivedId))
                    .sort((a, b) => b.extendedProps.events[0].ActualReceivedId - a.extendedProps.events[0].ActualReceivedId)[0];
                //console.log('previousEvent:', previousEvent);

                //Nếu có event phía trước
                if (previousEvent) {
                    //console.log('Có event trước');
                    const previousEventTime = new Date(previousEvent.extendedProps.events[0].ActualDeliveryTime).getTime();

                    const currentEventTime = new Date(actualReceived.ActualDeliveryTime).getTime();

                    //Kiểm tra xem DELIVERYTIME của event sau có cách DELIVERYTIME của event trước 10p không
                    //
                    //Trường hợp < 10p
                    if ((currentEventTime - previousEventTime) <= 10 * 60 * 1000) {
                        //Lấy ra Id của event trước (ko phải id của object mà là id của lịch )
                        const previousEventIds = previousEvent.id.split('-')[1].split('+');
                        //Nếu có trong id gộp thì cập nhật end
                        if (previousEventIds.includes(actualReceived.ActualReceivedId.toString())) {
                            //console.log('Cập nhật end của id gộp');
                            previousEvent.setEnd(formattedEnd);
                        }
                        //Nếu không có thì gộp event và cập nhật lại id
                        else {
                            updateActualReceivedList();
                            //console.log('Gộp id và event');
                            const newId = `actual-${previousEventIds.join('+')}+${actualReceived.ActualReceivedId}`;
                            const updatedEvents = [...(previousEvent.extendedProps.events || []), actualReceived];
                            previousEvent.setEnd(formattedEnd);
                            previousEvent.setExtendedProp('events', updatedEvents);
                            previousEvent.setProp('id', newId);
                            //console.log('Không có Id cần cập nhật trong id trước');
                        }
                    }
                    //Trường hợp > 10p thì tạo event mới
                    else {
                        if (existingEvent) {
                            //console.log('Update leadtime sự kiện trong trường hợp event sau lớn hơn trươc 10p:');
                            const existingEventIds = existingEvent.id.split('-')[1].split('+');
                            if (existingEventIds.includes(actualReceived.ActualReceivedId.toString())) {
                                if (!actualReceived.IsCompleted) {
                                    existingEvent.setEnd(formattedEnd);
                                }
                            }
                        } else {
                            updateActualReceivedList();
                            //console.log('ADD sự kiện trong trường hợp event sau lớn hơn trươc 10p:');
                            calendar.addEvent({
                                id: `actual-${actualReceived.ActualReceivedId}`,
                                title: tagName,
                                start: formattedStart,
                                end: formattedEnd,
                                resourceId: `${tagName}_Actual`,
                                extendedProps: {
                                    events: [actualReceived]
                                }
                            });
                            // Log the extendedProps of the newly added event
                            let newEvent = calendar.getEventById(`actual-${actualReceived.ActualReceivedId}`);
                            //console.log("Event vừa add nè: ", newEvent.extendedProps);
                        }
                    }
                }
                //Nếu ko có event trước
                else {
                    if (existingEvent) {
                        //console.log('cập nhật End không có event trước:');

                        const existingEventIds = existingEvent.id.split('-')[1].split('+');
                        if (existingEventIds.includes(actualReceived.ActualReceivedId.toString())) {
                            if (!actualReceived.IsCompleted) {
                                existingEvent.setEnd(formattedEnd);
                            }
                        }
                    } else {
                        updateActualReceivedList();
                        //console.log('ADD sự kiện trong trường hợp không có event trước:');
                        calendar.addEvent({
                            id: `actual-${actualReceived.ActualReceivedId}`,
                            title: tagName,
                            start: formattedStart,
                            end: formattedEnd,
                            resourceId: `${tagName}_Actual`,
                            extendedProps: {
                                events: [actualReceived],
                            }
                        });
                    }
                }
            }

        }).catch(error => {
            console.error("Error fetching tagNameRules:", error);
        });
    }


    /**
    * Cập nhật sự kiện actual khi các thông tin thay đổi (Phần đưa lên rack)
    */
    /*function updateCalendarEventStorage(actualReceived) {
        const actualDeliveryTime = new Date(actualReceived.ActualDeliveryTime);
        const actualLeadTime = actualReceived.ActualLeadTime;

        const [hours, minutes, seconds] = actualLeadTime.split(':').map(Number);
        const leadTimeInMilliseconds = (hours * 3600 + minutes * 60 + seconds) * 1000;
        const start = new Date(actualDeliveryTime.getTime() + leadTimeInMilliseconds);
        const end = new Date(start);
        const now = new Date();

        if (actualReceived.ActualStorageTime) {
            const leadTimeParts = actualReceived.ActualStorageTime.split(':');
            const hours = parseInt(leadTimeParts[0], 10);
            let minutes = parseInt(leadTimeParts[1], 10);
            const seconds = parseInt(leadTimeParts[2], 10);

            end.setHours(end.getHours() + hours);
            end.setMinutes(end.getMinutes() + minutes);
            end.setSeconds(end.getSeconds() + seconds);
        } else {
            now.setHours(now.getHours() + 1);
        }
        //Cộng 4 phút để không bị trùng lên phần event scan
        start.setMinutes(start.getMinutes() + 4);

        const formattedStart = formatDateTime(start);
        //const formattedEnd = formatDateTime(end);
        const formattedEnd = formatDateTime(now);

        //Tìm event storage đã tồn tại trong lịch
        let existingEvent = calendar.getEvents().find(event => {
            if (event.id.startsWith('storage-')) {
                return event.id.replace('storage-', '').split('+').some(id => id === actualReceived.ActualReceivedId.toString());
            }
            return false;
        });


        //Lấy ra tagNameRules (VD:KCN,HCM,..)
        getTagNameRules().then(tagNameRules => {
            //Tìm xem code của actualReceived có trong tagNameRules không
            const tagNameRule = tagNameRules.find(rule => rule.SupplierCode === actualReceived.SupplierCode);
            let tagName = actualReceived.SupplierCode;

            //Không có thì làm như bình thường
            if (!tagNameRule) {
                if (existingEvent) {
                    existingEvent.setEnd(formattedEnd);
                } else {
                    calendar.addEvent({
                        id: `storage-${actualReceived.ActualReceivedId}`,
                        title: actualReceived.SupplierName,
                        start: formattedStart,
                        end: formattedEnd,
                        resourceId: `${tagName}_Actual`,
                        backgroundColor: '#9570AF',
                        extendedProps: {
                            events: [actualReceived]
                        }
                    });
                }
            }
            //Có tagrule
            else {
                tagName = tagNameRule.TagName;
                //Lấy ra tất cả các event có cùng TagName trong 7 ngày 
                const allEvents = calendar.getEvents().filter(event => {
                    const eventDate = new Date(event.start);
                    const today = new Date();
                    const sevenDaysAgo = new Date();
                    sevenDaysAgo.setDate(today.getDate() - 7);

                    return event.id.startsWith('storage-') &&
                        event.extendedProps.events.some(e => e.TagName === tagName) &&
                        eventDate >= sevenDaysAgo && eventDate <= today;
                });


                //Tìm kiếm event có cùng TagName phía trước
                const previousEvent = allEvents
                    .filter(event => event.extendedProps.events.some(e => e.ActualReceivedId < actualReceived.ActualReceivedId))
                    .sort((a, b) => b.extendedProps.events[0].ActualReceivedId - a.extendedProps.events[0].ActualReceivedId)[0];

                //Nếu có event phía trước
                if (previousEvent) {

                    const previousEventTime = new Date(previousEvent.extendedProps.events[0].ActualDeliveryTime).getTime();

                    const currentEventTime = new Date(actualReceived.ActualDeliveryTime).getTime();

                    //Kiểm tra xem DELIVERYTIME của event sau có cách DELIVERYTIME của event trước 10p không
                    //
                    //Trường hợp < 10p
                    if ((currentEventTime - previousEventTime) <= 10 * 60 * 1000) {
                        //Lấy ra Id của event trước (ko phải id của object mà là id của lịch )
                        const previousEventIds = previousEvent.id.split('-')[1].split('+');
                        //Nếu có trong id gộp thì cập nhật end
                        if (previousEventIds.includes(actualReceived.ActualReceivedId.toString())) {
                            previousEvent.setEnd(formattedEnd);
                        }
                        //Nếu không có thì gộp event và cập nhật lại id
                        else {
                            const newId = `storage-${previousEventIds.join('+')}+${actualReceived.ActualReceivedId}`;
                            const updatedEvents = [...(previousEvent.extendedProps.events || []), actualReceived];
                            previousEvent.setEnd(formattedEnd);
                            previousEvent.setExtendedProp('events', updatedEvents);
                            previousEvent.setProp('id', newId);
                            console.log('Không có Id cần cập nhật trong id trước');
                        }
                    }
                    //Trường hợp > 10p thì tạo event mới
                    else {
                        if (existingEvent) {
                            console.log('Update leadtime sự kiện trong trường hợp event sau lớn hơn trươc 10p:');
                            const existingEventIds = existingEvent.id.split('-')[1].split('+');
                            if (existingEventIds.includes(actualReceived.ActualReceivedId.toString())) {
                                existingEvent.setEnd(formattedEnd);
                            }
                        } else {
                            console.log('ADD sự kiện trong trường hợp event sau lớn hơn trươc 10p:');
                            calendar.addEvent({
                                id: `storage-${actualReceived.ActualReceivedId}`,
                                title: tagName,
                                start: formattedStart,
                                end: formattedEnd,
                                resourceId: `${tagName}_Actual`,
                                backgroundColor: '#9570AF',
                                extendedProps: {
                                    events: [actualReceived]
                                }
                            });
                        }
                    }
                }
                //Nếu ko có event trước
                else {
                    if (existingEvent) {
                        const existingEventIds = existingEvent.id.split('-')[1].split('+');
                        if (existingEventIds.includes(actualReceived.ActualReceivedId.toString())) {
                            existingEvent.setEnd(formattedEnd);
                        }
                    } else {
                        calendar.addEvent({
                            id: `storage-${actualReceived.ActualReceivedId}`,
                            title: tagName,
                            start: formattedStart,
                            end: formattedEnd,
                            resourceId: `${tagName}_Actual`,
                            backgroundColor: '#9570AF',
                            extendedProps: {
                                events: [actualReceived],
                            }
                        });

                    }
                }
            }

        }).catch(error => {
            console.error("Error fetching tagNameRules:", error);
        });
    }*/
    calendar.render();

    // Tự động cuộn ngay khi lịch được hiển thị
    setTimeout(() => {
        autoScrollToCurrentTime(calendarEl);
    }, 500);

    /**
     * Lấy ngày hiện tại để trả về resource controller để hiển thị dynamic theo ngày
     */
    function getCurrentDate(dateNow) {

        const today = new Date().toISOString().split('T')[0];
        const dateToUse = dateNow ? dateNow : today;
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
    window.addEventListener("beforeunload", function (e) {
        e.preventDefault();
        
        e.returnValue = 'Are you sure you want to reload or leave this page?';
    });
    //window.addEventListener('beforeunload', function (e) {
    //    // Standard message is ignored by most browsers, but returning a value triggers the dialog
    //    e.preventDefault();
    //    //e.returnValue = 'Are you sure you want to reload or leave this page?';
    //});


    /**
     * Định nghĩa ra resource để hiển thị trên lịch (FullCalendar)
     */
    function fetchResources(weekdayId) {
        return fetch(`/api/ResourcesReceivedTLIP?weekdayId=${weekdayId}`)
            .then(response => response.json());
    }

    //Tải nhà cung cấp lên khi tải trang 
    loadSuppliersForToday();
    updateActualReceivedList();

    //Ẩn hai bút supplier list và ....
    document.getElementById('toggleButtons').addEventListener('click', function () {
        var buttonContainer = document.getElementById('buttonContainer');
        if (buttonContainer.style.display === 'none') {
            buttonContainer.style.display = 'flex';
        } else {
            buttonContainer.style.display = 'none';
        }
    });
    $(document).on('click', '[id^="delayButton-"]', function () {
        var planDetailId = this.id.replace('delayButton-', '');
        console.log('Clicked delayButton, planDetailId:', planDetailId);
        if (!planDetailId || isNaN(planDetailId)) {
            alert('Invalid plan detail ID.');
            return;
        }
        $('#delayPlanDetailId').val(planDetailId);
        $(`#planModal-${planDetailId}`).modal('hide');
        $(`#delayModal`).modal('show');
    });

    $('#confirmDelayBtn').off('click').on('click', function () {
      
    });

});


