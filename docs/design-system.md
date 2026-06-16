# Design System

## Direction

Work Planner использует направление из собственного Figma-референса: теплый, мягкий, дружелюбный mobile-first интерфейс для ежедневной работы с записями, клиентами и доходами.

Figma-проект используется как визуальный референс по настроению, формам, плотности и компонентным паттернам. Не копировать сторонние логотипы, брендовые иллюстрации, персонажей и уникальные assets без явного права на использование.

Ключевые свойства:

- mobile-first, хорошо выглядит от `360px`;
- спокойный светлый интерфейс;
- крупные touch targets;
- мягкие скругления;
- понятная иерархия данных;
- рабочий продукт, не лендинг;
- русский язык интерфейса по умолчанию;
- dark mode не реализуется сразу, но токены называются так, чтобы добавить его позже.

## Figma Reference

Референс:

```text
https://www.figma.com/design/rN83MV1VgWu6SD6tprAMwi/work-planner-design-reference?node-id=0-1
```

Новый Figma-файл является пользовательской копией референса для Work Planner. Через MCP файл сейчас не открылся из-за HTML/Cloudflare challenge, поэтому текущая спецификация фиксирует уже извлеченные ранее визуальные наблюдения и применяет их к пользовательскому Figma-референсу.

Зафиксированные наблюдения из дизайн-референса:

- используются light/dark варианты компонентов;
- кнопки имеют высоты `40px`, `48px`, `56px`;
- иконки используют размеры `16px`, `21px`, `24px`, `32px`;
- карточки используют мягкие границы и радиусы около `12px`;
- фоновые секции используют светлый нейтральный фон около `#F6F6F6`;
- основной текст близок к `#393938` / `#303030`;
- border/separator light близок к `#E9E7E2`;
- акценты включают розовый `#EF89C4`, зеленый `#49A35B`, голубой `#58A7F7`.

## Responsive Rules

Breakpoints:

```text
360px   minimum supported mobile width
390px   common mobile width
768px   tablet
1024px  desktop start
1280px  primary desktop QA width
```

Mobile:

- одна колонка;
- bottom navigation;
- основные действия доступны большим thumb-friendly controls;
- sticky/fixed primary action допустим только если не перекрывает контент;
- горизонтальный скролл запрещен.

Tablet:

- список и детали могут переходить в двухколоночный layout;
- calendar получает больше ширины, но сохраняет mobile-friendly tap targets;
- bottom navigation можно сохранять до `1023px`.

Desktop:

- полноценный dashboard layout, не растянутый mobile;
- sidebar navigation;
- контент ограничивается читаемой шириной;
- рабочие экраны могут иметь split view: список слева, детали/форма справа.

## Color Tokens

Использовать semantic tokens, не прямые названия цветов в компонентах.

Light theme:

```text
--color-background: #F8F6F1
--color-surface: #FFFFFF
--color-surface-muted: #F6F6F6
--color-text: #303030
--color-text-muted: #6F6F68
--color-border: #E9E7E2
--color-primary: #393938
--color-primary-foreground: #FFFFFF
--color-accent-pink: #EF89C4
--color-accent-green: #49A35B
--color-accent-blue: #58A7F7
--color-warning: #F4A261
--color-danger: #D9534F
--color-success: #49A35B
```

Usage rules:

- `background` для общего фона приложения;
- `surface` для карточек, sheet, modal, form panels;
- `surface-muted` для вторичных блоков и календарных областей;
- `primary` для главных CTA и сильного текста;
- `accent-*` только для статусов, типов записей и маленьких акцентов;
- не строить интерфейс вокруг одного яркого цвета.

Appointment colors:

```text
work: accent-green
personal: accent-blue
cancelled: text-muted + border
completed: primary text + muted background
pending sync: accent-pink
failed sync: danger
```

## Typography

Figma-референс использует дружелюбный геометрический характер типографики. В проекте использовать системный UI font stack, чтобы не тянуть внешний webfont и не усложнять загрузку.

Fallback:

```text
font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
```

Scale:

```text
display: 32px / 40px / 700
h1:      28px / 36px / 700
h2:      24px / 32px / 700
h3:      20px / 28px / 700
body:    16px / 24px / 500
body-sm: 14px / 20px / 500
caption: 12px / 16px / 600
label:   13px / 18px / 700
number:  24px / 32px / 700
```

Rules:

- no negative letter spacing in implementation;
- headings are compact inside cards and dashboards;
- long Russian labels must wrap cleanly;
- monetary values use tabular numbers when possible.

## Spacing, Radius, Elevation

Spacing scale:

```text
4, 8, 12, 16, 20, 24, 32, 40, 48
```

Layout spacing:

```text
mobile page padding: 16px
mobile section gap: 24px
desktop page padding: 32px
desktop content max width: 1180px
form field gap: 16px
card inner padding: 16px mobile, 20px desktop
```

Radius:

```text
button: 999px for primary rounded actions
input: 14px
card: 16px
modal/sheet: 24px
calendar item: 12px
avatar/photo: 16px
```

Elevation:

- base UI relies mostly on borders and background contrast;
- shadows are soft and rare;
- use stronger elevation only for modal, sheet, floating action, bottom nav.

## Components

Buttons:

- heights: `40px`, `48px`, `56px`;
- primary buttons use pill radius;
- icon-only buttons use `40px` or `48px` square/circle hit area;
- disabled state must be visually clear and non-interactive;
- destructive actions use danger color only when the action is final or high impact.

Inputs:

- minimum height `48px`;
- label above field;
- helper/error text below field;
- error state changes border and text, not layout height unexpectedly;
- phone/social fields use clear platform labels.

Cards:

- card radius `16px`;
- card border uses `--color-border`;
- no cards inside cards;
- appointment cards show title, client, time, type/status, amount;
- cancelled appointment cards are visually muted.

Navigation:

- mobile uses bottom navigation with 4-5 items;
- desktop uses sidebar;
- active item uses filled/soft background and clear icon/text state;
- use `lucide-react` icons, not copied Figma SVGs.

Lists:

- primary list item height should stay stable;
- list item click/tap target at least `44px`;
- support empty states without decorative overload;
- search and filters stay reachable on mobile.

Calendar:

- mobile defaults to list/day agenda plus compact calendar controls;
- desktop supports week/month views;
- `work` and `personal` use distinct but calm colors;
- cancelled records are muted and excluded from salary stats.

Reports:

- use clear metric cards;
- charts are secondary to readable totals;
- monthly salary and session count are first-level metrics;
- use `Recharts` with project tokens, not library defaults.

Modals and sheets:

- mobile uses bottom sheets for forms/details;
- desktop can use modal or side panel;
- destructive confirmations require explicit action text.

## Screen Patterns

Auth:

- centered mobile-friendly form;
- simple title, email/password fields, primary CTA;
- no marketing hero;
- after registration, show pending activation state.

Pending account:

- clear explanation that account is waiting for activation;
- no access to working data;
- allow logout.

Appointments list:

- primary screen after login;
- show today/upcoming first;
- quick add action;
- filters for type/status/date.

Calendar:

- month/week/day controls;
- mobile-first interaction;
- appointment type/status visible without opening details.

Clients:

- search first;
- list cards with name, label, city/contact hint;
- archived clients hidden by default.

Reports:

- monthly salary;
- completed work sessions count;
- filters by period;
- personal/cancelled excluded.

Settings:

- profile/session controls;
- sync status;
- backup/admin instructions later if needed.

## Accessibility

Requirements:

- minimum tap target `44px`;
- visible keyboard focus for all interactive controls;
- text contrast meets WCAG AA where possible;
- forms have labels tied to inputs;
- errors are shown textually, not only by color;
- navigation works with keyboard;
- reduced motion respected for transitions;
- bottom navigation does not cover content.

## Implementation Mapping

Tailwind:

- map color tokens to CSS variables;
- configure radius scale from this document;
- do not hardcode Figma color names inside components;
- component classes should reference semantic tokens.

shadcn/ui:

- use as primitive base for button, input, dialog, sheet, tabs, dropdown, popover, toast;
- customize tokens globally instead of one-off overrides;
- keep components accessible by default.

Icons:

- use `lucide-react`;
- default icon size `20px` in nav/buttons;
- use `16px` for compact metadata;
- use `24px` for standalone actions.

QA viewports:

```text
360x740
390x844
768x1024
1280x800
```

Frontend implementation must be verified on all QA viewports before considering UI work complete.
