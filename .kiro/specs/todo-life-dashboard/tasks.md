# Implementation Plan: To-Do List Life Dashboard Feature Enhancements

## Overview

This implementation plan covers the five feature enhancements for the To-Do List Life Dashboard: Light/Dark mode toggle, Custom name in greeting, Customizable Pomodoro timer duration, Duplicate task prevention, and Task sorting. The implementation builds upon the existing codebase and uses vanilla HTML, CSS, and JavaScript. Tasks are organized to build functionality incrementally with early validation through automated tests.

---

## Tasks

- [x] 1. Settings Panel Infrastructure
  - [x] 1.1 Add settings icon to greeting section in index.html
    - Insert gear icon (SVG) next to the greeting area
    - Add aria-label="Settings" for accessibility
    - Add ID `settings-toggle` for JavaScript targeting
    - _Requirements: 15.1, 15.2_

  - [x] 1.2 Create settings panel HTML structure in index.html
    - Create modal overlay with ID `settings-panel`
    - Add sections for Name, Theme, and Timer settings
    - Add close button with aria-label="Close settings"
    - Add data attributes for sections and controls
    - _Requirements: 15.2, 15.3, 15.4_

  - [x] 1.3 Style settings panel modal in css/style.css
    - Create `.settings-panel` class with fixed positioning
    - Style overlay with semi-transparent backdrop
    - Add smooth open/close animation transitions
    - Style panel content with proper spacing and typography
    - _Requirements: 15.1, 15.2_

  - [x] 1.4 Implement settings panel open/close logic in js/script.js
    - Add click event listener to settings toggle
    - Add click event listener to close button
    - Add click event listener to overlay to close
    - Implement keyboard Escape key to close panel
    - Add aria-hidden toggling for accessibility
    - _Requirements: 15.1, 15.6_

- [x] 2. Light / Dark Mode Toggle
  - [x] 2.1 Add theme toggle section to settings panel HTML
    - Add label "Theme" with description
    - Add light mode button with sun icon
    - Add dark mode button with moon icon
    - Add data-theme attribute to buttons
    - _Requirements: 16.1, 16.2_

  - [x] 2.2 Define CSS custom properties for both themes in css/style.css
    - Define `:root` variables for light theme colors
    - Define `.dark-theme` class for dark theme colors
    - Variables needed: bg-primary, bg-secondary, text-primary, text-secondary, accent, border, shadow
    - Add transition property on all color properties (0.3s)
    - _Requirements: 16.3, 16.4, 21.1, 21.2, 21.3, 21.4_

  - [x] 2.3 Apply CSS variables throughout existing stylesheet
    - Replace hardcoded colors with var(--variable-name)
    - Update greeting section styling
    - Update timer section styling
    - Update task list section styling
    - Update quick links section styling
    - _Requirements: 21.5, 21.6, 21.7_

  - [x] 2.4 Implement theme switching logic in js/script.js
    - Add `setTheme(theme)` function to apply theme class
    - Add `toggleTheme()` function for button clicks
    - Add `getCurrentTheme()` function returning 'light' or 'dark'
    - Update document.body.classList based on theme
    - _Requirements: 16.3, 16.4_

  - [x] 2.5 Persist theme preference to LocalStorage
    - Add theme to userPreferences object
    - Save theme immediately on change
    - Load theme on application initialization
    - _Requirements: 16.5, 16.6_

  - [~]* 2.6 Write property tests for theme functionality
    - **Property 1: Theme consistency across components**
    - **Validates: Requirements 16.3, 16.4**
    - **Property 2: Theme persistence round-trip**
    - **Validates: Requirements 16.5, 16.6**

- [x] 3. Custom Name in Greeting
  - [x] 3.1 Add name input section to settings panel HTML
    - Add label "Your Name" with description
    - Add input field with placeholder "Enter your name..."
    - Add ID `user-name-input` for JavaScript targeting
    - Add character limit indicator (max 50 characters)
    - _Requirements: 17.1, 17.2_

  - [x] 3.2 Style name input section in css/style.css
    - Style input field with theme-aware background
    - Add focus state styling with accent color
    - Style label and description text
    - _Requirements: 17.1_

  - [x] 3.3 Implement name input handling in js/script.js
    - Add input event listener to save on change
    - Add blur event listener to save on focus loss
    - Implement name sanitization (trim, max 50 chars)
    - Update greeting display immediately on change
    - _Requirements: 17.3, 17.5_

  - [x] 3.4 Modify greeting component to include user name
    - Update getGreeting() to accept userName parameter
    - Format greeting as "Good [Period], [Name]!" or just "Good [Period]!"
    - Handle empty name case (display default greeting)
    - _Requirements: 17.4, 17.5_

  - [x] 3.5 Persist user name to LocalStorage
    - Add userName to userPreferences object
    - Save name immediately on change
    - Load name on application initialization
    - Apply name to greeting on page load
    - _Requirements: 17.6, 17.7_

  - [ ]* 3.6 Write property tests for name personalization
    - **Property 8: Name personalization**
    - **Validates: Requirements 17.4, 17.7**

- [x] 4. Customizable Pomodoro Timer Duration
  - [x] 4.1 Add timer duration section to settings panel HTML
    - Add label "Timer Duration" with description
    - Add preset buttons: 15 min, 25 min (default), 45 min
    - Add custom duration input field (type number)
    - Add validation message area for errors
    - _Requirements: 18.1, 18.2, 18.3_

  - [x] 4.2 Style timer duration section in css/style.css
    - Style preset buttons with active state
    - Style custom input field with theme-aware colors
    - Style validation error message (red text)
    - _Requirements: 18.1_

  - [x] 4.3 Implement preset duration selection in js/script.js
    - Add click event listeners to preset buttons
    - Add data-preset attribute to buttons
    - Implement setTimerDuration(minutes) function
    - Update timer display immediately on preset selection
    - _Requirements: 18.4_

  - [x] 4.4 Implement custom duration input validation
    - Add input event listener to custom duration field
    - Validate range: 1-120 minutes
    - Show error message for invalid input
    - Retain previous valid duration on error
    - _Requirements: 18.5, 18.6_

  - [x] 4.5 Update timer component to use custom duration
    - Modify timer initialization to use saved duration
    - Update reset button to restore to custom duration
    - Ensure timer displays new duration immediately
    - _Requirements: 18.4, 18.5_

  - [x] 4.6 Persist timer duration to LocalStorage
    - Add timerDuration to userPreferences object
    - Add timerPreset to track which option selected
    - Save duration immediately on change
    - Load and apply duration on initialization
    - _Requirements: 18.7, 18.8_

  - [ ]* 4.7 Write property tests for timer duration
    - **Property 7: Timer duration validation**
    - **Validates: Requirements 18.5, 18.6, 18.7, 18.8**

- [x] 5. Checkpoint - Settings and Theme Features
  - Ensure settings panel opens and closes correctly
  - Verify theme toggles and persists across page reload
  - Verify name updates greeting immediately
  - Verify timer duration changes work correctly
  - Ensure all tests pass, ask the user if questions arise.
  - _Requirements: 15.5, 15.6, 16.5, 16.6, 17.6, 17.7, 18.7, 18.8_

- [x] 6. Prevent Duplicate Tasks
  - [x] 6.1 Add duplicate task check to addTask() function
    - Implement isDuplicateTask(taskText) helper function
    - Normalize comparison: trim and lowercase both texts
    - Check against all existing AppState.tasks
    - Return true if duplicate exists, false otherwise
    - _Requirements: 19.1, 19.2_

  - [x] 6.2 Implement duplicate prevention in addTask flow
    - Call isDuplicateTask before creating new task
    - If duplicate, return false without modifying state
    - Call showError() with message "This task already exists"
    - If not duplicate, proceed with normal addTask logic
    - _Requirements: 19.3, 19.4_

  - [x] 6.3 Ensure existing task remains unchanged on duplicate attempt
    - Verify task list not modified when duplicate detected
    - Verify no LocalStorage save occurs for duplicate
    - Verify error notification displays without list change
    - _Requirements: 19.5, 19.6_

  - [ ]* 6.4 Write property tests for duplicate prevention
    - **Property 4: Duplicate task prevention**
    - **Validates: Requirements 19.1, 19.2, 19.3, 19.4**

- [x] 7. Sort Tasks
  - [x] 7.1 Add sort dropdown to task list section in index.html
    - Add label "Sort by:" before dropdown
    - Add select element with ID `sort-select`
    - Add options: Newest First, Oldest First, Name (A-Z), Name (Z-A), Completion Status
    - Add data attributes for sort order values
    - _Requirements: 20.1, 20.2_

  - [x] 7.2 Style sort dropdown section in css/style.css
    - Style label with theme-aware colors
    - Style select element with padding and borders
    - Style dropdown options
    - Position above task list with margin
    - _Requirements: 20.1_

  - [x] 7.3 Implement SortOrder enum and comparison functions
    - Define SortOrder.NEWEST, OLDEST, NAME_ASC, NAME_DESC, COMPLETION
    - Implement getSortComparison() returning comparison function
    - Handle each sort type's logic:
      - Newest: compare createdAt descending
      - Oldest: compare createdAt ascending
      - Name A-Z: localeCompare ascending
      - Name Z-A: localeCompare descending
      - Completion: incomplete first, then createdAt
    - _Requirements: 20.3, 20.6_

  - [x] 7.4 Implement sort functionality in js/script.js
    - Add change event listener to sort dropdown
    - Update AppState.userPreferences.sortOrder
    - Call renderTaskList() immediately on change
    - Pass sort comparison function to render
    - _Requirements: 20.3, 20.6_

  - [x] 7.5 Persist sort preference to LocalStorage
    - Add sortOrder to userPreferences object
    - Save sortOrder immediately on change
    - Load sortOrder on application initialization
    - Apply saved sort to dropdown selection
    - _Requirements: 20.4, 20.5_

  - [x] 7.6 Ensure new tasks insert in correct sorted position
    - When adding new task, render with current sort applied
    - New task appears in correct position per sort order
    - Test each sort mode with new task addition
    - _Requirements: 20.6_

  - [ ]* 7.7 Write property tests for task sorting
    - **Property 5: Sort order consistency**
    - **Validates: Requirements 20.3, 20.6**
    - **Property 6: Sort preference persistence**
    - **Validates: Requirements 20.4, 20.5**

- [x] 8. Unified Settings Persistence System
  - [x] 8.1 Create unified settings LocalStorage key
    - Define StorageKeys.SETTINGS = 'dashboard_settings'
    - Create settings object with all preferences
    - _Requirements: 15.5, 15.6_

  - [x] 8.2 Implement settings validation schema
    - Define SettingsSchema with validation functions
    - userName: string, max 50 chars, trim whitespace
    - theme: 'light' or 'dark'
    - sortOrder: valid SortOrder value
    - timerDuration: number 1-120
    - _Requirements: 15.5_

  - [x] 8.3 Implement unified saveSettings() function
    - Save all preferences in single LocalStorage call
    - Validate data before saving
    - Handle storage errors gracefully
    - _Requirements: 15.5, 15.6_

  - [x] 8.4 Implement unified loadSettings() function
    - Load settings from LocalStorage
    - Apply defaults if no saved settings
    - Validate and normalize loaded settings
    - _Requirements: 15.5, 15.6_

  - [ ]* 8.5 Write property tests for settings persistence
    - **Property 3: Settings immediate application**
    - **Validates: Requirements 15.5, 15.6**
    - **Property 9: Settings initialization**
    - **Validates: Requirements 15.5, 16.5, 18.7, 20.4**

- [x] 9. Final Checkpoint - All Enhancements Complete
  - Verify all settings persist and apply correctly
  - Verify theme toggles work smoothly
  - Verify duplicate prevention prevents same tasks
  - Verify sorting works for all options
  - Ensure all tests pass, ask the user if questions arise.
  - _Requirements: 15.5, 15.6, 16.5, 16.6, 17.6, 17.7, 18.7, 18.8, 19.4, 20.5, 20.6_

---

## Notes

- Tasks marked with `*` are optional property-based tests that can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties from the design document
- Settings panel provides centralized control for all user preferences
- Theme changes use CSS variables for instant, smooth transitions
- Duplicate prevention is case-insensitive and preserves existing tasks
- Sorting is applied immediately and persists across sessions
- Checkpoints ensure incremental validation before proceeding

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["1.4", "2.1", "3.1", "4.1", "7.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "3.2", "4.2", "7.2"] },
    { "id": 3, "tasks": ["2.5", "3.3", "4.3", "7.3", "8.1", "8.2"] },
    { "id": 4, "tasks": ["2.6", "3.4", "4.4", "7.4", "8.3", "8.4"] },
    { "id": 5, "tasks": ["3.5", "4.5", "4.6", "7.5", "8.5"] },
    { "id": 6, "tasks": ["5"] },
    { "id": 7, "tasks": ["6.1", "6.2", "6.3", "6.4"] },
    { "id": 8, "tasks": ["7.6", "7.7"] },
    { "id": 9, "tasks": ["9"] }
  ]
}
```