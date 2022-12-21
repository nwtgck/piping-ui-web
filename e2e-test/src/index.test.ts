import * as assert from 'power-assert';
import * as webdriver from "selenium-webdriver";
import {findByLabel, servePipingUiIfNotServed} from "./util";
import {dockerSeleniumStandalone} from "./docker-selenium-standalone";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";

const PIPING_UI_PORT = 4000;
const PIPING_UI_URL = `http://localhost:${PIPING_UI_PORT}`;

before(async () => {
  await servePipingUiIfNotServed(PIPING_UI_PORT);
});

describe('Piping UI', () => {
  it('should transfer a file', async () => {
    const sharePath = "/tmp/selenium-docker_tmp_share";
    const sharePathInDocker = "/home/seluser/tmp";
    const downloadPath = "/tmp/selenium-docker_downloads_share";
    const downloadPathInDocker = "/home/seluser/Downloads";
    await dockerSeleniumStandalone({
      baseImage: "selenium/standalone-firefox:107.0",
      port: 4444,
      noVncPort: 7900,
      volumes: [
        { hostPath: sharePath, containerPath: sharePathInDocker },
        { hostPath: downloadPath, containerPath: downloadPathInDocker },
      ],
      forwardingTcpPorts: [PIPING_UI_PORT],
    });
    console.log("selenium is ready");

    const secretPath = crypto.randomBytes(8).toString("hex");
    const transferContent = crypto.randomBytes(10 * 1024 * 1024);

    {
      const driver = new webdriver.Builder().forBrowser(webdriver.Browser.FIREFOX)
        .usingServer("http://localhost:4444/wd/hub").build();
      await driver.get(PIPING_UI_URL);

      fs.writeFileSync(path.join(sharePath, "mydata.dat"), transferContent);

      await driver.findElement(webdriver.By.css("input[type='file']")).sendKeys(path.join(sharePathInDocker, "mydata.dat"));

      const secretPathInput = await findByLabel(driver, /Secret path/);
      await secretPathInput.sendKeys(secretPath);

      await new Promise(resolve => setTimeout(resolve, 1000));
      await (await driver.findElements(webdriver.By.xpath(`//button[.//*[contains(text(), "Send")]]`)))[1].click();
    }

    {
      const driver = new webdriver.Builder().forBrowser(webdriver.Browser.FIREFOX)
        .usingServer("http://localhost:4444/wd/hub").build();

      await driver.get(PIPING_UI_URL);
      await driver.findElement(webdriver.By.xpath(`//button[.//*[contains(text(), "Get")]]`)).click();
      const secretPathInput = await findByLabel(driver, /Secret path/);
      await secretPathInput.sendKeys(secretPath);

      await new Promise(resolve => setTimeout(resolve, 1000));
      await driver.findElement(webdriver.By.xpath(`//button[.//*[contains(text(), "Download")]]`)).click();

      const downloadedFilePath = path.join(downloadPath, secretPath);
      // NOTE: Firefox creates 0-byte file and .part file
      while (!fs.existsSync(downloadedFilePath) || fs.statSync(downloadedFilePath).size === 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      const downloadedFileContent = fs.readFileSync(downloadedFilePath);

      assert(transferContent.equals(downloadedFileContent));
    }
  });
});
