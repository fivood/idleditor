export function Icon({ src, className = 'w-5 h-5', alt = '' }: { src: string; className?: string; alt?: string }) {
  return <img src={src} className={className} alt={alt} />
}
