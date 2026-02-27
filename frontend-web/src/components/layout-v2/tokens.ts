export const shellTokens = {
  appRoot: 'min-h-screen bg-[#F3F6F7] text-[#1E3A4B]',
  sidebar:
    'border-r border-[#D6E2E6] bg-[#ECF3F2] shadow-[inset_-1px_0_0_rgba(214,226,230,0.85),8px_0_26px_-24px_rgba(16,57,74,0.45)]',
  topbar: 'bg-white/95 backdrop-blur-[2px]',
  divider: 'bg-[#DCE6EA]',
  card: 'rounded-[18px] border border-[#DCE7EB] bg-white shadow-[0_16px_30px_-24px_rgba(16,57,74,0.28)]',
  cardSoft:
    'rounded-[18px] border border-[#DEE8EC] bg-[#FCFEFD] shadow-[0_12px_24px_-22px_rgba(16,57,74,0.24)]',
  title: 'text-[26px] font-semibold tracking-[-0.02em] text-[#19384C]',
  subtitle: 'text-[14px] text-[#607B89]',
  textMuted: 'text-[#6C8794]',
  accent: 'text-[#1A9E87]',
  accentSoftBg: 'bg-[#ECF7F3]',
  input:
    'h-10 rounded-lg border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15',
};

export const shellFieldTokens = {
  base: 'h-10 w-full rounded-lg border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15',
  withIcon:
    'h-10 w-full rounded-lg border border-[#D4E2E7] bg-white pl-9 pr-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15',
  withIconCompact:
    'h-10 w-full rounded-lg border border-[#D4E2E7] bg-white pl-10 pr-10 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15',
  readOnlyWithIcon:
    'h-10 w-full rounded-lg border border-[#D4E2E7] bg-[#F8FBFC] pl-9 pr-3 text-sm text-[#4F6D7B] outline-none',
  textarea:
    'w-full rounded-lg border border-[#D4E2E7] bg-white px-3 py-2 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15',
  invalid: 'border-red-500 focus:border-red-500 focus:ring-red-100',
};

export const shellSpacing = {
  pageOuterX: 'px-4 sm:px-5 lg:px-6 xl:px-7',
  pageOuterY: 'pt-3 pb-5 sm:pt-4 sm:pb-6',
  pageGap: 'space-y-4',
};

export const shellRadius = {
  card: 'rounded-[18px]',
  interactive: 'rounded-xl',
};

export type ShellTokenMap = typeof shellTokens;
