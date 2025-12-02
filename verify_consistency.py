from playwright.sync_api import sync_playwright

def verify_pages():
    pages = ['dashboard.html', 'resources.html', 'profile.html', 'support.html']

    with sync_playwright() as p:
        browser = p.chromium.launch()

        for page_name in pages:
            print(f"Checking {page_name}...")
            # We open the file locally
            page = browser.new_page()
            try:
                # Use absolute path or file:// protocol
                import os
                cwd = os.getcwd()
                filepath = f"file://{cwd}/{page_name}"
                page.goto(filepath)

                # Check viewport
                viewport = page.locator('meta[name="viewport"]')
                if viewport.count() > 0:
                    content = viewport.get_attribute('content')
                    if content == "width=device-width, initial-scale=1.0":
                        print(f"  [PASS] Viewport tag present and correct in {page_name}")
                    else:
                        print(f"  [FAIL] Viewport tag content incorrect in {page_name}: {content}")
                else:
                    print(f"  [FAIL] Viewport tag MISSING in {page_name}")

                # Check CSS link
                css_link = page.locator('link[rel="stylesheet"][href="style.css"]')
                if css_link.count() > 0:
                    print(f"  [PASS] style.css linked in {page_name}")
                else:
                    print(f"  [FAIL] style.css NOT linked in {page_name}")

                # Check Auth Script
                auth_script = page.locator('script[src="auth.js"]')
                if auth_script.count() > 0:
                    print(f"  [PASS] auth.js included in {page_name}")
                else:
                    print(f"  [FAIL] auth.js NOT included in {page_name}")

            except Exception as e:
                print(f"  [ERROR] Failed to check {page_name}: {e}")
            finally:
                page.close()

        browser.close()

if __name__ == "__main__":
    verify_pages()
