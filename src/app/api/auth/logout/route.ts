import { NextResponse } from 'next/server'
import { clearJWTCookie } from '@/lib/jwt'

export async function POST() {
  try {
    clearJWTCookie()
    
    return NextResponse.json({
      message: 'ログアウトに成功しました'
    })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'ログアウト中にエラーが発生しました' },
      { status: 500 }
    )
  }
}
