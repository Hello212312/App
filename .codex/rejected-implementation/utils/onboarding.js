export const ONBOARDING_DRAFT_KEY = '@interny_onboarding_draft_v3';
export const INTEREST_OPTIONS = ['Computer Science','Medicine','Engineering','Science','Arts','Business','Finance','Aerospace','Law/Advocacy','Environment','Journalism','History','Astronomy','Social Science','Education'];
export function initialProfile(user = {}) {
  return { name:user.name || '',grade:user.grade || '',birthday:user.birthday || '',age:user.age ?? null,interests:user.interests || [],primaryInterest:user.primaryInterest || '',exploring:!!user.exploring,
    location:user.location || '',state:user.state || '',city:user.city || '',locationConfirmed:user.locationConfirmed ?? (!user.school && !!user.location && user.locationSource !== 'school'),locationSource:user.locationSource || (user.school ? 'school':'home'),school:user.school || null,
    formatPreference:user.formatPreference || '',remoteOnly:!!user.remoteOnly,travelWillingness:user.travelWillingness || 'local',maxCommuteMiles:user.maxCommuteMiles || 25,openToHousing:user.openToHousing ?? null,needsHousing:!!user.needsHousing,
    paidRequired:!!user.paidRequired,payPreference:user.payPreference || '',selectivityPreference:user.selectivityPreference || '',availableFrom:user.availableFrom || '',availableUntil:user.availableUntil || '',logisticsAnswered:!!user.logisticsAnswered,priorities:user.priorities || {},gpaRange:user.gpaRange || '',readiness:user.readiness || [],gender:user.gender || '',race:user.race || [],referralSource:user.referralSource || '' };
}
export function mergeOnboardingDraft(user, draft) {return {...initialProfile(user),...(draft?.profile || {})};}
