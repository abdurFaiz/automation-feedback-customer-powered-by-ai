# Changelog

## 2026-01-15 - Dashboard Responsive Design Implementation

### Changes Made
- **Dashboard Layout**: Made main dashboard responsive for mobile and tablet while preserving desktop layout
  - Changed main flex direction from `flex-row` to `flex-col lg:flex-row`
  - Adjusted padding from `p-6` to `p-4 md:p-6`
  - Reduced gap from `gap-6` to `gap-4 md:gap-6`

- **QuickOverview Component**: 
  - Updated grid from `grid-cols-1 lg:grid-cols-3` to `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
  - Made metrics section responsive: `flex-row` to `flex-col sm:flex-row`
  - Adjusted padding and spacing for mobile

- **InDepthInsights Component**:
  - Changed layout from `flex md:flex-row flex-col` to `flex flex-col lg:flex-row`
  - Made left column responsive with `lg:max-w-md w-full`
  - Updated right column to `flex-1 w-full space-y-4`

- **ChatbotToggle Component**:
  - Made chatbot panel hidden on mobile: `hidden md:block`
  - Adjusted panel width: `w-80 lg:w-96`
  - Made floating button responsive: `w-12 h-12 md:w-14 md:h-14`
  - Updated positioning: `bottom-4 right-4 md:bottom-6 md:right-6`

- **MetricCard Component**:
  - Made text responsive: `text-2xl md:text-4xl`

### Responsive Breakpoints
- **Mobile**: < 768px (md)
- **Tablet**: 768px - 1024px (md to lg)
- **Desktop**: > 1024px (lg+)

### Desktop Layout Preserved
- All desktop functionality and layout maintained
- No changes to desktop visual appearance
- Responsive changes only affect mobile and tablet views

## 2026-01-15 - Chatbot Mobile/Tablet Overlay Implementation

### Changes Made
- **ChatbotToggle Component**: Enhanced mobile/tablet experience
  - Added responsive behavior detection using `useEffect` and window resize listener
  - **Desktop (≥1024px)**: Chatbot opens by default as sidebar panel
  - **Mobile/Tablet (<1024px)**: Shows floating button, chatbot opens as full-screen overlay
  
- **Mobile/Tablet Overlay Features**:
  - Full-screen overlay with semi-transparent backdrop
  - Chatbot opens on top of all charts, not beside them
  - Responsive padding: `inset-x-4 top-4 bottom-4` on mobile, `inset-x-8 top-8 bottom-8` on tablet
  - Click outside overlay to close
  - Smooth animations with spring physics
  - Close button in top-right corner

- **Floating Button**:
  - Always visible on mobile/tablet when chatbot is closed
  - Also visible on desktop when chatbot is closed
  - Responsive sizing: `w-12 h-12` on mobile, `w-14 h-14` on desktop
  - Animated floating effect and rotation

### Behavior Summary
- **Desktop**: Sidebar chatbot (preserves original behavior)
- **Mobile/Tablet**: Floating button → Full-screen overlay chatbot
- **Auto-detection**: Automatically adjusts behavior based on screen size
- **Responsive**: Handles window resize events properly
## 2026-01-15 - Desktop Chatbot Responsive Improvements

### Changes Made
- **ChatbotToggle Component**: Made desktop chatbot panel more responsive
  - **Large screens (lg)**: `w-64` (256px) - More compact for better content balance
  - **Extra large screens (xl)**: `w-72` (288px) - Slightly wider for larger displays  
  - **2XL screens**: `w-80` (320px) - Full width for very large displays
  - Removed fixed `w-96` that was too wide and squashing main content

- **Dashboard Layout**: Enhanced main content area
  - Added `min-w-0` to charts section to prevent overflow
  - Improved gap spacing: `gap-4 lg:gap-6` for better responsive spacing
  - Better flex distribution between content and chatbot areas

### Responsive Chatbot Widths
- **1024px-1280px (lg)**: 256px width
- **1280px-1536px (xl)**: 288px width  
- **1536px+ (2xl)**: 320px width

This ensures the chatbot doesn't overwhelm the main dashboard content while still being functional and accessible.
## 2026-01-15 - InDepthInsights Collapse Functionality

### Changes Made
- **InDepthInsights Component**: Added collapse/expand functionality
  - Added collapse state management with `useState`
  - Added toggle button with chevron icons (ChevronUp/ChevronDown)
  - Implemented smooth animations using Framer Motion
  - Added `AnimatePresence` for enter/exit animations

- **UI Enhancements**:
  - Collapse button positioned next to filter button in header
  - Smooth height and opacity transitions (0.3s duration)
  - Proper overflow handling during animations
  - Accessible aria-labels for screen readers

- **Animation Details**:
  - **Expand**: `height: 0 → auto`, `opacity: 0 → 1`
  - **Collapse**: `height: auto → 0`, `opacity: 1 → 0`
  - **Easing**: `easeInOut` for smooth transitions
  - **Duration**: 300ms for optimal user experience

- **Imports Updated**:
  - Added `ChevronDown`, `ChevronUp` from lucide-react
  - Added `motion`, `AnimatePresence` from framer-motion
  - Removed unused `AlertCircle` import

### User Experience
- Click chevron button to toggle collapse/expand
- Content smoothly animates in/out
- Header remains visible when collapsed
- Maintains responsive behavior across all devices
## 2026-01-15 - Dark Mode Implementation

### Changes Made
- **Theme Context**: Created comprehensive dark mode system
  - Added `ThemeContext` with theme state management
  - Implemented localStorage persistence for theme preference
  - Added system theme detection (prefers-color-scheme)
  - Smooth transitions with 300ms duration

- **SwitchMode Component**: Enhanced with functional dark mode toggle
  - Connected to ThemeContext for actual theme switching
  - Proper state synchronization with theme context
  - Loading state with dark mode support

- **Providers Setup**: Integrated ThemeProvider into app
  - Added ThemeProvider to main Providers component
  - Proper provider hierarchy with SessionProvider and HeroUIProvider

- **Dashboard Dark Mode Support**:
  - **Main Layout**: Background, header, and text colors
  - **Card Components**: Background, borders, and text colors
  - **QuickOverview**: All text elements and icons
  - **InDepthInsights**: Complete dark mode styling
  - **UI Components**: MetricCard, CriticalIssueCard, LegendItem, UrgentReviewItem

### Dark Mode Features
- **Automatic Detection**: Respects system preference on first visit
- **Persistence**: Remembers user choice in localStorage
- **Smooth Transitions**: 300ms color transitions throughout UI
- **Complete Coverage**: All components support dark mode
- **Accessibility**: Proper contrast ratios maintained

### Color Scheme
- **Light Mode**: Gray-50 backgrounds, white cards, dark text
- **Dark Mode**: Gray-900 backgrounds, gray-800 cards, white text
- **Transitions**: Smooth color changes on all elements
- **Icons**: Proper contrast in both themes

### Usage
- Toggle switch in dashboard header
- Automatically saves preference
- Applies immediately across entire dashboard
- Respects system dark mode preference