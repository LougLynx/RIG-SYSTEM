document.addEventListener('DOMContentLoaded', function () {
    /**
   * Xử lý event không cho chọn effective trong quá khứ
   */
    const effectiveDateInput = document.getElementById('effectiveDate');
    const dateError = document.createElement('span');
    dateError.id = 'dateError';
    dateError.className = 'text-danger';
    dateError.style.display = 'none';
    dateError.textContent = 'Effective date cannot be in the past.';
    effectiveDateInput.parentNode.appendChild(dateError);

    effectiveDateInput.addEventListener('change', function () {
        const selectedDate = new Date(this.value);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to start of the day

        if (selectedDate < today) {
            dateError.style.display = 'block';
            this.value = '';
        } else {
            dateError.style.display = 'none';
        }

        const date = new Date(this.value);
        const formattedDate = ('0' + date.getDate()).slice(-2) + '/' + ('0' + (date.getMonth() + 1)).slice(-2) + '/' + date.getFullYear();
        this.setAttribute('data-formatted-date', formattedDate);
    });
    /**
    * Vẫn là validate effective date nhưng sử dụng form submit event
    */
    document.getElementById('changePlanForm').addEventListener('submit', function (event) {
        const dateInput = document.getElementById('effectiveDate');
        const selectedDate = new Date(dateInput.value);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to start of the day

        if (selectedDate < today) {
            dateError.style.display = 'block';
            event.preventDefault();
        } else {
            dateError.style.display = 'none';
        }

        const date = new Date(dateInput.value);
        const formattedDate = date.getFullYear() + '-' + ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2);
        dateInput.value = formattedDate;
    });

    // Khi người dùng nhập số Total Shipment, tạo động các Plan Detail
    $('#totalShipment').on('input', function () {
        const totalShipment = parseInt($(this).val());
        let planDetailsHtml = '';

        if (totalShipment > 0) {
            for (let i = 1; i <= totalShipment; i++) {
                planDetailsHtml += `
                <div class="form-group">
                    <label for="planDetailTime_${i}">Plan Detail Số ${i}</label>
                    <input type="text" class="form-control plan-detail-time" id="planDetailTime_${i}" name="planDetails[${i - 1}].planTime" pattern="([01]?[0-9]|2[0-3]):[0-5][0-9]" required />
                    <span class="text-danger plan-detail-error" id="planDetailError_${i}" style="display: none;">Plan Detail Time must be greater than the previous one.</span>
                </div>
            `;
            }
        }

        $('#planDetailsSection').html(planDetailsHtml); // Thêm các trường động vào form

        // Thêm sự kiện kiểm tra thời gian cho các trường Plan Detail
        $('.plan-detail-time').on('input', function () {
            const index = parseInt(this.id.split('_')[1]);
            const currentTime = this.value;
            const previousTime = index > 1 ? $(`#planDetailTime_${index - 1}`).val() : null;

            if (previousTime && currentTime <= previousTime) {
                $(`#planDetailError_${index}`).show();
                this.setCustomValidity('Plan Detail Time must be greater than the previous one.');
            } else {
                $(`#planDetailError_${index}`).hide();
                this.setCustomValidity('');
            }
        });
    });

    /**
    * Xử lý sự kiện save change
    * Validates all plan detail times and submits the form via AJAX if valid.
    */
    $('.save-plan-btn').on('click', function () {
        let isValid = true;

        // Kiểm tra tất cả các trường Plan Detail
        $('.plan-detail-time').each(function () {
            const index = parseInt(this.id.split('_')[1]);
            const currentTime = this.value;
            const previousTime = index > 1 ? $(`#planDetailTime_${index - 1}`).val() : null;

            if (previousTime && currentTime <= previousTime) {
                $(`#planDetailError_${index}`).show();
                this.setCustomValidity('Plan Detail Time must be greater than the previous one.');
                isValid = false;
            } else {
                $(`#planDetailError_${index}`).hide();
                this.setCustomValidity('');
            }
        });

        // Nếu có lỗi, ngăn không cho form được gửi
        if (!isValid) {
            alert('Please correct the errors before saving.');
            return;
        }

        const formData = $('#changePlanForm').serialize();
        console.log('Form Data Sent:', formData); // Log dữ liệu gửi lên server
        $.ajax({
            url: '/TLIPWarehouse/ChangePlanIssued',
            type: 'POST',
            data: formData,
            success: function (response) {
                console.log("Response from server:", response);
                if (response.success) {
                    $('#changePlanModal').modal('hide');  // Ẩn modal sau khi lưu thành công
                    location.reload();  // Tải lại trang
                } else {
                    alert('Error: ' + response.message);
                }
            },
            error: function (xhr, status, error) {
                console.log('Error saving plan:', error);
                alert('Error saving plan: ' + error);
            }
        });
    });

    $('.timepicker').timepicker({
        showMeridian: false, // Sử dụng định dạng 24 giờ
        defaultTime: false
    });

    $('.edit-btn').on('click', function () {
        var detailId = $(this).data('detail-id');
        var detailTime = $(this).data('detail-time');
        $('#detailId').val(detailId);
        $('#editPlanTime').timepicker('setTime', detailTime);
    });
    //Update plan time cho plan detail
    $('.save-time-btn').on('click', function () {
        var formData = $('#editPlanTimeForm').serialize();
        $.ajax({
            url: '/TLIPWarehouse/UpdatePlanTimeIssued',
            type: 'POST',
            data: formData,
            success: function (response) {
                $('#editPlanTimeModal').modal('hide');
                location.reload();
            },
            error: function (xhr, status, error) {
                alert('Error updating time: ' + error);
            }
        });
    });
    //Lấy các plan tỏng tương lai
    $.ajax({
        url: '/TLIPWarehouse/GetFuturePlansIssues',
        method: 'GET',
        success: function (data) {
            console.log(data);
            // Populate the future plans table
            var tableBody = $('#futurePlansTableBody');
            tableBody.empty();
            data.forEach(function (plan) {
                var effectiveDate = new Date(plan.EffectiveDate).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
                var row = '<tr class="future-plan-row" data-plan-id="' + plan.PlanId + '">' +
                    '<td>' + plan.PlanName + '</td>' +
                    '<td>' + effectiveDate + '</td>' +
                    '<td>' + plan.TotalShipment + '</td>' +
                    '</tr>';
                tableBody.append(row);
            });
            // Add click event listener to each row
            $('.future-plan-row').on('click', function () {
                var planId = $(this).data('plan-id');
                fetchPlanDetails(planId);
            });
        },
        error: function (xhr, status, error) {
            console.error('Error fetching future plans:', error);
        }
    });
    // Function to fetch plan details
    function fetchPlanDetails(planId) {
        $.ajax({
            url: '/TLIPWarehouse/GetPlanDetailsIssued',
            method: 'GET',
            data: { planId: planId },
            success: function (data) {
                console.log(data);
                // Populate the plan details table
                var tableBody = $('#planDetailsTableBody');
                tableBody.empty();
                data.forEach(function (detail) {
                    var row = '<tr>' +
                        '<td>' + detail.PlanDetailName + '</td>' +
                        '<td>' + detail.PlanTimeIssued + '</td>' +
                        '</tr>';
                    tableBody.append(row);
                });
                // Show the modal
                $('#planDetailsModal').modal('show');
            },
            error: function (xhr, status, error) {
                console.error('Error fetching plan details:', error);
            }
        });
    }
});
