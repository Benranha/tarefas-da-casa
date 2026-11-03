import { TfLoading } from '@/components/TfLoader'

// Aparece enquanto uma página do painel dos pais carrega.
export default function Loading() {
  return <TfLoading className="py-24" text="Arrumando a casa…" />
}
