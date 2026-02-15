import { useState, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { usePasswordChange } from '@/hooks/usePasswordChange'
import { useWearableSync } from '@/hooks/useWearableSync'
import { useStripeCheckout } from '@/hooks/useStripeCheckout'
import { doc, updateDoc } from 'firebase/firestore'
import { db, storage } from '@/lib/firebase'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label } from '@repo/ui'
import { Upload, Trash2, Lock, Eye, EyeOff, Plus, X, Watch, Crown, Zap, Check } from 'lucide-react'

export default function UserProfile() {
  const { user, profile } = useAuth()
  const { changePassword, loading: pwLoading } = usePasswordChange()
  const {
    connectWearable,
    disconnectWearable,
    isConnecting,
    error: wearableError,
  } = useWearableSync(user?.uid || null)
  const {
    startCheckout,
    openCustomerPortal,
    isLoading: checkoutLoading,
    error: checkoutError,
  } = useStripeCheckout(
    user?.uid || null,
    user?.email || null,
    profile?.subscription?.stripeCustomerId
  )
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form states
  const [bioEdit, setBioEdit] = useState(profile?.bio || '')
  const [goalInput, setGoalInput] = useState('')
  const [goalEdit, setGoalEdit] = useState(profile?.fitnessGoals || [])
  const [weight, setWeight] = useState(profile?.bodyStats?.weight?.toString() || '')
  const [height, setHeight] = useState(profile?.bodyStats?.height?.toString() || '')
  const [bodyFat, setBodyFat] = useState(profile?.bodyStats?.bodyFat?.toString() || '')
  const [unitPref, setUnitPref] = useState(profile?.unitPreference || 'metric')
  const [isPublic, setIsPublic] = useState(profile?.isPublicProfile || false)

  // Upload states
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Password change dialog
  const [pwDialogOpen, setPwDialogOpen] = useState(false)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showPw, setShowPw] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [pwMessage, setPwMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  )

  // Saving states
  const [saveMessage, setSaveMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  if (!user || !profile) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File must be less than 5MB')
      return
    }
    if (!file.type.startsWith('image/')) {
      setUploadError('File must be an image')
      return
    }

    setAvatarUploading(true)
    setUploadError(null)
    setUploadProgress(0)

    try {
      // Upload to Firebase Storage at avatars/{uid}
      const storageRef = ref(storage, `avatars/${user.uid}`)

      // Simulate progress (Firebase uploadBytes doesn't provide real progress)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => (prev < 90 ? prev + 10 : prev))
      }, 100)

      await uploadBytes(storageRef, file)
      clearInterval(progressInterval)
      setUploadProgress(100)

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef)

      // Update Firestore with new avatar URL
      await updateDoc(doc(db, 'users', user.uid), {
        avatarUrl: downloadURL,
      })

      setSaveMessage({ type: 'success', text: 'Avatar uploaded successfully' })
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
      setSaveMessage({
        type: 'error',
        text: 'Avatar upload failed',
      })
    } finally {
      setAvatarUploading(false)
      setUploadProgress(0)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDeleteAvatar = async () => {
    if (!profile.avatarUrl) return

    setAvatarUploading(true)
    try {
      // Delete from storage
      const storageRef = ref(storage, `avatars/${user.uid}`)
      try {
        await deleteObject(storageRef)
      } catch (err) {
        // Ignore if file doesn't exist
      }

      // Update Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        avatarUrl: null,
      })

      setSaveMessage({ type: 'success', text: 'Avatar deleted' })
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (err) {
      setSaveMessage({
        type: 'error',
        text: 'Failed to delete avatar',
      })
    } finally {
      setAvatarUploading(false)
    }
  }

  const handlePasswordChange = async () => {
    try {
      await changePassword(user, {
        currentPassword: currentPw,
        newPassword: newPw,
        confirmPassword: confirmPw,
      })
      setPwMessage({ type: 'success', text: 'Password updated successfully' })
      setTimeout(() => {
        setPwDialogOpen(false)
        setPwMessage(null)
        setCurrentPw('')
        setNewPw('')
        setConfirmPw('')
      }, 2000)
    } catch (err) {
      setPwMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update password',
      })
    }
  }

  const handleAddGoal = () => {
    if (goalInput.trim() && !goalEdit.includes(goalInput)) {
      setGoalEdit([...goalEdit, goalInput])
      setGoalInput('')
    }
  }

  const handleRemoveGoal = (goal: string) => {
    setGoalEdit(goalEdit.filter(g => g !== goal))
  }

  const handleSaveProfile = async () => {
    try {
      const bodyStatsUpdate: Record<string, number | string | undefined> = {}
      if (weight) bodyStatsUpdate.weight = Number(weight)
      if (height) bodyStatsUpdate.height = Number(height)
      if (bodyFat) bodyStatsUpdate.bodyFat = Number(bodyFat)
      if (profile?.bodyStats?.dob) bodyStatsUpdate.dob = profile.bodyStats.dob
      if (profile?.bodyStats?.gender) bodyStatsUpdate.gender = profile.bodyStats.gender

      await updateDoc(doc(db, 'users', user.uid), {
        bio: bioEdit,
        fitnessGoals: goalEdit,
        bodyStats: bodyStatsUpdate,
      })
      setSaveMessage({ type: 'success', text: 'Profile updated successfully' })
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (err) {
      setSaveMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to save profile',
      })
    }
  }

  const handleTogglePublic = async () => {
    const newValue = !isPublic
    setIsPublic(newValue)
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        isPublicProfile: newValue,
      })
    } catch (err) {
      setSaveMessage({
        type: 'error',
        text: 'Failed to update privacy setting',
      })
      setIsPublic(!newValue) // Revert
    }
  }

  const handleUnitToggle = async () => {
    const newUnit = unitPref === 'metric' ? 'imperial' : 'metric'
    setUnitPref(newUnit)
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        unitPreference: newUnit,
      })
    } catch (err) {
      setSaveMessage({
        type: 'error',
        text: 'Failed to update unit preference',
      })
      setUnitPref(unitPref) // Revert
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      {/* Global Message */}
      {saveMessage && (
        <div
          className={`p-4 rounded-lg text-sm font-semibold ${
            saveMessage.type === 'success'
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}
        >
          {saveMessage.text}
        </div>
      )}

      {/* Avatar Section */}
      <Card className="border-border bg-card overflow-hidden">
        <CardContent className="p-6 flex flex-col items-center gap-4">
          {/* Avatar Container with Progress */}
          <div className="relative group">
            <div className="w-32 h-32 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden border-2 border-slate-600">
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-5xl font-black text-muted-foreground">
                  {profile?.displayName?.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Progress Overlay */}
              {avatarUploading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    <p className="text-xs text-white font-bold">{uploadProgress}%</p>
                  </div>
                </div>
              )}
            </div>

            {/* Upload/Delete buttons */}
            {!avatarUploading && (
              <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <label className="cursor-pointer p-3 rounded-full hover:bg-black/50 transition-colors">
                  <Upload className="h-5 w-5 text-white" />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={avatarUploading}
                    className="hidden"
                  />
                </label>
                {profile?.avatarUrl && (
                  <button
                    onClick={handleDeleteAvatar}
                    disabled={avatarUploading}
                    className="p-3 rounded-full hover:bg-black/50 transition-colors"
                  >
                    <Trash2 className="h-5 w-5 text-white" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Upload Error */}
          {uploadError && <p className="text-xs text-red-400">{uploadError}</p>}

          {/* Name and Role */}
          <div className="text-center">
            <h2 className="text-2xl font-black text-foreground">{profile?.displayName}</h2>
            <div className="mt-2 inline-block px-3 py-1 rounded-full bg-primary/20 border border-primary/50">
              <span className="text-xs font-bold text-primary uppercase tracking-widest">
                {profile?.role === 'TRAINEE' ? 'Trainee' : 'Trainer'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bio Section */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">About</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-foreground text-sm">Bio</Label>
            <textarea
              value={bioEdit}
              onChange={e => setBioEdit(e.target.value.slice(0, 160))}
              placeholder="Tell us about yourself (max 160 characters)"
              className="w-full mt-2 p-3 rounded-lg bg-slate-900 text-foreground text-sm resize-none border border-slate-700 focus:border-primary focus:outline-none"
              rows={3}
            />
            <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
              <span>{bioEdit.length}/160</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fitness Profile Section */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">Fitness Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Body Stats */}
          <div>
            <Label className="text-foreground text-sm font-semibold block mb-3">
              Body Measurements ({unitPref === 'metric' ? 'Metric' : 'Imperial'})
            </Label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">
                  Weight ({unitPref === 'metric' ? 'kg' : 'lbs'})
                </Label>
                <Input
                  type="number"
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                  placeholder="0"
                  className="mt-1.5 bg-slate-900 text-foreground border-slate-700"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Height ({unitPref === 'metric' ? 'cm' : 'in'})
                </Label>
                <Input
                  type="number"
                  value={height}
                  onChange={e => setHeight(e.target.value)}
                  placeholder="0"
                  className="mt-1.5 bg-slate-900 text-foreground border-slate-700"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Body Fat %</Label>
                <Input
                  type="number"
                  value={bodyFat}
                  onChange={e => setBodyFat(e.target.value)}
                  placeholder="0"
                  className="mt-1.5 bg-slate-900 text-foreground border-slate-700"
                />
              </div>
            </div>
          </div>

          {/* Fitness Goals */}
          <div className="pt-4 border-t border-slate-700">
            <Label className="text-foreground text-sm font-semibold block mb-3">
              Fitness Goals
            </Label>
            <div className="flex gap-2 mb-3 flex-wrap">
              {goalEdit.map(goal => (
                <div
                  key={goal}
                  className="px-3 py-1.5 rounded-full bg-primary/20 border border-primary/50 flex items-center gap-2"
                >
                  <span className="text-xs font-bold text-primary">{goal}</span>
                  <button
                    onClick={() => handleRemoveGoal(goal)}
                    className="text-primary hover:text-red-500 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={goalInput}
                onChange={e => setGoalInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleAddGoal()}
                placeholder="e.g., Strength, Fat Loss, Hypertrophy"
                className="flex-1 bg-slate-900 text-foreground border-slate-700"
              />
              <Button
                onClick={handleAddGoal}
                disabled={!goalInput.trim()}
                variant="default"
                size="sm"
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t border-slate-700">
            <Button onClick={handleSaveProfile} className="bg-primary hover:bg-primary/90">
              Save Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Wearable Devices Section - PRO FEATURE */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">Wearable Devices</CardTitle>
              {profile?.subscription?.tier !== 'PRO' && (
                <span className="px-2 py-1 text-xs font-bold bg-amber-500/20 text-amber-400 rounded-full border border-amber-500/30">
                  PRO
                </span>
              )}
            </div>
            <Watch className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {profile?.subscription?.tier !== 'PRO' ? (
            <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700">
              <p className="text-sm text-muted-foreground mb-3">
                Automatically sync heart rate, sleep quality, and activity data from your wearable
                device.
              </p>
              <Button
                onClick={() => startCheckout({ priceId: import.meta.env.VITE_STRIPE_PRO_PRICE_ID })}
                disabled={checkoutLoading}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              >
                <Crown className="h-4 w-4 mr-2" />
                Upgrade to Pro
              </Button>
            </div>
          ) : (
            <>
              {/* Connection Status */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-700">
                <div className="flex items-center gap-3">
                  <Watch className="h-5 w-5 text-cyan-400" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Google Fit</p>
                    <p className="text-xs text-muted-foreground">
                      {profile?.wearableSync?.isConnected ? 'Connected' : 'Not connected'}
                    </p>
                  </div>
                </div>

                {profile?.wearableSync?.isConnected ? (
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400" />
                    <Button
                      onClick={disconnectWearable}
                      disabled={isConnecting}
                      variant="outline"
                      size="sm"
                      className="bg-slate-800 border-slate-600 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400"
                    >
                      {isConnecting ? 'Disconnecting...' : 'Disconnect'}
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={connectWearable}
                    disabled={isConnecting}
                    variant="default"
                    size="sm"
                    className="bg-cyan-500 hover:bg-cyan-600"
                  >
                    {isConnecting ? 'Connecting...' : 'Connect'}
                  </Button>
                )}
              </div>

              {/* Last Sync Info */}
              {profile?.wearableSync?.isConnected && profile?.wearableSync?.lastSyncAt && (
                <div className="text-xs text-muted-foreground">
                  Last synced: {new Date(profile.wearableSync.lastSyncAt.toDate()).toLocaleString()}
                </div>
              )}

              {/* Error Display */}
              {wearableError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {wearableError}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Subscription Management Section */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Subscription</CardTitle>
            <Crown className="h-5 w-5 text-amber-400" />
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {profile?.subscription?.tier === 'PRO' ? (
            <>
              {/* Active subscription display */}
              <div className="p-4 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-amber-500/20">
                    <Zap className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">DailyArc Pro</h4>
                    <p className="text-xs text-muted-foreground">
                      Status:{' '}
                      <span className="text-emerald-400 font-semibold">
                        {profile.subscription.status === 'active'
                          ? 'Active'
                          : profile.subscription.status === 'trialing'
                            ? 'Trial'
                            : profile.subscription.status === 'past_due'
                              ? 'Past Due'
                              : 'Active'}
                      </span>
                    </p>
                  </div>
                </div>

                {profile.subscription.currentPeriodEnd && (
                  <p className="text-xs text-muted-foreground mb-3">
                    {profile.subscription.status === 'canceled'
                      ? `Access ends: ${new Date(profile.subscription.currentPeriodEnd.toDate()).toLocaleDateString()}`
                      : `Renews: ${new Date(profile.subscription.currentPeriodEnd.toDate()).toLocaleDateString()}`}
                  </p>
                )}

                <Button
                  onClick={openCustomerPortal}
                  disabled={checkoutLoading}
                  variant="outline"
                  size="sm"
                  className="w-full bg-slate-800 border-amber-500/50 hover:bg-slate-700 text-amber-400"
                >
                  {checkoutLoading ? 'Loading...' : 'Manage Subscription'}
                </Button>
              </div>

              {/* Pro features list */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Your Pro Benefits
                </p>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400" />
                    Wearable device sync
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400" />
                    Advanced analytics
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400" />
                    Custom programs
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400" />
                    Data export
                  </li>
                </ul>
              </div>
            </>
          ) : (
            <>
              {/* Upgrade prompt */}
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Unlock the full potential of DailyArc with Pro features.
                </p>

                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm">
                    <Zap className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">Automatic wearable sync</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Zap className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">Advanced trend analysis</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Zap className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">Custom training builder</span>
                  </div>
                </div>

                <Button
                  onClick={() =>
                    startCheckout({ priceId: import.meta.env.VITE_STRIPE_PRO_PRICE_ID })
                  }
                  disabled={checkoutLoading}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 font-bold"
                  size="lg"
                >
                  <Crown className="h-5 w-5 mr-2" />
                  {checkoutLoading ? 'Loading...' : 'Upgrade to Pro - $9.99/month'}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Cancel anytime. Powered by Stripe.
                </p>
              </div>
            </>
          )}

          {/* Error Display */}
          {checkoutError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {checkoutError}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings Section */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">Settings & Privacy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Unit Preference */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-700">
            <div>
              <p className="text-sm font-semibold text-foreground">Unit System</p>
              <p className="text-xs text-muted-foreground">
                Currently using {unitPref === 'metric' ? 'Metric (kg, cm)' : 'Imperial (lbs, in)'}
              </p>
            </div>
            <Button
              onClick={handleUnitToggle}
              variant="outline"
              size="sm"
              className="bg-slate-800 border-slate-600 hover:bg-slate-700"
            >
              {unitPref === 'metric' ? 'Imperial' : 'Metric'}
            </Button>
          </div>

          {/* Public Profile */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-700">
            <div>
              <p className="text-sm font-semibold text-foreground">Public Profile</p>
              <p className="text-xs text-muted-foreground">
                {isPublic ? 'Visible in community' : 'Hidden from community search'}
              </p>
            </div>
            <button
              onClick={handleTogglePublic}
              className={`w-12 h-6 rounded-full transition-colors ${
                isPublic ? 'bg-primary' : 'bg-slate-600'
              } flex items-center ${isPublic ? 'justify-end' : 'justify-start'} p-0.5`}
            >
              <div className="w-5 h-5 rounded-full bg-white" />
            </button>
          </div>

          {/* Change Password */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-700">
            <div>
              <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Change Password
              </p>
              <p className="text-xs text-muted-foreground">Update your account password securely</p>
            </div>
            <Button
              onClick={() => setPwDialogOpen(true)}
              variant="outline"
              size="sm"
              className="bg-slate-800 border-slate-600 hover:bg-slate-700"
            >
              Change
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Password Change Modal */}
      {pwDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="border-border bg-card max-w-md w-full">
            <CardHeader>
              <CardTitle className="text-foreground">Change Password</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Current Password */}
              <div>
                <Label className="text-foreground text-sm">Current Password</Label>
                <div className="relative mt-1.5">
                  <input
                    type={showPw.current ? 'text' : 'password'}
                    value={currentPw}
                    onChange={e => setCurrentPw(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 text-foreground border border-slate-700 focus:border-primary focus:outline-none text-sm"
                    placeholder="Enter current password"
                  />
                  <button
                    onClick={() => setShowPw(prev => ({ ...prev, current: !prev.current }))}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    {showPw.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <Label className="text-foreground text-sm">New Password</Label>
                <div className="relative mt-1.5">
                  <input
                    type={showPw.new ? 'text' : 'password'}
                    value={newPw}
                    onChange={e => setNewPw(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 text-foreground border border-slate-700 focus:border-primary focus:outline-none text-sm"
                    placeholder="Enter new password (min 6 chars)"
                  />
                  <button
                    onClick={() => setShowPw(prev => ({ ...prev, new: !prev.new }))}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    {showPw.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <Label className="text-foreground text-sm">Confirm Password</Label>
                <div className="relative mt-1.5">
                  <input
                    type={showPw.confirm ? 'text' : 'password'}
                    value={confirmPw}
                    onChange={e => setConfirmPw(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 text-foreground border border-slate-700 focus:border-primary focus:outline-none text-sm"
                    placeholder="Confirm new password"
                  />
                  <button
                    onClick={() => setShowPw(prev => ({ ...prev, confirm: !prev.confirm }))}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    {showPw.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Message */}
              {pwMessage && (
                <div
                  className={`p-3 rounded-lg text-sm font-semibold ${
                    pwMessage.type === 'success'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}
                >
                  {pwMessage.text}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-700">
                <Button
                  onClick={() => {
                    setPwDialogOpen(false)
                    setPwMessage(null)
                    setCurrentPw('')
                    setNewPw('')
                    setConfirmPw('')
                  }}
                  variant="outline"
                  className="bg-slate-900 border-slate-600 hover:bg-slate-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePasswordChange}
                  disabled={pwLoading || !currentPw || !newPw || !confirmPw}
                  className="bg-primary hover:bg-primary/90 disabled:opacity-50"
                >
                  {pwLoading ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
