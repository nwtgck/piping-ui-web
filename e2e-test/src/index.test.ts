import * as assert from 'power-assert';
import {
  createDriverFactory,
  getBufferByBlobUrl,
  randomBytesAvoidingMimeTypeDetection,
  rayTracingPngImage,
  servePipingUiIfNotServed,
  waitForDownload,
} from "./util";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import {afterEach} from "mocha";
import {getActions} from "./getActions";

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

  it('should send and download a file', async function () {
    const {sharePath, sharePathInDocker, downloadPath, createDriver, blockPopup} = await driverFactoryPromise;

    const secretPath = crypto.randomBytes(8).toString("hex");
    const transferContent = randomBytesAvoidingMimeTypeDetection(1024 * 1024);

    {
      const driver = createDriver();
      defer(() => driver.quit());
      await driver.get(PIPING_UI_URL);
      const actions = getActions(driver);

      const transferFilePath = path.join(sharePath, "mydata.dat");
      fs.writeFileSync(transferFilePath, transferContent);
      defer(() => fs.rmSync(transferFilePath));
      await actions.inputFile(path.join(sharePathInDocker, "mydata.dat"));
      await actions.inputSecretPath(secretPath);
      await actions.togglePasswordlessSwitch();
      await new Promise(resolve => setTimeout(resolve, 1000));
      await actions.clickSendButton();
    }

    {
      const driver = createDriver();
      defer(() => driver.quit());
      await driver.get(PIPING_UI_URL);
      const actions = getActions(driver);

      await actions.clickGetMenuButton();
      await actions.inputSecretPath(secretPath);
      await actions.togglePasswordlessSwitch();
      await new Promise(resolve => setTimeout(resolve, 1000));
      await actions.clickDownloadButton();
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

  it('should send and show a file', async function () {
    const {sharePath, sharePathInDocker, downloadPath, createDriver, blockPopup} = await driverFactoryPromise;
    // NOTE: Skip because GitHub Actions frequently failed. In local Intel Mac, it succeeds.

    const secretPath = crypto.randomBytes(8).toString("hex");
    {
      const driver = createDriver();
      defer(() => driver.quit());
      await driver.get(PIPING_UI_URL);
      const actions = getActions(driver);

      const transferFilePath = path.join(sharePath, "myimg.png");
      fs.writeFileSync(transferFilePath, rayTracingPngImage);
      defer(() => fs.rmSync(transferFilePath));
      await actions.inputFile(path.join(sharePathInDocker, "myimg.png"));
      await actions.inputSecretPath(secretPath);
      await actions.togglePasswordlessSwitch();
      await new Promise(resolve => setTimeout(resolve, 1000));
      await actions.clickSendButton();
    }

    {
      const driver = createDriver();
      defer(() => driver.quit());
      await driver.get(PIPING_UI_URL);
      const actions = getActions(driver);

      await actions.clickGetMenuButton();
      await actions.inputSecretPath(secretPath);
      await actions.togglePasswordlessSwitch();
      await new Promise(resolve => setTimeout(resolve, 1000));
      await actions.clickViewButton();

      const imageBlobUrl = await actions.getImage0BlobUrlInView();
      const shownFileContent = await getBufferByBlobUrl(driver, imageBlobUrl);

      assert.strictEqual(rayTracingPngImage.length, shownFileContent.length);
      assert(rayTracingPngImage.equals(shownFileContent));
    }
  });

  it('should send and download an E2E encrypted file with password', async function () {
    const {sharePath, sharePathInDocker, downloadPath, createDriver, blockPopup} = await driverFactoryPromise;

    const secretPath = crypto.randomBytes(8).toString("hex");
    const transferContent = randomBytesAvoidingMimeTypeDetection(1024 * 1024);
    const filePassword = crypto.randomBytes(32).toString("binary");

    {
      const driver = createDriver();
      defer(() => driver.quit());
      await driver.get(PIPING_UI_URL);
      const actions = getActions(driver);

      const transferFilePath = path.join(sharePath, "mydata.dat");
      fs.writeFileSync(transferFilePath, transferContent);
      defer(() => fs.rmSync(transferFilePath));
      await actions.inputFile(path.join(sharePathInDocker, "mydata.dat"));
      await actions.inputSecretPath(secretPath);
      await actions.clickMoreOptionsButton();
      await actions.togglePasswordSwitch();
      await actions.inputPassword(filePassword);
      await new Promise(resolve => setTimeout(resolve, 1000));
      await actions.clickSendButton();
    }

    {
      const driver = createDriver();
      defer(() => driver.quit());
      await driver.get(PIPING_UI_URL);
      const actions = getActions(driver);

      await actions.clickGetMenuButton();
      await actions.inputSecretPath(secretPath);
      await actions.clickMoreOptionsButton();
      await actions.togglePasswordSwitch();
      await actions.inputPassword(filePassword);
      await new Promise(resolve => setTimeout(resolve, 1000));
      await actions.clickDownloadButton();
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

  it('should send and show an E2E encrypted file with password', async function () {
    const {sharePath, sharePathInDocker, downloadPath, createDriver, blockPopup} = await driverFactoryPromise;

    const secretPath = crypto.randomBytes(8).toString("hex");
    const filePassword = crypto.randomBytes(32).toString("binary");

    {
      const driver = createDriver();
      defer(() => driver.quit());
      await driver.get(PIPING_UI_URL);
      const actions = getActions(driver);

      const transferFilePath = path.join(sharePath, "myimg.png");
      fs.writeFileSync(transferFilePath, rayTracingPngImage);
      defer(() => fs.rmSync(transferFilePath));
      await actions.inputFile(path.join(sharePathInDocker, "myimg.png"));
      await actions.inputSecretPath(secretPath);
      await actions.clickMoreOptionsButton();
      await actions.togglePasswordSwitch();
      await actions.inputPassword(filePassword);
      await new Promise(resolve => setTimeout(resolve, 1000));
      await actions.clickSendButton();
    }

    {
      const driver = createDriver();
      defer(() => driver.quit());
      await driver.get(PIPING_UI_URL);
      const actions = getActions(driver);

      await actions.clickGetMenuButton();
      await actions.inputSecretPath(secretPath);
      await actions.clickMoreOptionsButton();
      await actions.togglePasswordSwitch();
      await actions.inputPassword(filePassword);
      await new Promise(resolve => setTimeout(resolve, 1000));
      await actions.clickViewButton();

      const imageBlobUrl = await actions.getImage0BlobUrlInView();
      const shownFileContent = await getBufferByBlobUrl(driver, imageBlobUrl);

      assert.strictEqual(rayTracingPngImage.length, shownFileContent.length);
      assert(rayTracingPngImage.equals(shownFileContent));
    }
  });

  it('should send and download a file by passwordless E2E encryption', async function () {
    const {sharePath, sharePathInDocker, downloadPath, createDriver, blockPopup} = await driverFactoryPromise;

    const secretPath = crypto.randomBytes(8).toString("hex");
    const transferContent = randomBytesAvoidingMimeTypeDetection(1024 * 1024);

    const senderDriver = createDriver();
    defer(() => senderDriver.quit());
    await senderDriver.get(PIPING_UI_URL);
    const senderActions = getActions(senderDriver);

    const transferFilePath = path.join(sharePath, "mydata.dat");
    fs.writeFileSync(transferFilePath, transferContent);
    defer(() => fs.rmSync(transferFilePath));
    await senderActions.inputFile(path.join(sharePathInDocker, "mydata.dat"));
    await senderActions.inputSecretPath(secretPath);
    await senderActions.togglePasswordlessSendAndVerifySwitch();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await senderActions.clickSendButton();

    const receiverDriver = createDriver();
    defer(() => receiverDriver.quit());
    await receiverDriver.get(PIPING_UI_URL);
    const receiverActions = getActions(receiverDriver);

    await receiverActions.clickGetMenuButton();
    await receiverActions.inputSecretPath(secretPath);
    await new Promise(resolve => setTimeout(resolve, 1000));
    await receiverActions.clickDownloadButton();

    await new Promise(resolve => setTimeout(resolve, 2000));
    await senderActions.clickPasswordlessVerifiedButton0();

    const finishRetryDownload = receiverActions.retryDownloadButtonIfNeed();
    defer(() => finishRetryDownload());

    const downloadedFilePath = path.join(downloadPath, secretPath);
    await waitForDownload(downloadedFilePath);
    const downloadedFileContent = fs.readFileSync(downloadedFilePath);

    assert.strictEqual(transferContent.length, downloadedFileContent.length);
    assert(transferContent.equals(downloadedFileContent));
    fs.rmSync(downloadedFilePath);
  });

  it('should send and show a file by passwordless E2E encryption', async function () {
    const {sharePath, sharePathInDocker, downloadPath, createDriver, blockPopup} = await driverFactoryPromise;

    const secretPath = crypto.randomBytes(8).toString("hex");

    const senderDriver = createDriver();
    defer(() => senderDriver.quit());
    await senderDriver.get(PIPING_UI_URL);
    const senderActions = getActions(senderDriver);

    const transferFilePath = path.join(sharePath, "myimg.png");
    fs.writeFileSync(transferFilePath, rayTracingPngImage);
    defer(() => fs.rmSync(transferFilePath));
    await senderActions.inputFile(path.join(sharePathInDocker, "myimg.png"));
    await senderActions.inputSecretPath(secretPath);
    await senderActions.togglePasswordlessSendAndVerifySwitch();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await senderActions.clickSendButton();

    const receiverDriver = createDriver();
    defer(() => receiverDriver.quit());
    await receiverDriver.get(PIPING_UI_URL);
    const receiverActions = getActions(receiverDriver);

    await receiverActions.clickGetMenuButton();
    await receiverActions.inputSecretPath(secretPath);
    await new Promise(resolve => setTimeout(resolve, 1000));
    await receiverActions.clickViewButton();

    await new Promise(resolve => setTimeout(resolve, 2000));
    await senderActions.clickPasswordlessVerifiedButton0();

    const imageBlobUrl = await receiverActions.getImage0BlobUrlInView();
    const shownFileContent = await getBufferByBlobUrl(receiverDriver, imageBlobUrl);

    assert.strictEqual(rayTracingPngImage.length, shownFileContent.length);
    assert(rayTracingPngImage.equals(shownFileContent));
  });
});
