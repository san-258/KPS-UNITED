from playwright.sync_api import sync_playwright, expect
import time

def verify_auto_logout():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # 1. Login with a timestamp older than 24 hours
        page.goto("http://localhost:8000/index.html")

        # 25 hours ago
        past_time = int(time.time() * 1000) - (25 * 60 * 60 * 1000)

        page.evaluate(f"""
            localStorage.setItem('currentUser', JSON.stringify({{
                name: 'Expired Store',
                email: 'expired@example.com',
                password: 'password123',
                loginTime: {past_time}
            }}));
        """)

        # 2. Try to go to dashboard
        page.goto("http://localhost:8000/dashboard.html")

        # 3. Should be redirected to index.html (login)
        page.wait_for_timeout(1000)
        print(f"URL after accessing dashboard with expired session: {page.url}")

        if page.url.endswith("index.html"):
            print("Auto-logout verified: Redirected to login page.")
        else:
            print("Auto-logout failed: Still on dashboard.")

        # 4. Verify user is removed from localStorage
        user = page.evaluate("localStorage.getItem('currentUser')")
        if user is None:
             print("Auto-logout verified: localStorage cleared.")
        else:
             print("Auto-logout failed: localStorage not cleared.")

        browser.close()

if __name__ == "__main__":
    verify_auto_logout()
