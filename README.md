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

### Basic Component

When NOT using a compile plugin to auto-wrap components for observability:

```tsx
// BEFORE: MobX Observer
import { observer } from 'mobx-react-lite'
const MyComponent = observer((props: { someProp: number }) => <>{props.someProp}</>)

// AFTER: XComponent
import { X } from '@n4s/xcomponent'
const MyComponent = X((props: { someProp: number }) => <>{props.someProp}</>)
```

If you ARE using a compile plugin to auto-wrap, you can omit the HOC wrapper:

```tsx
export const MyComponent = (props: { someProp: number }) => {
  const state = X.useState(props, (p) => class {
    foo = new Value(0)

    get computed() {
      return this.foo.value + p.someProp
    }
  })

  return <>{state.computed}</>
}
```

### Inline State

```tsx
import { X, Value } from '@n4s/xcomponent'

const Counter = () => {
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
}

/**
 * This demonstrates taking in props, using them observably within X.useState.
 * 
 * <ObservablePropsCounter multiplier={2.5} initialCount={0} />
 */
const ObservablePropsCounter = (props: { initialCount: number, multiplier: number }) => {
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
}
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


#### Value

The `Value` class is effectively `observable.box` of interface `{ value: T, set: (value: T) => void }`.

Features:
- Type inferrence
- Async mobx actions (no need to wrap in `runInAction` or use `flow` generators)
- Terseness
- Avoids reading `value` until necessary during prop-passing
- Supports two way binding patterns

```tsx
const selectedFruit = new Value<'banana'|'apple'|undefined>(undefined)
selectedFruit.set('test') // TS error
selectedFruit.set('banana') // Valid
selectedFruit.value // 'banana'
```

####  AsyncValue

Think of `react-query` for this one. It is a `Value` that can be in a loading state, and can be awaited.


Features:
- Ergonomic types
- Async mobx actions
- Queuing
- Promise cancellation
- Pending state
- Error state
- Success state
- Progress state (eg. for uploads)

```tsx
async function fetchFiles(c: { userId: string; foo: number }): Promise<{ name: string }[]> {
  return []
}

class ExampleModel {
  constructor() { makeAutoObservable(this) }
  activeUserId = '22'
  files = new AsyncValue(async ({ foo }: { foo: number }) =>
    fetchFiles({ userId: this.activeUserId, foo })
  )
}

const example = new ExampleModel()
example.files.value?.[0]?.name // undefined - missing data
await example.files.query({ foo: 22 }) // foo is strongly typed, inferred!
example.files.value?.[0]?.name // 'myFile.txt' - has data!
example.files.error // undefined - no error
example.files.isPending // false - we already awaited it

const v = new AsyncValue(() => fetchUsersList())
v.value // undefined
const promise = v.query() // Don't need to provide params as none are defined
v.isPending // true
await promise
v.isPending // false
v.value // [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }]
```


####  BoxedValue

Very similar to `Value`, however, allows for the getter and setter to be defined seperately, and additionally encapsulates the observable value inside the closure.

```tsx

const blah = { something: 'banana' }

const somethingFromUri = new BoxedValue(
  // getter
  () => uriRoutes.someRoute.search.something,
  // setter
  (newValue) => uriRoutes.someRoute.push((uri) => ({ search: { something: newValue } })),
)

somethingFromUri.value // 'foo'
somethingFromUri.set('bar')
somethingFromUri.value // 'bar'

// Here we omit the setter, so the value is read-only
// This is effectively just a container encapsulating the value
const somethingWrappedToOptimizeObservability = new BoxedValue(
  () => blah.something,
)

somethingWrappedToOptimizeObservability.value // 'banana'
somethingWrappedToOptimizeObservability.set('banana') // does nothing, because no setter
  
```

####  BoolValue

A `Value` that is specifically for boolean values. It has a few additional methods to make working with booleans easier.

```tsx

const isOpen = new BoolValue(true)

isOpen.toggle() // false
isOpen.toggle() // true
isOpen.setFalse()
isOpen.value // false
isOpen.isTrue // false
isOpen.setTrue()
isOpen.isTrue // true
isOpen.value // false

const Example = X(() => 
  <>
    <button onClick={isOpen.toggle}>Open</button>
    <Dialog onClose={isOpen.setFalse}>...</Dialog>
  </>
)
```

## Documentation

- [Conventions](./Conventions.md)
  - Plug this into your AI instructions as prompts.

## License

MIT
