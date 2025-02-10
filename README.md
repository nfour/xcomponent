# XComponent

A microframework that combines MobX and React to solve common performance, state management, and lifecycle issues.

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

### Basic Component

```tsx
import { X } from '@n4s/xcomponent'

const MyComponent = X<{ count: number }>(({ count }) => (
  <div>{count}</div>
))
```

### Inline State

```tsx
import { X, Value } from '@n4s/xcomponent'

const Counter = X(() => {
  const state = X.useState(() => class {
    count = new Value(0)
    get doubledCount() {
      return this.count.value * 2
    }

    increment = () => this.count.set(this.count.value + 1)
  })

  return (
    <>
      Count: {state.count.value}, Doubled Count: {state.doubledCount}
      <button onClick={state.increment}>+</button>
    </>
  )
})

/**
 * This demonstrates taking in props, using them observably within X.useState.
 * 
 * <ObservablePropsCounter multiplier={2.5} initialCount={0} />
 */
const ObservablePropsCounter = X<{ initialCount: number, multiplier: number }>((props) => {
  const state = X.useState(props, (props) => class {
    count = new Value(props.initialCount)
    get multipliedCount() {
      return this.count.value * props.multiplier // props.multiplier is observable!
    }

    increment = () => this.count.set(this.count.value + 1)
  })

  return (
    <>
      Count: {state.count.value}, Multiplied Count: {state.multipliedCount}
      <button onClick={state.increment}>+</button>
    </>
  )
})
```

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


### Component Composition

In the below examples you can see how to create a `Dialog` component with `Header` and `Body` subcomponents.

```tsx
const Dialog = X(({ children }) => (
  <div className={Dialog.classes.dialog} >{children}</div>
)).with({
  Header: X(({ children }) => (
    <header className={Dialog.classes.header} >{children}</header>
  )),
  Body: X(({ children }) => (
    <div className={Dialog.classes.body}>{children}</div>
  )),
  classes: {
    dialog: 'dialog',
    header: 'dialog-header',
    body: 'dialog-body',
  }
})

// Usage
<Dialog css={{
  // Can also ovveride using the classes we defined.
  [`.${Dialog.classes.dialog}`]: {
    background: 'white',
    padding: '1rem',
  }
}}>
  <Dialog.Header>Title</Dialog.Header>
  <Dialog.Body>Content</Dialog.Body>
</Dialog>
```


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

## Documentation

- [Extended Documentation and Examples](./ExtendedExplanation.md)
  - Further reading for advanced use cases, justifications etc.
- [Conventions](./Conventions.md)
  - Plug this into your AI instructions as prompts.
## License

MIT
