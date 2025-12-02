from playwright.sync_api import sync_playwright, expect
import time

def verify_transitions():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Inject a user into localStorage to simulate being logged in
        page.goto("http://localhost:8000/index.html")
        page.evaluate("""
            localStorage.setItem('currentUser', JSON.stringify({
                name: 'Test Store',
                email: 'test@example.com',
                password: 'password123',
                loginTime: new Date().getTime()
            }));
        """)

        # Navigate to dashboard
        page.goto("http://localhost:8000/dashboard.html")

        # Verify body has loaded class (transition)
        page.wait_for_selector("body.loaded")
        print("Dashboard loaded with transition.")

        # Navigate to support
        page.click("text=Support Center")
        page.wait_for_selector("body.loaded")
        print("Support page loaded with transition.")

        # Navigate back to dashboard
        page.click("text=Dashboard")
        page.wait_for_selector("body.loaded")
        print("Dashboard loaded again with transition.")

        browser.close()

if __name__ == "__main__":
    verify_transitions()
