import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format price in centavos to Philippine Peso currency string
 * @param centavos - Price in centavos (e.g., 15050 = ₱150.50)
 * @returns Formatted currency string (e.g., "₱150.50")
 */
export function formatCurrency(centavos: number | null | undefined): string {
  if (centavos === null || centavos === undefined) return "₱0.00";
  const pesos = centavos / 100;
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(pesos);
}
