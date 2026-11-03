export function Seoul() {
  return (
    <svg
      className="seoul"
      viewBox="0 0 1000 330"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="hill"
          x1="500"
          y1="100"
          x2="500"
          y2="330"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#a6c7f6" />
          <stop offset="1" stopColor="#d4e3fa" />
        </linearGradient>
      </defs>
      <circle cx="810" cy="75" r="37" fill="#f4dda9" opacity=".85" />
      <path
        d="M0 260C90 223 170 266 250 231S370 230 420 207C500 180 537 127 587 159S669 211 731 227C820 251 897 220 1000 255V330H0Z"
        fill="url(#hill)"
      />
      <g fill="#91b3e6">
        <path d="M18 330V218H62V330M76 330V251H112V330M121 330V190H158V330M168 330V239H211V330M221 330V210H264V330M277 330V250H309V330M321 330V219H353V330M366 330V246H408V330M770 330V228H803V330M817 330V181L832 129L846 181V330M863 330V225H902V330M917 330V196H960V330M972 330V250H1000V330" />
        <path d="M559 176L562 93H569L572 176Z" />
        <path d="M551 83H580L577 98H554Z" />
        <path d="M556 76H575V83H556Z" />
        <path d="M564 32H567V76H564Z" />
      </g>
      <g stroke="#dce9fc" strokeWidth="3" opacity=".75">
        <path d="M32 233H48M32 248H48M32 263H48M132 206H146M132 223H146M132 240H146M234 226H252M234 244H252M878 242H889M878 259H889M931 211H947M931 229H947M931 247H947" />
      </g>
      <g fill="#6e96cf">
        <path d="M433 330V266H503V330M422 265L468 245L514 265Z" />
        <path d="M612 330V248H680V330M601 247L646 226L691 247Z" />
        <path d="M696 330V280H740V330" />
      </g>
      <path
        d="M0 316C220 294 341 329 500 314S800 300 1000 317V330H0Z"
        fill="#c4d8f5"
      />
      <path d="M58 324H301M758 324H899" stroke="#eaf1fc" strokeWidth="2" />
    </svg>
  );
}
