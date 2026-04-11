
# Fix Mobile Scroll Bounce + Reduce Size + Add Tab Navigation Strategy

## Problems Identified

1. **Scroll bounce**: The `AnimatePresence` with `exit` animations in `MobileDashboard.tsx` causes layout height collapse during view transitions, snapping scroll to top. The `motion.div` exit animation removes content height momentarily.

2. **Everything too big**: Cards, icons, fonts, and spacing are sized for desktop. The `MobileStatsGrid` uses `text-lg` for values, `w-10 h-10` for icons — too large for 390px viewport. Many components have no mobile-specific sizing.

3. **Endless scrolling**: Each page dumps all sections vertically. Users must scroll through 8-12 cards to find what they need. No tab/section navigation exists on most pages.

## Plan

### 1. Fix scroll bounce in MobileDashboard
- Remove `AnimatePresence` and `motion.div` wrappers for view switching on mobile — use simple conditional rendering instead (no exit animation = no height collapse)
- This eliminates the layout shift that causes the snap-back

### 2. Reduce mobile sizing globally via CSS
In `src/index.css`, add a mobile-specific density override (max-width: 639px):
- Reduce `page-container` padding to `px-3 py-2`
- Reduce `.stats-grid-2x2` gap to `gap-1.5`
- Add `.mobile-compact` overrides: smaller card padding (`p-2`), smaller text sizes
- Reduce `mobile-bottom-nav-height` from 64px to 56px

### 3. Compact MobileStatsGrid
- Reduce icon containers from `w-10 h-10` to `w-8 h-8`, icons from `h-5 w-5` to `h-4 w-4`
- Reduce value text from `text-lg` to `text-sm font-bold`
- Reduce card padding from `p-3` to `p-2`

### 4. Compact MobileDashboard content
- Reduce `LiveClock`, `DashboardNotificationHub`, `MissionControl`, `DashboardViewTabs` sizes for mobile
- Make `DashboardViewTabs` smaller: reduce `py-3 px-4` to `py-2 px-3`, text to `text-xs`

### 5. Create `MobileTabLayout` — reusable tabbed section navigator
A new component that pages can use to organize their content into swipeable/tappable tabs instead of one long scroll:
- Sticky horizontal pill bar below the page header
- Each pill = a logical section of the page
- Only renders the active section's content
- Used by all major pages: Expenses, Income, Banking, Budget, Analytics, etc.

### 6. Apply `MobileTabLayout` to key pages (mobile only)
For each page, wrap the mobile view in tab sections:

**Expenses** → Tabs: [Lista | Filtros | Insights | Calendario]
**Income** → Tabs: [Lista | Resumen]
**Banking** → Tabs: [Resumen | Transacciones | Herramientas]
**Budget** → Already has tabs, just make them compact on mobile
**Analytics** → Tabs: [Gráficos | Predicciones | Simulador]
**Net Worth** → Tabs: [Resumen | Activos | Deudas]

### 7. Compact PageHeader for mobile
- Reduce title from `text-2xl` to `text-lg`
- Hide description on mobile
- Make breadcrumbs smaller

## Files to Create
- `src/components/mobile/MobileTabLayout.tsx` — reusable tab navigator

## Files to Modify (~15 files)
- `src/index.css` — mobile compact density
- `src/components/Layout.tsx` — reduce bottom nav height
- `src/components/dashboard/MobileDashboard.tsx` — remove AnimatePresence, compact spacing
- `src/components/dashboard/MobileStatsGrid.tsx` — smaller cards
- `src/components/dashboard/DashboardViewTabs.tsx` — compact on mobile
- `src/components/dashboard/MobileSectionPills.tsx` — compact
- `src/components/PageHeader.tsx` — compact mobile
- `src/pages/Expenses.tsx` — add MobileTabLayout
- `src/pages/Income.tsx` — add MobileTabLayout
- `src/pages/Banking.tsx` — add MobileTabLayout
- `src/pages/Analytics.tsx` — add MobileTabLayout
- `src/pages/NetWorth.tsx` — add MobileTabLayout
- `src/pages/Settings.tsx` — add MobileTabLayout

## Technical Notes
- `MobileTabLayout` only activates on `useIsMobile()` — desktop is unchanged
- Tab state persisted in URL search params so back button works
- Sticky tab bar uses `position: sticky; top: 52px` (below mobile header)
- Each tab lazy-renders its content to keep initial load fast
