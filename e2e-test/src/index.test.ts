import * as assert from 'power-assert';
import * as webdriver from "selenium-webdriver";
import {WebDriver} from "selenium-webdriver";
import {createDriverFactory, findElementByLabel, nativeClick, servePipingUiIfNotServed} from "./util";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import {afterEach} from "mocha";

const PIPING_UI_PORT = 4000;
const PIPING_UI_URL = `http://localhost:${PIPING_UI_PORT}`;

const driverFactoryPromise = createDriverFactory({
  dockerBaseImage: process.env["E2E_DOCKER_IMAGE"] || (() => {throw new Error("$E2E_DOCKER_IMAGE not found")})(),
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

  it('should transfer a file', async () => {
    const {sharePath, sharePathInDocker, downloadPath, createDriver} = await driverFactoryPromise;

    const secretPath = crypto.randomBytes(8).toString("hex");
    const transferContent = crypto.randomBytes(1024 * 1024);

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
      // NOTE: Firefox creates 0-byte file and .part file
      while (!fs.existsSync(downloadedFilePath) || fs.statSync(downloadedFilePath).size === 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      const downloadedFileContent = fs.readFileSync(downloadedFilePath);

      assert.strictEqual(transferContent.length, downloadedFileContent.length);
      assert(transferContent.equals(downloadedFileContent));
      fs.rmSync(downloadedFilePath);
    }
  });

  it('should transfer an E2E encrypted file with password', async () => {
    const {sharePath, sharePathInDocker, downloadPath, createDriver} = await driverFactoryPromise;

    const secretPath = crypto.randomBytes(8).toString("hex");
    const transferContent = crypto.randomBytes(1024 * 1024);
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
      // NOTE: Firefox creates 0-byte file and .part file
      while (!fs.existsSync(downloadedFilePath) || fs.statSync(downloadedFilePath).size === 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      const downloadedFileContent = fs.readFileSync(downloadedFilePath);

      assert.strictEqual(transferContent.length, downloadedFileContent.length);
      assert(transferContent.equals(downloadedFileContent));
      fs.rmSync(downloadedFilePath);
    }
  });
});
