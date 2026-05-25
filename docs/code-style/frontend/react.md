# React

- Move business logic into `modules/<feature>/hooks/`; components should not contain business logic. UI logic such as whether a component is open or closed can remain at the component level.

## Components

- Use only arrow functions components.

```tsx
export const MyComponent = () => {
	return <div>component</div>
}
```

- Props should use `type XxxProps`;

```tsx
import type { ButtonHTMLAttributes } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: 'primary' | 'secondary' | 'ghost'
}

export const Button = ({
	className,
	variant = 'primary',
	...props
}: ButtonProps) => {
	// ...
}
```

- One main component per file.
- `pages/` — route entry components; `shared/ui/` — reusable primitives; `modules/<feature>/ui/` — feature-specific UI.
- Name handlers using the following convention: `handleSubmit`, `handleClick`.

## Module Layout Example

```text
modules/clients/
  model/clients-queries.ts
  model/clients-form.ts
  hooks/use-clients-list.ts
  hooks/use-save-client.ts
  hooks/use-client-archive.ts
  hooks/use-invalidate-clients.ts
  hooks/use-clients-page.ts
  ui/client-card.tsx
  index.ts
pages/clients-page/
  clients-page.tsx
```

## Styles in JSX

- Use classes via `cn()` from `shared/lib/cn.ts`, and Tailwind tokens from the design system.
- Icons: `lucide-react`, size controlled through the `size` prop.

## Forms

- Use React Hook Form + Zod resolver from `@work-planner/shared`.
- Form schema should be a subset or `pick` from the shared schema, not a full DTO copy-paste.
- Form components live in `modules/<feature>/ui/`.
