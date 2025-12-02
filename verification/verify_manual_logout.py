from playwright.sync_api import sync_playwright, expect
import time

def verify_manual_logout_everywhere():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()

        pages_to_test = ["dashboard.html", "profile.html", "support.html", "resources.html"]

        for page_name in pages_to_test:
            page = context.new_page()
            print(f"Testing logout from {page_name}...")

            # Login
            page.goto("http://localhost:8000/index.html")
            page.evaluate("""
                localStorage.setItem('currentUser', JSON.stringify({
                    name: 'Test Store',
                    email: 'test@example.com',
                    password: 'password123',
                    loginTime: new Date().getTime()
                }));
            """)

            page.goto(f"http://localhost:8000/{page_name}")
            page.wait_for_selector("body.loaded") # wait for page load

            # Handle dialog
            page.on("dialog", lambda dialog: dialog.accept())

            # Click logout
            try:
                page.get_by_role("button", name="Logout").click()
                page.wait_for_timeout(1000)

                if page.url.endswith("index.html"):
                    print(f"Logout from {page_name} successful.")
                else:
                    print(f"Logout from {page_name} FAILED. URL: {page.url}")
            except Exception as e:
                print(f"Logout from {page_name} ERROR: {e}")

            page.close()

        browser.close()

if __name__ == "__main__":
    verify_manual_logout_everywhere()
