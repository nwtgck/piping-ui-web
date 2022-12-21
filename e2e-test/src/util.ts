import {fetch} from "undici";
import {spawn} from "child_process";

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
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}
