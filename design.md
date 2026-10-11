# Design System Specification — Lenny Growth Intelligence

## 1. Visual Identity & Design Philosophy
**Editorial Research Studio Meets Modern AI Strategy Workspace.**
The aesthetic balances scholarly typography with crisp modern software design tokens, avoiding generic gradients or noisy glassmorphism.

## 2. Color Palette & Tokens
- **Primary Background (`--bg-primary`)**: `#FDFBF7` (Warm Ivory / Linen)
- **Secondary Background (`--bg-secondary`)**: `#F8F5EE` (Soft Off-White)
- **Card Background (`--bg-card`)**: `#FFFFFF` (Pure White)
- **Primary Typography (`--text-primary`)**: `#1B2533` (Deep Ink Navy)
- **Secondary Typography (`--text-secondary`)**: `#4A5568` (Slate Neutral)
- **Muted Typography (`--text-muted`)**: `#718096` (Cool Grey)
- **Primary Accent (`--accent-violet`)**: `#6366F1` (Restrained Indigo / Violet)
- **Status Indicator Mint (`--accent-mint`)**: `#10B981` (Connected / Healthy)
- **Status Indicator Amber (`--accent-amber`)**: `#F59E0B` (Warning / Offline)

## 3. Typography Hierarchy
- Headings: Clean, modern high-contrast sans & editorial serif (`Inter`, `Newsreader`, `Charter`)
- Body Copy: 15px / 1.5 line-height for long-form readability.
- Code & Meta: `JetBrains Mono` / `Fira Code` for timestamps and technical artifacts.

## 4. UI Components & Layouts
- **Three-Column Flexible Grid**:
  1. **Sidebar Navigation (280px fixed)**: New session triggers, model provider dropdown, session history, and live knowledge base chunk counters.
  2. **Chat & Evidence Canvas (flexible)**: Chat messages, quick suggestion chips, citation badges, and artifact transformation triggers.
  3. **Artifact Workspace (480px on desktop / overlay on mobile)**: Live preview of HTML/CSS scorecards or Markdown briefs with source code viewer and download.
