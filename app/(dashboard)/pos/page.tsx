'use client'

import { useState } from 'react'
import { ShoppingCart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PageContainer } from '@/components/layouts/page-container'
import { SearchInput } from '@/components/ui/search-input'
import ProductCard from '@/components/pos/product-card'
import CartSheet from '@/components/pos/cart-sheet'
import VariantSelector from '@/components/pos/variant-selector'

const CATEGORIES = ['All', 'Pods', 'Mods', 'Juice', 'Accessories', 'Coils']

interface Product {
  id: number
  name: string
  price: number
  cost: number
  image: string
  category: string
  stock: number
  hasVariants: boolean
}

const PRODUCTS: Product[] = [
  { id: 1, name: 'IQOS Heets', price: 220, cost: 150, image: '🟫', category: 'Pods', stock: 45, hasVariants: true },
  { id: 2, name: 'Voopoo Drag X', price: 2500, cost: 1800, image: '⬛', category: 'Mods', stock: 12, hasVariants: false },
  { id: 3, name: 'Nice Salt 30mg', price: 350, cost: 200, image: '🟦', category: 'Juice', stock: 28, hasVariants: true },
  { id: 4, name: 'Coil Set (5pcs)', price: 450, cost: 250, image: '🔶', category: 'Coils', stock: 5, hasVariants: false },
  { id: 5, name: 'Geekvape Tank', price: 1200, cost: 800, image: '⚪', category: 'Accessories', stock: 18, hasVariants: true },
  { id: 6, name: 'Replacement Pod', price: 150, cost: 100, image: '🟩', category: 'Pods', stock: 62, hasVariants: false },
  { id: 7, name: 'Premium Juice Kit', price: 899, cost: 600, image: '🟥', category: 'Juice', stock: 9, hasVariants: true },
  { id: 8, name: 'Battery Pack', price: 650, cost: 450, image: '🟨', category: 'Accessories', stock: 35, hasVariants: false },
]

interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
  variant?: string | null
  cost: number
}

export default function POSScreen() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCart, setShowCart] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showVariantSelector, setShowVariantSelector] = useState(false)

  const filteredProducts = PRODUCTS.filter(product => {
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const handleAddToCart = (product: Product) => {
    if (product.hasVariants) {
      setSelectedProduct(product)
      setShowVariantSelector(true)
    } else {
      const existingItem = cart.find(item => item.id === product.id)
      if (existingItem) {
        setCart(cart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        ))
      } else {
        setCart([...cart, { ...product, quantity: 1, variant: null }])
      }
    }
  }

  const handleAddVariant = (variant: string, quantity: number) => {
    if (!selectedProduct) return

    const existingItem = cart.find(item => item.id === selectedProduct.id && item.variant === variant)
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === selectedProduct.id && item.variant === variant
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ))
    } else {
      setCart([...cart, {
        id: selectedProduct.id,
        name: selectedProduct.name,
        price: selectedProduct.price,
        cost: selectedProduct.cost,
        quantity,
        variant
      }])
    }
    setShowVariantSelector(false)
  }

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  // Sticky top content (search + categories + cart button)
  const stickyContent = (
    <div className="px-4 py-3 space-y-3">
      {/* Title & Cart Button */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">VapeTrack PH</h1>
        <button
          onClick={() => setShowCart(true)}
          className="relative bg-primary text-primary-foreground px-3 py-2 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors flex items-center gap-2 touch-target"
        >
          <ShoppingCart className="w-5 h-5" />
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {/* Search Bar */}
      <SearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search products..."
      />

      {/* Category Chips - Horizontal Scroll */}
      <div className="flex gap-2 overflow-x-auto pb-2 scroll-smooth">
        {CATEGORIES.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={cn(
              'px-4 py-2.5 min-h-11 rounded-full text-xs font-semibold whitespace-nowrap transition-all touch-target',
              selectedCategory === category
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                : 'bg-secondary/50 text-foreground hover:bg-secondary'
            )}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <PageContainer fullHeight noPaddingTop stickyTop={stickyContent}>
      {/* Product Grid - 2 Columns */}
      <div className="grid grid-cols-2 gap-3">
        {filteredProducts.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={() => handleAddToCart(product)}
          />
        ))}
      </div>

      {/* Cart Sheet */}
      {showCart && <CartSheet items={cart} onClose={() => setShowCart(false)} onUpdateCart={setCart} />}

      {/* Variant Selector */}
      {showVariantSelector && selectedProduct && (
        <VariantSelector
          product={selectedProduct}
          onAddToCart={handleAddVariant}
          onClose={() => setShowVariantSelector(false)}
        />
      )}
    </PageContainer>
  )
}
