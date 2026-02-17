'use client'

import { BarChart3, Calendar } from 'lucide-react'

export default function ReportsScreen() {
  const weeklyData = [
    { day: 'Mon', revenue: 12500 },
    { day: 'Tue', revenue: 14200 },
    { day: 'Wed', revenue: 11800 },
    { day: 'Thu', revenue: 16300 },
    { day: 'Fri', revenue: 18900 },
    { day: 'Sat', revenue: 21500 },
    { day: 'Sun', revenue: 19800 },
  ]

  const maxRevenue = Math.max(...weeklyData.map(d => d.revenue))

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-4">
        <h1 className="text-2xl font-bold text-foreground">Reports</h1>
        <p className="text-xs text-muted-foreground mt-1">Weekly performance analytics</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-20 space-y-4">
        {/* This Week Summary */}
        <div className="bg-linear-to-br from-primary/20 to-primary/5 rounded-2xl p-4 border border-primary/20">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">This Week Total</p>
              <h2 className="text-3xl font-bold text-primary mt-1">₱{weeklyData.reduce((sum, d) => sum + d.revenue, 0).toLocaleString()}</h2>
            </div>
            <div className="bg-primary/20 p-2.5 rounded-lg">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Average: ₱{Math.round(weeklyData.reduce((sum, d) => sum + d.revenue, 0) / 7).toLocaleString()} per day</p>
        </div>

        {/* Weekly Chart */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-foreground">Daily Revenue</h3>
          <div className="bg-card rounded-xl p-4 border border-border/50 space-y-3">
            {weeklyData.map(item => {
              const barWidth = (item.revenue / maxRevenue) * 100
              return (
                <div key={item.day} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground w-10">{item.day}</span>
                    <span className="text-xs font-bold text-primary">₱{item.revenue.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-primary to-primary/60 rounded-full transition-all"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-xl p-3 border border-border/50">
            <p className="text-xs text-muted-foreground font-medium mb-1.5">Best Day</p>
            <p className="text-xl font-bold text-success">Saturday</p>
            <p className="text-xs text-muted-foreground">₱21,500</p>
          </div>

          <div className="bg-card rounded-xl p-3 border border-border/50">
            <p className="text-xs text-muted-foreground font-medium mb-1.5">Lowest Day</p>
            <p className="text-xl font-bold text-warning">Wednesday</p>
            <p className="text-xs text-muted-foreground">₱11,800</p>
          </div>
        </div>

        {/* Period Selector */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            View Period
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {['Week', 'Month', 'Year'].map(period => (
              <button
                key={period}
                className="py-2.5 px-3 rounded-xl border-2 border-border/60 bg-secondary/40 text-foreground font-semibold text-xs hover:border-border/80 transition-colors"
              >
                {period}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
