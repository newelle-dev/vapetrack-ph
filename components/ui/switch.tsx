"use client"

import React from 'react'

export function Switch({ checked, onCheckedChange, disabled, className = '' }: { checked?: boolean; onCheckedChange?: (v: boolean) => void; disabled?: boolean; className?: string }) {
  return (
    <label className={`inline-flex items-center cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => !disabled && onCheckedChange?.(e.target.checked)}
        className="sr-only"
        disabled={disabled}
      />
      <span className={`w-10 h-6 rounded-full relative transition-colors ${checked ? 'bg-primary' : 'bg-muted'}`}>
        <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : ''}`}></span>
      </span>
    </label>
  )
}

export default Switch
