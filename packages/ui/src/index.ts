// =============================================================================
// @repo/ui - The Shared Component Closet
// =============================================================================
//
// 🎭 ANALOGY: This is like a shared wardrobe in a theater production.
// All the actors (apps) can come here to borrow costumes (components)
// instead of each making their own from scratch!
//
// This package contains:
// - Custom components (Header, Counter)
// - Shadcn UI components (Button, Card)
// - Utility functions (cn for class merging)
// =============================================================================

// Custom Components
export { Header } from './components/Header'
export { Counter } from './components/Counter'

// Shadcn UI Components
export { Button, buttonVariants } from './components/ui/button'
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from './components/ui/card'
export { Toast, toastVariants } from './components/ui/toast'
export { Progress } from './components/ui/progress'
export { Skeleton } from './components/ui/skeleton' // Export Skeleton
export { Input } from './components/ui/input'
export { Label } from './components/ui/label'
export { Slider } from './components/ui/slider'
export { RadioGroup, RadioGroupItem } from './components/ui/radio-group'

// Utilities
export { cn } from './lib/utils'
