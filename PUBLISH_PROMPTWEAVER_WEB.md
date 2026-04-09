# PromptWeaver Web 公開メモ

PC をつけなくても iPhone で使えるようにするには、`PromptWeaverWeb` を GitHub Pages に公開します。

## いま入っているもの

- GitHub Pages 用 workflow  
  [.github/workflows/deploy-promptweaver-web.yml](D:/AI生成/バイブコーディング/iOS用画像動画プロンプト生成アプリ/.github/workflows/deploy-promptweaver-web.yml)

## 公開の流れ

1. 変更を GitHub に push する
2. GitHub のリポジトリを開く
3. `Settings`
4. 左メニューの `Pages`
5. `Source` を `GitHub Actions` にする
6. `Actions` タブで `Deploy PromptWeaver Web` が完了するのを待つ
7. 出てきた URL を iPhone の Safari で開く
8. `ホーム画面に追加`

## 公開後の使い方

- 公開 URL を開けば使えます
- もう PC で PowerShell を起動する必要はありません
- データはその iPhone のブラウザ内に保存されます

## 注意

- 最初の 1 回だけ GitHub 側の設定が必要です
- GitHub Pages の反映には少し待つことがあります
- `PromptWeaverWeb` は静的サイトなので、そのまま GitHub Pages に載せられます
