"use client"

import React from 'react'

export function Table({ children, className = '', ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return <table className={`min-w-full ${className}`} {...props}>{children}</table>
}

export function TableHeader({ children, className = '', ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={`bg-background text-sm text-muted-foreground ${className}`} {...props}>{children}</thead>
}

export function TableBody({ children, className = '', ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={className} {...props}>{children}</tbody>
}

export function TableRow({ children, className = '', ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={`border-b ${className}`} {...props}>{children}</tr>
}

export function TableHead({ children, className = '', ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={`px-4 py-2 text-left text-sm font-medium ${className}`} {...props}>{children}</th>
}

export function TableCell({ children, className = '', ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={`px-4 py-2 text-sm ${className}`} {...props}>{children}</td>
}

export default Table
