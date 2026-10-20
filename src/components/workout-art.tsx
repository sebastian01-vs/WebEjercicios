export function WorkoutArt() {
  return (
    <div className="workout-art" aria-hidden="true">
      <div className="art-orbit orbit-one" />
      <div className="art-orbit orbit-two" />
      <span className="art-cross cross-one">+</span>
      <span className="art-cross cross-two">+</span>
      <div className="art-label">PROGRESS IS A PROCESS</div>
      <svg viewBox="0 0 420 230" fill="none">
        <defs>
          <linearGradient
            id="metal"
            x1="120"
            y1="30"
            x2="300"
            y2="220"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#636b65" />
            <stop offset=".45" stopColor="#b0b9a6" />
            <stop offset="1" stopColor="#3d453a" />
          </linearGradient>
          <linearGradient
            id="plate"
            x1="150"
            y1="10"
            x2="230"
            y2="200"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#cafa5c" />
            <stop offset="1" stopColor="#517d13" />
          </linearGradient>
          <filter id="shadow">
            <feDropShadow dx="2" dy="14" stdDeviation="12" floodColor="#000" floodOpacity=".5" />
          </filter>
        </defs>
        <g transform="rotate(-27 210 115)" filter="url(#shadow)">
          <rect x="74" y="101" width="270" height="28" rx="9" fill="url(#metal)" />
          <path
            d="M166 103v24m7-24v24m7-24v24m7-24v24m7-24v24m7-24v24m7-24v24m7-24v24m7-24v24m7-24v24m7-24v24m7-24v24m7-24v24"
            stroke="#384432"
            strokeWidth="2"
          />
          <rect x="108" y="55" width="30" height="120" rx="8" fill="#24351c" stroke="#8bbd3b" />
          <rect x="127" y="33" width="39" height="164" rx="9" fill="url(#plate)" stroke="#d6fa94" />
          <rect x="132" y="42" width="8" height="145" rx="3" fill="#d9fc9e" fillOpacity=".4" />
          <rect x="269" y="55" width="30" height="120" rx="8" fill="#24351c" stroke="#8bbd3b" />
          <rect x="247" y="33" width="39" height="164" rx="9" fill="url(#plate)" stroke="#d6fa94" />
          <rect x="252" y="42" width="8" height="145" rx="3" fill="#d9fc9e" fillOpacity=".4" />
          <rect x="78" y="96" width="12" height="38" rx="4" fill="#adb5a5" />
          <rect x="326" y="96" width="12" height="38" rx="4" fill="#adb5a5" />
        </g>
      </svg>
      <div className="art-tag">
        <span />
        ENFOQUE. FUERZA. CONSTANCIA.
      </div>
    </div>
  );
}
