

## Analysis: Bundle Pricing Discrepancy

**The problem:** The landing page shows $19.99/mo for the Bundle, but Stripe is configured at $14.99/mo. Users would see $19.99, click checkout, and get charged $14.99 -- inconsistent.

**My recommendation:** Keep Bundle at $14.99/mo (matching Stripe) and position it as **"2 apps for the price of 1"**. The value proposition is clear:

```text
Buying separately:        Bundle price:
  Pro      = $14.99/mo      $14.99/mo  (same as Pro alone!)
+ Premium = $ 6.99/mo      
= Total   = $21.98/mo      Savings: $6.99/mo = 32% off

Annual separately:         Bundle annual:
  Pro      = $143.88/yr      $119.90/yr ($9.99/mo)
+ Premium = $ 67.08/yr      
= Total   = $210.96/yr      Savings: $91.06/yr = 43% off
```

## Changes

### 1. Fix Bundle pricing in `Landing.tsx`
- Change `monthlyPrice` from `19.99` to `14.99` (match Stripe reality)
- Update `getPrice()` to show a "vs separate" savings callout for Bundle
- Add strikethrough of $21.98 next to $14.99 for visual impact

### 2. Fix Quick Pricing Bar
- Monthly: show `$14.99` (not `$19.99`)
- Annual: show `$9.99` (not `$14.99`)
- Add small savings text like "Save $7/mo" or "2x1"

### 3. Visual fixes for badge overlap
- Increase card top padding and adjust badge `top` position so "Mejor Valor" / "Best Value" never overlaps with "Evo Bundle" title
- Ensure consistent spacing across all 4 cards

### 4. Update `useSubscription.ts` and `SubscriptionManager.tsx`
- Verify `bundle_monthly` pricing constant matches Stripe ($14.99) -- already correct
- No Stripe changes needed (prices are already $14.99/mo and $119.90/yr)

