import {VERSION} from "@/version";
import {type KeyExchangeError} from "@/piping-ui-auth";
import {KEY_EXCHANGE_VERSION} from "@/piping-ui-auth/KEY_EXCHANGE_VERSION";
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
  send_button({nFiles, textIsBlank}: {nFiles: number, textIsBlank: boolean}) {
    if (nFiles === 0 && textIsBlank) {
      return "送信";
    }
    if (textIsBlank) {
      return `送信 ( ファイル )`;
    }
    if (nFiles === 0) {
      return `送信 ( テキスト )`;
    }
    return `送信 ( ファイル + テキスト )`;
  },
  get: '受信',
  text_mode: 'テキスト',
  text_placeholder: 'テキストやリンク',
  server: 'サーバー',
  secret_path: '転送パス',
  secret_path_placeholder: '例: mypath374, あいう123',
  make_half_width(notHalfWidth: string) {
    return `"${notHalfWidth}" を半角にする`;
  },
  drop_files_here_or_browse: 'ファイルをドラッグするか<span class=\'filepond--label-action\'>開く</span>',
  protect_with_password: 'パスワードで保護',
  passwordless_protection: 'パスワードレス',
  passwordless_protection_info_html: `\
<b>概要</b>
パスワードレス保護はセキュリティを格段に向上させます。利用するには送信者と受信者の両方がこのオプションを有効にする必要があります。

<b>開発者向け</b>
OpenPGP を使ったエンドツーエンド暗号化によりデータ転送が可能です。楕円曲線ディフィー・ヘルマン鍵共有 (ECDH) によって信頼できない通信路であっても暗号化鍵をセキュアに共有します。暗号化鍵は転送ごとに新しく生成されます。
`.replace(/\n/g, '<br>'),
  passwordless_verify_and_send: '確認して送信',
  passwordless_verify_and_send_info_html: `\
<b>概要</b>
送信前に受信者が想定した相手かどうかを安全な通信路で確認できます。これによりパスワードレス保護の安全性をさらに引き上げます。

<b>開発者向け</b>
このオプションを有効化することで中間者攻撃 (MITM) を防ぎます。ECDH によって共有される公開暗号化鍵は署名されています。その公開署名鍵から確認コードが生成されます。署名鍵の生成はデバイス内で行われ、ブラウザのリロードで再生成されます。
`.replace(/\n/g, '<br>'),
  password: 'パスワード',
  password_info_html: `\
<b>概要</b>
パスワードによりデータを保護します。

<b>開発者向け</b>
OpenPGP を使ったエンドツーエンド暗号化によりデータ転送が可能です。gpg コマンドと互換性があります。そのため Piping UI で送信し、curl と gpg で受信できます。またその逆も可能です。

<code># 送信
export GPG_TTY=$(tty)
echo 'hello' | gpg -c | curl -T - https://ppng.io/mypath</code>

<code># 受信
curl https://ppng.io/mypath | gpg</code>  
`.replace(/\n/g, '<br>'),
  password_is_required: 'パスワードを入力してください',
  more_options: 'その他のオプション',
  hide_options: 'オプション非表示',
  view: '見る',
  download: 'ダウンロード',
  error_input_file_or_text: 'エラー: ファイルを選択するかテキストを入力してください',
  error_secret_path_not_specified: 'エラー: 転送パスが指定されていません',
  upload: 'アップロード',
  waiting_for_receiver: '受信者を待機中...',
  verification_code: '確認コード',
  passwordless_verified: '確認完了',
  key_exchange_error: (keyExchangeError: KeyExchangeError): string => {
    switch (keyExchangeError.code) {
      case "send_failed":
        return '送信に失敗しました。転送パスを変更すると送信できる可能性があります。';
      case "receive_failed":
        return '受信に失敗しました。転送パスを変更すると受信できる可能性があります。';
      case "invalid_parcel_format":
        return '鍵交換のフォーマットが不正です。';
      case "key_exchange_version_mismatch":
        return `${ KEY_EXCHANGE_VERSION < keyExchangeError.peerVersion ? "このアプリを更新してください。" : "通信相手のアプリを更新してください。" }鍵交換のバージョンが異なります。`;
      case "payload_not_verified":
        return "鍵交換のペイロードが改竄された可能性があります。";
      case "invalid_v3_parcel_format":
        return "V3のパーセルとして不正なフォーマットです。";
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
  retry_download_dialog_title: 'ダウンロードを再試行しますか？',
  browser_may_have_blocked_download: 'ブラウザがダウンロードをブロックした可能性があります。',
  retry_download_dialog_yes: 'ダウンロード',
  retry_download_dialog_no: 'いいえ',
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
