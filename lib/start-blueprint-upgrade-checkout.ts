import { startBlueprintCheckout } from '@/lib/start-blueprint-checkout'
import type { BlueprintCheckoutContext } from '@/lib/saved-plans'

export async function startBlueprintUpgradeCheckout(
  location = 'monitor_tab',
  checkoutContext?: BlueprintCheckoutContext,
): Promise<void> {
  await startBlueprintCheckout({
    checkoutType: 'blueprint_upgrade',
    location,
    checkoutContext,
  })
}
