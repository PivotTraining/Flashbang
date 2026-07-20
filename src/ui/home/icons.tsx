// Inline SVG icon set — original glyphs, no external assets or franchise marks.

type IconProps = { size?: number; color?: string };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
});

export const PowersIcon = ({ size = 22, color = "#a855f7" }: IconProps) => (
  <svg {...base(size)}>
    <path
      d="M13 2 4.5 13.2h5.2L11 22l8.5-11.2h-5.2L13 2Z"
      fill={color}
      opacity={0.92}
    />
  </svg>
);

export const BallIcon = ({ size = 22, color = "#fb923c" }: IconProps) => (
  <svg {...base(size)}>
    <circle cx="12" cy="12" r="7.5" fill={color} opacity={0.9} />
    <circle cx="9.6" cy="9.6" r="2.3" fill="#fff" opacity={0.45} />
  </svg>
);

export const DragonIcon = ({ size = 22, color = "#22d3ee" }: IconProps) => (
  <svg {...base(size)}>
    <path
      d="M3 12c3-1 5-4 9-4 3.3 0 5.4 1.6 6.6 3.1L21 9.4l-.7 3.2 1.7 1.6-3.4.3c-1.2 2-3.4 3.5-6.6 3.5-4 0-6-3-9-4l2.6-1L3 12Z"
      fill={color}
      opacity={0.9}
    />
    <circle cx="16.4" cy="11.2" r="0.9" fill="#04121a" />
  </svg>
);

export const LoadoutIcon = ({ size = 22, color = "#facc15" }: IconProps) => (
  <svg {...base(size)}>
    <path
      d="M12 2.6 4.8 5.4v6.1c0 4.4 3 8.1 7.2 9.9 4.2-1.8 7.2-5.5 7.2-9.9V5.4L12 2.6Z"
      fill={color}
      opacity={0.9}
    />
    <path d="M12 7.4 9.4 12h5.2L12 16.6" stroke="#1a1200" strokeWidth="1.5" />
  </svg>
);

export const TrophyIcon = ({ size = 22, color = "#c084fc" }: IconProps) => (
  <svg {...base(size)}>
    <path
      d="M7 4h10v4.2a5 5 0 0 1-10 0V4Z"
      fill={color}
      opacity={0.9}
    />
    <path d="M17 5h3v2.2a3 3 0 0 1-3 3M7 5H4v2.2a3 3 0 0 0 3 3" stroke={color} strokeWidth="1.5" />
    <path d="M12 13.4V17M8.6 20.4h6.8" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const MissionsIcon = ({ size = 22, color = "#4ade80" }: IconProps) => (
  <svg {...base(size)}>
    <rect x="5" y="3.4" width="14" height="17.2" rx="2.4" fill={color} opacity={0.9} />
    <path
      d="m8.6 9.6 1.8 1.8 3.6-3.6M8.6 15.2l1.8 1.8 3.6-3.6"
      stroke="#04240f"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const LeaderboardIcon = ({ size = 22, color = "#38bdf8" }: IconProps) => (
  <svg {...base(size)}>
    <rect x="3.6" y="12" width="4.6" height="8.4" rx="1" fill={color} opacity={0.75} />
    <rect x="9.7" y="6.4" width="4.6" height="14" rx="1" fill={color} />
    <rect x="15.8" y="9.4" width="4.6" height="11" rx="1" fill={color} opacity={0.75} />
  </svg>
);

export const CoinIcon = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <circle cx="12" cy="12" r="9" fill="#f5b942" />
    <circle cx="12" cy="12" r="6.2" fill="#d99a1f" />
    <path d="M12 7.8v8.4M9.6 9.9h4.2a1.7 1.7 0 0 1 0 3.4h-3.4" stroke="#fde9b8" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const GemIcon = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M12 3 21 9.6 12 21 3 9.6 12 3Z" fill="#a855f7" />
    <path d="M12 3 21 9.6H3L12 3Z" fill="#c084fc" />
    <path d="M12 21V9.6" stroke="#5b21b6" strokeWidth="1.2" opacity={0.6} />
  </svg>
);

export const ShardIcon = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M12 2.4 15.4 12 12 21.6 8.6 12 12 2.4Z" fill="#38bdf8" />
    <path d="M12 2.4 15.4 12H12V2.4Z" fill="#7dd3fc" />
  </svg>
);

export const MailIcon = ({ size = 20, color = "#cdc3e6" }: IconProps) => (
  <svg {...base(size)}>
    <rect x="3" y="5.4" width="18" height="13.2" rx="2.2" stroke={color} strokeWidth="1.7" />
    <path d="m4 7 8 5.6L20 7" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

export const FriendsIcon = ({ size = 20, color = "#cdc3e6" }: IconProps) => (
  <svg {...base(size)}>
    <circle cx="9.2" cy="8.4" r="3.4" stroke={color} strokeWidth="1.7" />
    <path d="M3.4 19.4c0-3.2 2.6-5.4 5.8-5.4s5.8 2.2 5.8 5.4" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
    <path d="M16 5.4a3.4 3.4 0 0 1 0 6.6M17.4 14.4c2.1.6 3.4 2.4 3.4 5" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

export const CrownIcon = ({ size = 16, color = "#f5b942" }: IconProps) => (
  <svg {...base(size)}>
    <path d="M3 7.6 6.4 12 12 5.2 17.6 12 21 7.6v10.2H3V7.6Z" fill={color} />
  </svg>
);

export const ChevronIcon = ({ size = 18, color = "#cdc3e6" }: IconProps) => (
  <svg {...base(size)}>
    <path d="m9.4 5.6 6.4 6.4-6.4 6.4" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
