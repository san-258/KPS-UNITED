/**
 * KPS United Authentication & Common Logic
 */

const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

function checkSession() {
    const currentUserJSON = localStorage.getItem('currentUser');
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const isLoginPage = currentPage === 'index.html' || currentPage === 'reset-password.html' || currentPage === 'terms.html';

    if (currentUserJSON) {
        const currentUser = JSON.parse(currentUserJSON);
        const now = new Date().getTime();

        // Check if loginTime exists and is within 24 hours
        if (currentUser.loginTime && (now - currentUser.loginTime < SESSION_DURATION)) {
            // Valid session
            if (isLoginPage && currentPage !== 'terms.html') {
                // If on login page, redirect to dashboard
                window.location.href = 'dashboard.html';
            }
        } else {
            // Session expired or invalid
            handleLogout(false); // Logout without confirmation if expired
        }
    } else {
        // No user
        if (!isLoginPage) {
            // If on protected page, redirect to login
            window.location.href = 'index.html';
        }
    }
}

function handleLogout(confirmAction = true) {
    if (!confirmAction || confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
}

// Check session on load
window.addEventListener('load', function() {
    checkSession();
    document.body.classList.add('loaded'); // For smooth transition
});
