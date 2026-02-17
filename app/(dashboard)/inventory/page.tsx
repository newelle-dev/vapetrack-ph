'use client'

import { Plus, Search, Edit2 } from 'lucide-react'
import { useState } from 'react'
import { PageContainer } from '@/components/layouts/page-container'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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
    <PageContainer
      title="Inventory"
      action={
        <Button className="min-h-[44px] min-w-[44px]">
          <Plus className="w-5 h-5 md:mr-2" />
          <span className="hidden md:inline">Add Product</span>
        </Button>
      }
    >
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Product List */}
      <div className="space-y-2">
        {filteredProducts.map(product => (
          <div key={product.id} className="bg-card rounded-xl p-3 border border-border/50 hover:border-border transition-colors">
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
              <Button
                variant="secondary"
                size="icon"
                className="min-h-[44px] min-w-[44px]"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </PageContainer>
  )
}
