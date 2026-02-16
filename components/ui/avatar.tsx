"use client"

import React from 'react'

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  className?: string
}

export function Avatar({ children, className = '', ...rest }: AvatarProps) {
  return (
    <div className={"inline-flex items-center justify-center overflow-hidden rounded-full " + className} {...rest}>
      {children}
    </div>
  )
}

export function AvatarFallback({ children, className = '', ...rest }: AvatarProps) {
  return (
    <div className={"flex h-8 w-8 items-center justify-center text-sm font-medium " + className} {...rest}>
      {children}
    </div>
  )
}

export default Avatar
