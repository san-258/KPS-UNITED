const ADMIN_PASSWORD = 'admin123';

// Global error handler
window.onerror = function (msg, url, line, col, error) {
    alert('Global Error: ' + msg + '\nLine: ' + line);
    return false;
};

// Self-healing: Clear storage if requested
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('force_reload') === 'true') {
    localStorage.clear();
    window.location.href = window.location.pathname; // Reload without params
}

function handleAdminLogin(event) {
    try {
        alert('Starting login...'); // Aggressive Alert 1
        console.log('handleAdminLogin called');
        event.preventDefault();

        const passwordInput = document.getElementById('admin-password');
        const errorDiv = document.getElementById('error-message');

        if (!passwordInput) {
            alert('Critical Error: Password input not found!');
            return;
        }
        if (!errorDiv) {
            alert('Critical Error: Error div not found!');
            return;
        }

        const password = passwordInput.value;

        // Clear previous errors
        errorDiv.style.display = 'none';
        errorDiv.textContent = '';

        // Show debug info
        errorDiv.style.display = 'block';
        errorDiv.innerHTML += 'Debug: Attempting login...<br>';
        errorDiv.innerHTML += 'Debug: Password length: ' + (password ? password.length : 0) + '<br>';

        if (password === ADMIN_PASSWORD) {
            alert('Password check passed...'); // Aggressive Alert 2
            errorDiv.innerHTML += 'Debug: Password correct. Loading dashboard...<br>';

            // Small delay to let user see the message
            setTimeout(() => {
                try {
                    const loginDiv = document.getElementById('admin-login');
                    const dashboardDiv = document.getElementById('admin-dashboard');

                    if (loginDiv) loginDiv.style.display = 'none';
                    if (dashboardDiv) dashboardDiv.classList.add('active');

                    localStorage.setItem('adminLoggedIn', 'true');

                    if (typeof loadAllData === 'function') {
                        loadAllData();
                        alert('Data loaded!'); // Aggressive Alert 3
                    } else {
                        throw new Error('loadAllData function is missing!');
                    }
                } catch (e) {
                    errorDiv.innerHTML += 'Debug: Error loading data: ' + e.message + '<br>';
                    console.error(e);
                    alert('Login Error: ' + e.message);
                }
            }, 500);
        } else {
            alert('Password incorrect!'); // Aggressive Alert 4
            errorDiv.innerHTML += 'Debug: Password incorrect. Expected: ' + ADMIN_PASSWORD + '<br>';
            errorDiv.innerHTML += '<strong>Incorrect password!</strong>';
            errorDiv.style.display = 'block';
        }
    } catch (err) {
        console.error('Critical Login Error:', err);
        alert('Critical Login Error: ' + err.message);
    }
}

window.onload = function () {
    if (localStorage.getItem('adminLoggedIn') === 'true') {
        document.getElementById('admin-login').style.display = 'none';
        document.getElementById('admin-dashboard').classList.add('active');
        try {
            loadAllData();
        } catch (e) {
            console.error("Auto-login data load error", e);
        }
    }
};



function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-nav button').forEach(el => el.classList.remove('active'));

    // Show selected tab
    const tab = document.getElementById(`tab-${tabName}`);
    if (tab) tab.classList.add('active');

    // Update button style
    // Simple logic to find the button index based on tabName
    const buttons = document.querySelectorAll('.tab-nav button');
    const tabNames = ['stores', 'vendors', 'queries', 'vendor-comm', 'documents', 'terms', 'promotions', 'reporting'];
    const index = tabNames.indexOf(tabName);
    if (index >= 0 && buttons[index]) {
        buttons[index].classList.add('active');
    }
}

function handleLogout() {
    localStorage.removeItem('adminLoggedIn');
    window.location.reload();
}

// --- STORES LOGIC ---
function loadStores() {
    // Self-healing: Fix Member IDs in Admin View
    let stores = JSON.parse(localStorage.getItem('userStores') || '[]');
    let users = JSON.parse(localStorage.getItem('storeUsers') || '[]');
    let dataChanged = false;

    users.forEach(user => {
        if (user.memberId && !user.memberId.toString().includes('-')) {
            user.memberId = `${user.memberId}-1`;
            dataChanged = true;
        }
    });

    stores.forEach(store => {
        if (store.memberId && !store.memberId.toString().includes('-')) {
            store.memberId = `${store.memberId}-1`;
            dataChanged = true;
        }
    });

    if (dataChanged) {
        localStorage.setItem('storeUsers', JSON.stringify(users));
        localStorage.setItem('userStores', JSON.stringify(stores));
        console.log('Admin: Repaired legacy Member IDs.');
    }

    const tbody = document.getElementById('users-table-body');

    if (stores.length === 0) {
        tbody.innerHTML = `<tr>
                    <td colspan="8" class="no-users">No stores registered yet</td>
                </tr>`;
        return;
    }

    document.getElementById('total-stores').textContent = stores.length;
    document.getElementById('active-stores').textContent = stores.filter(s => s.status === 'Active').length;
    document.getElementById('retail-stores').textContent = stores.filter(s => s.businessType === 'Retail').length;

    // Update Table Header if needed (we need to add Status column)
    const thead = document.querySelector('#users-table thead tr');
    if (thead.children.length === 7) {
        const statusTh = document.createElement('th');
        statusTh.textContent = 'Status';
        thead.insertBefore(statusTh, thead.children[6]); // Insert before Actions
    }

    tbody.innerHTML = stores.map((store, index) => {
        const statusColor = store.status === 'Active' ? 'green' : (store.status === 'Suspended' ? 'red' : 'orange');
        const statusLabel = store.status || 'Pending';

        return ` <tr>
        <td>${index + 1}</td>
        <td>${store.memberId || 'N/A'}</td>
        <td>${store.id || 'N/A'}</td>
        <td>${store.name || 'N/A'}</td>
        <td>${store.businessPhone || 'N/A'}</td>
        <td>${store.businessEmail || 'N/A'}</td>
        <td style="color:${statusColor}; font-weight:bold;">${statusLabel}</td>
        <td>
            <button onclick="openEditStoreModal('${store.id}')"
                style="background: var(--kps-yellow); color: black; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; margin-right:5px;">Edit</button>
            <button onclick="deleteStore('${store.id}')"
                style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">Delete</button>
        </td>
    </tr> `;
    }).join('');
}

function openEditStoreModal(storeId) {
    const stores = JSON.parse(localStorage.getItem('userStores') || '[]');
    const store = stores.find(s => s.id.toString() === storeId.toString());

    if (!store) return;

    document.getElementById('editStoreModal').style.display = 'block';
    document.getElementById('editStoreId').value = store.id;
    document.getElementById('editStoreName').value = store.name;
    document.getElementById('editStoreStatus').value = store.status || 'Pending';
    document.getElementById('editMemberId').value = store.memberId;

    // Populate Vendors
    const allVendors = JSON.parse(localStorage.getItem('adminVendors') || '[]');
    const container = document.getElementById('editStoreVendors');
    const storeVendors = store.vendors || [];

    if (allVendors.length === 0) {
        container.innerHTML = '<p>No vendors defined in system.</p>';
    } else {
        container.innerHTML = allVendors.map(v => `
    <label style="display:flex; align-items:center; gap:5px; font-weight:normal;">
        <input type="checkbox" value="${v.name}" ${storeVendors.includes(v.name) ? 'checked' : ''}>
        ${v.name}
    </label>
    `).join('');
    }
}

function closeEditStoreModal() {
    document.getElementById('editStoreModal').style.display = 'none';
}

function saveStoreChanges(event) {
    event.preventDefault();
    const storeId = document.getElementById('editStoreId').value;
    const newStatus = document.getElementById('editStoreStatus').value;
    const newMemberId = document.getElementById('editMemberId').value;

    // Get selected vendors
    const checkboxes = document.querySelectorAll('#editStoreVendors input[type="checkbox"]:checked');
    const selectedVendors = Array.from(checkboxes).map(cb => cb.value);

    let stores = JSON.parse(localStorage.getItem('userStores') || '[]');
    const index = stores.findIndex(s => s.id.toString() === storeId.toString());

    if (index !== -1) {
        // Update store
        stores[index].status = newStatus;
        stores[index].memberId = newMemberId;
        stores[index].vendors = selectedVendors;

        localStorage.setItem('userStores', JSON.stringify(stores));

        // Also update user record if member ID changed?
        // Complex: If member ID changes, we might need to move it to another user bucket or create a new user?
        // For now, let's assume the admin knows what they are doing re-assigning IDs.
        // Ideally we should check if the new Member ID exists in storeUsers.

        alert('Store updated successfully!');
        closeEditStoreModal();
        loadStores();
    }
}

function filterStores() {
    const searchTerm = document.getElementById('search-box').value.toLowerCase();
    const stores = JSON.parse(localStorage.getItem('userStores') || '[]');
    const tbody = document.getElementById('users-table-body');

    const filteredStores = stores.filter(store => (store.name && store.name.toLowerCase().includes(searchTerm)) ||
        (store.businessEmail && store.businessEmail.toLowerCase().includes(searchTerm)) || (store.businessPhone &&
            store.businessPhone.includes(searchTerm)));

    if (filteredStores.length === 0) {
        tbody.innerHTML = `<tr>
                    <td colspan="8" class="no-users">No stores match your search</td>
                </tr>`;
        return;
    }

    tbody.innerHTML = filteredStores.map((store, index) => {
        const statusColor = store.status === 'Active' ? 'green' : (store.status === 'Suspended' ? 'red' : 'orange');
        const statusLabel = store.status || 'Pending';
        return ` <tr>
        <td>${index + 1}</td>
        <td>${store.memberId || 'N/A'}</td>
        <td>${store.id || 'N/A'}</td>
        <td>${store.name || 'N/A'}</td>
        <td>${store.businessPhone || 'N/A'}</td>
        <td>${store.businessEmail || 'N/A'}</td>
        <td style="color:${statusColor}; font-weight:bold;">${statusLabel}</td>
        <td>
            <button onclick="openEditStoreModal('${store.id}')"
                style="background: var(--kps-yellow); color: black; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; margin-right:5px;">Edit</button>
            <button onclick="deleteStore('${store.id}')"
                style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">Delete</button>
        </td>
    </tr> `;
    }).join('');
}

function downloadCSV() {
    const stores = JSON.parse(localStorage.getItem('userStores') || '[]');

    if (stores.length === 0) {
        alert('No stores to download!');
        return;
    }

    let csv = 'Member ID,Store ID,Store Name,Status,Store Phone,Store Email\n';

    stores.forEach(store => {
        csv += `"${store.memberId || ''}", "${store.id || ''}", "${store.name || ''}", "${store.status || 'Pending'}",
    "${store.businessPhone || ''}", "${store.businessEmail || ''}" \n`;
    });

    const blob = new Blob([csv], {
        type: 'text/csv'
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    a.download = `kps-united-stores-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    alert('CSV file downloaded successfully!');
}

function downloadJSON() {
    const stores = JSON.parse(localStorage.getItem('userStores') || '[]');

    if (stores.length === 0) {
        alert('No stores to download!');
        return;
    }

    const sanitizedStores = stores.map(s => ({
        memberId: s.memberId,
        storeId: s.id,
        storeName: s.name,
        status: s.status || 'Pending',
        phone: s.businessPhone,
        email: s.businessEmail
    }));

    const json = JSON.stringify(sanitizedStores, null, 2);

    const blob = new Blob([json], {
        type: 'application/json'
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    a.download = `kps-united-stores-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    alert('JSON file downloaded successfully!');
}

function copyEmails() {
    const stores = JSON.parse(localStorage.getItem('userStores') || '[]');

    if (stores.length === 0) {
        alert('No stores to copy!');
        return;
    }

    const emails = stores.map(s => s.businessEmail).filter(e => e).join(', ');

    navigator.clipboard.writeText(emails).then(() => {
        alert(`${stores.length} email addresses copied to clipboard !\n\nYou can now paste them into your email client.`);

    }).catch(() => {
        const textarea = document.createElement('textarea');
        textarea.value = emails;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);

        alert(`${stores.length} email addresses copied to clipboard !`);
    });
}

function deleteStore(storeId) {
    if (confirm('Are you sure you want to delete this store? This action cannot be undone.')) {
        // 1. Get current stores
        let stores = JSON.parse(localStorage.getItem('userStores') || '[]');

        // 2. Find the store to delete
        const storeToDelete = stores.find(store => store.id.toString() === storeId.toString());

        // Handle static store or not found
        if (!storeToDelete) {
            if (storeId === '1000-1') {
                alert("Cannot delete the demo static store.");
                return;
            }

            return; // Should not happen if ID is valid
        }

        const memberIdToDelete = storeToDelete.memberId;

        // 3. Remove the store
        stores = stores.filter(store => store.id.toString() !== storeId.toString());
        localStorage.setItem('userStores', JSON.stringify(stores));

        // 4. Check if user has any other stores left
        const remainingStoresForMember = stores.filter(store => store.memberId === memberIdToDelete);

        if (remainingStoresForMember.length === 0) {
            // 5. No stores left, delete the user account
            let users = JSON.parse(localStorage.getItem('storeUsers') || '[]');
            const initialUserCount = users.length;
            users = users.filter(user => user.memberId !== memberIdToDelete);

            if (users.length < initialUserCount) {
                localStorage.setItem('storeUsers', JSON.stringify(users));
                alert('Store deleted. Since this was the only store for this member, the user account has also been deleted.');
            } else {
                alert('Store deleted successfully.');
            }
        } else {
            alert('Store deleted successfully.');
        }
        loadStores(); // Re-render table
    }
}

// --- VENDOR LOGIC ---
function loadVendors() {
    const vendors = JSON.parse(localStorage.getItem('adminVendors') || '[]');
    const tbody = document.getElementById('vendors-table-body');

    if (vendors.length === 0) {
        // Initialize with default vendors if empty
        const defaultVendors = [{
            id: 1,
            name: 'Pepsi',
            pricing: 'Call for pricing',
            contactName: 'John Doe',
            contactEmail: 'john@pepsi.com',
            contactPhone: '555-0101'
        }, {
            id: 2,
            name: 'Coke',
            pricing: 'Call for pricing',
            contactName: 'Jane Smith',
            contactEmail: 'jane@coke.com',
            contactPhone: '555-0102'
        }];
        // Only set defaults if we really want to seed data. For now let's just show empty
        // Let's seed if empty for demo purposes
        if (!localStorage.getItem('adminVendors')) {
            localStorage.setItem('adminVendors', JSON.stringify(defaultVendors));
            loadVendors(); // Reload
            return;
        }
        tbody.innerHTML = '<tr><td colspan="4" class="no-users">No vendors added yet</td></tr>';
        return;
    }
    tbody.innerHTML = vendors.map((vendor) => {
        return `
        <tr>
            <td>${vendor.name}</td>
            <td>${vendor.pricing || 'N/A'}</td>
            <td>
                ${vendor.contactName || ''}<br>
                <small>${vendor.contactEmail || ''}</small><br>
                <small>${vendor.contactPhone || ''}</small>
            </td>
            <td>
                <button onclick="editVendor(${vendor.id})"
                    style="background: var(--kps-yellow); color: black; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; margin-right:5px;">Edit</button>
                <button onclick="deleteVendor(${vendor.id})"
                    style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">Delete</button>
            </td>
        </tr>
        `;
    }).join('');
}

function openVendorModal(vendorId = null) {
    const modal = document.getElementById('addVendorModal');
    const title = document.getElementById('vendorModalTitle');
    const form = document.getElementById('addVendorForm');

    modal.style.display = 'block';

    if (vendorId) {
        // Edit Mode
        title.textContent = 'Edit Vendor';
        const vendors = JSON.parse(localStorage.getItem('adminVendors') || '[]');
        const vendor = vendors.find(v => v.id === vendorId);
        if (vendor) {
            document.getElementById('vendorId').value = vendor.id;
            document.getElementById('vendorName').value = vendor.name;
            document.getElementById('vendorPricing').value = vendor.pricing || '';
            document.getElementById('vendorContactName').value = vendor.contactName || '';
            document.getElementById('vendorContactEmail').value = vendor.contactEmail || '';
            document.getElementById('vendorContactPhone').value = vendor.contactPhone || '';
        }
    } else {
        // Add Mode
        title.textContent = 'Add New Vendor';
        form.reset();
        document.getElementById('vendorId').value = '';
    }
}

function closeVendorModal() {
    document.getElementById('addVendorModal').style.display = 'none';
}

function saveVendor(event) {
    event.preventDefault();
    const id = document.getElementById('vendorId').value;
    const name = document.getElementById('vendorName').value;
    const pricing = document.getElementById('vendorPricing').value;
    const contactName = document.getElementById('vendorContactName').value;
    const contactEmail = document.getElementById('vendorContactEmail').value;
    const contactPhone = document.getElementById('vendorContactPhone').value;

    let vendors = JSON.parse(localStorage.getItem('adminVendors') || '[]');

    if (id) {
        // Update
        const index = vendors.findIndex(v => v.id == id);
        if (index !== -1) {
            vendors[index] = { ...vendors[index], name, pricing, contactName, contactEmail, contactPhone };
        }
    } else {
        // Create
        const newId = Date.now(); // Simple ID generation
        vendors.push({ id: newId, name, pricing, contactName, contactEmail, contactPhone });
    }

    localStorage.setItem('adminVendors', JSON.stringify(vendors));
    closeVendorModal();
    loadVendors();
}

function editVendor(id) {
    openVendorModal(id);
}

function deleteVendor(id) {
    if (confirm('Are you sure you want to delete this vendor?')) {
        let vendors = JSON.parse(localStorage.getItem('adminVendors') || '[]');
        vendors = vendors.filter(v => v.id !== id);
        localStorage.setItem('adminVendors', JSON.stringify(vendors));
        loadVendors();
    }
}

// --- QUERIES LOGIC ---
function loadQueries() {
    const queries = JSON.parse(localStorage.getItem('storeQueries') || '[]');
    const tbody = document.getElementById('queries-table-body');

    if (queries.length === 0) {
        tbody.innerHTML = `<tr>
                    <td colspan="5" class="no-users">No queries submitted yet</td>
                </tr>`;
        return;
    }

    // Sort by date desc
    queries.sort((a, b) => new Date(b.date) - new Date(a.date));

    tbody.innerHTML = queries.map((query) => {
        const statusColor = query.status === 'Replied' ? 'green' : '#dc3545';
        return `
        <tr>
            <td>${new Date(query.date).toLocaleDateString()}</td>
            <td>${query.storeName || 'Unknown Store'}</td>
            <td>${query.subject}</td>
            <td style="color:${statusColor}; font-weight:bold;">${query.status}</td>
            <td>
                <button onclick="openReplyModal(${query.id})"
                    style="background: var(--kps-navy); color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">
                    ${query.status === 'Replied' ? 'View/Edit Reply' : 'Reply'}
                </button>
            </td>
        </tr>
        `;
    }).join('');
}

function openReplyModal(queryId) {
    const queries = JSON.parse(localStorage.getItem('storeQueries') || '[]');
    const query = queries.find(q => q.id === queryId);

    if (!query) return;

    document.getElementById('replyModal').style.display = 'block';
    document.getElementById('replyQueryId').value = queryId;
    document.getElementById('query-details').innerHTML = `
        <strong>From:</strong> ${query.storeName}<br>
        <strong>Subject:</strong> ${query.subject}<br>
        <strong>Message:</strong> ${query.message}
        `;
    document.getElementById('replyMessage').value = query.reply || '';
}

function closeReplyModal() {
    document.getElementById('replyModal').style.display = 'none';
}

function sendReply(event) {
    event.preventDefault();
    const queryId = parseInt(document.getElementById('replyQueryId').value);
    const replyMsg = document.getElementById('replyMessage').value;

    let queries = JSON.parse(localStorage.getItem('storeQueries') || '[]');
    const index = queries.findIndex(q => q.id === queryId);

    if (index !== -1) {
        queries[index].reply = replyMsg;
        queries[index].status = 'Replied';
        queries[index].replyDate = new Date().toISOString();
        localStorage.setItem('storeQueries', JSON.stringify(queries));

        alert('Reply sent successfully!');
        closeReplyModal();
        loadQueries();
    }
}

// --- VENDOR COMM LOGIC ---
function loadComm() {
    const comms = JSON.parse(localStorage.getItem('vendorComm') || '[]');
    const tbody = document.getElementById('comm-table-body');

    if (comms.length === 0) {
        tbody.innerHTML = `<tr>
                    <td colspan="4" class="no-users">No communications logged yet</td>
                </tr>`;
        return;
    }

    // Sort by date desc
    comms.sort((a, b) => new Date(b.date) - new Date(a.date));

    tbody.innerHTML = comms.map((comm) => {
        return `
        <tr>
            <td>${new Date(comm.date).toLocaleDateString()}</td>
            <td>${comm.vendorName}</td>
            <td>${comm.type}</td>
            <td>${comm.message}</td>
        </tr>
        `;
    }).join('');
}

function openCommModal() {
    const modal = document.getElementById('commModal');
    const vendorSelect = document.getElementById('commVendorId');

    // Populate vendors
    const vendors = JSON.parse(localStorage.getItem('adminVendors') || '[]');
    if (vendors.length === 0) {
        alert("Please add vendors first!");
        return;
    }

    vendorSelect.innerHTML = vendors.map(v => `<option value="${v.id}">${v.name}</option>`).join('');

    document.getElementById('commForm').reset();
    modal.style.display = 'block';
}

function closeCommModal() {
    document.getElementById('commModal').style.display = 'none';
}

function saveComm(event) {
    event.preventDefault();
    const vendorId = document.getElementById('commVendorId').value;
    const type = document.getElementById('commType').value;
    const message = document.getElementById('commMessage').value;

    const vendors = JSON.parse(localStorage.getItem('adminVendors') || '[]');
    const vendor = vendors.find(v => v.id == vendorId);
    const vendorName = vendor ? vendor.name : 'Unknown Vendor';

    const newComm = {
        id: Date.now(),
        vendorId: vendorId,
        vendorName: vendorName,
        type: type,
        message: message,
        date: new Date().toISOString()
    };

    let comms = JSON.parse(localStorage.getItem('vendorComm') || '[]');
    comms.push(newComm);
    localStorage.setItem('vendorComm', JSON.stringify(comms));

    alert('Communication logged!');
    closeCommModal();
    loadComm();
}

// --- DOCUMENTS LOGIC ---
function loadDocs() {
    const docs = JSON.parse(localStorage.getItem('adminDocs') || '[]');
    const tbody = document.getElementById('docs-table-body');

    if (docs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="no-users">No documents uploaded yet</td></tr>';
        return;
    }

    // Sort by date desc
    docs.sort((a, b) => new Date(b.date) - new Date(a.date));

    tbody.innerHTML = docs.map((doc) => {
        return `
        <tr>
            <td>${new Date(doc.date).toLocaleDateString()}</td>
            <td>${doc.name}</td>
            <td>${doc.type}</td>
            <td>
                <button onclick="downloadDoc(${doc.id})"
                    style="background: var(--kps-green); color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; margin-right:5px;">Download</button>
                <button onclick="deleteDoc(${doc.id})"
                    style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">Delete</button>
            </td>
        </tr>
        `;
    }).join('');
}

function handleDocUpload(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];

        // Limit size to 2MB to avoid localStorage quota issues
        if (file.size > 2 * 1024 * 1024) {
            alert("File is too large! Please upload files smaller than 2MB.");
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            const base64Data = e.target.result;

            const newDoc = {
                id: Date.now(),
                name: file.name,
                type: file.type,
                data: base64Data,
                date: new Date().toISOString()
            };

            let docs = JSON.parse(localStorage.getItem('adminDocs') || '[]');
            docs.push(newDoc);

            try {
                localStorage.setItem('adminDocs', JSON.stringify(docs));
                alert("Document uploaded successfully!");
                loadDocs();
            } catch (err) {
                alert("Storage quota exceeded! Cannot save this file. Please delete old files or upload smaller ones.");
                console.error(err);
            }
        };
        reader.readAsDataURL(file);
    }
}

function deleteDoc(id) {
    if (confirm('Are you sure you want to delete this document?')) {
        let docs = JSON.parse(localStorage.getItem('adminDocs') || '[]');
        docs = docs.filter(d => d.id !== id);
        localStorage.setItem('adminDocs', JSON.stringify(docs));
        loadDocs();
    }
}

function downloadDoc(id) {
    const docs = JSON.parse(localStorage.getItem('adminDocs') || '[]');
    const doc = docs.find(d => d.id === id);

    if (doc) {
        const a = document.createElement('a');
        a.href = doc.data;
        a.download = doc.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
}

function loadAllData() {
    loadStores();
    loadVendors();
    loadQueries();
    loadComm();
    loadDocs();
    loadTerms();
    loadPromos();
    loadReportingFilters();
}

// ... (existing functions) ...

// TERMS LOGIC
function loadTerms() {
    const termsData = JSON.parse(localStorage.getItem('appTerms') || 'null');

    if (termsData) {
        document.getElementById('terms-version').textContent = termsData.version;
        document.getElementById('terms-date').textContent = new Date(termsData.date).toLocaleString();
        document.getElementById('terms-content').value = termsData.text;
    } else {
        document.getElementById('terms-version').textContent = '1.0';
        document.getElementById('terms-date').textContent = 'Never';
        document.getElementById('terms-content').value = 'Welcome to KPS United! Please read our terms...';
    }
}

function publishTerms() {
    const content = document.getElementById('terms-content').value;
    if (!content.trim()) {
        alert("Terms content cannot be empty!");
        return;
    }

    if (!confirm("Are you sure you want to publish new terms? All users will be required to accept them on next login.")) {
        return;
    }

    let currentTerms = JSON.parse(localStorage.getItem('appTerms') || 'null');
    let newVersion = 1.0;

    if (currentTerms) {
        newVersion = parseFloat(currentTerms.version) + 0.1;
    }

    const newTerms = {
        version: newVersion.toFixed(1),
        text: content,
        date: new Date().toISOString()
    };

    localStorage.setItem('appTerms', JSON.stringify(newTerms));

    // Update UI
    loadTerms();
    alert(`Terms v${newTerms.version} published successfully!`);
}

// PROMOTIONS LOGIC
function loadPromos() {
    const promos = JSON.parse(localStorage.getItem('adminPromos') || '[]');
    const tbody = document.getElementById('promos-table-body');

    if (promos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="no-users">No promotions active</td></tr>';
        return;
    }

    tbody.innerHTML = promos.map(p => `
        <tr>
            <td>${p.image ? `<img src="${p.image}"
                    style="width:50px; height:50px; object-fit:cover; border-radius:5px;">` : 'No Image'}</td>
            <td>${p.title}</td>
            <td>${p.vendor}</td>
            <td>Active</td>
            <td>
                <button onclick="deletePromo(${p.id})"
                    style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">Delete</button>
            </td>
        </tr>
        `).join('');
}

function openAddPromoModal() {
    // Populate Vendors Dropdown
    const vendors = JSON.parse(localStorage.getItem('adminVendors') || '[]');
    const select = document.getElementById('promoVendor');

    if (vendors.length === 0) {
        alert("Please add vendors first!");
        return;
    }

    select.innerHTML = vendors.map(v => `<option value="${v.name}">${v.name}</option>`).join('');
    document.getElementById('addPromoModal').style.display = 'block';
}

function handlePromoImage(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        if (file.size > 500 * 1024) { // 500KB limit
            alert("Image too large! Max 500KB.");
            input.value = '';
            return;
        }
        const reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById('promoImageData').value = e.target.result;
            document.getElementById('promoImagePreview').innerHTML = `<img src="${e.target.result}"
            style="width:100%; border-radius:5px;">`;
        };
        reader.readAsDataURL(file);
    }
}

function savePromo(event) {
    event.preventDefault();
    const title = document.getElementById('promoTitle').value;
    const desc = document.getElementById('promoDesc').value;
    const vendor = document.getElementById('promoVendor').value;
    const image = document.getElementById('promoImageData').value;

    const newPromo = {
        id: Date.now(),
        title,
        description: desc,
        vendor,
        image,
        date: new Date().toISOString()
    };

    let promos = JSON.parse(localStorage.getItem('adminPromos') || '[]');
    promos.push(newPromo);
    localStorage.setItem('adminPromos', JSON.stringify(promos));

    document.getElementById('addPromoModal').style.display = 'none';
    document.getElementById('addPromoForm').reset();
    document.getElementById('promoImagePreview').innerHTML = '';
    loadPromos();
    alert("Promotion added successfully!");
}

function deletePromo(id) {
    if (confirm("Delete this promotion?")) {
        let promos = JSON.parse(localStorage.getItem('adminPromos') || '[]');
        promos = promos.filter(p => p.id !== id);
        localStorage.setItem('adminPromos', JSON.stringify(promos));
        loadPromos();
    }
}

// REPORTING LOGIC
function loadReportingFilters() {
    const stores = JSON.parse(localStorage.getItem('userStores') || '[]');

    // Populate Towns
    const towns = [...new Set(stores.map(s => s.city).filter(c => c))].sort();
    const townSelect = document.getElementById('report-town');

    townSelect.innerHTML = '<option value="">All Towns</option>' + towns.map(town => `<option value="${town}">
            ${town}</option>`).join('');

    // Populate Vendors (from adminVendors now!)
    let adminVendors = JSON.parse(localStorage.getItem('adminVendors') || '[]');
    // If empty, fallback to hardcoded or default
    if (adminVendors.length === 0) {
        const defaultVendors = ['Pepsi', 'Coke', 'Dr. Pepper', '7Up', 'Budweiser', 'Miller', 'Coors', 'Other'];
        adminVendors = defaultVendors.map(v => ({ name: v }));
    }

    const vendorContainer = document.getElementById('report-vendors');
    vendorContainer.innerHTML = adminVendors.map(v => ` <div class="multi-select-option"> <input type="checkbox"
                value="${v.name}" id="vendor-${v.name}"> <label for="vendor-${v.name}"
                style="margin:0; font-weight:normal;">${v.name}</label> </div> `).join('');
}

function generateReport() {
    const stores = JSON.parse(localStorage.getItem('userStores') || '[]');
    const selectedTown = document.getElementById('report-town').value;
    const selectedVendors = Array.from(document.querySelectorAll('#report-vendors input:checked')).map(cb =>
        cb.value);

    const filteredStores = stores.filter(store => {
        // Filter by Town
        if (selectedTown && store.city !== selectedTown) return false;

        // Filter by Vendors (OR logic: if store has ANY of the selected vendors)
        // If no vendors selected, show all (unless town filter applies)
        if (selectedVendors.length > 0) {
            if (!store.vendors || !Array.isArray(store.vendors)) return false;
            // Check if store has at least one of the selected vendors
            const hasVendor = selectedVendors.some(v => store.vendors.includes(v));
            if (!hasVendor) return false;
        }

        return true;
    });

    const tbody = document.getElementById('report-table-body');

    if (filteredStores.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="no-users">No stores match the selected criteria</td></tr>';
        return;
    }

    tbody.innerHTML = filteredStores.map((store, index) => {
        const vendorsStr = store.vendors ? store.vendors.join(', ') : 'None';
        return `
        <tr>
            <td>${index + 1}</td>
            <td>${store.name || 'N/A'}</td>
            <td>${store.city || 'N/A'}</td>
            <td>${vendorsStr}</td>
            <td>${store.businessPhone || 'N/A'} <br> ${store.businessEmail || 'N/A'}</td>
        </tr>
        `;
    }).join('');
}

function downloadReportCSV() {
    const stores = JSON.parse(localStorage.getItem('userStores') || '[]');
    const selectedTown = document.getElementById('report-town').value;
    const selectedVendors = Array.from(document.querySelectorAll('#report-vendors input:checked')).map(cb =>
        cb.value);

    const filteredStores = stores.filter(store => {
        if (selectedTown && store.city !== selectedTown) return false;
        if (selectedVendors.length > 0) {
            if (!store.vendors || !Array.isArray(store.vendors)) return false;
            const hasVendor = selectedVendors.some(v => store.vendors.includes(v));
            if (!hasVendor) return false;
        }
        return true;
    });

    if (filteredStores.length === 0) {
        alert('No data to download!');
        return;
    }

    let csv = 'Store Name,City,Vendors,Phone,Email\n';
    filteredStores.forEach(store => {
        const vendorsStr = store.vendors ? store.vendors.join('; ') : '';
        csv += `"${store.name || ''}","${store.city || ''}","${vendorsStr}","${store.businessPhone ||
            ''}","${store.businessEmail || ''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kps-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}


