# 今日の献立なーに？🍱

AIシェフが冷蔵庫の食材から献立を提案するWebアプリ。

## デプロイ方法（Vercel）

### 1. Anthropic APIキーを取得
https://console.anthropic.com/ でAPIキーを作成

### 2. Vercelにデプロイ
1. https://vercel.com でアカウント作成
2. 「Add New Project」→「Deploy from CLI or Upload」
3. このフォルダをZIPにしてアップロード

### 3. 環境変数を設定
Vercelのプロジェクト設定 → Environment Variables:
```
ANTHROPIC_API_KEY = sk-ant-xxxxxxxxxx
```

### 4. 完成！
`https://your-app.vercel.app` でスマホからもアクセスできます。

## ローカルで動かす
```bash
npm install
echo "ANTHROPIC_API_KEY=sk-ant-xxx" > .env.local
npm run dev
```
