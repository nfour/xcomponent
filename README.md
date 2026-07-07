# XComponent

A microframework that combines MobX and React to solve common performance, state management, and lifecycle issues.

+ [Install](#install)
+ [Features](#features)
+ [Usage](#usage)
  + [Basic Component](#basic-component)
  + [Inline State](#inline-state)
  + [Lifecycle Hooks](#lifecycle-hooks)
  + [Component Composition](#component-composition)
+ [API](#api)
  + [Core](#core)
  + [Models](#models)
    + [Value](#value)
    + [AsyncValue](#asyncvalue)
    + [BoxedValue](#boxedvalue)
    + [BoolValue](#boolvalue)
+ [Documentation](#documentation)
+ [License](#license)

## Install

```bash
pnpm add @n4s/xcomponent
```

## Features

- Drop-in replacement for MobX `observer`
- Built-in state management patterns
- Simplified lifecycle hooks
- Component composition utilities
- Helper models for common use cases

## Usage

For day-to-day usage, treat [SKILL.md](./SKILL.md) as the primary guide. It is the first-class usage reference for authoring xcomponent-based components, including build-time auto observer wrapping, local state patterns, reactions, async state, and composition.

Use this README for the compact overview. Use [SKILL.md](./SKILL.md) for the authoritative workflow, caveats, and expanded examples.

### Basic Component

Manual wrap mode:

```tsx
import { X } from '@n4s/xcomponent'

export const UserName = X(({ name }: { name: string }) => {
  return <span>{name}</span>
})
```

Build-time auto-wrap mode:

```tsx
import { X, Value } from '@n4s/xcomponent'

export const UserName = (props: { name: string }) => {
  const state = X.useState(props, (props) => class {
    prefix = new Value('User:')

    get label() {
      return `${this.prefix.value} ${props.name}`
    }
  })

  return <span>{state.label}</span>
}
```

Use bare functions only when your build step really does inject MobX observation.

### Inline State

```tsx
import { X, Value } from '@n4s/xcomponent'

export const Counter = X(() => {
  const state = X.useState(() => class {
    count = new Value(0)

    get doubled() {
      return this.count.value * 2
    }

    increment = () => this.count.set(this.count.value + 1)
  })

  return (
    <>
      <div>{state.count.value}</div>
      <div>{state.doubled}</div>
      <button onClick={state.increment}>+</button>
    </>
  )
})
```

For observable props, custom-hook extraction, and functional-state variants, use [SKILL.md](./SKILL.md).

### Lifecycle Hooks

The goal of this library is to avoid using hooks from `react` during normal state management operations, thus the below lifecycle hooks are provided.

```tsx
X.useOnMounted(() => {
  // Called when component mounts
})

X.useOnUnmounted(() => {
  // Called when component unmounts
})

X.useReaction(
  () => state.someValue,
  (newValue) => {
    // Called on first render, and whenever observable dependencies change
  }
)

X.useAutorun(() => {
  // Called on first render, and whenever observable dependencies change
})
```

`X.useReaction` uses `fireImmediately: true` and structural comparison by default. See [SKILL.md](./SKILL.md) for the caveats around observable tracking and prop-driven reactions.

### Component Composition

Use `.with()` to attach subcomponents or static class maps.

```tsx
const Dialog = X(({ children }: { children: React.ReactNode }) => {
  return <div className={Dialog.classes.root}>{children}</div>
}).with({
  Header: X(({ children }: { children: React.ReactNode }) => {
    return <header className={Dialog.classes.header}>{children}</header>
  }),
  Body: X(({ children }: { children: React.ReactNode }) => {
    return <section className={Dialog.classes.body}>{children}</section>
  }),
  classes: {
    root: 'dialog-root',
    header: 'dialog-header',
    body: 'dialog-body',
  },
})
```

See [SKILL.md](./SKILL.md) for the full composition guidance and usage patterns.

## API

### Core

- `X<Props>()` - Create an observed component with type support
- `X.useState()` - Create component-scoped state
- `X.useOnMounted()` - Mount lifecycle hook
- `X.useOnUnmounted()` - Unmount lifecycle hook
- `X.useReaction()` - MobX reaction hook
- `X.useAutorun()` - MobX autorun hook

### Models

- `Value<T>` - Observable value container
- `AsyncValue<T>` - Async state container with pending/error/value states
- `BoxedValue<T>` - Encapsulated observable with custom getter/setter
- `BoolValue` - Boolean value with toggle utilities

For workflow guidance on when to choose each model, use [SKILL.md](./SKILL.md).

#### Value

The `Value` class is effectively `observable.box` of interface `{ value: T, set: (value: T) => void }`.

```tsx
const selectedFruit = new Value<'banana'|'apple'|undefined>(undefined)
selectedFruit.set('test') // TS error
selectedFruit.set('banana') // Valid
selectedFruit.value // 'banana'
```

#### AsyncValue

Think of `react-query` for this one. It is a `Value` that can be in a loading state, and can be awaited.

```tsx
const users = new AsyncValue(async ({ orgId }: { orgId: string }) => {
  return fetchUsers(orgId)
})

await users.query({ orgId: 'acme' })
users.value
users.error
users.isPending
```

For query lifecycle details such as `reset()`, `clone()`, and prop-driven querying, use [SKILL.md](./SKILL.md).

#### BoxedValue

Very similar to `Value`, however, it allows the getter and setter to be defined separately and encapsulates the observable value inside the closure.

```tsx
const selectedId = new BoxedValue(
  () => route.search.userId,
  (userId) => route.push((uri) => ({ search: { userId } })),
)
```

Read `boxed.value` inside render or a computed getter so MobX can track it. See [SKILL.md](./SKILL.md) for the reactivity caveat.

#### BoolValue

Use for booleans with convenience helpers.

```tsx
const isOpen = new BoolValue(false)
isOpen.toggle()
isOpen.setTrue()
isOpen.setFalse()
```

## Documentation

- [SKILL.md](./SKILL.md)
  - First-class usage guide for humans and AI tooling.
- [src/stories/demoApp](./src/stories/demoApp)
  - Larger example app structure using xcomponent patterns.

If README and [SKILL.md](./SKILL.md) ever disagree, prefer [SKILL.md](./SKILL.md).

## License

MIT
