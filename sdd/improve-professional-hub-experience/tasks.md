# Tasks: improve-professional-hub-experience

## Phase1:
- [x] 1.1 Create `apps/mobile/app/components/ProfileProgressBar.js` with getProfileCompletion() calculation
- [x] 1.2 Create `apps/mobile/app/components/CollapsibleSection.js` with icon, badge, toggle state
- [x] 1.3 Create `apps/mobile/app/components/WorkPostCardLinkedIn.js` with full-width cover, 2x2 grid, bold title
- [x] 1.4 Create `apps/mobile/app/screens/OpportunitiesScreen.js` with placeholder content

## Phase2:
- [x] 2.1 Modify `apps/mobile/app/navigation/RootNavigator.js`: Add Oportunidades tab (position 3), conditionally render based on isProfessional
- [x] 2.2 Modify `apps/mobile/app/theme/index.js`: Add progressBarSuccess, progressBarWarning colors to palette
- [x] 2.3 Modify `apps/mobile/app/screens/ProfessionalHubScreen.js`: Integrate ProfileProgressBar at top, refactor into CollapsibleSection components

## Phase3:
- [x] 3.1 Wire ProfileProgressBar to calculate completion from profile, categories, serviceAreas, workPosts state
- [x] 3.2 Replace WorkPostComposer cards in ProfessionalHubScreen with WorkPostCardLinkedIn components
- [x] 3.3 Verify tab visibility: Professional sees 5 tabs, Customer sees 4 tabs (test with useAuth mock)

## Phase4:
- [x] 4.1 Write Jest test for getProfileCompletion(): test each field, weights, edge cases (empty profile, 100%)
- [x] 4.2 Write RTL test for ProfileProgressBar: renders correct %, handles 0% and 100%
- [x] 4.3 Write RTL test for CollapsibleSection: expand/collapse, badge updates
- [x] 4.4 Write RTL test for WorkPostCardLinkedIn: renders grid 2x2, full-width cover, title bold
- [x] 4.5 Write integration test for RootNavigator: verify tab rendering by role
