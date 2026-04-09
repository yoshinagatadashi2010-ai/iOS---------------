# PromptWeaver セキュリティ改善チェックリスト

このファイルは、現在のこのリポジトリ構成に合わせた実務向けチェックリストです。

対象:

- 公開 GitHub リポジトリ
- GitHub Pages で配信している `PromptWeaverWeb`
- 将来公開の可能性がある iOS アプリ本体 `PromptWeaver`

## いまの前提

- `PromptWeaverWeb` は GitHub Pages で公開されている
- Web 版のデータ保存は `localStorage`
- Web 版は独自バックエンドを持たない静的サイト
- QR コード表示は外部サービスを使っている
- iOS 側の entitlements には `com.example` の仮値が残っている

## 優先度 A: 先にやる

- [ ] `master` に branch protection を設定する
  - 直接 push を禁止
  - Pull Request 必須
  - 必要なら review 必須
  - status check 必須

- [ ] GitHub の secret scanning を有効にする
  - Public repo では最優先
  - 誤って API キーや token を入れた時の検知に使う

- [ ] GitHub の push protection を有効にする
  - 秘密情報を push しようとした時点で止める

- [ ] collaborator 権限を見直す
  - Admin は必要最小限
  - 普段の作業は Write か Triage で足りるか確認

- [ ] Actions の実行権限を見直す
  - 不要な workflow を増やさない
  - 必要な workflow だけを残す
  - third-party action を増やす時は source を確認する

- [ ] `.gitignore` を強化する
  - 現在の `.gitignore` は Xcode 系中心で、秘密情報向けの除外が弱い
  - 追加候補:
    - `.env`
    - `.env.*`
    - `*.pem`
    - `*.p12`
    - `*.mobileprovision`
    - `Secrets.plist`
    - `GoogleService-Info.plist`
    - `*.key`

## 優先度 B: Web 版の安全性を上げる

- [ ] `PromptWeaverWeb` の QR 生成を外部依存からアプリ内生成に置き換える
  - 現在は URL を外部 QR サービスへ渡している
  - 機密データそのものではないが、依存先は減らしたほうがよい
  - 対象:
    - [export.js](D:/AI生成/バイブコーディング/iOS用画像動画プロンプト生成アプリ/PromptWeaverWeb/src/core/export.js)

- [ ] 共有端末では Web 版を使わない運用にする
  - `localStorage` にプロンプト内容が残る
  - 共用 PC では専用ブラウザプロファイルを使う
  - 使用後にサイトデータ削除も検討する
  - 対象:
    - [store.js](D:/AI生成/バイブコーディング/iOS用画像動画プロンプト生成アプリ/PromptWeaverWeb/src/core/store.js)

- [ ] 出力ファイルの扱いを決める
  - `.md` と `.json` を外部共有すると、その時点でブラウザ外へ出る
  - 機密プロンプトは共有先を限定する
  - 対象:
    - [export.js](D:/AI生成/バイブコーディング/iOS用画像動画プロンプト生成アプリ/PromptWeaverWeb/src/core/export.js)

- [ ] 公開 URL に入れる情報を見直す
  - URL 自体には機密文字列を含めない
  - QR にする URL も同様

- [ ] service worker の更新運用を確認する
  - キャッシュ不整合が起きた時に古い画面が残る
  - リリース時に cache version の更新方針を決める
  - 対象:
    - [sw.js](D:/AI生成/バイブコーディング/iOS用画像動画プロンプト生成アプリ/PromptWeaverWeb/sw.js)
    - [main.js](D:/AI生成/バイブコーディング/iOS用画像動画プロンプト生成アプリ/PromptWeaverWeb/src/main.js)

- [ ] 将来的に Content Security Policy を検討する
  - 外部読み込み先を明示的に制限する
  - GitHub Pages では実装方法を先に整理してから導入する

## 優先度 C: iOS 側で公開前に見直す

- [ ] `com.example` の仮値を本番値へ置き換える
  - iCloud container
  - Bundle ID
  - ubiquity kvstore identifier
  - 対象:
    - [PromptWeaver.entitlements](D:/AI生成/バイブコーディング/iOS用画像動画プロンプト生成アプリ/PromptWeaver/Resources/PromptWeaver.entitlements)

- [ ] entitlements を最小権限にする
  - 本当に必要な iCloud / CloudKit だけ残す
  - 使わない capability は外す

- [ ] CloudKit の利用方針を決める
  - private database を前提にする
  - public database を使わない
  - エクスポートファイルと CloudKit データの役割を分ける

- [ ] iCloud Drive 出力先の内容確認を運用に入れる
  - `.md` / `.json` に個人情報や社外秘が混ざらないか確認

## 優先度 D: GitHub 運用の改善

- [ ] Pages 配信用 workflow は `master` だけを対象にする
  - 途中の作業 branch で失敗ログを増やさない
  - 誤配信や混乱を避ける
  - 対象:
    - [deploy-promptweaver-web.yml](D:/AI生成/バイブコーディング/iOS用画像動画プロンプト生成アプリ/.github/workflows/deploy-promptweaver-web.yml)

- [ ] Dependabot alerts と security updates を有効にする
  - 将来ライブラリ追加時に効く

- [ ] Issue / Discussions / Wiki の公開範囲を見直す
  - 不要なら閉じる
  - 外部投稿を受ける面を増やしすぎない

- [ ] Releases に機密ファイルを添付しない
  - 証明書、設定ファイル、内部資料を含めない

- [ ] Actions logs に秘密情報が出ないようにする
  - echo や debug 出力を増やしすぎない

## 事故が起きた時の対応

- [ ] 秘密情報をコミットしたら、まず失効・再発行する
  - 消しただけでは不十分
  - 履歴に残っている前提で動く

- [ ] 公開済みのファイルに機密が入っていたら、Pages 再デプロイだけでなく履歴も確認する

- [ ] 共有済みの `.md` / `.json` がある場合、配布先も追跡する

## 月1でやる見直し

- [ ] collaborator 一覧の確認
- [ ] branch protection の確認
- [ ] Pages の公開 URL の確認
- [ ] 不要な workflow / artifacts の整理
- [ ] 公開リポジトリに秘密情報が入っていないか再確認

## このリポジトリで特に注意する点

- Web 版の保存先はサーバーではなく `localStorage`
- QR 表示は外部サービス依存
- 公開リポジトリなので、今後追加する設定ファイルの扱いに注意
- iOS 側の entitlements はまだ仮値を含む

## 次に着手しやすい順番

1. `master` の branch protection を設定する
2. secret scanning / push protection を有効にする
3. `.gitignore` を強化する
4. QR をアプリ内生成へ置き換える
5. workflow の対象 branch を `master` のみに絞る
