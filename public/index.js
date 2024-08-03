document.addEventListener('DOMContentLoaded', () => {
    console.log('Adding submit event listener');
    const itemsPerPage = 5;
    let currentPage = 1;
    let users = [];
    let editingUserId = null;
    let userToDelete = null; // Store the user to be deleted

    async function fetchUsers() {
        try {
            const response = await fetch('http://localhost:4004/api/users');
            if (!response.ok) throw new Error('Network response was not ok');
            users = await response.json();
            renderTable();
            renderPagination();
        } catch (error) {
            console.error('Error fetching users:', error);
            document.getElementById('message').innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
        }
    }

    function renderTable() {
        const tableBody = document.getElementById('userTable').getElementsByTagName('tbody')[0];
        tableBody.innerHTML = '';

        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const paginatedUsers = users.slice(start, end);

        paginatedUsers.forEach(user => {
            const row = tableBody.insertRow();
            row.insertCell(0).textContent = user.name;
            row.insertCell(1).textContent = user.age;
            row.insertCell(2).textContent = user.mobile;

            // Action column with Edit and Delete buttons
            const actionCell = row.insertCell(3);

            // Edit button
            const editButton = document.createElement('button');
            editButton.textContent = 'Edit';
            editButton.className = 'btn btn-warning btn-sm';
            editButton.addEventListener('click', () => editUser(user._id));
            actionCell.appendChild(editButton);

            // Delete button
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.className = 'btn btn-danger btn-sm ml-2';
            deleteButton.addEventListener('click', () => confirmDeleteUser(user._id));
            actionCell.appendChild(deleteButton);
        });
    }

    function renderPagination() {
        const pagination = document.getElementById('pagination');
        pagination.innerHTML = '';

        const totalPages = Math.ceil(users.length / itemsPerPage);

        for (let i = 1; i <= totalPages; i++) {
            const pageItem = document.createElement('li');
            pageItem.className = `page-item ${i === currentPage ? 'active' : ''}`;

            const pageLink = document.createElement('a');
            pageLink.className = 'page-link';
            pageLink.href = '#';
            pageLink.textContent = i;
            pageLink.addEventListener('click', (event) => {
                event.preventDefault();
                currentPage = i;
                renderTable();
                renderPagination();
            });

            pageItem.appendChild(pageLink);
            pagination.appendChild(pageItem);
        }
    }

    function setFormMode(isEditMode) {
        document.getElementById('submitBtn').style.display = isEditMode ? 'none' : 'inline-block';
        document.getElementById('updateBtn').style.display = isEditMode ? 'inline-block' : 'none';
    }

    async function editUser(userId) {
        try {
            const response = await fetch(`http://localhost:4004/api/users/${userId}`);
            if (!response.ok) throw new Error('Network response was not ok');
            const user = await response.json();

            document.getElementById('name').value = user.name;
            document.getElementById('age').value = user.age;
            document.getElementById('mobile').value = user.mobile;
            document.getElementById('editId').value = userId;

            setFormMode(true);
        } catch (error) {
            console.error('Error fetching user for edit:', error);
            document.getElementById('message').innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
        }
    }

    async function updateUser() {
        const userId = document.getElementById('editId').value;
        const name = document.getElementById('name').value;
        const age = document.getElementById('age').value;
        const mobile = document.getElementById('mobile').value;

        try {
            const response = await fetch(`http://localhost:4004/api/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, age, mobile })
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Server response:', result);
                document.getElementById('message').innerHTML = `<div class="alert alert-success">User updated with Name: <b>${result.name}</b></div>`;
                document.getElementById('itemForm').reset();
                document.getElementById('itemForm').classList.remove('was-validated'); // Remove validation state
                setFormMode(false);
                fetchUsers(); // Refresh the user list
            } else {
                const error = await response.json();
                console.error('Error response:', error);
                document.getElementById('message').innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
            }
        } catch (err) {
            console.error('Fetch error:', err);
            document.getElementById('message').innerHTML = `<div class="alert alert-danger">Error: ${err.message}</div>`;
        }
    }

    function confirmDeleteUser(userId) {
        userToDelete = userId; // Store the user ID for deletion
        fetch(`http://localhost:4004/api/users/${userId}`)
            .then(response => response.json())
            .then(user => {
                // Set the modal content
                const modalBody = document.querySelector('#confirmDeleteModal .modal-body');
                modalBody.innerHTML = `Are you sure you want to delete this user: <strong>${user.name}</strong>?`;

                // Show the modal
                $('#confirmDeleteModal').modal('show');
            })
            .catch(error => {
                console.error('Error fetching user for delete confirmation:', error);
                document.getElementById('message').innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
            });
    }

    async function confirmDelete() {
        if (userToDelete) {
            try {
                const response = await fetch(`http://localhost:4004/api/users/${userToDelete}`, {
                    method: 'DELETE'
                });

                let resultMessage = 'User deleted successfully.';
                if (response.ok) {
                    try {
                        const result = await response.json(); // Get API response message
                        resultMessage = result.message || 'User deleted successfully.';
                    } catch (error) {
                        console.error('Error parsing response JSON:', error);
                        resultMessage = 'User deleted successfully.';
                    }
                    $('#confirmDeleteModal').modal('hide'); // Hide the modal
                    document.getElementById('message').innerHTML = `<div class="alert alert-success">${resultMessage}</div>`; // Show success message
                    fetchUsers(); // Refresh the user list
                } else {
                    const error = await response.json();
                    document.getElementById('message').innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
                }
            } catch (err) {
                console.error('Fetch error:', err);
                document.getElementById('message').innerHTML = `<div class="alert alert-danger">Error: ${err.message}</div>`;
            }
        }
    }

    document.getElementById('itemForm').addEventListener('submit', async function (e) {
        e.preventDefault();
        console.log('Form submitted');

        const name = document.getElementById('name').value;
        const age = document.getElementById('age').value;
        const mobile = document.getElementById('mobile').value;
        const messageDiv = document.getElementById('message');

        messageDiv.innerHTML = ''; // Clear previous messages

        if (editingUserId) {
            await updateUser();
        } else {
            try {
                console.log('Sending data:', { name, age, mobile });
                const response = await fetch('http://localhost:4004/api/users', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name, age, mobile })
                });

                if (response.ok) {
                    const result = await response.json();
                    console.log('Server response:', result);
                    messageDiv.innerHTML = `<div class="alert alert-success">User created with Name: <b>${result.name}</b></div>`;
                    document.getElementById('itemForm').reset(); // Reset the form fields
                    document.getElementById('itemForm').classList.remove('was-validated'); // Remove validation state
                    fetchUsers(); // Refresh the user list
                } else {
                    const error = await response.json();
                    console.error('Error response:', error);
                    messageDiv.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
                }
            } catch (err) {
                console.error('Fetch error:', err);
                messageDiv.innerHTML = `<div class="alert alert-danger">Error: ${err.message}</div>`;
            }
        }
    });

    document.getElementById('updateBtn').addEventListener('click', async () => {
        await updateUser();
    });

    // Confirm delete button click event
    document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
        await confirmDelete();
    });

    // Initial fetch of users
    fetchUsers();
});