import * as assert from 'power-assert';
import * as webdriver from "selenium-webdriver";
import {WebDriver} from "selenium-webdriver";
import {
  createDriverFactory,
  findElementByLabel,
  findElementsByTagNameAndContent, getBufferByBlobUrl,
  nativeClick,
  randomBytesAvoidingMimeTypeDetection,
  rayTracingPngImage,
  servePipingUiIfNotServed, waitFor,
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
    fileInput: async () => await driver.findElement(webdriver.By.css("input[type='file']")),
    secretPathInput: async () => await findElementByLabel(driver, /Secret path/),
    sendButton: async () => (await driver.findElements(webdriver.By.xpath(`//button[.//*[contains(text(), "Send")]]`)))[1],
    getMenuButton: async () => driver.findElement(webdriver.By.xpath(`//button[.//*[contains(text(), "Get")]]`)),
    downloadButton: async () => driver.findElement(webdriver.By.xpath(`//button[.//*[contains(text(), "Download")]]`)),
    viewButton: async () => driver.findElement(webdriver.By.xpath(`//button[.//*[contains(text(), "View")]]`)),
    image0InView: async () => driver.findElement(webdriver.By.xpath("//img[contains(@src, 'blob:')]")),
    passwordlessSwitch: async () => await findElementByLabel(driver, /Passwordless/),
    verifySendButton0: async () => (await findElementsByTagNameAndContent(driver, "button", /Verify & Send/i))[0],
    passwordSwitch: async () => await findElementByLabel(driver, /Protect with password/),
    passwordInput: async () => driver.findElement(webdriver.By.css("input[type=password]")),
  } as const;
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

      const transferFilePath = path.join(sharePath, "mydata.dat");
      fs.writeFileSync(transferFilePath, transferContent);
      defer(() => fs.rmSync(transferFilePath));
      await (await elements.fileInput()).sendKeys(path.join(sharePathInDocker, "mydata.dat"));
      await (await elements.secretPathInput()).sendKeys(secretPath);
      await new Promise(resolve => setTimeout(resolve, 1000));
      await (await elements.sendButton()).click();
    }

    {
      const driver = createDriver();
      defer(() => driver.quit());

      await driver.get(PIPING_UI_URL);

      const elements = findElements(driver);

      await (await elements.getMenuButton()).click();
      await (await elements.secretPathInput()).sendKeys(secretPath);
      await new Promise(resolve => setTimeout(resolve, 1000));
      await (await elements.downloadButton()).click();

      const downloadedFilePath = path.join(downloadPath, secretPath);
      await waitForDownload(downloadedFilePath);
      const downloadedFileContent = fs.readFileSync(downloadedFilePath);

      assert.strictEqual(transferContent.length, downloadedFileContent.length);
      assert(transferContent.equals(downloadedFileContent));
      fs.rmSync(downloadedFilePath);
    }
  });

  it('should send and shows a file', async () => {
    const {sharePath, sharePathInDocker, downloadPath, createDriver} = await driverFactoryPromise;

    const secretPath = crypto.randomBytes(8).toString("hex");
    {
      const driver = createDriver();
      defer(() => driver.quit());
      await driver.get(PIPING_UI_URL);
      const elements = findElements(driver);

      const transferFilePath = path.join(sharePath, "myimg.png");
      fs.writeFileSync(transferFilePath, rayTracingPngImage);
      defer(() => fs.rmSync(transferFilePath));
      await (await elements.fileInput()).sendKeys(path.join(sharePathInDocker, "myimg.png"));
      await (await elements.secretPathInput()).sendKeys(secretPath);
      await new Promise(resolve => setTimeout(resolve, 1000));
      await (await elements.sendButton()).click();
    }

    {
      const driver = createDriver();
      defer(() => driver.quit());
      await driver.get(PIPING_UI_URL);
      const elements = findElements(driver);

      await (await elements.getMenuButton()).click();
      await (await elements.secretPathInput()).sendKeys(secretPath);
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

      const transferFilePath = path.join(sharePath, "mydata.dat");
      fs.writeFileSync(transferFilePath, transferContent);
      defer(() => fs.rmSync(transferFilePath));
      await (await elements.fileInput()).sendKeys(path.join(sharePathInDocker, "mydata.dat"));
      await (await elements.secretPathInput()).sendKeys(secretPath);
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

      await (await elements.getMenuButton()).click();
      await (await elements.secretPathInput()).sendKeys(secretPath);
      // NOTE: passwordElement.click() causes "Element <input id="..." type="checkbox"> is not clickable at point because another element <div class="..."> obscures it"
      await nativeClick(driver, await elements.passwordSwitch());
      await (await elements.passwordInput()).sendKeys(filePassword);
      await new Promise(resolve => setTimeout(resolve, 1000));
      await (await elements.downloadButton()).click();

      const downloadedFilePath = path.join(downloadPath, secretPath);
      await waitForDownload(downloadedFilePath);
      const downloadedFileContent = fs.readFileSync(downloadedFilePath);

      assert.strictEqual(transferContent.length, downloadedFileContent.length);
      assert(transferContent.equals(downloadedFileContent));
      fs.rmSync(downloadedFilePath);
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

    const transferFilePath = path.join(sharePath, "mydata.dat");
    fs.writeFileSync(transferFilePath, transferContent);
    defer(() => fs.rmSync(transferFilePath));
    await (await senderElements.fileInput()).sendKeys(path.join(sharePathInDocker, "mydata.dat"));
    await (await senderElements.secretPathInput()).sendKeys(secretPath);
    // NOTE: e.click() causes "Element <input id="..." type="checkbox"> is not clickable at point because another element <div class="..."> obscures it"
    await nativeClick(senderDriver, (await senderElements.passwordlessSwitch()));
    await new Promise(resolve => setTimeout(resolve, 1000));
    await (await senderElements.sendButton()).click();

    const receiverDriver = createDriver();
    defer(() => receiverDriver.quit());
    await receiverDriver.get(PIPING_UI_URL);
    const receiverElements = findElements(receiverDriver);

    await (await receiverElements.getMenuButton()).click();
    await (await receiverElements.secretPathInput()).sendKeys(secretPath);
    // NOTE: e.click() causes "Element <input id="..." type="checkbox"> is not clickable at point because another element <div class="..."> obscures it"
    await nativeClick(receiverDriver, await receiverElements.passwordlessSwitch());
    await new Promise(resolve => setTimeout(resolve, 1000));
    await (await receiverElements.downloadButton()).click();

    await new Promise(resolve => setTimeout(resolve, 2000));
    await (await senderElements.verifySendButton0()).click();

    const downloadedFilePath = path.join(downloadPath, secretPath);
    await waitForDownload(downloadedFilePath);
    const downloadedFileContent = fs.readFileSync(downloadedFilePath);

    assert.strictEqual(transferContent.length, downloadedFileContent.length);
    assert(transferContent.equals(downloadedFileContent));
    fs.rmSync(downloadedFilePath);
  });
});
