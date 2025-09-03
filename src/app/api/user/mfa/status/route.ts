import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/jwt'

export async function GET(request: NextRequest) {
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
      where: { id: user.sub },
      select: {
        mfaEnabled: true,
        backupCodes: true
      }
    })

    if (!dbUser) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      )
    }

    // バックアップコードの残数を計算
    let remainingBackupCodes = 0
    if (dbUser.backupCodes) {
      try {
        const backupCodes = JSON.parse(dbUser.backupCodes)
        remainingBackupCodes = backupCodes.length
      } catch (error) {
        remainingBackupCodes = 0
      }
    }

    return NextResponse.json({
      mfaEnabled: dbUser.mfaEnabled,
      remainingBackupCodes
    })
  } catch (error) {
    console.error('MFA status error:', error)
    return NextResponse.json(
      { error: 'MFA状態の取得中にエラーが発生しました' },
      { status: 500 }
    )
  }
}
