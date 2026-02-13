/**
 * Admin Panel - Trainer Approval Management
 * Accessible only to users with role === 'ADMIN'
 * Displays pending trainers and allows approval/rejection
 */

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Toast,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@repo/ui'
import {
  usePendingTrainers,
  useApproveTrainer,
  useRejectTrainer,
  useAllTrainers,
} from '@/hooks/useTrainerApproval'
import { useAllUsersAdmin } from '@/hooks/useAllUsersAdmin'
import { type User } from '@repo/shared'
import { CheckCircle, XCircle, Eye, AlertCircle, Users } from 'lucide-react'

interface TrainerWithStatus extends User {
  id: string
}

export default function AdminPanel() {
  const { data: pendingTrainers, isLoading: isPendingLoading } = usePendingTrainers()
  const { data: allTrainers, isLoading: isAllLoading } = useAllTrainers()
  const { users, loading: usersLoading } = useAllUsersAdmin()
  const approveMutation = useApproveTrainer()
  const rejectMutation = useRejectTrainer()

  const [selectedTrainer, setSelectedTrainer] = useState<TrainerWithStatus | null>(null)
  const [showCertModal, setShowCertModal] = useState(false)
  const [userTab, setUserTab] = useState<'all' | 'trainees' | 'trainers'>('all')
  const [toast, setToast] = useState<{
    visible: boolean
    variant: 'default' | 'success' | 'destructive'
    message: string
  }>({ visible: false, variant: 'default', message: '' })

  const handleApprove = async (trainerId: string) => {
    try {
      await approveMutation.mutateAsync(trainerId)
      setToast({
        visible: true,
        variant: 'success',
        message: 'Trainer approved successfully! ✅',
      })
      setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000)
    } catch (error) {
      setToast({
        visible: true,
        variant: 'destructive',
        message: 'Failed to approve trainer ❌',
      })
    }
  }

  const handleReject = async (trainerId: string) => {
    try {
      await rejectMutation.mutateAsync(trainerId)
      setToast({
        visible: true,
        variant: 'destructive',
        message: 'Trainer rejected.',
      })
      setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000)
    } catch (error) {
      setToast({
        visible: true,
        variant: 'destructive',
        message: 'Failed to reject trainer ❌',
      })
    }
  }

  const handleViewCertificate = (trainer: TrainerWithStatus) => {
    setSelectedTrainer(trainer)
    setShowCertModal(true)
  }

  // Stats
  const approvedCount = allTrainers?.filter(t => t.trainerStatus === 'APPROVED').length || 0
  const rejectedCount = allTrainers?.filter(t => t.trainerStatus === 'REJECTED').length || 0
  const pendingCount = pendingTrainers?.length || 0

  // User filtering
  const traineeUsers = users.filter(u => u.role === 'TRAINEE')
  const trainerUsers = users.filter(u => u.role === 'TRAINER')
  const adminUsers = users.filter(u => u.role === 'ADMIN')

  let filteredUsers: User[] = []
  if (userTab === 'all') {
    filteredUsers = users
  } else if (userTab === 'trainees') {
    filteredUsers = traineeUsers
  } else if (userTab === 'trainers') {
    filteredUsers = trainerUsers
  }

  return (
    <div className="flex flex-col gap-6 min-h-screen bg-slate-950 p-6">
      <Toast
        variant={toast.variant}
        visible={toast.visible}
        onClose={() => setToast(prev => ({ ...prev, visible: false }))}
      >
        {toast.message}
      </Toast>

      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
        <p className="text-slate-400">Manage trainer approvals and certifications</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-slate-700/50 bg-slate-900/50">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-2">
              <span className="text-sm text-slate-400 uppercase">Pending</span>
              <span className="text-2xl font-bold text-yellow-500">{pendingCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-2">
              <span className="text-sm text-emerald-600 uppercase">Approved</span>
              <span className="text-2xl font-bold text-emerald-500">{approvedCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-rose-500/30 bg-rose-500/5">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-2">
              <span className="text-sm text-rose-600 uppercase">Rejected</span>
              <span className="text-2xl font-bold text-rose-500">{rejectedCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* All Users Directory */}
      <Card className="border-slate-700/50 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Users className="h-5 w-5 text-cyan-500" />
            User Directory
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Tab Buttons */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setUserTab('all')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                userTab === 'all'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                  : 'bg-slate-800/50 text-slate-400 hover:text-slate-300 border border-slate-700/50'
              }`}
            >
              All Users ({users.length})
            </button>
            <button
              onClick={() => setUserTab('trainees')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                userTab === 'trainees'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                  : 'bg-slate-800/50 text-slate-400 hover:text-slate-300 border border-slate-700/50'
              }`}
            >
              Trainees ({traineeUsers.length})
            </button>
            <button
              onClick={() => setUserTab('trainers')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                userTab === 'trainers'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                  : 'bg-slate-800/50 text-slate-400 hover:text-slate-300 border border-slate-700/50'
              }`}
            >
              Trainers ({trainerUsers.length})
            </button>
            <button
              disabled
              className="px-4 py-2 rounded-lg font-medium text-slate-500 bg-slate-800/50 border border-slate-700/50 opacity-50"
            >
              Admins ({adminUsers.length})
            </button>
          </div>

          {/* User List Grid */}
          {usersLoading ? (
            <div className="text-center py-8 text-slate-400">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-slate-400">No users found in this category</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUsers.map(user => (
                <div
                  key={user.uid}
                  className="p-4 rounded-lg border border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/50 transition"
                >
                  {/* Avatar & Header */}
                  <div className="flex gap-3 items-start mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700 text-white font-semibold text-sm flex-shrink-0">
                      {(user.displayName || 'U')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate">{user.displayName}</p>
                      <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    </div>
                  </div>

                  {/* Role Badge */}
                  <div className="mb-3">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                        user.role === 'ADMIN'
                          ? 'bg-purple-500/20 text-purple-400'
                          : user.role === 'TRAINER'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      {user.role || 'PENDING'}
                    </span>
                  </div>

                  {/* Trainer Status Badge (if trainer) */}
                  {user.role === 'TRAINER' && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-400">Status:</span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          user.trainerStatus === 'APPROVED'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : user.trainerStatus === 'REJECTED'
                              ? 'bg-rose-500/20 text-rose-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                        }`}
                      >
                        {user.trainerStatus || 'PENDING'}
                      </span>
                    </div>
                  )}

                  {/* Onboarding Status */}
                  {!user.onboardingComplete && (
                    <p className="text-xs text-yellow-400 mt-2">⚠️ Onboarding incomplete</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Trainers Table */}
      <Card className="border-slate-700/50 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            Pending Trainers ({pendingCount})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isPendingLoading ? (
            <div className="text-center py-8 text-slate-400">Loading pending trainers...</div>
          ) : pendingTrainers && pendingTrainers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="text-left py-3 px-4 text-slate-300 font-semibold">Name</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-semibold">Email</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-semibold">
                      Certification
                    </th>
                    <th className="text-right py-3 px-4 text-slate-300 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingTrainers.map(trainer => (
                    <tr
                      key={trainer.id}
                      className="border-b border-slate-800/50 hover:bg-slate-800/30 transition"
                    >
                      <td className="py-3 px-4 text-white font-medium">{trainer.displayName}</td>
                      <td className="py-3 px-4 text-slate-300">{trainer.email}</td>
                      <td className="py-3 px-4">
                        {trainer.certificationUrl ? (
                          <button
                            onClick={() => handleViewCertificate(trainer)}
                            className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </button>
                        ) : (
                          <span className="text-slate-500 text-xs">No cert</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            className="bg-emerald-500 hover:bg-emerald-600 text-white flex gap-1"
                            onClick={() => handleApprove(trainer.id)}
                            disabled={approveMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="bg-rose-500 hover:bg-rose-600 text-white flex gap-1"
                            onClick={() => handleReject(trainer.id)}
                            disabled={rejectMutation.isPending}
                          >
                            <XCircle className="h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">No pending trainers</div>
          )}
        </CardContent>
      </Card>

      {/* All Trainers Overview */}
      <Card className="border-slate-700/50 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-white">All Trainers Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {isAllLoading ? (
            <div className="text-center py-8 text-slate-400">Loading trainers...</div>
          ) : allTrainers && allTrainers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allTrainers.map(trainer => (
                <div
                  key={trainer.id}
                  className={`p-4 rounded-lg border transition ${
                    trainer.trainerStatus === 'APPROVED'
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : trainer.trainerStatus === 'REJECTED'
                        ? 'border-rose-500/30 bg-rose-500/5'
                        : 'border-yellow-500/30 bg-yellow-500/5'
                  }`}
                >
                  <div className="flex gap-3 items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-white">{trainer.displayName}</p>
                      <p className="text-sm text-slate-400">{trainer.email}</p>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        trainer.trainerStatus === 'APPROVED'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : trainer.trainerStatus === 'REJECTED'
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                      }`}
                    >
                      {trainer.trainerStatus}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">No trainers found</div>
          )}
        </CardContent>
      </Card>

      {/* Certificate Modal */}
      <Dialog open={showCertModal} onOpenChange={setShowCertModal}>
        <DialogContent className="border-slate-700/50 bg-slate-900">
          <DialogHeader>
            <DialogTitle className="text-white">
              {selectedTrainer?.displayName} - Certification
            </DialogTitle>
          </DialogHeader>
          {selectedTrainer?.certificationUrl ? (
            <div className="space-y-4">
              {selectedTrainer.certificationUrl.startsWith('data:image') ? (
                <img
                  src={selectedTrainer.certificationUrl}
                  alt="Certification"
                  className="w-full max-h-96 object-contain rounded-lg border border-slate-700"
                />
              ) : (
                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                  <p className="text-slate-300 text-sm break-all">
                    {selectedTrainer.certificationUrl.substring(0, 100)}...
                  </p>
                </div>
              )}
              <p className="text-xs text-slate-400">
                Trainer: {selectedTrainer.displayName} ({selectedTrainer.email})
              </p>
            </div>
          ) : (
            <p className="text-slate-400">No certification provided</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
