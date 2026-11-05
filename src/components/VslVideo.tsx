// Vídeo de apresentação do Tarefinha (VSL, ~1min47, com locução e legenda já no vídeo).
// preload="none": o arquivo só baixa quando a pessoa toca no play, para não pesar a página.
export default function VslVideo({ className = '' }: { className?: string }) {
  return (
    <div className={`overflow-hidden rounded-[24px] md:rounded-[32px] bg-ink p-2 md:p-3 shadow-[0_6px_0_rgba(58,42,34,.14),0_24px_48px_rgba(58,42,34,.25)] ${className}`}>
      <video
        className="block w-full aspect-video rounded-[18px] md:rounded-[24px] bg-ink"
        src="/video/tarefinha-vsl.mp4"
        poster="/video/tarefinha-vsl-capa.jpg"
        controls
        playsInline
        preload="none"
        aria-label="Vídeo: conheça o Tarefinha em menos de 2 minutos"
      />
    </div>
  )
}
