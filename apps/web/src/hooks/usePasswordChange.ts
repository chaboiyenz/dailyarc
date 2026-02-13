import { useCallback, useState } from 'react'
import {
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
  type User as FirebaseUser,
} from 'firebase/auth'

interface PasswordChangeParams {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export function usePasswordChange() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const changePassword = useCallback(async (user: FirebaseUser, params: PasswordChangeParams) => {
    setLoading(true)
    setError(null)

    try {
      // Validate inputs
      if (!params.currentPassword) {
        throw new Error('Current password is required')
      }
      if (!params.newPassword) {
        throw new Error('New password is required')
      }
      if (params.newPassword.length < 6) {
        throw new Error('New password must be at least 6 characters')
      }
      if (params.newPassword !== params.confirmPassword) {
        throw new Error('Passwords do not match')
      }

      if (!user.email) {
        throw new Error('User email not found')
      }

      // Step 1: Re-authenticate the user with current password
      const credential = EmailAuthProvider.credential(user.email, params.currentPassword)
      await reauthenticateWithCredential(user, credential)

      // Step 2: Update password to new password
      await updatePassword(user, params.newPassword)

      return { success: true, message: 'Password updated successfully' }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred')
      // Map Firebase error codes to user-friendly messages
      let message = error.message
      if (message.includes('wrong-password')) {
        message = 'Current password is incorrect'
      } else if (message.includes('too-many-requests')) {
        message = 'Too many failed attempts. Please try again later'
      }
      const customError = new Error(message)
      setError(customError)
      throw customError
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    changePassword,
    loading,
    error,
  }
}
