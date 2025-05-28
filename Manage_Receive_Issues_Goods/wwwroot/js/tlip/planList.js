$(document).ready(function () {
    $('#supplierSelect').select2({
        placeholder: "Chọn nhà cung cấp",
        allowClear: true
    });
});

function filterPlans() {
    var selectedWeekday = document.getElementById("weekdaySelect").value;
    var selectedSupplier = document.getElementById("supplierSelect").value;
    var cards = document.getElementsByClassName("weekday-card");

    for (var i = 0; i < cards.length; i++) {
        var card = cards[i];
        var rows = card.getElementsByClassName("plan-row");
        var showCard = false;

        for (var j = 0; j < rows.length; j++) {
            var row = rows[j];
            var supplierCode = row.getAttribute("data-supplier");
            var supplierName = row.getAttribute("data-supplier-name");

            if ((selectedWeekday == "0" || card.getAttribute("data-weekday") == selectedWeekday) &&
                (selectedSupplier == "0" || supplierCode == selectedSupplier || supplierName.includes(selectedSupplier))) {
                row.style.display = "";
                showCard = true;
            } else {
                row.style.display = "none";
            }
        }

        card.style.display = showCard ? "block" : "none";
    }
}