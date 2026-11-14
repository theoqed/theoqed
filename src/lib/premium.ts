export interface PremiumStatusInput {
  is_premium?: boolean | null;
  premium_until?: string | null;
}

export type MembershipState = 'free' | 'active' | 'expired';

export function getMembershipState(profile?: PremiumStatusInput | null): MembershipState {
  if (!profile?.is_premium) return 'free';
  if (!profile.premium_until) return 'active'; // Lifetime / tanpa batas waktu

  const expiry = new Date(profile.premium_until).getTime();
  return expiry > Date.now() ? 'active' : 'expired';
}

export function isPremiumActive(profile?: PremiumStatusInput | null): boolean {
  return getMembershipState(profile) === 'active';
}

export function getRemainingDays(premiumUntil?: string | null): number | null {
  if (!premiumUntil) return null;
  const diff = new Date(premiumUntil).getTime() - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function formatIndonesianDate(dateStr?: string | null): string {
  if (!dateStr) return 'Selamanya (Lifetime)';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}