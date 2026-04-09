# PromptWeaver Web

PromptWeaver の Web / PWA 版です。iPhone、Android、Windows、Mac のブラウザで使えます。

## できること

- 画像プロンプト / 動画プロンプトの作成と編集
- Markdown プレビュー
- Markdown / JSON の書き出し
- コピー / 共有
- ブラウザ内保存
- iPhone のホーム画面追加
- GitHub Pages での公開

## ローカルで開く

`PromptWeaverWeb` フォルダで次を実行します。

```bash
npm run serve
```

または PowerShell で次を実行します。

```powershell
cd "D:\AI生成\バイブコーディング\iOS用画像動画プロンプト生成アプリ\PromptWeaverWeb"
python -m http.server 4177 --bind 0.0.0.0
```

PC では次の URL を開きます。

- `http://localhost:4177/?v=4#home`

同じ Wi-Fi の iPhone では次のように開きます。

- `http://<PCのIPアドレス>:4177/?v=4#home`

## テスト

```bash
npm test
```

## GitHub Pages で公開する

このリポジトリには、`PromptWeaverWeb` をそのまま GitHub Pages に公開する workflow が入っています。

追加したファイル:

- `.github/workflows/deploy-promptweaver-web.yml`

公開後の URL は、通常は次の形になります。

- `https://<GitHubユーザー名>.github.io/<リポジトリ名>/`

### 最初に必要なこと

1. GitHub に push する
2. GitHub の `Settings > Pages` を開く
3. `Source` を `GitHub Actions` にする
4. `Actions` タブで `Deploy PromptWeaver Web` が成功するのを待つ

### 公開後に iPhone で使う

1. Safari で公開 URL を開く
2. 共有ボタンを押す
3. `ホーム画面に追加`

これで PC を起動しなくても使えます。
