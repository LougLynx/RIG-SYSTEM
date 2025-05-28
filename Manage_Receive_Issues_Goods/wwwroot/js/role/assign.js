document.addEventListener('DOMContentLoaded', function () {
    var editButtons = document.querySelectorAll('.edit-button');
    editButtons.forEach(function (button) {
        button.addEventListener('click', function () {
            var userName = button.getAttribute('data-username');
            var editRow = document.getElementById('edit-' + userName);
            if (editRow.style.display === 'none') {
                editRow.style.display = 'table-row';
            } else {
                editRow.style.display = 'none';
            }
        });
    });

    var addRoleButtons = document.querySelectorAll('.add-role-button');
    addRoleButtons.forEach(function (button) {
        button.addEventListener('click', function () {
            var userName = button.getAttribute('data-username');
            var newRole = document.getElementById('newRole-' + userName).value;
            if (newRole) {
                var form = document.createElement('form');
                form.method = 'post';
                form.action = '/Role/Assign';

                var userNameInput = document.createElement('input');
                userNameInput.type = 'hidden';
                userNameInput.name = 'userName';
                userNameInput.value = userName;
                form.appendChild(userNameInput);

                var roleNameInput = document.createElement('input');
                roleNameInput.type = 'hidden';
                roleNameInput.name = 'roleName';
                roleNameInput.value = newRole;
                form.appendChild(roleNameInput);

                document.body.appendChild(form);
                form.submit();
            }
        });
    });
});