

## Analysis: Disclaimer vs Full Redesign

The user raises a valid concern. Refactoring 15 animation files to match the real app UI is high-risk:
- Any future app redesign means updating 15 demo files again
- Animations could break or look worse if forced into real component styles
- The current demos are already polished and engaging

**Recommendation: Add a subtle disclaimer + keep current demos.**

This is the industry standard approach. Apps like Notion, Linear, and Stripe use stylized/illustrative demos on their landing pages. The key is transparency.

## Plan

### Single change in `FeatureDemosCarousel.tsx`

Add a small, elegant disclaimer text below the carousel dots (near the existing mobile swipe hint area). Something like:

- Spanish: "Simulación ilustrativa · La interfaz real puede variar"
- English: "Illustrative demo · Actual interface may vary"

Styled as `text-[10px] text-slate-400` -- subtle, non-intrusive, but legally and ethically clear.

### Files to modify
- `src/components/landing/FeatureDemosCarousel.tsx` -- add 1 line of disclaimer text below the dots navigation

That's it. No need to touch the 15 demo files. Minimal risk, maximum clarity.

