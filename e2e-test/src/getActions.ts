import * as webdriver from "selenium-webdriver";
import {nativeClick, waitFor} from "./util";

export function getActions(driver: webdriver.WebDriver) {
  return {
    async clickGetMenuButton() {
      const getMenuButton = driver.findElement(webdriver.By.css("[data-testid=get_menu_button]"));
      await getMenuButton.click();
    },
    async inputFile(path: string) {
      const fileInput = driver.findElement(webdriver.By.css("[data-testid=file_input] input[type=file]"));
      await fileInput.sendKeys(path);
    },
    async inputSecretPath(path: string) {
      const secretPathClearButton = driver.findElement(webdriver.By.css("[data-testid=secret_path_input] ~ * [aria-label='Clear Secret path']"));
      await secretPathClearButton.click();
      const secretPathInput = driver.findElement(webdriver.By.css("[data-testid=secret_path_input]"));
      await secretPathInput.sendKeys(path);
    },
    async togglePasswordlessSwitch() {
      const passwordlessSwitch = driver.findElement(webdriver.By.css("[data-testid=passwordless_switch]"));
      // NOTE: e.click() causes "Element <input id="..." type="checkbox"> is not clickable at point because another element <div class="..."> obscures it"
      await nativeClick(driver, passwordlessSwitch);
    },
    async togglePasswordlessSendAndVerifySwitch() {
      const passwordlessSendAndVerifySwitch = driver.findElement(webdriver.By.css("[data-testid=passwordless_send_and_verify_switch]"));
      // NOTE: e.click() causes "Element <input id="..." type="checkbox"> is not clickable at point because another element <div class="..."> obscures it"
      await nativeClick(driver, passwordlessSendAndVerifySwitch);
    },
    async togglePasswordSwitch() {
      const passwordSwitch = driver.findElement(webdriver.By.css("[data-testid=password_switch]"));
      // NOTE: passwordSwitch.click() causes "Element <input id="..." type="checkbox"> is not clickable at point because another element <div class="..."> obscures it"
      await nativeClick(driver, (await passwordSwitch));
    },
    async inputPassword(password: string) {
      const passwordInput = driver.findElement(webdriver.By.css("[data-testid=password_input]"));
      await passwordInput.sendKeys(password);
    },
    async clickSendButton() {
      const sendButton = driver.findElement(webdriver.By.css("[data-testid=send_button]"));
      await sendButton.click();
    },
    async clickMoreOptionsButton() {
      const moreOptionsButton = driver.findElement(webdriver.By.css("[data-testid=more_options_button]"));
      await moreOptionsButton.click();
    },
    async clickDownloadButton() {
      const downloadButton = driver.findElement(webdriver.By.css("[data-testid=download_button]"));
      await downloadButton.click();
    },
    async clickViewButton() {
      const viewButton = driver.findElement(webdriver.By.css("[data-testid=view_button]"));
      await viewButton.click();
    },
    retryDownloadButtonIfNeed(): () => void {
      let done = false;
      (async () => {
        let retryDownloadButton: webdriver.WebElement;
        while (true) {
          try {
            retryDownloadButton = await driver.findElement(webdriver.By.css("[data-testid=retry_download_button]"));
            const href = await retryDownloadButton.getAttribute("href");
            if (href.includes("/sw-download/")) {
              break;
            }
          } catch (e) {
          }
          await new Promise(resolve => setTimeout(resolve, 500));
          if (done) {
            return;
          }
        }
        await driver.executeScript((button: HTMLElement) => {
          window.scrollTo(0, button.offsetTop)
        }, retryDownloadButton);
        // GitHub Actions frequently fails in 2 seconds.
        await new Promise(resolve => setTimeout(resolve, 5000));
        await retryDownloadButton.click();
      })().catch(e => console.error("failed to run retryDownloadButtonIfNeed()", e));
      return () => { done = true };
    },
    async clickPasswordlessVerifiedButton0() {
      const passwordlessVerifiedButton0 = driver.findElement(webdriver.By.css("[data-testid=expand_panel_0] [data-testid=passwordless_verified_button]"));
      await passwordlessVerifiedButton0.click();
    },
    async getImage0BlobUrlInView(): Promise<string> {
      const findImage0InView = () => driver.findElement(webdriver.By.xpath("//*[@data-testid='expand_panel_0']//*[@data-testid='image' and contains(@src, 'blob:')]"));
      return await (await waitFor(async () => findImage0InView())).getAttribute("src");
    },
  };
}
