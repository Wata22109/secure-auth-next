'use client'

import { checkPasswordStrength } from '@/lib/validations'

interface PasswordStrengthMeterProps {
  password: string
}

export default function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  if (!password) return null

  const strength = checkPasswordStrength(password)
  const width = (strength.score / 5) * 100

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${strength.color}`}
            style={{ width: `${width}%` }}
          />
        </div>
        <span className={`text-sm font-medium ${
          strength.score <= 2 ? 'text-red-600' :
          strength.score <= 3 ? 'text-yellow-600' : 'text-green-600'
        }`}>
          {strength.label}
        </span>
      </div>
      <p className="text-xs text-gray-500">
        パスワードは大文字、小文字、数字、記号を含む必要があります
      </p>
    </div>
  )
}
