import {fetch} from "undici";
import {spawn} from "child_process";
import * as webdriver from "selenium-webdriver";
import * as firefox from "selenium-webdriver/firefox";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as crypto from "crypto";
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

// NOTE: e.click() causes "Element <input id="..." type="checkbox"> is not clickable at point because another element <div class="..."> obscures it"
export async function nativeClick(driver: webdriver.WebDriver, element: webdriver.WebElement) {
  await driver.executeScript((e: any) => e.click(), element);
}

export async function getBufferByBlobUrl(driver: webdriver.WebDriver, blobUrl: string): Promise<Buffer> {
  const base64String: string = await driver.executeAsyncScript(async function (blobUrl: string) {
    // eslint-disable-next-line prefer-rest-params
    const callback = arguments[arguments.length - 1];
    const res = await window.fetch(blobUrl);
    const arrayBuffer = await res.arrayBuffer();
    // NOTE: transferring raw Uint8Array causes "Error: Accessing TypedArray data over Xrays is slow, and forbidden in order to encourage performant code. To copy TypedArrays across origin boundaries, consider using Components.utils.cloneInto()."
    // NOTE: Transferring Base64 string is faster than transferring number[] especially in Firefox
    const array = [...new Uint8Array(arrayBuffer)];
    // NOTE: chunking avoids an error "RangeError: too many function arguments"
    const chunkSize = 65536;
    let str = '';
    while (array.length > 0) {
      str += String.fromCharCode.apply(null, array.splice(0, chunkSize));
    }
    callback(btoa(str));
  }, blobUrl);
  return Buffer.from(base64String, "base64");
}

export function randomBytesAvoidingMimeTypeDetection(size: number): Buffer {
  // NOTE: 4100 was used in FileType.minimumBytes in file-type until 13.1.2
  const zeroPadSize = 4100;
  if (size < zeroPadSize) {
    throw new Error(`size should be at least ${zeroPadSize}`);
  }
  return Buffer.concat([Buffer.alloc(zeroPadSize), crypto.randomBytes(size - zeroPadSize)]);
}

export async function waitForDownload(filePath: string) {
  // NOTE: Firefox creates 0-byte file and .part file
  while (!fs.existsSync(filePath) || fs.statSync(filePath).size === 0) {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

export async function waitFor<T>(f: () => T | Promise<T>, { intervalMillis = 1000 }: { intervalMillis?: number }  = {}): Promise<T> {
  while (true) {
    try {
      return await f();
    } catch (e) {
      await new  Promise(resolve => setTimeout(resolve, intervalMillis));
    }
  }
}

export const rayTracingPngImage: Buffer = fs.readFileSync("./resources/ray-tracing-iow-1280x720.png");

export async function createDriverFactory({dockerBaseImage, disablesServiceWorker, blockPopup, forwardingTcpPorts}: {dockerBaseImage: string, disablesServiceWorker: boolean, blockPopup: boolean, forwardingTcpPorts: readonly number[]}) {
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
          .setFirefoxOptions(
            new firefox.Options()
              .setPreference("browser.helperApps.neverAsk.saveToDisk", "application/octet-stream;application/x-unknown-content-type")
              .setPreference("dom.serviceWorkers.enabled", !disablesServiceWorker)
              // 20 is default value in Firefox 108
              .setPreference("dom.popup_maximum", blockPopup ? 0 : 20)
          )
          .usingServer("http://localhost:4444/wd/hub").build();
      }
    }
    if (dockerBaseImage.includes("-chrome:") || dockerBaseImage.includes("-chromium:")) {
      if (disablesServiceWorker) {
        throw new Error(`can not disable Service Worker on Chrome/Chromium`);
      }
      if (blockPopup) {
        throw new Error(`can not block popup on Chrome/Chromium`);
      }
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
    blockPopup,
  };
}
