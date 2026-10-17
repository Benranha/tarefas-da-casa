import { redirect } from 'next/navigation'
import { getFamily } from '@/lib/auth/server'
import { onboardingStatus } from '@/lib/onboarding'
import OnboardingFlow from './OnboardingFlow'

export const dynamic = 'force-dynamic'

export default async function OnboardingPage() {
  const family = await getFamily()
  if (!family) redirect('/login')
  const status = await onboardingStatus(family.ownerId)
  if (status.done) redirect('/pais')

  return <OnboardingFlow userName={family.userName} child={status.child} />
}
