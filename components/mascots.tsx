/**
 * 轻屿的猫狗吉祥物（chibi 风格：大头、圆角、腮红，零外部资源）。
 * 配色与全局色板一致；尖角用同色描边圆角化。
 */

/** 趴着的猫（面包猫，面向左） */
export function CatLoaf({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 72" fill="none" aria-hidden="true" className={className}>
      {/* 尾巴 */}
      <path
        d="M98 56 Q114 52 110 38"
        stroke="#4F7A6B"
        strokeWidth="9"
        strokeLinecap="round"
      />
      {/* 身体 */}
      <path
        d="M16 66 Q14 44 60 44 Q106 44 104 66 Z"
        fill="#4F7A6B"
        stroke="#4F7A6B"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* 头 */}
      <circle cx="34" cy="38" r="17" fill="#4F7A6B" />
      {/* 耳（圆角三角） */}
      <path
        d="M22 26 L18 12 L32 19 Z"
        fill="#4F7A6B"
        stroke="#4F7A6B"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M46 26 L50 12 L36 19 Z"
        fill="#4F7A6B"
        stroke="#4F7A6B"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M22.5 22.5 L21 16 L27 19.5 Z" fill="#F3C8B8" />
      <path d="M45.5 22.5 L47 16 L41 19.5 Z" fill="#F3C8B8" />
      {/* 眼 */}
      <ellipse cx="27" cy="40" rx="2" ry="2.6" fill="#33403E" />
      <ellipse cx="39" cy="40" rx="2" ry="2.6" fill="#33403E" />
      {/* 腮红 */}
      <circle cx="21" cy="44.5" r="2.6" fill="#F3C8B8" opacity="0.85" />
      <circle cx="44" cy="44.5" r="2.6" fill="#F3C8B8" opacity="0.85" />
      {/* 猫嘴 w */}
      <path
        d="M30.5 45.5 q1.5 1.5 3 0 q1.5 1.5 3 0"
        stroke="#F6F5F0"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** 坐着的小狗（垂耳 + 吐舌 + 柴犬眉点，面向左） */
export function DogSit({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 110 96" fill="none" aria-hidden="true" className={className}>
      {/* 卷尾 */}
      <path
        d="M74 44 Q92 40 86 24"
        stroke="#4F7A6B"
        strokeWidth="9"
        strokeLinecap="round"
      />
      {/* 身体 */}
      <path
        d="M32 50 C20 58 15 74 15 88 L84 88 C86 70 76 56 60 50 C52 47 42 48 32 50 Z"
        fill="#4F7A6B"
        stroke="#4F7A6B"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* 头 */}
      <circle cx="37" cy="36" r="18" fill="#4F7A6B" />
      {/* 垂耳（深一档） */}
      <ellipse cx="20" cy="31" rx="8" ry="13" fill="#3F6558" transform="rotate(14 20 31)" />
      <ellipse cx="54" cy="31" rx="8" ry="13" fill="#3F6558" transform="rotate(-14 54 31)" />
      {/* 吻部 */}
      <circle cx="28" cy="45" r="9" fill="#E7EFEB" />
      {/* 鼻 */}
      <ellipse cx="24.5" cy="42" rx="2.4" ry="2" fill="#33403E" />
      {/* 吐舌 */}
      <ellipse cx="28" cy="51" rx="2.4" ry="3.2" fill="#E88980" />
      {/* 柴犬眉点 */}
      <circle cx="33" cy="25" r="1.8" fill="#E7EFEB" opacity="0.9" />
      <circle cx="45" cy="25" r="1.8" fill="#E7EFEB" opacity="0.9" />
      {/* 眼 */}
      <ellipse cx="33" cy="32" rx="2" ry="2.6" fill="#33403E" />
      <ellipse cx="46" cy="32" rx="2" ry="2.6" fill="#33403E" />
      {/* 腮红 */}
      <circle cx="45" cy="41" r="2.8" fill="#F3C8B8" opacity="0.85" />
    </svg>
  );
}

/** 陪伴猫头像（对话里轻屿的化身） */
export function CatAvatar({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <circle cx="16" cy="16" r="16" fill="#E7EFEB" />
      {/* 耳（圆角三角 + 内耳） */}
      <path
        d="M7 12 L5 4 L13 7 Z"
        fill="#4F7A6B"
        stroke="#4F7A6B"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M25 12 L27 4 L19 7 Z"
        fill="#4F7A6B"
        stroke="#4F7A6B"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M8.5 9.5 L8 7 L11 8.5 Z" fill="#F3C8B8" />
      <path d="M23.5 9.5 L24 7 L21 8.5 Z" fill="#F3C8B8" />
      {/* 头 */}
      <circle cx="16" cy="18" r="11.5" fill="#4F7A6B" />
      {/* 眼 */}
      <ellipse cx="11.5" cy="17.5" rx="2" ry="2.6" fill="#33403E" />
      <ellipse cx="20.5" cy="17.5" rx="2" ry="2.6" fill="#33403E" />
      <circle cx="12.2" cy="16.7" r="0.6" fill="#F6F5F0" />
      <circle cx="21.2" cy="16.7" r="0.6" fill="#F6F5F0" />
      {/* 腮红 */}
      <circle cx="7.5" cy="22" r="2.4" fill="#F3C8B8" opacity="0.9" />
      <circle cx="24.5" cy="22" r="2.4" fill="#F3C8B8" opacity="0.9" />
      {/* 鼻 + 猫嘴 w */}
      <path d="M15 20.4 h2 l-1 1.2 Z" fill="#F3C8B8" />
      <path
        d="M13.7 22.6 q1.15 1.2 2.3 0 q1.15 1.2 2.3 0"
        stroke="#F6F5F0"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
