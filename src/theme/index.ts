export const colors = {
  bg: '#F6F5F2',
  paper: '#FFFFFF',
  ink: '#111111',
  inkSoft: '#3A3A3C',
  muted: '#8E8E93',
  line: '#EFEFEA',
  purple: '#7B61FF',
  purpleSoft: '#EFE8FF',
  green: '#1F9D55',
  greenSoft: '#E7F6EC',
  mint: '#DFF3E8',
  lavender: '#EDE7FB',
  pink: '#F8DDE6',
  pinkSoft: '#FDE8EE',
  blueSoft: '#E7F1FB',
  orange: '#F4A261',
  orangeSoft: '#FBE7D4',
  clay: '#D9A066',
  red: '#E85D4C',
  yellow: '#E7C15A',
  white: '#FFFFFF',
  overlay: 'rgba(17, 17, 17, 0.45)',
  tabInactive: '#A1A1A8',
  linen: '#F6F5F2',
  linenDeep: '#E8E6E1',
  terracotta: '#7B61FF',
  terracottaDark: '#5B45D6',
  terracottaSoft: '#EFE8FF',
  moss: '#1F9D55',
  mossSoft: '#E7F6EC',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
} as const;

export const radius = {
  sm: 12,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
} as const;

export const type = {
  display: {
    fontSize: 32,
    lineHeight: 38,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.7,
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Inter_600SemiBold',
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Inter_400Regular',
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'Inter_500Medium',
  },
  button: {
    fontSize: 16,
    lineHeight: 20,
    fontFamily: 'Inter_600SemiBold',
  },
} as const;
