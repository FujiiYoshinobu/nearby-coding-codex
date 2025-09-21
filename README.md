# nearby-coding-codex

React 実装による VSCode 拡張「nearby-coding」フロントエンドのモック UI です。アバター設定画面と広場画面の 2 画面構成で、XP とレベルの成長演出を含みます。

## 開発環境

- Vite + React + TypeScript
- CSS によるドット絵風アバター表現
- 擬似バックエンド `src/api/mockApi.ts` による XP / レベル計算と遭遇判定

## スクリプト

```bash
npm install
npm run dev
npm run build
npm run lint
```

`npm install` が利用できない環境の場合は、適宜オフラインミラーを設定してください。

## 構成

```
src/
├── api/mockApi.ts        // 擬似 API。XP 計算やログイン・遭遇イベントを再現
├── App.tsx               // 画面遷移と状態管理
├── components/
│   ├── AvatarSetup.tsx   // アバター設定フォーム
│   ├── Plaza.tsx         // 広場画面（遭遇演出）
│   └── AvatarSprite.tsx  // ドット絵アバター描画
├── styles/               // 画面ごとのスタイル
└── main.tsx
```
