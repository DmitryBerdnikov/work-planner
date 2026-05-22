# React

- Move business logic into hooks; components should not contain business logic. UI logic such as whether a component is open or closed can remain at the component level.

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
- `views/` — pages; `ui/` — reusable blocks not tied to a specific route.
- Name handlers using the following convention: `handleSubmit`, `handleClick`.

## Styles in JSX

- Use classes via `cn()`, and Tailwind tokens from the design system.
- Icons: `lucide-react`, size controlled through the `size` prop.

## Forms

- Use React Hook Form + Zod resolver from `@work-planner/shared`.
- Form schema should be a subset or `pick` from the shared schema, not a full DTO copy-paste.
