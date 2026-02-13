import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'

type UnitSystem = 'metric' | 'imperial'

interface UnitContextType {
  unit: UnitSystem
  setUnit: (unit: UnitSystem) => void
  convert: {
    kgToLbs: (kg: number) => number
    lbsToKg: (lbs: number) => number
    cmToInches: (cm: number) => number
    inchesToCm: (inches: number) => number
    kmToMiles: (km: number) => number
    milesToKm: (miles: number) => number
  }
  format: {
    weight: (value: number) => string
    height: (value: number) => string
    distance: (value: number) => string
  }
}

const UnitContext = createContext<UnitContextType | undefined>(undefined)

export function UnitProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth()
  const [unit, setUnit] = useState<UnitSystem>('metric')

  useEffect(() => {
    if (profile?.unitPreference) {
      setUnit(profile.unitPreference)
    }
  }, [profile?.unitPreference])

  const convert = {
    kgToLbs: (kg: number) => Number((kg * 2.20462).toFixed(2)),
    lbsToKg: (lbs: number) => Number((lbs / 2.20462).toFixed(2)),
    cmToInches: (cm: number) => Number((cm / 2.54).toFixed(2)),
    inchesToCm: (inches: number) => Number((inches * 2.54).toFixed(1)),
    kmToMiles: (km: number) => Number((km * 0.621371).toFixed(2)),
    milesToKm: (miles: number) => Number((miles / 0.621371).toFixed(2)),
  }

  const format = {
    weight: (value: number) => {
      if (unit === 'metric') {
        return `${value} kg`
      }
      return `${convert.kgToLbs(value)} lbs`
    },
    height: (value: number) => {
      if (unit === 'metric') {
        return `${value} cm`
      }
      const totalInches = convert.cmToInches(value)
      const feet = Math.floor(totalInches / 12)
      const inches = Math.round(totalInches % 12)
      return `${feet}'${inches}"`
    },
    distance: (value: number) => {
      if (unit === 'metric') {
        return `${value} km`
      }
      return `${convert.kmToMiles(value)} mi`
    },
  }

  const value: UnitContextType = {
    unit,
    setUnit,
    convert,
    format,
  }

  return <UnitContext.Provider value={value}>{children}</UnitContext.Provider>
}

export function useUnitPreference() {
  const context = useContext(UnitContext)
  if (!context) {
    throw new Error('useUnitPreference must be used within UnitProvider')
  }
  return context
}
