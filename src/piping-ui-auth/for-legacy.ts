import * as t from "io-ts";
import urlJoin from "url-join";
import {sha256} from "@/utils/sha256";

const keyExchangeParcelLegacyType = t.type({
  version: t.number,
});
type KeyExchangeLegacyParcel = t.TypeOf<typeof keyExchangeParcelLegacyType>;

async function keyExchangePathBeforeV3(type: 'sender' | 'receiver', secretPath: string): Promise<string> {
  return await sha256(`${secretPath}/key_exchange/${type}`);
}

// For testing: https://git-ce4f4b3d9b88d47280bc46ee2ce769b01d7b0653--piping-ui.netlify.app/
export function makeKeyExchangeFailForLegacy(serverUrl: string, type: 'sender' | 'receiver', secretPath: string, abortController: AbortController): void {
  // key exchange version to notify
  const oldKeyExchangeVersion = 3;
  (async () => {
    try {
      const keyExchangeParcel: KeyExchangeLegacyParcel = {
        version: oldKeyExchangeVersion + 1,
      };
      const myPath = await keyExchangePathBeforeV3(type, secretPath);
      const peerPath = await keyExchangePathBeforeV3(type === 'sender' ? 'receiver' : 'sender', secretPath);
      const postResPromise = await fetch(urlJoin(serverUrl, myPath), {
        method: 'POST',
        body: JSON.stringify(keyExchangeParcel),
        signal: abortController.signal,
      });
      const peerResPromise = await fetch(urlJoin(serverUrl, peerPath), {
        signal: abortController.signal,
      });
    } catch (e: any) {
      if (e.name === 'AbortError') {
        return;
      }
      console.warn(e);
    }
  })();
}
