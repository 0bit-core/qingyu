/**
 * 轻屿的猫狗吉祥物（自绘极简剪影，零外部资源）。
 * 配色与全局色板一致：sage 主体 + paper 挖空细节。
 */

/** 趴着的猫（面包猫，面向左） */
export function CatLoaf({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 72" fill="none" aria-hidden="true" className={className}>
      <path
        d="M100 58 Q116 54 112 40"
        stroke="#4F7A6B"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path d="M20 64 Q20 42 62 42 Q104 42 104 64 Z" fill="#4F7A6B" />
      <circle cx="32" cy="36" r="15" fill="#4F7A6B" />
      <path d="M20 26 L17 13 L30 20 Z" fill="#4F7A6B" />
      <path d="M44 26 L47 13 L34 20 Z" fill="#4F7A6B" />
      <circle cx="26" cy="37" r="1.8" fill="#F6F5F0" />
      <circle cx="37" cy="37" r="1.8" fill="#F6F5F0" />
    </svg>
  );
}

/** 坐着的柴犬（面向左，卷尾） */
export function DogSit({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 110 96" fill="none" aria-hidden="true" className={className}>
      <path
        d="M76 46 Q92 40 88 26 Q85 16 74 18"
        stroke="#4F7A6B"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M34 48 C22 56 16 72 16 88 L82 88 C84 70 74 56 58 50 C50 47 42 46 34 48 Z"
        fill="#4F7A6B"
      />
      <circle cx="36" cy="34" r="17" fill="#4F7A6B" />
      <path d="M23 23 L20 8 L35 15 Z" fill="#4F7A6B" />
      <path d="M49 23 L52 8 L37 15 Z" fill="#4F7A6B" />
      <circle cx="24" cy="40" r="6.5" fill="#E7EFEB" />
      <circle cx="21" cy="39" r="1.8" fill="#33403E" />
      <circle cx="35" cy="30" r="1.8" fill="#F6F5F0" />
    </svg>
  );
}

/** 陪伴猫头像（对话里轻屿的化身） */
export function CatAvatar({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <circle cx="16" cy="16" r="16" fill="#E7EFEB" />
      <path d="M7 10 L5 2 L14 7 Z" fill="#4F7A6B" />
      <path d="M25 10 L27 2 L18 7 Z" fill="#4F7A6B" />
      <circle cx="16" cy="17" r="11" fill="#4F7A6B" />
      <circle cx="12" cy="17" r="1.4" fill="#F6F5F0" />
      <circle cx="20" cy="17" r="1.4" fill="#F6F5F0" />
      <path d="M15 21.5 h2 l-1 1.6 Z" fill="#F6F5F0" />
    </svg>
  );
}
