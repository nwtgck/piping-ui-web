import {spawn, spawnSync} from "child_process";
import {fetch} from "undici";
export async function dockerSeleniumStandalone({ baseImage, port = 4444, noVncPort = 7900, maxSessions = 4, volumes = [], forwardingTcpPorts = [] }: {
  baseImage: string,
  port?: number,
  noVncPort?: number,
  maxSessions?: number,
  forwardingTcpPorts?: readonly number[],
  volumes?: readonly { hostPath: string, containerPath: string }[]
}) {
  const dockerImage = `selenium-with-socat-${baseImage.replaceAll("/", "-").replaceAll(":", "-")}`;
  const dockerBuildResult = spawnSync("docker", ["build", "-t", dockerImage, "-"], {
    input: `\
FROM ${baseImage}

RUN sudo apt update && sudo apt install -y socat
`,
    stdio: ['pipe', 'pipe', 'inherit'],
  });
  if (dockerBuildResult.status !== 0) {
    throw new Error("failed to docker-build");
  }
  const volumesOptions = volumes.flatMap(({hostPath, containerPath}) => ["-v", `${hostPath}:${containerPath}`]);
  const dockerRunResult = spawnSync("docker", ["run", "-dit", "--rm", "-p", `${port}:4444`, "-p", `${noVncPort}:7900`, ...volumesOptions, `--shm-size=2g`, "-e", "SE_START_XVFB=false", "-e", `SE_NODE_MAX_SESSIONS=${maxSessions}`, dockerImage]);
  if (dockerRunResult.status !== 0) {
    throw new Error(`failed to docker-run: ${dockerRunResult.stderr.toString("utf-8")}`);
  }
  const containerId = dockerRunResult.stdout.toString("utf-8").trim();
  const removeContainer = () => {
    spawnSync("docker", ["rm", "-f", containerId]);
    console.log("container removed");
  };
  process.once('SIGINT', () => {
    removeContainer();
    process.kill(process.pid, 'SIGINT');
  });
  process.once('exit', removeContainer);
  for (const port of forwardingTcpPorts) {
    const p = spawn("docker", ["exec", containerId, "sh", "-c", `socat TCP-LISTEN:${port},fork,reuseaddr TCP:host.docker.internal:${port}`], {
      detached: true,
      stdio: "ignore",
    });
    p.unref();
  }
  // Wait for :4444 is ready
  while (true) {
    try {
      const res = await fetch(`http://localhost:${port}/wd/hub`);
      if (res.status !== 404) {
        throw new Error("not 404");
      }
      if (JSON.parse(await res.text()).value.error === "unknown command") {
        break;
      }
      return;
    } catch (e) {
      // Do nothing
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}
