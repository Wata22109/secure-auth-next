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

    // ログイン履歴の取得（最新5件）
    const loginHistory = await prisma.loginHistory.findMany({
      where: {
        userId: user.sub
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5,
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      loginHistory
    })
  } catch (error) {
    console.error('Get login history error:', error)
    return NextResponse.json(
      { error: 'ログイン履歴の取得中にエラーが発生しました' },
      { status: 500 }
    )
  }
}
