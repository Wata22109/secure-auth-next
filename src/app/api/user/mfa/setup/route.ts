import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/jwt'
import { initializeMFA } from '@/lib/mfa'

export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    // ユーザー情報を取得
    const dbUser = await prisma.user.findUnique({
      where: { id: user.sub }
    })

    if (!dbUser) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      )
    }

    // 既にMFAが有効な場合はエラー
    if (dbUser.mfaEnabled) {
      return NextResponse.json(
        { error: 'MFAは既に有効になっています' },
        { status: 400 }
      )
    }

    // MFA設定を初期化
    const mfaSetup = await initializeMFA(dbUser.email)
    
    // 一時的にシークレットを保存（確認後に有効化）
    await prisma.user.update({
      where: { id: user.sub },
      data: {
        mfaSecret: mfaSetup.secret,
        backupCodes: JSON.stringify(mfaSetup.backupCodes)
      }
    })

    return NextResponse.json({
      secret: mfaSetup.secret,
      qrCodeUrl: mfaSetup.qrCodeUrl,
      backupCodes: mfaSetup.backupCodes
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'MFA設定の初期化中にエラーが発生しました' },
      { status: 500 }
    )
  }
}
