'use client'

import { Settings, LogOut, Bell, Lock, User, HelpCircle } from 'lucide-react'

export default function SettingsScreen() {
  const settingsSections = [
    {
      title: 'Account',
      items: [
        { icon: User, label: 'Profile', description: 'Manage your profile' },
        { icon: Lock, label: 'Security', description: 'Password & 2FA' },
      ]
    },
    {
      title: 'App',
      items: [
        { icon: Bell, label: 'Notifications', description: 'Alert preferences' },
        { icon: Settings, label: 'Preferences', description: 'App settings' },
      ]
    },
    {
      title: 'Support',
      items: [
        { icon: HelpCircle, label: 'Help', description: 'FAQs & support' },
      ]
    }
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-4">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-20 space-y-4">
        {/* Shop Info Card */}
        <div className="bg-card rounded-[14px] p-4 border border-border/50">
          <h3 className="text-sm font-bold text-foreground mb-2">Shop Info</h3>
          <div className="space-y-2 text-sm">
            <p className="text-foreground"><span className="text-muted-foreground">Shop:</span> VapeTrack PH</p>
            <p className="text-foreground"><span className="text-muted-foreground">Owner:</span> Manager</p>
            <p className="text-foreground"><span className="text-muted-foreground">Version:</span> 1.0.0</p>
          </div>
        </div>

        {/* Settings Sections */}
        {settingsSections.map((section, idx) => (
          <div key={idx} className="space-y-2">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide px-1">{section.title}</h3>
            <div className="space-y-1">
              {section.items.map((item, itemIdx) => {
                const IconComponent = item.icon
                return (
                  <button
                    key={itemIdx}
                    className="w-full bg-card rounded-[14px] p-3 border border-border/50 hover:border-border transition-colors flex items-center gap-3 text-left"
                  >
                    <div className="bg-secondary rounded-lg p-2.5">
                      <IconComponent className="w-4 h-4 text-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}

        {/* Logout Button */}
        <button className="w-full bg-accent/10 hover:bg-accent/20 text-accent rounded-[14px] py-3 font-semibold transition-colors flex items-center justify-center gap-2 mt-6 touch-target">
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  )
}
