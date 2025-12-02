from playwright.sync_api import sync_playwright, expect
import time

def verify_logo():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        page.goto("http://localhost:8000/index.html")

        # Take screenshot of login page
        page.screenshot(path="verification/login_page_logo.png")

        # Check if logo image is loaded and visible
        # We can check naturalWidth to ensure it loaded
        is_logo_loaded = page.evaluate("""
            () => {
                const img = document.querySelector('.logo-image');
                return img && img.naturalWidth > 0;
            }
        """)

        if is_logo_loaded:
            print("Logo image loaded successfully.")
        else:
            print("Logo image FAILED to load.")

        browser.close()

if __name__ == "__main__":
    verify_logo()
