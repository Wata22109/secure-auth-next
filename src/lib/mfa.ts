import { authenticator } from 'otplib'
import QRCode from 'qrcode'
import crypto from 'crypto'

// TOTPの設定
authenticator.options = {
  window: 1, // 前後1分間のトークンを許容
  step: 30   // 30秒間隔
}

// MFAシークレットの生成
export function generateMFASecret(): string {
  return authenticator.generateSecret()
}

// TOTPトークンの生成
export function generateTOTP(secret: string): string {
  return authenticator.generate(secret)
}

// TOTPトークンの検証
export function verifyTOTP(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token, secret })
  } catch (error) {
    return false
  }
}

// QRコードの生成
export async function generateQRCode(secret: string, email: string, appName: string = 'Secure Auth'): Promise<string> {
  const otpauth = authenticator.keyuri(email, appName, secret)
  return await QRCode.toDataURL(otpauth)
}

// バックアップコードの生成
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = []
  for (let i = 0; i < count; i++) {
    // 8桁の数字コードを生成
    const code = crypto.randomInt(10000000, 99999999).toString()
    codes.push(code)
  }
  return codes
}

// バックアップコードの検証
export function verifyBackupCode(inputCode: string, backupCodes: string[]): { isValid: boolean; remainingCodes: string[] } {
  const index = backupCodes.findIndex(code => code === inputCode)
  if (index === -1) {
    return { isValid: false, remainingCodes: backupCodes }
  }
  
  // 使用されたコードを削除
  const remainingCodes = backupCodes.filter((_, i) => i !== index)
  return { isValid: true, remainingCodes }
}

// MFA設定の初期化
export async function initializeMFA(email: string) {
  const secret = generateMFASecret()
  const backupCodes = generateBackupCodes()
  const qrCodeUrl = await generateQRCode(secret, email)
  
  return {
    secret,
    backupCodes,
    qrCodeUrl
  }
}
