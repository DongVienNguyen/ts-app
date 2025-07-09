# CSS Modular Structure

Cấu trúc CSS đã được tổ chức thành các module riêng biệt để dễ bảo trì và tái sử dụng.

## 📁 Cấu trúc thư mục

```
src/styles/
├── base.css           # Base styles, CSS variables, Tailwind imports
├── responsive.css     # Responsive utilities, mobile-first design
├── mobile.css         # Mobile-specific optimizations
├── animations.css     # Animations, transitions, keyframes
├── components.css     # Component-specific styles
├── accessibility.css  # A11y improvements, focus states
├── utilities.css      # Utility classes, helpers
└── README.md         # Documentation
```

## 🎯 Mục đích từng file

### `base.css`
- CSS variables cho theme
- Tailwind imports
- Base element styles
- Typography fundamentals

### `responsive.css`
- Mobile-first responsive utilities
- Breakpoint-specific classes
- Responsive text, spacing, layout

### `mobile.css`
- Touch-friendly components
- Mobile navigation
- Device-specific optimizations
- Safe area support

### `animations.css`
- Custom keyframes
- Animation classes
- Performance optimizations
- Reduced motion support

### `components.css`
- Reusable component styles
- Form components
- Button variants
- Card layouts
- Table styles

### `accessibility.css`
- Focus management
- Screen reader support
- High contrast mode
- Keyboard navigation
- ARIA enhancements

### `utilities.css`
- Helper classes
- Print styles
- Dark mode utilities
- Spacing helpers
- Layout utilities

## 🚀 Cách sử dụng

### Import trong main CSS
```css
@import './styles/base.css';
@import './styles/responsive.css';
@import './styles/mobile.css';
@import './styles/animations.css';
@import './styles/components.css';
@import './styles/accessibility.css';
@import './styles/utilities.css';
```

### Sử dụng classes
```jsx
// Responsive components
<div className="container-mobile p-responsive">
  <h1 className="text-responsive-2xl">Title</h1>
  <button className="btn-touch ts-button">Action</button>
</div>

// Mobile optimizations
<input className="input-mobile form-input" />
<nav className="nav-mobile">Navigation</nav>

// Animations
<div className="animate-slide-in-up hover-lift">
  Animated content
</div>

// Accessibility
<button className="focus-visible keyboard-focus">
  Accessible button
</button>
```

## 📱 Responsive Strategy

### Mobile First
- Base styles cho mobile (320px+)
- Progressive enhancement cho larger screens
- Touch-friendly interactions

### Breakpoints
- `sm`: 640px+ (Tablet portrait)
- `md`: 768px+ (Tablet landscape)
- `lg`: 1024px+ (Desktop)
- `xl`: 1280px+ (Large desktop)

### Responsive Classes
```css
.text-responsive-lg    /* text-base -> text-lg -> text-xl */
.p-responsive          /* p-3 -> p-4 -> p-6 */
.grid-responsive-1     /* grid-cols-1 -> 2 -> 3 -> 4 */
```

## 🎨 Component System

### TS Manager Specific
```css
.ts-brand             /* Green gradient branding */
.ts-card              /* Enhanced card with hover */
.ts-button            /* Primary button with animations */
.asset-card           /* Asset-specific styling */
.crc-card             /* CRC-specific styling */
```

### Generic Components
```css
.card                 /* Basic card layout */
.form-input           /* Styled form input */
.btn-primary          /* Primary button */
.status-badge         /* Status indicator */
```

## ♿ Accessibility Features

### Focus Management
- Visible focus indicators
- Skip links
- Focus trapping

### Screen Reader Support
- `.sr-only` for screen reader content
- ARIA live regions
- Semantic markup support

### High Contrast
- Automatic adjustments
- Color blind friendly indicators
- Enhanced borders and text

## 🔧 Performance

### Optimizations
- GPU acceleration classes
- Will-change properties
- Reduced motion support
- Efficient animations

### Best Practices
- Use `gpu-accelerated` for animated elements
- Apply `will-change-*` before animations
- Remove will-change after animations complete

## 🐛 Debug Utilities

### Development Only
```css
.debug-mobile         /* Shows MOBILE indicator */
.debug-tablet         /* Shows TABLET indicator */
.debug-desktop        /* Shows DESKTOP indicator */
```

## 📝 Naming Conventions

### BEM-inspired
- `.component-name`
- `.component-name__element`
- `.component-name--modifier`

### Responsive Suffixes
- `-responsive` for adaptive sizing
- `-mobile` for mobile-specific
- `-desktop` for desktop-specific

### State Prefixes
- `hover-*` for hover states
- `active-*` for active states
- `focus-*` for focus states

## 🔄 Maintenance

### Adding New Styles
1. Xác định category phù hợp
2. Thêm vào file tương ứng
3. Document trong README
4. Test trên multiple devices

### Refactoring
1. Identify duplicate styles
2. Extract to appropriate module
3. Update imports
4. Test thoroughly

## 📊 File Size Impact

Việc chia nhỏ CSS giúp:
- Tree shaking hiệu quả hơn
- Caching tốt hơn
- Debug dễ dàng hơn
- Collaboration tốt hơn
- Maintenance đơn giản hơn

Tuy nhiên cần chú ý:
- Số lượng HTTP requests tăng (giải quyết bằng bundling)
- Import order quan trọng
- Dependency management