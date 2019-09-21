export function strings(language: string) {
  return <K extends keyof (typeof defaultStr)>(key: K) => {
    if(language.startsWith("en")) {
      return en[key];
    } else if(language.startsWith("ja")) {
      return ja[key];
    } else {
      return defaultStr[key];
    }
  };
}

const en = {
  language: 'Language',
  dark_theme: 'Dark Theme',
  pwa_update: 'Update',
  send: 'Send',
  get: 'Get',
  text_mode: 'Text mode',
  text_placeholder: 'Text',
  server_url: 'Server URL',
  secret_path: 'Secret path',
  drop_a_file_here_or_browse: 'Drop a file here or <span class=\'filepond--label-action\'>Browse</span>',
  view: 'View',
  download: 'Download',
  error_file_not_selected: 'Error: File not selected',
  error_secret_path_not_specified: 'Error: Secret path not specified',
};
const defaultStr = en;

const ja: typeof defaultStr = {
  language: '言語 (Language)',
  dark_theme: 'ダークテーマ',
  pwa_update: 'Update',
  send: '送信',
  get: '受信',
  text_mode: 'テキスト',
  text_placeholder: 'テキスト',
  server_url: 'サーバー',
  secret_path: '転送パス',
  drop_a_file_here_or_browse: 'ファイルをドラッグするか<span class=\'filepond--label-action\'>開く</span>',
  view: '見る',
  download: 'ダウンロード',
  error_file_not_selected: 'エラー: ファイルが選択されていません',
  error_secret_path_not_specified: 'エラー: 転送パスが指定されていません',
} as const;
