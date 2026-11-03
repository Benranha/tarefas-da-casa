'use client'

import { useState, type ComponentProps } from 'react'

// Aplica a máscara (92) 99999-9999 / (92) 9999-9999 enquanto a pessoa digita.
export function maskPhone(raw: string): string {
  let d = raw.replace(/\D/g, '')
  if (d.length > 11 && d.startsWith('55')) d = d.slice(2)
  d = d.slice(0, 11)
  if (d.length === 0) return ''
  if (d.length <= 2) return `(${d}`
  const ddd = d.slice(0, 2)
  const rest = d.slice(2)
  if (d.length <= 6) return `(${ddd}) ${rest}`
  const cut = d.length > 10 ? 5 : 4
  return `(${ddd}) ${rest.slice(0, cut)}-${rest.slice(cut)}`
}

export default function PhoneInput(
  props: Omit<ComponentProps<'input'>, 'value' | 'onChange' | 'type' | 'inputMode'>,
) {
  const [value, setValue] = useState('')
  return (
    <input
      {...props}
      type="tel"
      inputMode="tel"
      autoComplete="tel"
      maxLength={15}
      value={value}
      onChange={(e) => setValue(maskPhone(e.target.value))}
    />
  )
}
