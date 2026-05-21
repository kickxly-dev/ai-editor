export function CourtIQLogo({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="9" fill="url(#logo-grad)"/>
      <path d="M10 16C10 12.686 12.686 10 16 10C17.66 10 19.16 10.674 20.243 11.757" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M22 16C22 19.314 19.314 22 16 22C14.34 22 12.84 21.326 11.757 20.243" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
      <circle cx="16" cy="16" r="2.5" fill="white" fillOpacity="0.9"/>
      <circle cx="21" cy="11" r="1.5" fill="#FB7185"/>
      <circle cx="11" cy="21" r="1.5" fill="#7DD3FC"/>
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E11D48"/>
          <stop offset="1" stopColor="#7C3AED"/>
        </linearGradient>
      </defs>
    </svg>
  )
}
