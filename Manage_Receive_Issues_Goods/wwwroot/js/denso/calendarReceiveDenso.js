//CẢNH BÁO: CODE KHÓ ĐỌC, HÃY CỐ HIỂU ^^  DO CODE NÀY VIẾT KHI CHƯA CÓ KINH NGHIÊM CHIA CLASS VỚI JS!!!!!!!!!!

document.addEventListener('DOMContentLoaded', function () {

    var calendarEl = document.getElementById('calendar');
    var notificationDismissed = false;


    console.log("Plandetail  nè:", planDetails);
    console.log("Past Plandetail  nè:", pastPlanDetails);
    console.log("Current effectivedate  nè:", currentPlanEffectiveDate);

    // Tạo kết nối SignalR với Hub
    var connection = new signalR.HubConnectionBuilder().withUrl("/updateReceiveDensoHub").build();

    connection.start().then(function () {
        console.log("SignalR connected.");
    }).catch(function (err) {
        return console.error(err.toString());
    });

    // Lắng nghe sự kiện cập nhật
    connection.on("ReceiveUpdate", function (message) {
        console.log("Received SignalR update:", message);
        fetchUpdatedEvents(); 
    });

    // Lắng nghe sự kiện xóa
    connection.on("EventDeleted", function (eventId) {
        console.log("Event deleted:", eventId);
        location.reload(); // Reload the page
    });

    /**
    * Hàm để cập nhật actual event
    */
    function fetchUpdatedEvents() {
        fetch('/DensoWarehouse/GetUpdatedEventsReceived')
            .then(response => response.json())
            .then(data => { 
                console.log('Plan details:', data.planDetails);
                console.log('Current EffectiveDate:', data.currentPlanEffectiveDate);
                console.log('Next EffectiveDate:', data.nextPlanEffectiveDate);
                console.log('PastPlanDetails:', data.pastPlanDetails);

                // Tạo danh sách các sự kiện mới
                const today = new Date().toISOString().split('T')[0];
                console.log("Today:", today);
                const newEvents = [];
                let resourceIdCounterSequence = 2;

                data.planDetails.forEach(detail => {
                    if (detail.Actuals && detail.Actuals.length > 0) {
                        detail.Actuals.forEach(actual => {
                            const actualDate = new Date(actual.ActualTime);
                            const actualDateString = actualDate.toISOString().split('T')[0];

                            if (actualDateString === today) {
                                const actualStartTime = `${actualDateString}T${actualDate.toTimeString().split(' ')[0]}`;
                                console.log("actualStartTime nè nè: ",actualStartTime);
                                const actualEndDate = new Date(actualDate.getTime() + 60 * 60000); // Thêm 1 giờ cho thời gian kết thúc
                                const actualEndTime = `${actualEndDate.toISOString().split('T')[0]}T${actualEndDate.toTimeString().split(' ')[0]}`;

                                // Tạo sự kiện mới cho Actual
                                const newEvent = {
                                    id: `actual-${actual.ActualId}`,
                                    title: `Chuyến ${detail.PlanDetailName}`,
                                    start: actualStartTime,
                                    end: actualEndTime,
                                    resourceId: resourceIdCounterSequence,
                                    extendedProps: {
                                        hasActual: true,
                                        userName: actual.UserName
                                    }
                                };
                                newEvents.push(newEvent);

                                const existingEvent = calendar.getEventById(newEvent.id);
                                if (existingEvent) {
                                    console.log("Existing event:", existingEvent );
                                    existingEvent.remove(); 
                                }
                            }            
                        });
                    }
                    resourceIdCounterSequence += 2;
                });

                // Thêm tất cả các sự kiện mới vào calendar
                newEvents.forEach(newEvent => {
                    calendar.addEvent(newEvent);
                });
                //location.reload();
                console.log('Updated events fetched and added:', data);
            })
            .catch(error => console.error('Error fetching updated events:', error));
    }

    /**
     * Lấy thời gian thực cho Indicator
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
    var now = getFormattedNow();


    /**
     * Chuyển đổi ngày thành chuỗi ở định dạng YYYY-MM-DD
     */
    function formatDateToLocalString(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
    * Tạo sự kiện hàng ngày dựa trên kế hoạch quá khứ, hiện tại và kế hoạch tiếp theo
    */
    function generateDailyEvents(planDetails, currentPlanEffectiveDate, nextPlanEffectiveDate, pastPlanDetails) {
        const events = [];
        const today = new Date();
        const todayString = today.toISOString().split('T')[0];
        const currentPlanStartDate = new Date(currentPlanEffectiveDate);
        const nextPlanStartDate = nextPlanEffectiveDate ? new Date(nextPlanEffectiveDate) : null;


        // Hiển thị quá khứ plan và actual theo actualtime
        function addEventsBasedOnActualTime(details) {
            let resourceIdCounterPast = 1;
            details.forEach(detail => {

                if (detail.Actuals && detail.Actuals.length > 0) {
                    detail.Actuals.forEach(actual => {
                        console.log("Actual:", actual);
                        const actualDate = new Date(actual.ActualTime);
                        const actualYear = actualDate.getFullYear();
                        const actualMonth = String(actualDate.getMonth() + 1).padStart(2, '0');
                        const actualDay = String(actualDate.getDate()).padStart(2, '0');
                        const actualDateString = `${actualYear}-${actualMonth}-${actualDay}`;

                        // Hiển thị sự kiện PlanDetail dựa trên ActualTime
                        const actualDate_Compare = actualDate.toISOString().split('T')[0];
                        if (actualDate_Compare !== todayString) {
                            const planStartTime = `${actualDateString}T${detail.PlanTimeReceived}`;
                            const [hours, minutes] = detail.PlanTimeReceived.split(':').map(Number);
                            const planEndTime = `${actualDateString}T${String(hours + 1).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;

                            events.push({
                                id: `plan-${detail.PlanDetailId}-actual-${actualDateString}`,
                                title: `Chuyến ${detail.PlanDetailName}`,
                                start: planStartTime,
                                end: planEndTime,
                                resourceId: resourceIdCounterPast,
                                extendedProps: {
                                    hasActual: true,
                                    planDetailId: detail.PlanDetailId,
                                    resourceId: resourceIdCounterPast
                                }
                            });
                        }

                        // Hiển thị sự kiện Actual dựa trên ActualTime
                        const actualStartTime = `${actualDateString}T${actualDate.toTimeString().split(' ')[0]}`;
                        const actualEndDate = new Date(actualDate.getTime() + 60 * 60000); // Thêm 1 giờ cho thời gian kết thúc
                        const actualEndTime = `${actualEndDate.getFullYear()}-${String(actualEndDate.getMonth() + 1).padStart(2, '0')}-${String(actualEndDate.getDate()).padStart(2, '0')}T${actualEndDate.toTimeString().split(' ')[0]}`;

                        events.push({
                            id: `actual-${actual.ActualId}`,
                            title: `Chuyến ${detail.PlanDetailName}`,
                            start: actualStartTime,
                            end: actualEndTime,
                            resourceId: resourceIdCounterPast + 1,
                            extendedProps: {
                                hasActual: true,
                                userName: actual.UserName
                            }
                        });
                    });
                }
                resourceIdCounterPast += 2;
            });
        }

        // Hiển thị các plandetail trong quá khứ
        addEventsBasedOnActualTime(pastPlanDetails);

        //Khởi tạo biến đếm resourceId để hiển thị theo từng line
        let resourceIdCounter = 1;
        // Hiển thị plandetail hiện tại và tương lai
        planDetails.forEach(detail => {

            // Hiển thị các PlanDetail từ hiện tại đến trước ngày của kế hoạch tiếp theo
            if (!nextPlanStartDate || today < nextPlanStartDate) {
                let startDate = new Date(Math.max(today.getTime(), currentPlanStartDate.getTime()));
                const endDate = nextPlanStartDate || new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
                while (startDate < endDate) {
                    const year = startDate.getFullYear();
                    const month = String(startDate.getMonth() + 1).padStart(2, '0');
                    const day = String(startDate.getDate()).padStart(2, '0');
                    const dateString = `${year}-${month}-${day}`;
                    const start = `${dateString}T${detail.PlanTimeReceived}`;
                    const [hours, minutes] = detail.PlanTimeReceived.split(':').map(Number);
                    const endHours = hours + 1;
                    const end = `${dateString}T${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
                    events.push({
                        id: `plan-${detail.PlanDetailId}-${dateString}`,
                        title: `Chuyến ${detail.PlanDetailName}`,
                        start: start,
                        end: end,
                        resourceId: resourceIdCounter,
                        extendedProps: {
                            hasActual: false,
                            planDetailId: detail.PlanDetailId,
                            planDetailName: detail.PlanDetailName,
                            isLate: false,
                            resourceId: resourceIdCounter
                        }
                    });
                    // Tăng ngày để lặp lại sự kiện
                    startDate.setDate(startDate.getDate() + 1);
                }
            }

            // Kiểm tra nếu PlanDetail hôm nay đã có Actual chưa
            const hasActualForToday = detail.Actuals && detail.Actuals.some(actual => {
                const actualDate = new Date(actual.ActualTime);
                const actualDateString = formatDateToLocalString(actualDate);
                return actualDateString === todayString;
            });

            //PlanDetail có Actual thì hiển thị Actual
            if (hasActualForToday) {
                detail.Actuals.forEach(actual => {
                    const actualDate = new Date(actual.ActualTime);
                    const actualDateString = formatDateToLocalString(actualDate);
                    if (actualDateString === todayString) {
                        const actualStartTime = `${todayString}T${actualDate.toTimeString().split(' ')[0]}`;
                        const actualEndDate = new Date(actualDate.getTime() + 60 * 60000); // Thêm 1 giờ cho thời gian kết thúc
                        const actualEndTime = `${actualEndDate.getFullYear()}-${String(actualEndDate.getMonth() + 1).padStart(2, '0')}-${String(actualEndDate.getDate()).padStart(2, '0')}T${actualEndDate.toTimeString().split(' ')[0]}`;
/*
                        events.push({
                            id: `actual-${actual.ActualId}`,
                            title: `Chuyến ${detail.PlanDetailName}`,
                            start: actualStartTime,
                            end: actualEndTime,
                            resourceId: resourceIdCounter + 1,
                            extendedProps: { hasActual: true }
                        });*/

                        // Cập nhật sự kiện PlanDetail để hasActual thành true
                        const planEvent = events.find(event => event.id === `plan-${detail.PlanDetailId}-${todayString}`);
                        if (planEvent) {
                            planEvent.extendedProps.hasActual = true;
                        }
                    }
                });
            }
            // Tăng resourceIdCounter lên 2 để hiển thị sự kiện Actual
            resourceIdCounter += 2;
        });
        console.log("All Events Generated:", events);
        return events;
    }
    fetchUpdatedEvents();


  


    /**
     * Confirm chuyến hàng đã đến
     */
    function confirmActual(planDetailId, planDetailName) {
        var now = new Date();
        var formattedNow = now.getFullYear() + '-'
            + String(now.getMonth() + 1).padStart(2, '0') + '-'
            + String(now.getDate()).padStart(2, '0') + 'T'
            + String(now.getHours()).padStart(2, '0') + ':'
            + String(now.getMinutes()).padStart(2, '0') + ':'
            + String(now.getSeconds()).padStart(2, '0');

        fetch('/DensoWarehouse/AddActualReceived', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                PlanDetailId: planDetailId,
                PlanDetailName: planDetailName,
                ActualTime: formattedNow
            })
        })
            .then(response => response.json())
            .then(data => {
                //Thêm actual mà không cần tải lại trang
                if (data.success) {
                    console.log('Response from server:', data);

                    const todayString = formattedNow.split('T')[0];
                    var planEvent = calendar.getEventById(`plan-${planDetailId}-${todayString}`);
                    console.log("Plan Event:", planEvent);

                    if (planEvent) {
                        planEvent.setExtendedProp('hasActual', true);
                        planEvent.setExtendedProp('isLate', false);
                        console.log('Updated PlanDetail with hasActual:', planEvent);
                    } else {
                        console.log('PlanDetail event not found for update.');
                    }
                    // Ẩn nút Confirm của plandetail đã được confirm
                    var confirmButton = document.getElementById('confirmButton');
                    if (confirmButton) {
                        confirmButton.style.display = 'none';
                    }
                    // Ẩn modal chi tiết sự kiện (eventModal)
                    var detailModal = document.getElementById('eventModal');
                    var bootstrapModal = bootstrap.Modal.getInstance(detailModal);
                    bootstrapModal.hide();
                    // Hiển thị modal thông báo thành công
                    var successModal = new bootstrap.Modal(document.getElementById('successModal'));
                    successModal.show();
                  // location.reload();
                } else {
                    console.log('Error from server:', data);
                    alert('Error confirming actual.');
                }
            })
            .catch(error => console.error('Error:', error));
    }

    let deleteActualId = null; // Biến lưu trữ ID của Actual cần xóa

    /**
     * Xóa Actual
     */
    function confirmDelete(actualId) {
        // Lưu lại Actual ID để xóa sau khi người dùng xác nhận
        deleteActualId = actualId;

        // Hiển thị modal xác nhận xóa
        var deleteModalElement = document.getElementById('deleteConfirmModal');
        var deleteModal = new bootstrap.Modal(deleteModalElement);
        deleteModal.show();
    }

    // Khi người dùng nhấn nút "Xóa" trong modal xác nhận
    document.getElementById('confirmDeleteBtn').addEventListener('click', function () {
        if (deleteActualId) {
            fetch(`/DensoWarehouse/DeleteActualReceived/${deleteActualId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        console.log('Actual deleted successfully.');
                        connection.invoke("EventDeleted", deleteActualId).catch(function (err) {
                            return console.error(err.toString());
                        });
                        // Xóa sự kiện khỏi lịch
                        calendar.getEventById(`actual-${deleteActualId}`).remove();

                        // Ẩn modal xác nhận xóa
                        var deleteModalElement = document.getElementById('deleteConfirmModal');
                        var deleteModal = bootstrap.Modal.getInstance(deleteModalElement);
                        deleteModal.hide();

                        // Ẩn modal chi tiết sự kiện (eventModal)
                        var eventModalElement = document.getElementById('eventModal');
                        var eventModal = bootstrap.Modal.getInstance(eventModalElement);
                        eventModal.hide();

                        
                        // Reload lại trang
                        location.reload();
                    } else {
                        alert('Error deleting actual.');
                    }
                })
                .catch(error => console.error('Error:', error));
        }
    });


    /**
   * Kiểm tra xem chuyến hàng có bị muộn không (Plandetail chưa được confirm)
   */
    function checkForLateShipments(planDetails) {
        const now = new Date();
        const todayString = now.toISOString().split('T')[0]; // Ngày hôm nay ở định dạng YYYY-MM-DD

        planDetails.forEach(detail => {
            const planTimeParts = detail.PlanTimeReceived.split(':');
            const planDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), planTimeParts[0], planTimeParts[1]);
            const fifteenMinutesAfterPlanTime = new Date(planDate.getTime() + 15 * 60000); // Thêm 15 phút

            // Kiểm tra nếu PlanTime là hôm nay và hiện tại đã quá 15 phút so với PlanTime
            if (now.toISOString().split('T')[0] === formatDateToLocalString(planDate) && now > fifteenMinutesAfterPlanTime) {
                // Kiểm tra nếu không có Actual cho hôm nay
                const hasActualForToday = detail.Actuals && detail.Actuals.some(actual => {
                    const actualDate = new Date(actual.ActualTime);
                    const actualDateString = formatDateToLocalString(actualDate);
                    return actualDateString === todayString;
                });

                // Nếu không có Actual cho hôm nay, đánh dấu chuyến hàng bị muộn
                if (!hasActualForToday && !notificationDismissed) {
                    const event = calendar.getEventById(`plan-${detail.PlanDetailId}-${todayString}`);
                    if (event) {
                        // Đặt isLate để cập nhật icon cảnh báo
                        event.setExtendedProp('isLate', true);
                        console.log(`Shipment ${detail.PlanDetailName} is late!`);
                    }
                    toastr.warning("Please check if the shipment is late if not please confirm status", null, {
                        timeOut: 10000,
                        extendedTimeOut: 0,
                        closeButton: true,
                        progressBar: true,
                        positionClass: 'toast-top-center',
                        onHidden: function () {
                            notificationDismissed = true;
                            clearInterval(notificationInterval);
                        }
                    });
                }
            }
        });
    }

    //Lặp lại thông báo mỗi 10 giây cho đên skhi được confirm
    var notificationInterval = setInterval(() => {
        checkForLateShipments(planDetails);
    }, 10000);

    /**
     * Render icon cảnh báo nếu đến muộn
     */
    function eventContent(arg) {
        let content = document.createElement('div');
        content.classList.add('centered-event');
        // Tạo phần tử icon
        if (arg.event.extendedProps.isLate) {
            let icon = document.createElement('i');
            icon.classList.add('fa', 'fa-exclamation-triangle'); // Thay đổi class icon theo ý muốn, ví dụ: 'fa-calendar'
            icon.style.color = 'red'; // Thay đổi màu icon thành đỏ
            content.appendChild(icon);
        }
        // Thêm tiêu đề vào content
        content.innerHTML += ` ${arg.event.title}`;
        return { domNodes: [content] };
    }


    //Khởi tạo lịch
    var calendar = new FullCalendar.Calendar(calendarEl, {
        schedulerLicenseKey: 'CC-Attribution-NonCommercial-NoDerivatives',
        initialView: 'resourceTimelineDay',
        slotDuration: '01:00',
        slotLabelInterval: '00:30',
        slotLabelFormat: {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        },
        slotMinTime: '00:00:00',
        slotMaxTime: '24:00:00',
        stickyFooterScrollbar: 'auto',
        resourceAreaWidth: '110px',
        height: 1100,
        nowIndicator: true,
        now: now,
        timeZone: 'Asia/Bangkok',
        locale: 'en-GB',
        aspectRatio: 2.0,
        headerToolbar: {
            left: 'prev,next',
            center: 'title',
            right: 'resourceTimelineDay,resourceTimelineWeek,resourceTimelineYear'
        },
        editable: false,
        resourceAreaHeaderContent: 'Details/Hour',
        resources: '/api/ResourcesReceivedDenso',
        resourceOrder: 'order',
        events: generateDailyEvents(planDetails, currentPlanEffectiveDate, nextPlanEffectiveDate, pastPlanDetails),
        eventClick: function (info) {
            console.log("Event Clicked:", info.event);
            // Lấy ngày hôm nay ở định dạng YYYY-MM-DD
            const today = new Date();
            const todayString = today.toISOString().split('T')[0];

            // Lấy ngày từ thời gian bắt đầu của sự kiện được click
            const eventDate = new Date(info.event.start).toISOString().split('T')[0];
            console.log("Infor Start:", eventDate);
            // Lấy các thông tin cần thiết từ sự kiện
            const hasActual = info.event.extendedProps.hasActual;                   
            console.log("Has Actual:", hasActual);  
            const planDetailId = info.event.extendedProps.planDetailId;
            const planDetailName = info.event.extendedProps.planDetailName;

            // Hiển thị chi tiết sự kiện trong modal
            document.getElementById('eventDetails').innerHTML = `${info.event.title}<br><i><strong>Nhận lúc: ${new Date(info.event.start).toLocaleString('vi-VN', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit' })}</strong>`;
            if (info.event.id.startsWith('actual')) {
                document.getElementById('eventDetails').innerHTML += `<br><i><strong>PIC:</strong> <u>${info.event.extendedProps.userName}</u></i>`;
            }
            // Điều chỉnh nút Confirm dựa trên điều kiện
            const confirmButton = document.getElementById('confirmButton');
            if (confirmButton) {
                // Chỉ hiển thị nút Confirm nếu sự kiện thuộc về ngày hôm nay và chưa có Actual
                if (eventDate === todayString && !hasActual) {
                    confirmButton.style.display = 'block';
                    confirmButton.onclick = function () {
                        confirmActual(planDetailId, planDetailName);
                    };
                } else {
                    confirmButton.style.display = 'none';
                }
            }
                                                    
            // Điều chỉnh nút Delete nếu sự kiện là Actual
            const deleteButton = document.getElementById('deleteButton');
            if (deleteButton) {
                if (info.event.id.startsWith('actual')) {
                    deleteButton.style.display = 'block';
                    deleteButton.onclick = function () {
                        confirmDelete(info.event.id.split('-')[1]);
                    };
                } else {
                    deleteButton.style.display = 'none';
                }
            }

            // Hiển thị modal chi tiết sự kiện
            const modalElement = document.getElementById('eventModal');
            if (modalElement) {
                const myModal = new bootstrap.Modal(modalElement);
                myModal.show();
            }
        },
        views: {
            resourceTimelineDay: {
                titleFormat: { day: '2-digit', month: '2-digit', year: 'numeric' }
            },
            resourceTimelineWeek: {
                titleFormat: { day: '2-digit', month: '2-digit', year: 'numeric' }
            }
        },
        resourceLaneClassNames: function (arg) {
            if (arg.resource.title === "Actual") {
                return ['gray-background'];
            }
            return ['white-background'];
        },
        resourceLabelClassNames: function (arg) {
            if (arg.resource.title === "Actual") {
                return ['gray-background'];
            }
            return ['white-background'];
        },
        eventContent: eventContent,
        slotLabelContent: function (arg) {
            return { html: `<i style="color: blue;">${arg.text}</i>` };
        },
        slotLabelClassNames: function (arg) {
            return ['custom-slot-label'];
        }
    });
    ;

    calendar.render();
});

