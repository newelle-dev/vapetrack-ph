'use client'

import { Plus, Search, Edit2, AlertCircle } from 'lucide-react'
import { useState } from 'react'

export default function InventoryScreen() {
  const [searchQuery, setSearchQuery] = useState('')

  const products = [
    { id: 1, name: 'IQOS Heets', category: 'Pods', stock: 45, cost: 150, price: 220, status: 'ok' },
    { id: 2, name: 'Voopoo Drag X', category: 'Mods', stock: 12, cost: 1800, price: 2500, status: 'ok' },
    { id: 3, name: 'Nice Salt 30mg', category: 'Juice', stock: 28, cost: 200, price: 350, status: 'ok' },
    { id: 4, name: 'Coil Set (5pcs)', category: 'Coils', stock: 5, cost: 250, price: 450, status: 'low' },
    { id: 5, name: 'Sony 18650', category: 'Batteries', stock: 2, cost: 350, price: 450, status: 'critical' },
  ]

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-foreground">Inventory</h1>
          <button className="bg-primary text-primary-foreground p-2 rounded-lg hover:bg-primary/90 transition-colors touch-target">
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      {/* Product List */}
      <div className="flex-1 overflow-y-auto px-4 py-3 pb-20 space-y-2">
        {filteredProducts.map(product => (
          <div key={product.id} className="bg-card rounded-[14px] p-3 border border-border/50 hover:border-border transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-foreground">{product.name}</h3>
                <p className="text-xs text-muted-foreground">{product.category}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs font-semibold text-primary">₱{product.price}</span>
                  <span className="text-xs text-muted-foreground line-through">₱{product.cost}</span>
                </div>
              </div>

              {/* Stock Badge */}
              <div className={`text-right ${product.status === 'critical' ? 'text-accent' : product.status === 'low' ? 'text-warning' : 'text-success'}`}>
                <p className="text-sm font-bold">{product.stock}</p>
                <p className="text-xs font-medium">
                  {product.status === 'critical' ? '⚠️ Critical' : product.status === 'low' ? '⚠️ Low' : '✓ OK'}
                </p>
              </div>

              {/* Edit Button */}
              <button className="p-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors touch-target">
                <Edit2 className="w-4 h-4 text-foreground" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
