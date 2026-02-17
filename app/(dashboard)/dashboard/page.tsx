import { TrendingUp, AlertCircle, ShoppingCart, Building2 } from 'lucide-react'
import { PageContainer } from '@/components/layouts/page-container'
import { MetricsCard } from '@/components/dashboard/metrics-card'
import { StatCard } from '@/components/dashboard/stat-card'

export default function Dashboard() {
  // Sample data
  const userName = 'Juan' // TODO: Replace with actual user data
  const currentBranch = 'Manila (Main)' // TODO: Replace with actual branch data

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

  // Get time-based greeting
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <PageContainer>
      {/* Personalized Greeting */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xl text-foreground font-bold tracking-tight">
            {greeting}, {userName}!
          </p>
          <button className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 bg-secondary/50 px-2 py-1 rounded-md border border-border/50">
            <Building2 className="w-3.5 h-3.5" />
            <span>{currentBranch}</span>
            <span className="text-[10px] opacity-70">▼</span>
          </button>
        </div>
      </div>

      {/* Hero Card - Today's Revenue */}
      <MetricsCard
        title="Today's Revenue"
        value={todayRevenue}
        icon={ShoppingCart}
        trend={{
          value: parseFloat(revenueGrowth),
          label: 'growth',
        }}
        subValue={{
          label: 'Profit',
          value: `₱${todayProfit.toLocaleString()}`,
        }}
      />

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Profit Card */}
        <StatCard
          title="Today's Profit"
          value={todayProfit}
          subtext={`${profitMargin}% margin`}
          valueColor="text-success"
        />

        {/* Transactions Card */}
        <StatCard
          title="Transactions"
          value={24}
          subtext="+3 from yesterday"
        />
      </div>

      {/* Low Stock Alerts */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-accent" />
          Low Stock Alerts
        </h3>
        {lowStockProducts.map(product => (
          <div key={product.id} className="bg-accent/10 border-l-4 border-accent rounded-xl p-3 flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm text-foreground">{product.name}</p>
              <p className="text-xs text-muted-foreground">Only {product.stock} left</p>
            </div>
            <button className="text-xs font-bold text-accent bg-accent/20 px-3 py-1.5 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center">
              Restock
            </button>
          </div>
        ))}
      </div>

      {/* Top Sellers */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Top Sellers Today
          </h3>
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Weekly Rank</span>
        </div>
        {topSellers.map((item, idx) => (
          <div key={idx} className="bg-secondary/30 rounded-xl p-3 border border-border/30">
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
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-primary" />
          Recent Activity
        </h3>
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
    </PageContainer>
  )
}
