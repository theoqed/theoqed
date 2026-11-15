export function checkPremiumAccess(profile: Record<string, any> | null | undefined): boolean {
  if (!profile) return false;
  return Boolean(
    profile.is_premium === true ||
      profile.is_admin === true ||
      profile.role === 'admin' ||
      profile.role === 'premium' ||
      profile.role === 'pro' ||
      profile.tier === 'premium' ||
      profile.tier === 'pro' ||
      profile.plan === 'premium' ||
      profile.plan === 'pro' ||
      profile.subscription_status === 'active'
  );
}