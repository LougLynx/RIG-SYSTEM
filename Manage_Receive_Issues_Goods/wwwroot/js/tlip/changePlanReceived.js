document.addEventListener('DOMContentLoaded', function () {
    var Calendar = FullCalendar.Calendar;
    var Draggable = FullCalendar.Draggable;

    var containerEl = document.getElementById('external-events');
    var calendarEl = document.getElementById('calendar');
    //var checkbox = document.getElementById('drop-remove');
    var inputExcel = document.getElementById('input-excel');
    var colorPicker = document.getElementById('color-picker');
    var planNameInput = document.getElementById('plan-name');
    var feedbackEl = document.createElement('div');
    feedbackEl.id = 'feedback';
    document.body.appendChild(feedbackEl);

    // Khởi tạo các event bên ngoài để kéo thả
    // -----------------------------------------------------------------

    new Draggable(containerEl, {
        itemSelector: '.fc-event',
        eventData: function (eventEl) {
            return {
                title: eventEl.innerText,
                backgroundColor: colorPicker.value,
                borderColor: colorPicker.value
            };
        }
    });

    // Khởi tạo lịch
    // -----------------------------------------------------------------

    var calendar = new Calendar(calendarEl, {
        schedulerLicenseKey: 'CC-Attribution-NonCommercial-NoDerivatives',
        initialView: 'resourceTimelineWeek',
        headerToolbar: {
            left: '',
            right: ''
        },
        slotDuration: '00:30',
        // Mỗi slot cách nhau 1 tiếng
        slotLabelInterval: '00:30',
        resourceAreaWidth: '100px',
        resourceAreaHeaderContent: 'Thứ/Giờ',
        resources: [
            { id: '1', title: 'Thứ 2' },
            { id: '2', title: 'Thứ 3' },
            { id: '3', title: 'Thứ 4' },
            { id: '4', title: 'Thứ 5' },
            { id: '5', title: 'Thứ 6' },
            { id: '6', title: 'Thứ 7' },
        ],
        /*  events: [
              { id: '1', resourceId: '1', start: '2024-11-11T09:00:00', end: '2024-11-11T14:00:00', title: 'event 1', backgroundColor: '#ff9f89', borderColor: '#ff9f89' }
          ],*/
        validRange: {
            start: '2024-11-11', // Thứ Hai
            end: '2024-11-17' // Chủ Nhật
        },
        hiddenDays: [0, 2, 3, 4, 5, 6], // Ẩn Tất cả các thứ trừ thứ 2
        editable: true,
        droppable: true, // Cho phép kéo thả
        aspectRatio: 2.0,
        height: 'auto',
        slotLabelClassNames: function (arg) {
            const grayBackgroundTimes = [
                { hours: 10, minutes: 0 },
                { hours: 14, minutes: 0 },
                { hours: 17, minutes: 30 },
                { hours: 22, minutes: 0 },
                { hours: 1, minutes: 30 }
            ];

            return grayBackgroundTimes.some(time =>
                arg.date.getHours() === time.hours && arg.date.getMinutes() === time.minutes
            ) ? ['gray-background'] : [];
        },
        slotLaneClassNames: function (arg) {
            const grayBackgroundTimes = [
                { hours: 10, minutes: 0 },
                { hours: 14, minutes: 0 },
                { hours: 17, minutes: 30 },
                { hours: 22, minutes: 0 },
                { hours: 1, minutes: 30 }
            ];

            return grayBackgroundTimes.some(time =>
                arg.date.getHours() === time.hours && arg.date.getMinutes() === time.minutes
            ) ? ['gray-background'] : [];
        },
        resourceLaneClassNames: function (arg) {
            return ['white-background'];
        },
        resourceLabelClassNames: function (arg) {
            return ['white-background'];
        },
        eventDidMount: function (info) {
            var eventStart = info.event.start;
            var eventEnd = info.event.end;

            console.log('Event start:', eventStart.getHours());

            if (eventStart.getHours() >= 6 && eventStart.getHours() < 14) {
                 info.el.style.backgroundColor = '#C2B742';
                info.el.style.borderColor = '#C2B742';
            } else if (eventStart.getHours() >= 14 && eventStart.getHours() < 22) {
                info.el.style.backgroundColor = '#FF9F89';
                info.el.style.borderColor = '#FF9F89';
            } else {
                info.el.style.backgroundColor = '#9CBF69';
                info.el.style.borderColor = '#9CBF69';
            }
        },
        eventClick: function (info) {
            // Hiện bảng màu khi ấn vào event
            colorPicker.style.display = 'block';
            colorPicker.value = info.event.backgroundColor;
            colorPicker.oninput = function () {
                info.event.setProp('backgroundColor', colorPicker.value);
                info.event.setProp('borderColor', colorPicker.value);
            };

            // Xóa icon thùng rác hiện tại nếu có
            var existingTrashIcon = document.getElementById('trash-icon');
            if (existingTrashIcon) {
                document.body.removeChild(existingTrashIcon);
            }

            // Tạo icon thùng rác
            var trashIcon = document.createElement('span');
            trashIcon.id = 'trash-icon';
            trashIcon.innerHTML = '🗑️';
            trashIcon.style.cursor = 'pointer';
            trashIcon.style.position = 'absolute';
            trashIcon.style.top = info.jsEvent.pageY + 'px';
            trashIcon.style.left = info.jsEvent.pageX + 'px';
            trashIcon.style.zIndex = 1000;
            trashIcon.onclick = function () {
                info.event.remove();
                document.body.removeChild(trashIcon);
            };

            // Thêm icon thùng rác vào body
            document.body.appendChild(trashIcon);

            // Ẩn icon thùng rác khi click ra ngoài
            document.addEventListener('click', function hideTrashIcon(event) {
                if (!trashIcon.contains(event.target) && !info.el.contains(event.target)) {
                    document.body.removeChild(trashIcon);
                    document.removeEventListener('click', hideTrashIcon);
                }
            });
        },
        drop: function (info) {

            /*if (checkbox.checked) {
                // if so, remove the element from the "Draggable Events" list
                info.draggedEl.parentNode.removeChild(info.draggedEl);
            }*/
        },
        eventResize: function (info) {
            info.event.setStart(formatDateTime(info.event.start));
            info.event.setEnd(formatDateTime(info.event.end));
        },
        eventReceive: function (info) {
            function formatDateTime(date) {
                var d = new Date(date);
                var hours = ('0' + d.getHours()).slice(-2);
                var minutes = ('0' + d.getMinutes()).slice(-2);
                var seconds = ('0' + d.getSeconds()).slice(-2);
                var day = ('0' + d.getDate()).slice(-2);
                var month = ('0' + (d.getMonth() + 1)).slice(-2);
                var year = d.getFullYear();
                return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
            }

            info.event.setStart(formatDateTime(info.event.start));
            info.event.setEnd(formatDateTime(new Date(info.event.start.getTime() + 60 * 60 * 1000))); // Set end time to 1 hour after start time

            info.event.setProp('backgroundColor', colorPicker.value);
            info.event.setProp('borderColor', colorPicker.value);

            // is the "remove after drop" checkbox checked?
            /*            if (checkbox.checked) {
                            // if so, remove the element from the "Draggable Events" list
                            info.draggedEl.parentNode.removeChild(info.draggedEl);
                        }*/
        },

        slotLabelFormat: [
            { hour: 'numeric', minute: '2-digit', hour12: false }
        ]
    });

    calendar.render();


    // Xuất ra excel
    // -----------------------------------------------------------------
    document.getElementById('export-excel').addEventListener('click', function () {
        var planName = planNameInput.value.trim();
        if (!planName) {
            alert('Vui lòng nhập tên kế hoạch trước khi xuất file.');
            return;
        }

        var events = calendar.getEvents();
        var data = events.map(function (event) {
            return {
                'Nhà Cung Cấp': event.title,
                'Giờ Nhận': formatDateTimeToExcel(event.start),
                'Giờ Kết Thúc': formatDateTimeToExcel(event.end),
                'Thứ': event.getResources().map(function (resource) {
                    switch (resource.id) {
                        case '1': return 'Thứ 2';
                        case '2': return 'Thứ 3';
                        case '3': return 'Thứ 4';
                        case '4': return 'Thứ 5';
                        case '5': return 'Thứ 6';
                        case '6': return 'Thứ 7';
                        default: return '';
                    }
                }).join(', ')/*,
                'BackgroundColor': event.backgroundColor,
                'BorderColor': event.borderColor*/
            };
        });

        var ws = XLSX.utils.json_to_sheet(data);
        /*
                // Ẩn các cột BackgroundColor và BorderColor
                ws['!cols'] = [];
                ws['!cols'][4] = { hidden: true }; // Ẩn cột ResourceId
                ws['!cols'][5] = { hidden: true }; // Ẩn cột BackgroundColor
                ws['!cols'][6] = { hidden: true }; // Ẩn cột BorderColor*/

        var wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Events');
        XLSX.writeFile(wb, `${planName}.xlsx`);
    });
    // Xuất ra ppt
    // -----------------------------------------------------------------
    document.getElementById('export-ppt').addEventListener('click', function () {
        var planName = planNameInput.value.trim();
        if (!planName) {
            alert('Vui lòng nhập tên kế hoạch trước khi xuất file.');
            return;
        }

        html2canvas(calendarEl).then(function (canvas) {
            var imgData = canvas.toDataURL('image/png');
            var pptx = new PptxGenJS();
            var slide = pptx.addSlide();
            slide.addImage({ data: imgData, x: 0.5, y: 0.5, w: 9, h: 5 });
            pptx.writeFile(`${planName}.pptx`);
        });
    });


    // Đọc file excel
    // -----------------------------------------------------------------
    //inputExcel.addEventListener('change', function (e) {
    //    var file = e.target.files[0];
    //    var reader = new FileReader();
    //    reader.onload = function (e) {
    //        var data = new Uint8Array(e.target.result);
    //        var workbook = XLSX.read(data, { type: 'array' });
    //        var firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    //        var jsonData = XLSX.utils.sheet_to_json(firstSheet);

    //        var events = jsonData.map(function (item) {
    //            var resourceId;
    //            switch (item['Thứ']) {
    //                case 'Thứ 2': resourceId = '1'; break;
    //                case 'Thứ 3': resourceId = '2'; break;
    //                case 'Thứ 4': resourceId = '3'; break;
    //                case 'Thứ 5': resourceId = '4'; break;
    //                case 'Thứ 6': resourceId = '5'; break;
    //                case 'Thứ 7': resourceId = '6'; break;
    //                default: resourceId = ''; break;
    //            }
    //            return {
    //                title: item['Nhà Cung Cấp'],
    //                start: parseExcelDate(item['Giờ Nhận']),
    //                end: parseExcelDate(item['Giờ Kết Thúc']),
    //                resourceId: resourceId/*,
    //                backgroundColor: item['BackgroundColor'],
    //                borderColor: item['BorderColor']*/
    //            };
    //        });
    //        console.log(events);

    //        calendar.removeAllEvents();
    //        calendar.addEventSource(events);

    //        // Điền tên file vào phần nhập tên kế hoạch
    //        var fileName = file.name.split('.').slice(0, -1).join('.');
    //        planNameInput.value = fileName;

    //        // Provide visual feedback
    //        feedbackEl.innerText = 'Events successfully loaded from Excel file!';
    //        feedbackEl.style.color = 'green';
    //    };
    //    reader.readAsArrayBuffer(file);
    //});

    // Hiển modal khi ấn nút submit
    // -----------------------------------------------------------------
    document.getElementById('submit-plan').addEventListener('click', function () {
        var planName = planNameInput.value.trim();
        if (!planName) {
            alert('Vui lòng nhập tên kế hoạch trước khi submit kế hoạch.');
            return;
        }
        $('#dateModal').modal('show');

        $('#datepicker').attr('readonly', 'readonly'); // Ngăn chặn gõ text vào
        $('#datepicker').datepicker({
            startDate: new Date(), // Không cho chọn ngày trong quá khứ
            autoclose: true
        }).on('changeDate', function (e) {
            var selectedDate = e.date;
            var today = new Date();
            today.setHours(0, 0, 0, 0); // Đặt giờ phút giây mili giây về 0 để so sánh chính xác
            if (selectedDate < today) {
                alert('Không thể chọn ngày trong quá khứ.');
                $('#datepicker').datepicker('setDate', today); // Đặt lại ngày về hôm nay
            }
        });
    });
    document.querySelectorAll('#dateModal .close, #dateModal .btn-secondary').forEach(function (element) {
        element.addEventListener('click', function () {
            $('#dateModal').modal('hide');
        });
    });

    // Gửi dữ liệu plan về back end để add vào database
    // -----------------------------------------------------------------
    document.getElementById('save-date').addEventListener('click', async function () {
        var selectedDate = document.getElementById('datepicker').value;
        var file = inputExcel.files[0];
        if (!file) { alert("Nofile!"); return };
        var formData = new FormData();
        formData.append('file', file);
        if (!selectedDate) {
            alert('Please select a date.');
            return;
        }

        var dateParts = selectedDate.split('-');
        var formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
        var requestData = {
            PlanName: planNameInput.value,
            EffectiveDate: formattedDate,
        };

        console.log('Request data:', JSON.stringify(requestData));
        try {
            // 1. Save plan data
            await fetch('/TLIPWarehouse/ChangePlanReceived', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            })
                .then(response => response.json())
                .then(data => {
                    if (!data.success) {
                        throw new Error(data.message);
                    }
                });
            // 2. If Excel file is selected, upload it
            await fetch('/TLIPWarehouse/ReadFileExcel', {
                method: 'POST',
                body: formData
            })
                .then(uploadResponse => uploadResponse.text())
                .then(uploadResult => {
                    alert(uploadResult);
                    location.reload(); // Refresh the page to see the changes
                })

            // Optionally, refresh the page or update the UI here
            
        } catch (error) {
            console.error('Error:', error);
            alert(`An error occurred. Please try again.\n Detail: ${error.message}`);
        }

        $('#dateModal').modal('hide');
    }
});


// 
// -----------------------------------------------------------------
function formatDateTime(date) {
    var d = new Date(date);
    var hours = ('0' + d.getHours()).slice(-2);
    var minutes = ('0' + d.getMinutes()).slice(-2);
    var seconds = ('0' + d.getSeconds()).slice(-2);
    var day = ('0' + d.getDate()).slice(-2);
    var month = ('0' + (d.getMonth() + 1)).slice(-2);
    var year = d.getFullYear();
    return `${hours}:${minutes}:${seconds} ${day}-${month}-${year}`;
}

function formatDateTimeToExcel(date) {
    var d = new Date(date);
    var hours = ('0' + d.getHours()).slice(-2);
    var minutes = ('0' + d.getMinutes()).slice(-2);
    var seconds = ('0' + d.getSeconds()).slice(-2);
    var day = ('0' + d.getDate()).slice(-2);
    var month = ('0' + (d.getMonth() + 1)).slice(-2);
    var year = d.getFullYear();
    return `${hours}:${minutes}:${seconds}`;
}

function parseExcelDate(excelDate) {
    var time = excelDate.trim();
    var fixedDate = '2024-11-11';
    return `${fixedDate}T${time}`;
}
function calculateLeadTime(start, end) {
    var startDate = new Date(start);
    var endDate = new Date(end);
    var diffMs = endDate - startDate; // Difference in milliseconds
    var diffHrs = Math.floor(diffMs / 3600000); // Convert to hours
    var diffMins = Math.floor((diffMs % 3600000) / 60000); // Convert remainder to minutes
    var diffSecs = Math.floor((diffMs % 60000) / 1000); // Convert remainder to seconds

    var formattedHrs = ('0' + diffHrs).slice(-2);
    var formattedMins = ('0' + diffMins).slice(-2);
    var formattedSecs = ('0' + diffSecs).slice(-2);

    return `${formattedHrs}:${formattedMins}:${formattedSecs}`;
}

});
