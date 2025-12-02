from playwright.sync_api import sync_playwright, expect
import time

def verify_logout():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Listen for console logs
        page.on("console", lambda msg: print(f"Console: {msg.text}"))
        page.on("pageerror", lambda err: print(f"Page Error: {err}"))

        # Inject a user into localStorage to simulate being logged in
        page.goto("http://localhost:8000/index.html")
        page.evaluate("""
            localStorage.setItem('currentUser', JSON.stringify({
                name: 'Test Store',
                email: 'test@example.com',
                password: 'password123'
            }));
        """)

        # Navigate to dashboard
        page.goto("http://localhost:8000/dashboard.html")

        # Verify we are on dashboard
        expect(page.get_by_role("heading", name="KPS United Dashboard")).to_be_visible()
        print("Successfully navigated to dashboard")

        # Handle dialog
        page.on("dialog", lambda dialog: dialog.accept())

        # Click logout
        print("Attempting to click logout button...")
        page.get_by_role("button", name="🚪 Logout").click()

        # Wait for potential navigation
        page.wait_for_timeout(1000)

        # Check if we are redirected to index.html
        print(f"Current URL: {page.url}")

        # Take a screenshot
        page.screenshot(path="verification/logout_attempt.png")

        # Check localStorage
        current_user = page.evaluate("localStorage.getItem('currentUser')")
        print(f"currentUser in localStorage: {current_user}")

        if page.url.endswith("index.html") and current_user is None:
            print("Logout successful")
        else:
            print("Logout failed")

        browser.close()

if __name__ == "__main__":
    verify_logout()
