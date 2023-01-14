import * as pipingUiAuth from "@/piping-ui-auth";
import {KEY_EXCHANGE_VERSION} from "@/piping-ui-auth/KEY_EXCHANGE_VERSION";

export function shouldUpdateApp(keyExchangeError: pipingUiAuth.KeyExchangeError): boolean {
  if (keyExchangeError.code !== "key_exchange_version_mismatch") {
    return false;
  }
  return KEY_EXCHANGE_VERSION < keyExchangeError.peerVersion;
}
