'use client'

import { TrendingUp, AlertCircle, ShoppingCart } from 'lucide-react'

export default function Dashboard() {
  // Sample data
  const todayRevenue = 25500
  const yesterdayRevenue = 18200
  const revenueGrowth = ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100).toFixed(1)
  
  const todayProfit = 8200
  const profitMargin = ((todayProfit / todayRevenue) * 100).toFixed(1)

  const lowStockProducts = [
    { id: 1, name: 'Sony 18650', stock: 2, minStock: 10 },
    { id: 4, name: 'Coil Pack (5pcs)', stock: 5, minStock: 15 },
  ]

  const topSellers = [
    { name: 'Juice 30ml Bottle', sales: 45, revenue: 11250 },
    { name: 'IQOS Heets', sales: 38, revenue: 8360 },
    { name: 'Replacement Pod', sales: 28, revenue: 4200 },
  ]

  const recentActivity = [
    { type: 'sale', description: 'Sale completed', time: '2 mins ago', amount: 2500 },
    { type: 'restock', description: 'Inventory updated', time: '15 mins ago', amount: null },
    { type: 'sale', description: 'Sale completed', time: '28 mins ago', amount: 1800 },
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-4">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-xs text-muted-foreground mt-1">Today&apos;s business overview</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-20 space-y-4">
        {/* Hero Card - Today's Revenue */}
        <div className="bg-linear-to-br from-primary/20 to-primary/5 rounded-2xl p-4 border border-primary/20">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Today&apos;s Revenue</p>
              <h2 className="text-3xl font-bold text-primary mt-1">₱{todayRevenue.toLocaleString()}</h2>
            </div>
            <div className="bg-primary/20 p-2.5 rounded-lg">
              <ShoppingCart className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-success" />
            <span className="text-sm font-semibold text-success">+{revenueGrowth}% from yesterday</span>
          </div>
        </div>

        {/* Stat Cards Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Profit Card */}
          <div className="bg-card rounded-[14px] p-3 border border-border/50 hover:border-border transition-colors">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1.5">Today&apos;s Profit</p>
            <h3 className="text-2xl font-bold text-success mb-1">₱{todayProfit.toLocaleString()}</h3>
            <p className="text-xs text-muted-foreground">{profitMargin}% margin</p>
          </div>

          {/* Transactions Card */}
          <div className="bg-card rounded-[14px] p-3 border border-border/50 hover:border-border transition-colors">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1.5">Transactions</p>
            <h3 className="text-2xl font-bold text-foreground mb-1">24</h3>
            <p className="text-xs text-muted-foreground">+3 from yesterday</p>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-accent" />
            Low Stock Alerts
          </h3>
          {lowStockProducts.map(product => (
            <div key={product.id} className="bg-accent/10 border-l-3 border-accent rounded-[12px] p-3 flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm text-foreground">{product.name}</p>
                <p className="text-xs text-muted-foreground">Only {product.stock} left</p>
              </div>
              <span className="text-xs font-bold text-accent bg-accent/20 px-2 py-1 rounded">Restock</span>
            </div>
          ))}
        </div>

        {/* Top Sellers */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-foreground">Top Sellers Today</h3>
          {topSellers.map((item, idx) => (
            <div key={idx} className="bg-secondary/30 rounded-[12px] p-3 border border-border/30">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-sm text-foreground">{item.name}</p>
                <span className="text-xs font-bold text-primary">#{idx + 1}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{item.sales} sold</span>
                <span className="text-success font-semibold">₱{item.revenue.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-foreground">Recent Activity</h3>
          <div className="space-y-1">
            {recentActivity.map((activity, idx) => (
              <div key={idx} className="flex items-start gap-3 p-2 rounded-lg hover:bg-secondary/30 transition-colors">
                <div className={`w-2 h-2 rounded-full mt-2 ${activity.type === 'sale' ? 'bg-primary' : 'bg-warning'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground font-medium">{activity.description}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
                {activity.amount && (
                  <span className="text-sm font-bold text-primary">₱{activity.amount.toLocaleString()}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
