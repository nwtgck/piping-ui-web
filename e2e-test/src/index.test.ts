import * as assert from 'power-assert';
import * as webdriver from "selenium-webdriver";
import {WebDriver} from "selenium-webdriver";
import {
  createDriverFactory,
  getBufferByBlobUrl,
  nativeClick,
  randomBytesAvoidingMimeTypeDetection,
  rayTracingPngImage,
  servePipingUiIfNotServed,
  waitFor,
  waitForDownload,
} from "./util";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import {afterEach} from "mocha";

const PIPING_UI_PORT = 4000;
const PIPING_UI_URL = `http://localhost:${PIPING_UI_PORT}`;

const driverFactoryPromise = createDriverFactory({
  dockerBaseImage: process.env["E2E_DOCKER_IMAGE"] || (() => {throw new Error("$E2E_DOCKER_IMAGE not found")})(),
  disablesServiceWorker: process.env["E2E_DISABLE_SERVICE_WORKER"] === "true",
  blockPopup: process.env["E2E_BLOCK_POPUP"] === "true",
  forwardingTcpPorts: [PIPING_UI_PORT],
});

before(async () => {
  await Promise.all([
    servePipingUiIfNotServed(PIPING_UI_PORT),
    driverFactoryPromise,
  ]);
});

function findElements(driver: WebDriver) {
  return {
    fileInput: async () => driver.findElement(webdriver.By.css("[data-testid=file_input] input[type=file]")),
    secretPathInput: async () => driver.findElement(webdriver.By.css("[data-testid=secret_path_input]")),
    secretPathClearButton: async () => driver.findElement(webdriver.By.css("[data-testid=secret_path_input] ~ * [aria-label='clear icon']")),
    passwordlessSendAndVerifySwitch: async () => driver.findElement(webdriver.By.css("[data-testid=passwordless_send_and_verify_switch]")),
    sendButton: async () => driver.findElement(webdriver.By.css("[data-testid=send_button]")),
    getMenuButton: async () => driver.findElement(webdriver.By.css("[data-testid=get_menu_button]")),
    downloadButton: async () => driver.findElement(webdriver.By.css("[data-testid=download_button]")),
    viewButton: async () => driver.findElement(webdriver.By.css("[data-testid=view_button]")),
    image0InView: async () => driver.findElement(webdriver.By.xpath("//*[@data-testid='expand_panel_0']//*[@data-testid='image' and contains(@src, 'blob:')]")),
    passwordlessSwitch: async () => driver.findElement(webdriver.By.css("[data-testid=passwordless_switch]")),
    passwordlessVerifiedButton0: async () => driver.findElement(webdriver.By.css("[data-testid=expand_panel_0] [data-testid=passwordless_verified_button]")),
    moreOptionsButton: async () => driver.findElement(webdriver.By.css("[data-testid=more_options_button]")),
    passwordSwitch: async () => driver.findElement(webdriver.By.css("[data-testid=password_switch]")),
    passwordInput: async () => driver.findElement(webdriver.By.css("[data-testid=password_input]")),
  } as const;
}

function getActions(driver: WebDriver) {
  const elements = findElements(driver);
  return {
    async inputSecretPath(path: string) {
      await (await elements.secretPathClearButton()).click();
      await (await elements.secretPathInput()).sendKeys(path);
    },
    retryDownloadButtonIfNeed(): () => void {
      let done = false;
      (async () => {
        let retryDownloadButton: webdriver.WebElement;
        while (true) {
          try {
            retryDownloadButton = await driver.findElement(webdriver.By.css("[data-testid=retry_download_button]"));
            const href = await retryDownloadButton.getAttribute("href");
            console.log("href", href);
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
        await nativeClick(driver, retryDownloadButton);
      })().catch(e => console.error(e));
      return () => { done = true };
    },
  };
}

describe('Piping UI', () => {
  const afterCallbacks: (() => void | Promise<void>)[] = [];
  afterEach(async () => {
    for (let i = afterCallbacks.length - 1; i >= 0; i--) {
      await afterCallbacks[i]();
    }
    afterCallbacks.length = 0;
  });
  function defer(f: () => void | Promise<void>) {
    afterCallbacks.push(f);
  }

  it('should send and download a file', async () => {
    const {sharePath, sharePathInDocker, downloadPath, createDriver} = await driverFactoryPromise;

    const secretPath = crypto.randomBytes(8).toString("hex");
    const transferContent = randomBytesAvoidingMimeTypeDetection(1024 * 1024);

    {
      const driver = createDriver();
      defer(() => driver.quit());
      await driver.get(PIPING_UI_URL);
      const elements = findElements(driver);
      const actions = getActions(driver);

      const transferFilePath = path.join(sharePath, "mydata.dat");
      fs.writeFileSync(transferFilePath, transferContent);
      defer(() => fs.rmSync(transferFilePath));
      await (await elements.fileInput()).sendKeys(path.join(sharePathInDocker, "mydata.dat"));
      await actions.inputSecretPath(secretPath);
      // NOTE: e.click() causes "Element <input id="..." type="checkbox"> is not clickable at point because another element <div class="..."> obscures it"
      await nativeClick(driver, await elements.passwordlessSwitch());
      await new Promise(resolve => setTimeout(resolve, 1000));
      await (await elements.sendButton()).click();
    }

    {
      const driver = createDriver();
      defer(() => driver.quit());
      await driver.get(PIPING_UI_URL);
      const elements = findElements(driver);
      const actions = getActions(driver);

      await (await elements.getMenuButton()).click();
      await actions.inputSecretPath(secretPath);
      // NOTE: e.click() causes "Element <input id="..." type="checkbox"> is not clickable at point because another element <div class="..."> obscures it"
      await nativeClick(driver, await elements.passwordlessSwitch());
      await new Promise(resolve => setTimeout(resolve, 1000));
      await (await elements.downloadButton()).click();
      const finishRetryDownload = actions.retryDownloadButtonIfNeed();
      defer(() => finishRetryDownload());

      const downloadedFilePath = path.join(downloadPath, secretPath);
      await waitForDownload(downloadedFilePath);
      const downloadedFileContent = fs.readFileSync(downloadedFilePath);

      assert.strictEqual(transferContent.length, downloadedFileContent.length);
      assert(transferContent.equals(downloadedFileContent));
      fs.rmSync(downloadedFilePath);
    }
  });

  it('should send and show a file', async () => {
    const {sharePath, sharePathInDocker, downloadPath, createDriver} = await driverFactoryPromise;

    const secretPath = crypto.randomBytes(8).toString("hex");
    {
      const driver = createDriver();
      defer(() => driver.quit());
      await driver.get(PIPING_UI_URL);
      const elements = findElements(driver);
      const actions = getActions(driver);

      const transferFilePath = path.join(sharePath, "myimg.png");
      fs.writeFileSync(transferFilePath, rayTracingPngImage);
      defer(() => fs.rmSync(transferFilePath));
      await (await elements.fileInput()).sendKeys(path.join(sharePathInDocker, "myimg.png"));
      await actions.inputSecretPath(secretPath);
      // NOTE: e.click() causes "Element <input id="..." type="checkbox"> is not clickable at point because another element <div class="..."> obscures it"
      await nativeClick(driver, await elements.passwordlessSwitch());
      await new Promise(resolve => setTimeout(resolve, 1000));
      await (await elements.sendButton()).click();
    }

    {
      const driver = createDriver();
      defer(() => driver.quit());
      await driver.get(PIPING_UI_URL);
      const elements = findElements(driver);
      const actions = getActions(driver);

      await (await elements.getMenuButton()).click();
      await actions.inputSecretPath(secretPath);
      // NOTE: e.click() causes "Element <input id="..." type="checkbox"> is not clickable at point because another element <div class="..."> obscures it"
      await nativeClick(driver, await elements.passwordlessSwitch());
      await new Promise(resolve => setTimeout(resolve, 1000));
      await (await elements.viewButton()).click();

      const imageBlobUrl = await (await waitFor(() => elements.image0InView())).getAttribute("src");
      const shownFileContent = await getBufferByBlobUrl(driver, imageBlobUrl);

      assert.strictEqual(rayTracingPngImage.length, shownFileContent.length);
      assert(rayTracingPngImage.equals(shownFileContent));
    }
  });

  it('should send and download an E2E encrypted file with password', async () => {
    const {sharePath, sharePathInDocker, downloadPath, createDriver} = await driverFactoryPromise;

    const secretPath = crypto.randomBytes(8).toString("hex");
    const transferContent = randomBytesAvoidingMimeTypeDetection(1024 * 1024);
    const filePassword = crypto.randomBytes(32).toString("binary");

    {
      const driver = createDriver();
      defer(() => driver.quit());
      await driver.get(PIPING_UI_URL);
      const elements = findElements(driver);
      const actions = getActions(driver);

      const transferFilePath = path.join(sharePath, "mydata.dat");
      fs.writeFileSync(transferFilePath, transferContent);
      defer(() => fs.rmSync(transferFilePath));
      await (await elements.fileInput()).sendKeys(path.join(sharePathInDocker, "mydata.dat"));
      await actions.inputSecretPath(secretPath);
      await (await elements.moreOptionsButton()).click();
      // NOTE: passwordElement.click() causes "Element <input id="..." type="checkbox"> is not clickable at point because another element <div class="..."> obscures it"
      await nativeClick(driver, (await elements.passwordSwitch()));
      await (await elements.passwordInput()).sendKeys(filePassword);
      await new Promise(resolve => setTimeout(resolve, 1000));
      await (await elements.sendButton()).click();
    }

    {
      const driver = createDriver();
      defer(() => driver.quit());
      await driver.get(PIPING_UI_URL);
      const elements = findElements(driver);
      const actions = getActions(driver);

      await (await elements.getMenuButton()).click();
      await actions.inputSecretPath(secretPath);
      await (await elements.moreOptionsButton()).click();
      // NOTE: passwordElement.click() causes "Element <input id="..." type="checkbox"> is not clickable at point because another element <div class="..."> obscures it"
      await nativeClick(driver, await elements.passwordSwitch());
      await (await elements.passwordInput()).sendKeys(filePassword);
      await new Promise(resolve => setTimeout(resolve, 1000));
      await (await elements.downloadButton()).click();
      const finishRetryDownload = actions.retryDownloadButtonIfNeed();
      defer(() => finishRetryDownload());

      const downloadedFilePath = path.join(downloadPath, secretPath);
      await waitForDownload(downloadedFilePath);
      const downloadedFileContent = fs.readFileSync(downloadedFilePath);

      assert.strictEqual(transferContent.length, downloadedFileContent.length);
      assert(transferContent.equals(downloadedFileContent));
      fs.rmSync(downloadedFilePath);
    }
  });

  it('should send and show an E2E encrypted file with password', async () => {
    const {sharePath, sharePathInDocker, downloadPath, createDriver} = await driverFactoryPromise;

    const secretPath = crypto.randomBytes(8).toString("hex");
    const filePassword = crypto.randomBytes(32).toString("binary");

    {
      const driver = createDriver();
      defer(() => driver.quit());
      await driver.get(PIPING_UI_URL);
      const elements = findElements(driver);
      const actions = getActions(driver);

      const transferFilePath = path.join(sharePath, "myimg.png");
      fs.writeFileSync(transferFilePath, rayTracingPngImage);
      defer(() => fs.rmSync(transferFilePath));
      await (await elements.fileInput()).sendKeys(path.join(sharePathInDocker, "myimg.png"));
      await actions.inputSecretPath(secretPath);
      await (await elements.moreOptionsButton()).click();
      // NOTE: passwordElement.click() causes "Element <input id="..." type="checkbox"> is not clickable at point because another element <div class="..."> obscures it"
      await nativeClick(driver, (await elements.passwordSwitch()));
      await (await elements.passwordInput()).sendKeys(filePassword);
      await new Promise(resolve => setTimeout(resolve, 1000));
      await (await elements.sendButton()).click();
    }

    {
      const driver = createDriver();
      defer(() => driver.quit());
      await driver.get(PIPING_UI_URL);
      const elements = findElements(driver);
      const actions = getActions(driver);

      await (await elements.getMenuButton()).click();
      await actions.inputSecretPath(secretPath);
      await (await elements.moreOptionsButton()).click();
      // NOTE: passwordElement.click() causes "Element <input id="..." type="checkbox"> is not clickable at point because another element <div class="..."> obscures it"
      await nativeClick(driver, await elements.passwordSwitch());
      await (await elements.passwordInput()).sendKeys(filePassword);
      await new Promise(resolve => setTimeout(resolve, 1000));
      await (await elements.viewButton()).click();

      const imageBlobUrl = await (await waitFor(() => elements.image0InView())).getAttribute("src");
      const shownFileContent = await getBufferByBlobUrl(driver, imageBlobUrl);

      assert.strictEqual(rayTracingPngImage.length, shownFileContent.length);
      assert(rayTracingPngImage.equals(shownFileContent));
    }
  });

  it('should send and download a file by passwordless E2E encryption', async () => {
    const {sharePath, sharePathInDocker, downloadPath, createDriver} = await driverFactoryPromise;

    const secretPath = crypto.randomBytes(8).toString("hex");
    const transferContent = randomBytesAvoidingMimeTypeDetection(1024 * 1024);

    const senderDriver = createDriver();
    defer(() => senderDriver.quit());
    await senderDriver.get(PIPING_UI_URL);
    const senderElements = findElements(senderDriver);
    const senderActions = getActions(senderDriver);

    const transferFilePath = path.join(sharePath, "mydata.dat");
    fs.writeFileSync(transferFilePath, transferContent);
    defer(() => fs.rmSync(transferFilePath));
    await (await senderElements.fileInput()).sendKeys(path.join(sharePathInDocker, "mydata.dat"));
    await senderActions.inputSecretPath(secretPath);
    // NOTE: e.click() causes "Element <input id="..." type="checkbox"> is not clickable at point because another element <div class="..."> obscures it"
    await nativeClick(senderDriver, await senderElements.passwordlessSendAndVerifySwitch());
    await new Promise(resolve => setTimeout(resolve, 1000));
    await (await senderElements.sendButton()).click();

    const receiverDriver = createDriver();
    defer(() => receiverDriver.quit());
    await receiverDriver.get(PIPING_UI_URL);
    const receiverElements = findElements(receiverDriver);
    const receiverActions = getActions(receiverDriver);

    await (await receiverElements.getMenuButton()).click();
    await receiverActions.inputSecretPath(secretPath);
    await new Promise(resolve => setTimeout(resolve, 1000));
    await (await receiverElements.downloadButton()).click();
    const finishRetryDownload = receiverActions.retryDownloadButtonIfNeed();
    defer(() => finishRetryDownload());

    await new Promise(resolve => setTimeout(resolve, 2000));
    await (await senderElements.passwordlessVerifiedButton0()).click();

    const downloadedFilePath = path.join(downloadPath, secretPath);
    await waitForDownload(downloadedFilePath);
    const downloadedFileContent = fs.readFileSync(downloadedFilePath);

    assert.strictEqual(transferContent.length, downloadedFileContent.length);
    assert(transferContent.equals(downloadedFileContent));
    fs.rmSync(downloadedFilePath);
  });

  it('should send and show a file by passwordless E2E encryption', async () => {
    const {sharePath, sharePathInDocker, downloadPath, createDriver} = await driverFactoryPromise;

    const secretPath = crypto.randomBytes(8).toString("hex");

    const senderDriver = createDriver();
    defer(() => senderDriver.quit());
    await senderDriver.get(PIPING_UI_URL);
    const senderElements = findElements(senderDriver);
    const senderActions = getActions(senderDriver);

    const transferFilePath = path.join(sharePath, "myimg.png");
    fs.writeFileSync(transferFilePath, rayTracingPngImage);
    defer(() => fs.rmSync(transferFilePath));
    await (await senderElements.fileInput()).sendKeys(path.join(sharePathInDocker, "myimg.png"));
    await senderActions.inputSecretPath(secretPath);
    // NOTE: e.click() causes "Element <input id="..." type="checkbox"> is not clickable at point because another element <div class="..."> obscures it"
    await nativeClick(senderDriver, await senderElements.passwordlessSendAndVerifySwitch());
    await new Promise(resolve => setTimeout(resolve, 1000));
    await (await senderElements.sendButton()).click();

    const receiverDriver = createDriver();
    defer(() => receiverDriver.quit());
    await receiverDriver.get(PIPING_UI_URL);
    const receiverElements = findElements(receiverDriver);
    const receiverActions = getActions(receiverDriver);

    await (await receiverElements.getMenuButton()).click();
    await receiverActions.inputSecretPath(secretPath);
    await new Promise(resolve => setTimeout(resolve, 1000));
    await (await receiverElements.viewButton()).click();

    await new Promise(resolve => setTimeout(resolve, 2000));
    await (await senderElements.passwordlessVerifiedButton0()).click();

    const imageBlobUrl = await (await waitFor(() => receiverElements.image0InView())).getAttribute("src");
    const shownFileContent = await getBufferByBlobUrl(receiverDriver, imageBlobUrl);

    assert.strictEqual(rayTracingPngImage.length, shownFileContent.length);
    assert(rayTracingPngImage.equals(shownFileContent));
  });
});
