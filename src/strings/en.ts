import {VERSION} from "@/version";
import {KEY_EXCHANGE_VERSION, type KeyExchangeError} from "@/piping-ui-auth";

const urlJoinAsync = () => import('url-join').then(p => p.default);
const sanitizeHtmlAllowingATagAsync = () => import('@/utils/sanitizeHtmlAllowingATag').then(p => p.sanitizeHtmlAllowingATag);

export const en = {
  language: 'Language',
  dark_theme: 'Dark Theme',
  version: `Version: ${VERSION}`,
  view_on_github: 'View source code on GitHub',
  open_source_licenses: 'Open source licenses',
  close: "Close",
  send: 'Send',
  get: 'Get',
  text_mode: 'Text mode',
  text_placeholder: 'Text',
  server_url: 'Server URL',
  secret_path: 'Secret path',
  secret_path_placeholder: 'e.g. mypath374',
  drop_a_file_here_or_browse: 'Drop a file here or <span class=\'filepond--label-action\'>Browse</span>',
  protect_with_password: 'Protect with password',
  passwordless_protection: 'Passwordless',
  passwordless_verify_and_send: 'Verify and send',
  password: 'Password',
  password_is_required: 'Password is required',
  more_options: 'More options',
  hide_options: 'Hide options',
  view: 'View',
  download: 'Download',
  error_input_file_or_text: 'Error: Input files or text',
  error_secret_path_not_specified: 'Error: Secret path not specified',
  upload: 'Upload',
  waiting_for_receiver: 'Waiting for receiver...',
  verification_code: 'Verification code',
  passwordless_verified: 'Verified',
  key_exchange_error: (keyExchangeError: KeyExchangeError): string => {
    switch (keyExchangeError.code) {
      case "send_failed":
        return 'Failed to send. Changing the secret path may avoid the problem.';
      case "receive_failed":
        return 'Failed to receive. Changing the secret path may avoid the problem.';
      case "invalid_parcel_format":
        return 'Key exchange format is invalid.';
      case "key_exchange_version_mismatch":
        return `${ KEY_EXCHANGE_VERSION < keyExchangeError.peerVersion ? "Please update your app." : "Please update peer's app." } Key exchange versions are different.`;
      case "payload_not_verified":
        return "Key exchange payload could have been tampered";
      case "invalid_v3_parcel_format":
        return "Parcel is an invalid V3 parcel";
    }
  },
  sender_not_verified: 'Sender not verified',
  upload_url: 'Upload URL',
  compressing: 'Compressing...',
  encrypting: 'Encrypting...',
  data_uploader_xhr_onerror: async (p: {serverUrl: string}) => {
    const sanitizeHtmlAllowingATag = await sanitizeHtmlAllowingATagAsync();
    const urlJoin = await urlJoinAsync();
    const versionUrl = urlJoin(p.serverUrl, "/version");
    return sanitizeHtmlAllowingATag(`An error occurred. The server might be < 0.9.4. Please check <a href="${versionUrl}" target="_blank">${versionUrl}</a>`);
  },
  data_uploader_xhr_upload_error: 'An error occurred while uploading',
  cancel: 'Cancel',
  view_in_viewer: 'View',
  download_url: 'Download URL',
  waiting_for_sender: 'Waiting for sender...',
  decrypting: 'Decrypting...',
  copied: 'Copied',
  password_might_be_wrong: 'The password might be wrong',
  reinput_password: 'Reinput password',
  unlock: 'Unlock',
  view_raw: 'View raw',
  xhr_status_error: (p: {status: number, response: string}) => {
    return `Error (${p.status}): "${p.response}"`;
  },
  data_viewer_fetch_error: 'Download error',
  fetch_status_error: (p: {status: number, message: string}) => {
    return `Error (${p.status}): "${p.message}"`;
  },
  data_viewer_body_read_error: (p: { error: unknown }) => {
    return `Body read error: ${p.error}`;
  },
  save: 'Save',
  record_server_url: 'Record server URL',
  record_secret_path: 'Record secret path',
  download_in_downloader: 'Download',
};

export type Strings = typeof en;
