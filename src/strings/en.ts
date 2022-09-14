import {VERSION} from "@/version";
import {type KeyExchangeErrorCode} from "@/_piping-ui-auth";

const urlJoinAsync = () => import('url-join').then(p => p.default);
const sanitizeHtmlAllowingATagAsync = () => import('@/utils/sanitizeHtmlAllowingATag').then(p => p.sanitizeHtmlAllowingATag);

export const en = {
  language: 'Language',
  dark_theme: 'Dark Theme',
  pwa_update: 'Update',
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
  password: 'Password',
  password_is_required: 'Password is required',
  view: 'View',
  download: 'Download',
  error_file_not_selected: 'Error: File not selected',
  error_secret_path_not_specified: 'Error: Secret path not specified',
  upload: 'Upload',
  canceled: 'Canceled',
  waiting_for_receiver: 'Waiting for receiver...',
  verification_code: 'Verification code',
  verify_and_send: 'Verify & Send',
  key_exchange_error: (errorCode: KeyExchangeErrorCode): string => {
    switch (errorCode) {
      case "send_failed":
        return 'Failed to send. Changing the secret path may avoid the problem.';
      case "receive_failed":
        return 'Failed to receive. Changing the secret path may avoid the problem.';
      case "invalid_parcel_format":
        return 'Parcel format is invalid.';
      case "different_key_exchange_version":
        return 'Key exchange versions are different. Please update your app or peer\'s app.'
      case "invalid_v1_parcel_format":
        return "Parcel is an invalid V1 parcel";
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
  data_viewer_xhr_onerror: 'Download error',
  save: 'Save',
  record_server_url: 'Record server URL',
  record_secret_path: 'Record secret path',
  download_in_downloader: 'Download',
};

export type Strings = typeof en;
