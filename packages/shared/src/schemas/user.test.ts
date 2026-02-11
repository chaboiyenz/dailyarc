import { describe, it, expect } from 'vitest'
import { UserSchema, CreateUserSchema } from './user'

describe('UserSchema', () => {
  it('validates correct user data', () => {
    const result = UserSchema.safeParse({
      uid: '123',
      email: 'test@example.com',
      displayName: 'Test User',
      role: 'TRAINEE',
      onboardingComplete: true,
      inventory: [],
      stats: {
        currentPushupLevel: 0,
        weight: 75,
      },
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing uid', () => {
    const result = UserSchema.safeParse({
      email: 'test@example.com',
      displayName: 'Test User',
      role: 'TRAINEE',
      onboardingComplete: false,
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid email', () => {
    const result = UserSchema.safeParse({
      uid: '123',
      email: 'invalid-email',
      displayName: 'Test User',
      role: null,
      onboardingComplete: false,
    })
    expect(result.success).toBe(false)
  })

  it('allows optional photoURL', () => {
    const result = UserSchema.safeParse({
      uid: '123',
      email: 'test@example.com',
      displayName: 'Test User',
      role: null,
      onboardingComplete: false,
      inventory: [],
      stats: {
        currentPushupLevel: 0,
        weight: 0,
      },
    })
    expect(result.success).toBe(true)
  })
})

describe('CreateUserSchema', () => {
  it('validates user creation input', () => {
    const result = CreateUserSchema.safeParse({
      email: 'new@example.com',
      name: 'New User',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email on creation', () => {
    const result = CreateUserSchema.safeParse({
      email: 'bad-email',
      name: 'New User',
    })
    expect(result.success).toBe(false)
  })

  it('requires email', () => {
    const result = CreateUserSchema.safeParse({
      name: 'New User',
    })
    expect(result.success).toBe(false)
  })
})
