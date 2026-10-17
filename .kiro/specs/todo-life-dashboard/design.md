# Design Document: To-Do List Life Dashboard Feature Enhancements

## Introduction

This design document outlines the architectural approach and implementation details for the feature enhancements to the To-Do List Life Dashboard. The enhancements include a settings panel with user preferences, light/dark mode theming, customizable Pomodoro timer duration, duplicate task prevention, and task sorting functionality. The application is built using HTML, CSS, and Vanilla JavaScript with a single CSS file and single JavaScript file structure.

## Overview

The To-Do List Life Dashboard is a personal productivity web application that serves as a central hub for daily planning and productivity. The feature enhancements extend the existing application with user customization capabilities while maintaining the simplicity and performance characteristics that define the current implementation.

The enhanced dashboard provides users with the ability to personalize their experience through a settings panel that controls theme appearance, greeting personalization, and timer configuration. The duplicate prevention system ensures task lists remain clean and meaningful by detecting and preventing redundant entries. The task sorting feature allows users to organize their tasks according to various criteria including creation date, alphabetical order, and completion status.

All enhancements are implemented using Vanilla JavaScript with no external dependencies. The styling architecture uses CSS custom properties to enable efficient theme switching. Data persistence leverages the browser's LocalStorage API with enhanced schema validation to ensure data integrity across sessions.

## Architecture

### Component-Based Architecture

The enhanced dashboard follows a component-based architecture where each major feature is encapsulated within a dedicated module. This approach promotes separation of concerns, maintainability, and testability. The application consists of the following core components:

1. **GreetingComponent**: Manages time-based greeting, date/time display, and user name personalization
2. **TimerComponent**: Handles Pomodoro timer functionality with configurable duration
3. **TaskManager**: Core task CRUD operations with duplicate detection and sorting
4. **SettingsManager**: Manages user preferences including theme, name, and timer settings
5. **QuickLinksComponent**: Manages quick link buttons for favorite websites
6. **LocalStorageManager**: Handles data persistence and schema management

### State Management Pattern

The application employs a centralized state management pattern using the `AppState` object. This single source of truth holds all application data and is synchronized with LocalStorage for persistence. State changes trigger UI updates through reactive rendering functions. The state is structured to separate transient UI state from persistent data, ensuring that non-persistent values like timer running state do not affect stored preferences.

### Data Flow

User interactions trigger events that flow through the following pattern: User Input → Event Handler → State Update → LocalStorage Sync → UI Render. This unidirectional data flow ensures consistency between the UI and underlying data. Each component listens for state changes and updates its respective DOM elements accordingly. The LocalStorageManager serves as the bridge between application state and browser storage, handling serialization, validation, and error recovery.

## Components and Interfaces

### Settings Panel Component

The settings panel is implemented as a modal overlay that appears when the user clicks the gear icon. The gear icon is positioned next to the greeting section and uses an inline SVG icon for visual clarity. The panel contains organized sections for each preference category with clear labels and input controls. The modal backdrop dims the background content to focus user attention on the settings.

**Interface Methods:**
- `openSettings()`: Displays the settings panel with animation
- `closeSettings()`: Hides the settings panel and saves current state
- `applySetting(settingName, value)`: Applies a setting change immediately

### Theme Toggle Component

The theme toggle uses button elements rather than a checkbox for better accessibility and clearer visual feedback. Active state is indicated through CSS classes and icon styling. The sun icon represents light mode, while the moon icon represents dark mode. When a theme is selected, it is visually highlighted and the corresponding icon receives emphasis.

**Interface Methods:**
- `setTheme(theme)`: Applies the specified theme ('light' or 'dark')
- `toggleTheme()`: Switches between light and dark themes
- `getCurrentTheme()`: Returns the currently active theme

### Sort Control Component

The sort dropdown is positioned above the task list with a label and select element. The dropdown contains all five sort options with descriptive labels. The currently selected sort option is marked in the UI and persisted to LocalStorage. When the user changes the sort order, the task list immediately re-renders in the new order.

**Interface Methods:**
- `setSortOrder(order)`: Applies the specified sort order
- `getSortOrder()`: Returns the current sort order
- `getSortComparison()`: Returns the comparison function for the current order

### Settings Persistence Component

The LocalStorageManager provides a unified interface for settings persistence. All settings are validated against a schema before storage, ensuring data integrity. Settings are immediately persisted upon change to prevent data loss.

**Interface Methods:**
- `saveSettings(settings)`: Persists settings to LocalStorage
- `loadSettings()`: Retrieves and validates settings from LocalStorage
- `getDefaultSettings()`: Returns default settings values

## Data Models

### User Preferences Schema

The `userPreferences` object contains all settings that persist across sessions. Each preference has a defined type and validation constraints. The theme property controls the CSS custom property values applied to the document. The sortOrder property determines the algorithm used when rendering the task list. The timerDuration property stores the user's preferred Pomodoro timer length in minutes.

```javascript
const AppState = {
  // Task state (existing)
  tasks: [],
  taskCounter: 0,

  // Timer state (transient, not persisted)
  timer: {
    timeRemaining: 1500,
    isRunning: false,
    isPaused: false,
    intervalId: null,
    defaultDuration: 25
  },

  // Quick links state (existing)
  quickLinks: [],
  linkCounter: 0,

  // UI state (transient, not persisted)
  editingTaskId: null,
  isInitialized: false,
  settingsPanelOpen: false,
  
  // User preferences (persisted)
  userPreferences: {
    userName: '',
    theme: 'light',
    sortOrder: 'newest',
    timerDuration: 25,
    timerPreset: 'default'
  },

  defaults: {
    timerDuration: 25,
    sortOrder: 'newest',
    theme: 'light'
  }
};
```

### Sort Order Enumeration

The application supports five distinct sort orders, each serving different user needs. The sort order is persisted in LocalStorage and restored on page load. The default sort order is "newest" to match the requirement of showing most recent tasks first.

```javascript
const SortOrder = {
  NEWEST: 'newest',
  OLDEST: 'oldest',
  NAME_ASC: 'name-asc',
  NAME_DESC: 'name-desc',
  COMPLETION: 'completion'
};
```

### Settings Schema Definition

The settings schema defines the structure of persisted user preferences with type validation:

```javascript
const SettingsSchema = {
  userName: {
    type: 'string',
    default: '',
    maxLength: 50,
    sanitization: value => String(value).trim().substring(0, 50)
  },
  theme: {
    type: 'string',
    default: 'light',
    validation: value => ['light', 'dark'].includes(value)
  },
  sortOrder: {
    type: 'string',
    default: 'newest',
    validation: value => Object.values(SortOrder).includes(value)
  },
  timerDuration: {
    type: 'number',
    default: 25,
    validation: value => Number.isInteger(value) && value >= 1 && value <= 120
  },
  timerPreset: {
    type: 'string',
    default: 'default',
    validation: value => ['15', 'default', '45', 'custom'].includes(value)
  }
};
```

### LocalStorage Keys

```javascript
const StorageKeys = {
  TASKS: 'dashboard_tasks',
  QUICK_LINKS: 'dashboard_quick_links',
  SETTINGS: 'dashboard_settings'
};
```

## Implementation Details

### New State Additions

The application state object has been extended to include new properties for user preferences and enhanced task management. Transient UI state is clearly separated from persistent preferences. Properties like `settingsPanelOpen` and `editingTaskId` are not persisted because they represent temporary UI state that should reset on page reload. This separation ensures that LocalStorage contains only meaningful user data while the UI can still maintain its current state during an active session.

### UI Changes

The settings panel is implemented as a modal overlay that appears when the user clicks the gear icon. The gear icon is positioned next to the greeting section and uses an inline SVG icon for visual clarity. The panel contains organized sections for each preference category with clear labels and input controls. The modal backdrop dims the background content to focus user attention on the settings.

### Algorithm for Duplicate Detection

The duplicate detection algorithm ensures that tasks with the same text are identified regardless of case. The algorithm normalizes both the new task text and existing task texts to lowercase before comparison. This approach handles all variations of case sensitivity while preserving the original task text capitalization for display.

```javascript
function isDuplicateTask(taskText) {
  const normalizedInput = taskText.trim().toLowerCase();
  
  return AppState.tasks.some(existingTask => {
    const normalizedExisting = existingTask.text.trim().toLowerCase();
    return normalizedExisting === normalizedInput;
  });
}
```

When a duplicate is detected, the system prevents the task from being added and displays an error notification. The notification message is clear and actionable: "This task already exists." The existing task remains unchanged, and the user can retry with different text.

### Sorting Logic

Each sort order has a dedicated comparison function that defines how tasks are ordered. The comparison functions return negative, zero, or positive values based on the JavaScript Array.sort() specification. The sorting is stable, meaning tasks with equal sort keys maintain their relative order.

```javascript
function getSortComparison() {
  switch (AppState.userPreferences.sortOrder) {
    case SortOrder.NEWEST:
      return (a, b) => b.createdAt - a.createdAt;
    
    case SortOrder.OLDEST:
      return (a, b) => a.createdAt - b.createdAt;
    
    case SortOrder.NAME_ASC:
      return (a, b) => a.text.localeCompare(b.text);
    
    case SortOrder.NAME_DESC:
      return (a, b) => b.text.localeCompare(a.text);
    
    case SortOrder.COMPLETION:
      return (a, b) => {
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }
        return b.createdAt - a.createdAt;
      };
    
    default:
      return (a, b) => b.createdAt - a.createdAt;
  }
}
```

When the user selects a new sort option, the tasks are immediately re-rendered in the new order. The sort preference is saved to LocalStorage to persist the user's choice.

### Theme CSS Variables Approach

The theming system uses CSS custom properties (variables) defined on the `:root` element for light theme and a `.dark-theme` class for dark theme. All color values in the stylesheet reference these variables rather than hard-coded color values. This approach allows complete theme switching by changing a single class on the document element.

```css
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
  --bg-tertiary: #e9ecef;
  --text-primary: #212529;
  --text-secondary: #495057;
  --text-muted: #868e96;
  --accent-primary: #4c6ef5;
  --accent-primary-hover: #364fc7;
  --accent-danger: #ff6b6b;
  --accent-success: #51cf66;
  --border-color: #dee2e6;
  --shadow-color: rgba(0, 0, 0, 0.15);
  --card-bg: #ffffff;
  --input-bg: #ffffff;
  --button-text: #ffffff;
}

.dark-theme {
  --bg-primary: #1a1a2e;
  --bg-secondary: #16213e;
  --bg-tertiary: #0f3460;
  --text-primary: #eaeaea;
  --text-secondary: #b8b8b8;
  --text-muted: #888888;
  --accent-primary: #5c7cfa;
  --accent-primary-hover: #748ffc;
  --accent-danger: #ff6b6b;
  --accent-success: #51cf66;
  --border-color: #2d3748;
  --shadow-color: rgba(0, 0, 0, 0.4);
  --card-bg: #1a1a2e;
  --input-bg: #16213e;
  --button-text: #ffffff;
}
```

All components in the stylesheet use CSS variables for their styling. Theme changes include CSS transitions for smooth color adaptation (0.3 seconds).

### LocalStorage Schema Changes

The LocalStorage schema has been extended to include new keys for user preferences. The existing `dashboard_tasks` and `dashboard_quick_links` keys remain unchanged for backward compatibility. A new `dashboard_settings` key stores all user preferences in a unified structure.

```javascript
const LocalStorageManager = {
  TASKS_KEY: 'dashboard_tasks',
  LINKS_KEY: 'dashboard_quick_links',
  SETTINGS_KEY: 'dashboard_settings',

  saveSettings() {
    try {
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(AppState.userPreferences));
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      return false;
    }
  },

  loadSettings() {
    try {
      const stored = localStorage.getItem(this.SETTINGS_KEY);
      if (!stored) {
        return this.getDefaultSettings();
      }
      
      const settings = JSON.parse(stored);
      return this.validateAndNormalizeSettings(settings);
    } catch (error) {
      console.error('Error loading settings:', error);
      return this.getDefaultSettings();
    }
  },

  getDefaultSettings() {
    return {
      userName: '',
      theme: 'light',
      sortOrder: 'newest',
      timerDuration: 25,
      timerPreset: 'default'
    };
  },

  validateAndNormalizeSettings(input) {
    const defaults = this.getDefaultSettings();
    const result = { ...defaults };
    
    for (const key in SettingsSchema) {
      const schema = SettingsSchema[key];
      const value = input[key];
      
      if (schema.validation(value)) {
        result[key] = schema.sanitization ? schema.sanitization(value) : value;
      }
    }
    
    return result;
  }
};
```

## Error Handling

### Notification System

The application uses a centralized notification system for displaying errors and success messages. Notifications appear in the top-right corner with appropriate styling for error (red) and success (green) states. Notifications automatically dismiss after a configurable duration to avoid cluttering the interface. The notification system is used for duplicate task detection, validation errors, and storage failures.

### Graceful Degradation

When LocalStorage is unavailable or quota exceeded, the application degrades gracefully. Users can continue using the application during the session, but changes are not persisted. The application provides clear messaging about the storage limitation while maintaining full functionality. When storage recovers (such as clearing space), the application resumes normal persistence.

### Input Validation

All user inputs undergo validation before acceptance. Task text is validated for non-empty content and length limits. Timer duration inputs are validated against the 1-120 minute range. URLs are validated to ensure they begin with http:// or https://. Name inputs have length limits and are sanitized of potentially dangerous characters. Validation failures display clear error messages without modifying application state.

### Data Validation on Load

All persisted data undergoes validation before being applied to application state. The validate functions check data types, ranges, and format constraints. Invalid data triggers a fallback to default values with console warnings for debugging. This defensive approach prevents corruption from malformed LocalStorage entries.

## Security Considerations

### Input Sanitization

All user inputs undergo sanitization before storage or rendering. Task text is trimmed of whitespace and limited in length to prevent storage abuse. URL inputs are validated to ensure they begin with http:// or https://. Name inputs have length limits and are sanitized of potentially dangerous characters. This defense-in-depth approach prevents XSS attacks and storage overflow.

### LocalStorage Security

LocalStorage data is treated as untrusted when loaded from storage. The validation functions ensure malformed data cannot corrupt application state. The application does not store sensitive information like passwords in LocalStorage. Session data that should not persist is kept in memory only, never written to LocalStorage.

## Accessibility

### ARIA Attributes

All new UI elements include appropriate ARIA attributes for screen reader compatibility. The settings panel uses `role="dialog"` and `aria-label` for proper announcement. Theme buttons include `aria-pressed` state to indicate active theme. The sort dropdown uses standard form control semantics for accessibility.

### Keyboard Navigation

The settings panel supports keyboard navigation with Tab and Shift+Tab for focus management. The Escape key closes the settings panel for consistent keyboard interaction. Theme buttons and other interactive elements are keyboard accessible. Focus management ensures keyboard users can access all new functionality.

### Visual Accessibility

Color contrast ratios meet WCAG AA standards in both light and dark themes. Theme changes respect user system preferences when available. Focus indicators are visible and clearly indicate keyboard focus. The interface adapts to user font size preferences through relative units.

## Performance Optimizations

### Efficient DOM Updates

The task list rendering uses efficient DOM diffing principles. Rather than manipulating individual elements, the entire list is rebuilt when needed. This approach prevents subtle bugs from state desynchronization. The performance impact is negligible for typical task list sizes (under 100 tasks).

### LocalStorage Batching

Settings changes are immediately persisted to LocalStorage to prevent data loss. The small size of settings data means immediate saves have minimal performance impact. No batching is necessary for the current data volume. This approach ensures preferences are never lost even if the browser crashes.

### Debounced Rendering

Time-sensitive updates like the clock display use efficient rendering with minimal DOM queries. Timer updates occur once per second as required. The greeting component caches DOM element references to avoid repeated queries. These optimizations ensure the application remains responsive even on lower-end devices.

## Correctness Properties

### Property 1: Theme consistency across components

*For any* visible component in the UI and *for any* theme selection (light or dark), the component's background, text, and border colors SHALL reference the theme variables appropriate to the selected theme.

**Validates: Requirements 16.3, 16.4**

### Property 2: Theme persistence round-trip

*For any* theme selection and subsequent page reload, the application SHALL apply the same theme that was selected before the reload.

**Validates: Requirements 16.5, 16.6**

### Property 3: Settings immediate application

*For any* settings change (name, theme, timer duration), the application SHALL apply the change to the interface immediately and persist it to Local Storage within the same operation.

**Validates: Requirements 15.5, 15.6, 16.4, 17.3, 18.4, 18.5**

### Property 4: Duplicate task prevention

*For any* task text and *for any* existing task list, if a task with the same text exists (case-insensitive comparison), adding a new task SHALL NOT modify the task list and SHALL display an error notification.

**Validates: Requirements 19.1, 19.2, 19.3, 19.4**

### Property 5: Sort order consistency

*For any* sort order selection and *for any* task list state, the rendered task list SHALL be correctly ordered according to the selected sort algorithm immediately after selection.

**Validates: Requirements 20.3, 20.6**

### Property 6: Sort preference persistence

*For any* sort order selection and subsequent page reload, the application SHALL restore the same sort order that was selected before the reload.

**Validates: Requirements 20.4, 20.5**

### Property 7: Timer duration validation

*For any* timer duration setting (preset or custom), the application SHALL validate the duration is between 1 and 120 minutes, apply the validated duration to the timer, and persist the setting.

**Validates: Requirements 18.5, 18.6, 18.7, 18.8**

### Property 8: Name personalization

*For any* non-empty name setting and *for any* time of day, the greeting message SHALL include the name in the format "Good [Timeperiod], [Name]!"

**Validates: Requirements 17.4, 17.7**

### Property 9: Settings initialization

*For any* fresh installation (no stored settings), the application SHALL initialize all settings to their default values: light theme, newest-first sort, 25-minute timer, and empty name.

**Validates: Requirements 15.5, 16.5, 18.7, 20.4**

## Testing Strategy

### Unit Testing Approach

Unit tests verify each sorting algorithm produces correct ordering for known inputs. Duplicate detection tests cover case-insensitive matching with various text inputs. Theme variable application tests verify CSS values match expected theme. Settings persistence tests verify round-trip save/load operations.

### Integration Testing Approach

Integration tests verify that settings changes immediately reflect in the UI. Theme toggle tests verify both visual appearance and data persistence. Task creation tests verify duplicate prevention at the integration level. Sort functionality tests verify that new tasks appear in correct sorted position.

### Manual Testing Checklist

Manual testing validates smooth theme transitions and visual consistency. Settings panel behavior is verified including open/close and input handling. All sorting options are tested with various task states. Theme persistence is tested across page reloads. Accessibility is verified with screen readers and keyboard navigation.