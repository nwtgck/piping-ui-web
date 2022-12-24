import {fetch} from "undici";
import {spawn} from "child_process";
import * as webdriver from "selenium-webdriver";
import * as firefox from "selenium-webdriver/firefox";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import {dockerSeleniumStandalone} from "./docker-selenium-standalone";

export async function servePipingUiIfNotServed(port: number) {
  try {
    const res = await fetch(`http://localhost:${port}`);
    if (res.status === 200) {
      // no need to serve. already served somewhere
      return;
    }
  } catch (e) {
    // Do nothing
  }
  const p = spawn("npm", ["run", "serve"], {
    cwd: "..",
    env: {
      ...process.env,
      "PORT": port.toString(),
    },
    // TODO: change to "ignore"?
    stdio: "inherit",
  });
  process.once('SIGINT', () => {
    p.kill();
    process.kill(process.pid, 'SIGINT');
  });
  process.once('exit', () => p.kill());

  p.unref();

  // TODO: detect command failure

  while (true) {
    try {
      const res = await fetch(`http://localhost:${port}`);
      if (res.status === 200) {
        return;
      }
    } catch (e) {
      // Do nothing
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

export async function findElementByLabel(driver: webdriver.WebDriver, text: string | RegExp) {
  return (await findElementsByLabel(driver, text))[0];
}

export async function findElementsByLabel(driver: webdriver.WebDriver, text: string | RegExp) {
  const findPredicate: (({textContent}: {textContent: string}) => boolean) = typeof text === "string" ? ({textContent}) => textContent === text : ({textContent}) => !!textContent.match(text);
  const elements = (await driver.findElements(webdriver.By.css('label')));
  const ids: readonly string[] = await Promise.all(
    (await Promise.all(elements.map(async element => ({element, textContent: await element.getText()}))))
      .filter(findPredicate)
      .map(e => e.element.getAttribute("for"))
  );
  return ids.map(id => driver.findElement(webdriver.By.id(id)));
}

export async function findElementsByTagNameAndContent(driver: webdriver.WebDriver, tagName: string, text: string | RegExp) {
  const findPredicate: (({textContent}: {textContent: string}) => boolean) = typeof text === "string" ? ({textContent}) => textContent === text : ({textContent}) => !!textContent.match(text);
  const elements = await driver.findElements(webdriver.By.css(tagName));
  return await Promise.all(
    (await Promise.all(elements.map(async element => ({element, textContent: await element.getText()}))))
      .filter(findPredicate)
      .map(x => x.element)
  );
}

export async function nativeClick(driver: webdriver.WebDriver, element: webdriver.WebElement) {
  await driver.executeScript((e: any) => e.click(), element);
}

export async function createDriverFactory({dockerBaseImage, forwardingTcpPorts}: {dockerBaseImage: string, forwardingTcpPorts: readonly number[]}) {
  const sharePath = fs.mkdtempSync(path.join(os.tmpdir(), "selenium-docker-share-"));
  const sharePathInDocker = "/home/seluser/tmp";
  const downloadPath = fs.mkdtempSync(path.join(os.tmpdir(), "selenium-docker-downloads-share-"));
  const downloadPathInDocker = "/home/seluser/Downloads";

  await dockerSeleniumStandalone({
    baseImage: dockerBaseImage,
    port: 4444,
    vncPort: 5900,
    noVncPort: 7900,
    volumes: [
      { hostPath: sharePath, containerPath: sharePathInDocker },
      { hostPath: downloadPath, containerPath: downloadPathInDocker },
    ],
    forwardingTcpPorts,
  });

  console.log("selenium is ready");

  const createDriver: () => webdriver.WebDriver = (() => {
    if (dockerBaseImage.includes("-firefox:")) {
      return () => {
        return new webdriver.Builder().forBrowser(webdriver.Browser.FIREFOX)
          .setFirefoxOptions(new firefox.Options()
            .setPreference("browser.helperApps.neverAsk.saveToDisk", "application/x-unknown-content-type")
          )
          .usingServer("http://localhost:4444/wd/hub").build();
      }
    }
    if (dockerBaseImage.includes("-chrome:") || dockerBaseImage.includes("-chromium:")) {
      return () => {
        return new webdriver.Builder().forBrowser(webdriver.Browser.CHROME)
          .usingServer("http://localhost:4444/wd/hub").build();
      }
    }
    throw new Error(`unexpected docker image: ${dockerBaseImage}`);
  })();

  return {
    sharePath,
    sharePathInDocker,
    downloadPath,
    downloadPathInDocker,
    createDriver,
  };
}
