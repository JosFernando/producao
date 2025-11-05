from playwright.sync_api import sync_playwright
import os

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the local HTML file
        file_path = os.path.abspath('index.html')
        page.goto(f'file://{file_path}')

        # Simulate login by showing the app container
        page.evaluate("document.getElementById('auth-container').classList.add('hidden')")
        page.evaluate("document.getElementById('app-container').classList.remove('hidden')")
        page.evaluate("document.getElementById('app-container').classList.add('flex')")

        # Take a screenshot
        page.screenshot(path='verification.png')

        browser.close()

if __name__ == '__main__':
    run_verification()
