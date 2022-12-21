import {fetch} from "undici";
import {spawn} from "child_process";
import * as webdriver from "selenium-webdriver";

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

export async function findByLabel(driver: webdriver.WebDriver, text: string | RegExp) {
  const findPredicate: (({textContent}: {textContent: string}) => boolean) = typeof text === "string" ? ({textContent}) => textContent === text : ({textContent}) => !!textContent.match(text);
  const elements = (await driver.findElements(webdriver.By.css('label')));
  const id = await (await Promise.all(elements.map(async element => ({element, textContent: await element.getText()}))))
    .find(findPredicate)!
    .element
    .getAttribute("for")
  return driver.findElement(webdriver.By.id(id));
}
