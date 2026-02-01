# App typography (Inter, responsive)

All text in the app should use the global typography from `fonts.ts` so it stays consistent and scales with device size.

## Usage

```ts
import { FONTS, FONT_SIZES, TEXT_STYLES } from '../utils/fonts';

// Option 1: Use predefined text styles (recommended)
<Text style={[TEXT_STYLES.screenTitle, { color: colors.text }]}>Screen Title</Text>
<Text style={[TEXT_STYLES.sectionHeading, { color: colors.text }]}>Section</Text>
<Text style={[TEXT_STYLES.cardTitleSemiBold, { color: colors.primary }]}>Card Title</Text>
<Text style={[TEXT_STYLES.bodyPrimary, { color: colors.text }]}>Body text</Text>
<Text style={[TEXT_STYLES.bodySecondary, { color: colors.textSecondary }]}>Secondary</Text>
<Text style={[TEXT_STYLES.caption, { color: colors.textSecondary }]}>Caption</Text>
<Text style={[TEXT_STYLES.buttonSemiBold, { color: '#FFF' }]}>Button</Text>

// Option 2: Use theme (if you use useTheme())
const { typography, fontSizes } = useTheme();
<Text style={[typography.screenTitle, { color: colors.text }]}>Title</Text>

// Option 3: Build style from FONT_SIZES + FONTS
<Text style={{ fontFamily: FONTS.INTER_SEMIBOLD, fontSize: FONT_SIZES.SECTION_HEADING, fontWeight: '600' }}>Heading</Text>
```

## Guidelines (Inter)

| Use case           | Style                  | Size (px) | Weight    | Line height |
|--------------------|------------------------|-----------|-----------|-------------|
| Screen title       | `screenTitle`          | 22–24     | SemiBold/Bold | ×1.5   |
| Section heading    | `sectionHeading`       | 16–18     | SemiBold  | ×1.5        |
| Card title         | `cardTitle` / `cardTitleSemiBold` | 15–16 | Medium/SemiBold | ×1.5 |
| Body primary       | `bodyPrimary`          | 14–15     | Regular   | ×1.5        |
| Body secondary     | `bodySecondary`        | 12–13     | Regular   | ×1.5        |
| Captions / hints   | `caption`              | 11–12     | Regular   | ×1.5        |
| Button text        | `button` / `buttonSemiBold` | 14–16 | Medium/SemiBold | ×1.5 |
| Input text         | `input`                | 14–15     | Regular   | ×1.5        |
| Label              | `label`                | 12–13     | Medium    | ×1.5        |

All sizes are responsive via `moderateScale()` so they adapt to device width.
