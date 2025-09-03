# SecureAuth-Next

セキュアな認証・認可機能を持つNext.jsアプリケーション

## アプリケーション概要

SecureAuth-Nextは、現代的なWebアプリケーションに求められるセキュアな認証・認可機能を実装したNext.jsアプリケーションです。JWT（JSON Web Token）ベースの認証システムを採用し、セキュリティを重視した設計となっています。

### 実装されたセキュアな認証機能

- **JWTトークンベース認証**: セキュアなCookieベースのJWT認証
- **パスワードハッシュ化**: bcryptによる安全なパスワード保存
- **アカウントロック機能**: ブルートフォース攻撃対策
- **パスワード強度チェック**: リアルタイムパスワード強度評価
- **ログイン履歴管理**: セキュリティ監査のための履歴記録
- **Content Security Policy**: 厳格なセキュリティヘッダー設定

## 機能一覧と実装解説

### 基本機能

#### 1. サインアップ (`/signup`)

**データフロー:**
1. ユーザーがフォームに入力（名前、メールアドレス、パスワード、確認用パスワード）
2. クライアントサイドバリデーション（zod + react-hook-form）
3. メールアドレス重複チェック（onBlur時）
4. サーバーサイドバリデーション
5. パスワードハッシュ化（bcrypt）
6. ユーザー作成とJWT発行
7. ダッシュボードへリダイレクト

**シーケンス図:**
```
ユーザー → フォーム入力 → バリデーション → API呼び出し → データベース保存 → JWT発行 → リダイレクト
```

#### 2. ログイン (`/login`)

**データフロー:**
1. ユーザーがメールアドレスとパスワードを入力
2. アカウントロック状態チェック
3. パスワード検証
4. ログイン失敗時：失敗回数カウントアップ、5回でロック
5. ログイン成功時：JWT発行、ログイン履歴記録
6. ダッシュボードへリダイレクト

#### 3. ログアウト

**データフロー:**
1. ヘッダーの「ログアウト」ボタンクリック
2. `/api/auth/logout`エンドポイント呼び出し
3. JWT Cookie無効化
4. SWRキャッシュクリア
5. ログインページへリダイレクト

### 追加機能

#### 追加機能1: パスワード強度メーター

**UI実装:**
- パスワード入力フィールド下部にリアルタイム強度バー表示
- 強度レベル：弱い（赤）、普通（黄）、安全（緑）
- 評価基準：文字数、大文字・小文字・数字・記号の組み合わせ

**強度判定ロジック:**
```typescript
function checkPasswordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[@$!%*?&]/.test(password)) score++;
  
  if (score <= 2) return { score, label: '弱い', color: 'bg-red-500' };
  else if (score <= 3) return { score, label: '普通', color: 'bg-yellow-500' };
  else return { score, label: '安全', color: 'bg-green-500' };
}
```

#### 追加機能2: アカウントロック

**ロック条件:**
- ログイン失敗5回で15分間ロック
- `failedLoginAttempts`フィールドで失敗回数管理
- `lockoutUntil`フィールドでロック解除時刻管理

**ロック時の画面表示:**
```
アカウントは一時的にロックされています。しばらく時間をおいてから再試行してください。
```

**ロック解除の仕組み:**
- 15分経過後に自動解除
- ログイン成功時に失敗回数とロック時刻をリセット

#### 追加機能3: パスワード変更

**プロファイルページ実装:**
- 現在のパスワード、新しいパスワード、確認用パスワードの3つの入力フィールド
- パスワード強度メーター付き
- 現在のパスワード検証機能

**API処理フロー:**
1. 現在のパスワードをbcrypt.compareで検証
2. 新しいパスワードをbcryptでハッシュ化
3. データベース更新
4. 成功メッセージ表示

#### 追加機能4: ログイン履歴

**履歴表示機能:**
- 直近5件のログイン履歴をテーブル形式で表示
- 日時、IPアドレス、ユーザーエージェントを記録
- ユーザーエージェントは50文字で切り詰め表示

**記録タイミング:**
- ログイン成功時に`LoginHistory`テーブルに自動記録
- IPアドレスとユーザーエージェントを取得して保存

## セキュリティ設計

### パスワードハッシュ化

**bcryptの採用理由:**
- ソルト自動生成によるレインボーテーブル攻撃対策
- 計算コストの調整可能（コストファクター12を採用）
- 時間ベースの攻撃に対する耐性

**コストファクター12について:**
- 2^12 = 4096回のハッシュ計算
- セキュリティとパフォーマンスのバランス
- 現代的なハードウェアでの適切な計算時間

### Cookieの安全性

**設定属性:**
- `HttpOnly`: JavaScriptからのアクセス防止（XSS対策）
- `Secure`: HTTPS通信時のみ送信（本番環境）
- `SameSite=Strict`: CSRF攻撃対策
- `Path=/`: アプリケーション全体で有効

**各属性の役割:**
- **HttpOnly**: クライアントサイドスクリプトによるトークン窃取を防止
- **Secure**: 中間者攻撃によるトークン傍受を防止
- **SameSite**: クロスサイトリクエストフォージェリ攻撃を防止

### Content Security Policy (CSP)

**設定したCSPディレクティブ:**
```javascript
"default-src 'self'",
"script-src 'self'",
"style-src 'self' 'unsafe-inline'",
"img-src 'self' data: https:",
"font-src 'self'",
"connect-src 'self'",
"frame-ancestors 'none'",
"base-uri 'self'",
"form-action 'self'"
```

**各ディレクティブの意図:**
- **default-src 'self'**: デフォルトで同一オリジンのみ許可
- **script-src 'self'**: インラインスクリプトを禁止し、同一オリジンのスクリプトのみ許可
- **frame-ancestors 'none'**: クリックジャッキング攻撃を防止
- **form-action 'self'**: フォーム送信先を同一オリジンに制限

## 技術スタック

- **フレームワーク**: Next.js 14 (App Router)
- **データベース**: SQLite (Prisma ORM)
- **認証**: JWT (joseライブラリ)
- **パスワードハッシュ**: bcryptjs
- **バリデーション**: Zod
- **フォーム管理**: React Hook Form
- **データフェッチング**: SWR
- **スタイリング**: Tailwind CSS
- **言語**: TypeScript

## セットアップ

### 前提条件
- Node.js 18以上
- npm または yarn

### インストール手順

1. 依存関係のインストール
```bash
npm install
```

2. 環境変数の設定
```bash
# .env.local ファイルを作成
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
NEXTAUTH_SECRET="your-nextauth-secret-key"
```

3. データベースのセットアップ
```bash
npx prisma generate
npx prisma db push
```

4. 開発サーバーの起動
```bash
npm run dev
```

### 利用可能なスクリプト

- `npm run dev`: 開発サーバー起動
- `npm run build`: プロダクションビルド
- `npm run start`: プロダクションサーバー起動
- `npm run lint`: ESLint実行
- `npm run db:generate`: Prismaクライアント生成
- `npm run db:push`: データベーススキーマ適用
- `npm run db:studio`: Prisma Studio起動

## アーキテクチャ

### ディレクトリ構造
```
src/
├── app/
│   ├── actions/
│   │   └── authActions.ts      # サーバーアクション
│   ├── api/
│   │   ├── auth/
│   │   │   ├── check-email/
│   │   │   ├── login/
│   │   │   └── logout/
│   │   └── user/
│   │       ├── change-password/
│   │       └── login-history/
│   ├── dashboard/
│   │   └── profile/            # プロファイルページ
│   ├── login/                  # ログインページ
│   ├── signup/                 # サインアップページ
│   └── layout.tsx
├── components/
│   ├── Header.tsx              # ヘッダーコンポーネント
│   └── PasswordStrengthMeter.tsx
├── lib/
│   ├── jwt.ts                  # JWT関連ユーティリティ
│   ├── prisma.ts               # Prismaクライアント
│   └── validations.ts          # バリデーションスキーマ
└── middleware.ts               # 認証ミドルウェア
```

### データベース設計

**User モデル:**
- id: UUID (主キー)
- email: ユニークメールアドレス
- password: ハッシュ化されたパスワード
- name: ユーザー名
- role: ユーザーロール (ADMIN/USER)
- failedLoginAttempts: ログイン失敗回数
- lockoutUntil: ロック解除時刻
- createdAt/updatedAt: タイムスタンプ

**LoginHistory モデル:**
- id: UUID (主キー)
- userId: ユーザーID (外部キー)
- ipAddress: ログイン時のIPアドレス
- userAgent: ユーザーエージェント
- createdAt: ログイン時刻

## セキュリティ考慮事項

### 実装済みセキュリティ機能
- JWTトークンの適切な管理
- パスワードの安全なハッシュ化
- アカウントロック機能
- CSPヘッダー設定
- セキュアなCookie設定
- 入力値バリデーション

### 推奨される追加セキュリティ対策
- レートリミットの実装
- 2要素認証（2FA）の追加
- セッション管理の強化
- ログ監視システムの導入
- 定期的なセキュリティ監査

## ライセンス

MIT License
