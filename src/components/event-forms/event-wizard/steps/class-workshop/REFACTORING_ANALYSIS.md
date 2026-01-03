# ClassWorkshopStep Refactoring Analysis

## Issues Identified

### 1. Unnecessary/Fragile useEffects
- **Lines 62-81**: Association cleanup effect includes `form` in deps (should use `form.setValue`, `form.clearErrors`)
- **Lines 84-91**: Listing fee cleanup effect - same issue
- **Lines 94-103**: Conditional field cleanup - same issue
- **Risk**: Including `form` object in deps can cause unnecessary re-runs if form reference changes

### 2. RHF Anti-patterns
- **Mixing `form.watch()` and `useWatch()`**: Lines 27, 30, 36, 37 use `form.watch()`, line 44 uses `useWatch()`
- **Performance**: Multiple `form.watch()` calls cause multiple re-renders. Should use `useWatch` consistently
- **Best Practice**: `useWatch` is more performant and recommended for watching multiple fields

### 3. Duplicated State
- `isWorkshop` and `isPart` are derived values (fine, but could be computed)
- `showPlaceholder` is local UI state (appropriate)

### 4. Code Complexity
- **Lines 285-383**: Listing fee section is 98 lines of complex conditional logic
- **Lines 202-245**: Festival association section could be extracted
- **Line 297**: IIFE pattern is unnecessary - can use direct conditional rendering
- Fee calculation logic duplicated in JSX (lines 299, 325, 334)

### 5. Performance Issues
- Multiple `form.watch()` calls trigger separate re-renders
- Fee calculation in options array (line 334) recalculates on every render
- Occurrence count calculation is memoized (good), but extraFees depends on it

## Refactoring Plan

1. **Extract ListingFeeSection** - Similar to `performance/ListingFeeSection.tsx`
2. **Extract FestivalAssociationSection** - Handle parent event search and placeholder
3. **Create fee calculation utilities** - Centralize fee logic
4. **Fix RHF patterns** - Use `useWatch` consistently, fix dependency arrays
5. **Simplify conditional rendering** - Remove IIFE, use direct conditionals

## Proposed Components

- `class-workshop/ClassWorkshopListingFeeSection.tsx` - Handle listing fee logic
- `class-workshop/FestivalAssociationSection.tsx` - Handle festival/workshop association
- `class-workshop/fee-utils.ts` - Fee calculation utilities

