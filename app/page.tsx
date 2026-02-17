'use client'

import { ArrowRight, TrendingUp, Zap, BarChart3, Lock } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/10 to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/30 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold">
              VT
            </div>
            <span className="font-bold text-lg text-foreground">VapeTrack PH</span>
          </div>
          <button
            onClick={() => window.location.href = '/login'}
            className="px-5 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            Start Tracking
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 py-16 md:py-24">
        <div className="text-center space-y-6 mb-12">
          <div className="inline-block px-4 py-2 bg-primary/15 border border-primary/30 rounded-full">
            <span className="text-sm font-semibold text-primary">Fast. Profitable. Real-time.</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground text-balance leading-tight">
            Cloud-Based Control for Your Vape Business
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
            Manage sales, track profit margins, monitor inventory—all in seconds. Built for retail speed.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <button
              onClick={() => window.location.href = '/login'}
              className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-all hover:shadow-lg flex items-center gap-2"
            >
              Try It Free <ArrowRight className="w-5 h-5" />
            </button>
            <button className="px-8 py-3 border border-border text-foreground rounded-lg font-semibold hover:bg-secondary transition-colors">
              See Demo
            </button>
          </div>
        </div>

        {/* Hero Image Placeholder */}
        <div className="relative bg-secondary/50 border border-border/50 rounded-2xl p-8 backdrop-blur-sm aspect-video flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
          <div className="relative space-y-4 text-center">
            <Zap className="w-12 h-12 text-primary mx-auto" />
            <p className="text-muted-foreground">Live POS System Preview</p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-foreground text-center mb-4">Designed for Speed</h2>
        <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
          Complete retail management without the complexity. Every second counts in retail—we built VapeTrack with speed as the foundation.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: Zap,
              title: 'Sub-Second Checkout',
              description: 'Process sales in 30 seconds or less with one-hand operation'
            },
            {
              icon: TrendingUp,
              title: 'Live Profit Tracking',
              description: 'See margins, costs, and revenue in real-time on every screen'
            },
            {
              icon: BarChart3,
              title: 'Smart Inventory',
              description: 'Track stock levels, low alerts, and top performers instantly'
            },
            {
              icon: Lock,
              title: 'Secure & Reliable',
              description: 'Offline mode keeps you running. Cloud sync when connected.'
            }
          ].map((feature, idx) => {
            const Icon = feature.icon
            return (
              <div key={idx} className="p-6 bg-card/50 border border-border/50 rounded-xl hover:border-primary/30 transition-colors">
                <Icon className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Key Benefits */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-foreground text-center mb-12">What You Get</h2>
        <div className="space-y-8">
          {[
            {
              number: '1',
              title: 'Fastest Checkout in Retail',
              description: 'One-hand operation optimized for Android devices. Add variants, select quantity, confirm—done. No wasted motion.'
            },
            {
              number: '2',
              title: 'Instant Profit Visibility',
              description: 'Every product shows cost, price, and margin. Know your profitability on every sale at a glance.'
            },
            {
              number: '3',
              title: 'Real-Time Inventory',
              description: 'Stock levels update instantly. Get alerts for low stock. Track best sellers. Prevent overselling.'
            },
            {
              number: '4',
              title: 'Daily Insights',
              description: 'Revenue, profit, top products—see it all in your owner dashboard. Make decisions on live data.'
            }
          ].map((benefit, idx) => (
            <div key={idx} className="flex gap-6 items-start">
              <div className="w-12 h-12 bg-primary/15 rounded-lg flex-shrink-0 flex items-center justify-center">
                <span className="font-bold text-primary">{benefit.number}</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-6xl mx-auto px-4 py-16 grid md:grid-cols-3 gap-8">
        {[
          { stat: '<30s', label: 'Average Checkout Time' },
          { stat: '100%', label: 'Profit Visibility' },
          { stat: '5', label: 'Screens + Features' }
        ].map((item, idx) => (
          <div key={idx} className="text-center">
            <p className="text-4xl font-bold text-primary mb-2">{item.stat}</p>
            <p className="text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </section>

      {/* Screenshots/Features Showcase */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-foreground text-center mb-4">Complete Shop Management</h2>
        <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
          From point-of-sale to inventory and reporting, manage your entire shop from one app.
        </p>
        <div className="grid md:grid-cols-2 gap-6">
          {[
            { title: 'POS Screen', desc: 'Lightning-fast checkout with live cart and payment options' },
            { title: 'Dashboard', desc: 'Real-time revenue, profit, and performance metrics' },
            { title: 'Inventory', desc: 'Track stock, costs, and profit margins for every product' },
            { title: 'Reports', desc: 'Weekly revenue charts and sales performance analysis' }
          ].map((screen, idx) => (
            <div key={idx} className="p-8 bg-secondary/30 border border-border/50 rounded-xl">
              <div className="w-12 h-12 bg-primary/15 rounded-lg mb-4 flex items-center justify-center">
                <div className="w-6 h-6 bg-primary rounded" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{screen.title}</h3>
              <p className="text-muted-foreground text-sm">{screen.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30 rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">Ready to Speed Up Your Shop?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Get faster checkouts, better profit visibility, and smarter inventory management today.
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            className="px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-all hover:shadow-lg inline-flex items-center gap-2 text-lg"
          >
            Start Using VapeTrack <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-sm text-muted-foreground mt-6">No credit card required. Try free for 30 days.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 bg-secondary/20 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <p className="font-semibold text-foreground mb-4">VapeTrack PH</p>
              <p className="text-sm text-muted-foreground">Fast POS for Filipino vape shops</p>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-4">Product</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition">Features</a></li>
                <li><a href="#" className="hover:text-foreground transition">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground transition">FAQ</a></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-4">Support</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition">Docs</a></li>
                <li><a href="#" className="hover:text-foreground transition">Help Center</a></li>
                <li><a href="#" className="hover:text-foreground transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-4">Legal</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground transition">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/30 pt-8">
            <p className="text-center text-sm text-muted-foreground">
              © 2026 VapeTrack PH. Designed for Filipino retailers.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
