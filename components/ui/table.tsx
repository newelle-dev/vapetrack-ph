"use client"

import React from 'react'

export function Table({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <table className={`min-w-full ${className}`}>{children}</table>
}

export function TableHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <thead className={`bg-background text-sm text-muted-foreground ${className}`}>{children}</thead>
}

export function TableBody({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <tbody className={className}>{children}</tbody>
}

export function TableRow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <tr className={`border-b ${className}`}>{children}</tr>
}

export function TableHead({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-4 py-2 text-left text-sm font-medium ${className}`}>{children}</th>
}

export function TableCell({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-2 text-sm ${className}`}>{children}</td>
}

export default Table
