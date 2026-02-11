import { useState } from 'react'
import Sidebar, { type NavSection } from './Sidebar'
import TraineeDashboard from './TraineeDashboard'
import TrainerDashboard from './TrainerDashboard'
import ReadinessView from './ReadinessView'
import TrainingView from './TrainingView'
import NutritionView from './NutritionView'
import CoachView from './CoachView'
import AnalyticsView from './AnalyticsView'
import CommunityFeed from '../social/CommunityFeed'
import ChatPortal from '../social/ChatPortal'
import { Button } from '@repo/ui'
import { cn } from '@repo/ui/utils'

interface DashboardLayoutProps {
  userName: string
  userRole: string
  onSignOut: () => void
}

export default function DashboardLayout({ userName, userRole, onSignOut }: DashboardLayoutProps) {
  const [activeSection, setActiveSection] = useState<NavSection>('dashboard')
  const [collapsed, setCollapsed] = useState(false)

  const isTrainer = userRole === 'TRAINER'

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return isTrainer ? <TrainerDashboard /> : <TraineeDashboard onNavigate={setActiveSection} />
      case 'readiness':
        return <ReadinessView />
      case 'training':
        return <TrainingView />
      case 'nutrition':
        return <NutritionView />
      case 'community':
        return <CommunityFeed />
      case 'messages':
        return <ChatPortal />
      case 'coach':
        return <CoachView userRole={userRole} />
      case 'analytics':
        return <AnalyticsView />
      default:
        return isTrainer ? <TrainerDashboard /> : <TraineeDashboard onNavigate={setActiveSection} />
    }
  }

  const sectionTitles: Record<NavSection, string> = {
    dashboard: isTrainer ? 'Risk Dashboard' : 'Command Center',
    readiness: 'Readiness Check',
    training: 'Training Arc',
    nutrition: 'Nutrition Engine',
    community: 'Community Network',
    messages: 'Comms',
    coach: isTrainer ? 'Client Management' : 'Coach Portal',
    analytics: 'Analytics',
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        active={activeSection}
        onNavigate={setActiveSection}
        userName={userName}
        userRole={userRole}
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
      />

      {/* Main Content */}
      <main className={cn('flex-1 transition-all duration-300', collapsed ? 'ml-16' : 'ml-60')}>
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-md">
          <div>
            <h1 className="text-lg font-bold text-foreground">{sectionTitles[activeSection]}</h1>
            <p className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onSignOut}
              className="text-muted-foreground hover:text-foreground"
            >
              Sign Out
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">{renderContent()}</div>
      </main>
    </div>
  )
}
