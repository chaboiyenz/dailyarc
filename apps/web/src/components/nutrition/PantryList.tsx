import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Toast } from '@repo/ui'
import { Plus, Trash2 } from 'lucide-react'
import { useInventory } from '@/hooks/useInventory'

export default function PantryList() {
  const { inventory, addToPantry, removeFromPantry, loading } = useInventory()
  const [newItem, setNewItem] = useState('')
  const [toast, setToast] = useState<{
    visible: boolean
    message: string
    variant: 'default' | 'destructive' | 'success'
  }>({ visible: false, message: '', variant: 'default' })

  const showToast = (
    message: string,
    variant: 'default' | 'destructive' | 'success' = 'default'
  ) => {
    setToast({ visible: true, message, variant })
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000)
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItem.trim()) return

    try {
      await addToPantry(newItem)
      showToast('Item added to pantry', 'success')
      setNewItem('')
    } catch (error: any) {
      showToast(error.message || 'Failed to add item', 'destructive')
    }
  }

  const handleRemove = async (item: string) => {
    try {
      await removeFromPantry(item)
      showToast('Item removed', 'default')
    } catch (error) {
      showToast('Failed to remove item', 'destructive')
    }
  }

  return (
    <Card className="glass-card h-full flex flex-col relative">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Your Pantry</CardTitle>
          <span className="text-xs text-muted-foreground">{inventory.length} items</span>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
        {/* Add Item Form */}
        <form onSubmit={handleAdd} className="flex gap-2">
          <Input
            placeholder="Add ingredient..."
            value={newItem}
            onChange={e => setNewItem(e.target.value)}
            disabled={loading}
            className="bg-background/50"
          />
          <Button type="submit" size="icon" disabled={loading || !newItem.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </form>

        {/* Inventory List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
          {inventory.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 text-sm">
              Your pantry is empty. <br /> Add items to get recipe suggestions!
            </div>
          ) : (
            inventory.map((item: string) => (
              <div
                key={item}
                className="group flex items-center justify-between rounded-lg border bg-card/50 p-2 text-sm transition-all hover:bg-card"
              >
                <span>{item}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 text-destructive transition-opacity group-hover:opacity-100 items-center justify-center flex"
                  onClick={() => handleRemove(item)}
                  disabled={loading}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>

      <Toast
        visible={toast.visible}
        variant={toast.variant}
        onClose={() => setToast(prev => ({ ...prev, visible: false }))}
      >
        {toast.message}
      </Toast>
    </Card>
  )
}
