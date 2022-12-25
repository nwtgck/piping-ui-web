import {VERSION} from "@/version";
import {type KeyExchangeErrorCode} from "@/piping-ui-auth";
import {type Strings} from "@/strings/en";

const urlJoinAsync = () => import('url-join').then(p => p.default);
const sanitizeHtmlAllowingATagAsync = () => import('@/utils/sanitizeHtmlAllowingATag').then(p => p.sanitizeHtmlAllowingATag);

export const ja: Strings = {
  language: '言語 (Language)',
  dark_theme: 'ダークテーマ',
  version: `バージョン: ${VERSION}`,
  view_on_github: 'GitHubでソースコードを見る',
  open_source_licenses: 'オープンソース ライセンス',
  close: "閉じる",
  send: '送信',
  get: '受信',
  text_mode: 'テキスト',
  text_placeholder: 'テキスト',
  server_url: 'サーバー',
  secret_path: '転送パス',
  secret_path_placeholder: '例: mypath374, あいう123',
  drop_a_file_here_or_browse: 'ファイルをドラッグするか<span class=\'filepond--label-action\'>開く</span>',
  protect_with_password: 'パスワードで保護',
  passwordless_protection: 'パスワードレス',
  password: 'パスワード',
  password_is_required: 'パスワードを入力してください',
  view: '見る',
  download: 'ダウンロード',
  error_file_not_selected: 'エラー: ファイルが選択されていません',
  error_secret_path_not_specified: 'エラー: 転送パスが指定されていません',
  upload: 'アップロード',
  waiting_for_receiver: '受信者を待機中...',
  verification_code: '確認コード',
  verify_and_send: '確認完了',
  key_exchange_error: (errorCode: KeyExchangeErrorCode): string => {
    switch (errorCode) {
      case "send_failed":
        return '送信に失敗しました。転送パスを変更すると送信できる可能性があります。';
      case "receive_failed":
        return '受信に失敗しました。転送パスを変更すると受信できる可能性があります。';
      case "invalid_parcel_format":
        return 'パーセルのフォーマットが不正です。';
      case "different_key_exchange_version":
        return '鍵交換のバージョンが異なります。このアプリを更新するか通信相手のアプリを更新してください。';
      case "invalid_v1_parcel_format":
        return "V1のパーセルとして不正なフォーマットです。"
    }
  },
  sender_not_verified: '送信者が拒否しました',
  upload_url: 'アップロードURL',
  compressing: '圧縮中...',
  encrypting: '暗号化中...',
  data_uploader_xhr_onerror: async (p: {serverUrl: string}) => {
    const sanitizeHtmlAllowingATag = await sanitizeHtmlAllowingATagAsync();
    const urlJoin = await urlJoinAsync();
    const versionUrl = urlJoin(p.serverUrl, "/version");
    return sanitizeHtmlAllowingATag(`エラーが発生しました。サーバーが0.9.4より低い可能性があります。 <a href="${versionUrl}" target="_blank">${versionUrl}</a> でバージョンの確認できます。`);
  },
  data_uploader_xhr_upload_error: 'アップロード中にエラーが発生しました',
  cancel: 'キャンセル',
  view_in_viewer: '表示',
  decrypting: '復号中...',
  download_url: 'ダウンロードURL',
  waiting_for_sender: '送信者を待機中...',
  copied: 'コピーされました',
  password_might_be_wrong: 'パスワードが間違っている可能性があります',
  reinput_password: 'パスワードを再入力',
  unlock: '解除',
  view_raw: '解除せずに見る',
  xhr_status_error: (p: {status: number, response: string}) => {
    return `エラー (${p.status}): "${p.response}"`;
  },
  data_viewer_fetch_error: 'ダウンロードエラー',
  fetch_status_error: (p: {status: number, message: string}) => {
    return `エラー (${p.status}): "${p.message}"`;
  },
  data_viewer_body_read_error: (p: { error: unknown }) => {
    return `読み込みエラー: ${p.error}`;
  },
  save: '保存',
  record_server_url: 'サーバーURLを記憶',
  record_secret_path: '転送パスを記憶',
  download_in_downloader: 'ダウンロード',
} as const;
