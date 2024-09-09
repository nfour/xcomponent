# XComponent

This is a small wrapper around `react-mobx-lite` to provide a more ergonomic API, which resembles the state lifecycle of `vue.js`

The focus is on:
- Conventions
- Ergonomics
- Consistency
- Mobx observability
- React ecosystem

## Why

React's ecosystem is a great place to be, so we do not want to leave it for `vue` or `svelte` just because of how annoying `hooks`, state management and render performance can be.

So we use an observable solution like mobx. It solves the performance problems, but it also adds boilerplate and doesn't quite match React's flow. There is no "correct" convention either, so your team is left to "figure it out".

This library exists to define a convention while being simple enough to review or copy paste parts of it into your own project as desired.

## How does it compare?

The library provides ways to solve boilerplate and inconsistency issues that arise when using mobx with react, while being fairly intuitive & minimal for those familiar with mobx in react.


### Drop in replacement for `observer`

```tsx
//
// BEFORE:
//
import { observer } from 'mobx-react-lite'

const MyComponent = observer<{ someProp: number }>((props) => <>{props.someProp}</>)

//
// AFTER:
//
import { X } from '@n4s/xcomponent'

const MyComponent = X<{ someProp: number }>((props) => <>{props.someProp}</>)
```

### Enhanced composition pattern

```tsx
//
// BEFORE:
//

import { observer } from 'mobx-react-lite'

const Dialog = observer<{ children: ReactNode }>((props) =>
  <> {props.children} </>
)

const DialogHead = observer<{ children: ReactNode }>((props) =>
  <h2>{props.children}</h2>
)

const Example = () => <Dialog><DialogHead>Title</DialogHead>Content</Dialog>

//
// AFTER:
//

import { X } from '@n4s/xcomponent'

const Dialog = X((props) =>
  <>{props.children}</>
)
.with({
  Head: X((props) =>
    <h2 className={Dialog.classes.head}>{props.children}</h2>
  ),

  // Can provide any static property, such as surfacing public classnames to override styles with.
  classes: {
    head: 'dialog-head',
  }
})

const Example = () => <Dialog><Dialog.Head>Title</Dialog.Head>Content</Dialog>
```

### Full example comparison

```tsx
//
// BEFORE:
//

import { observer } from 'mobx-react-lite'
import React from 'react'

export const MyComponent = observer<{ someProp: number }>((props) => {
  const [state] = React.useState(() => new (class {
    constructor() {
      makeAutoObservable(this)
    }

    count = 0
    someProp = props.someProp

    get combinedNumber() {
      return this.count + this.someProp
    }

    setCount = (value: number) => this.count = value
    setSomeProp = (value: number) => this.someProp = value

    increment = () => this.setCount(this.count + 1)
    
  })())

  useEffect(() => {
    console.log('mounted')
    return () => {
      console.log('unmounted')
    }
  }, [])

  useEffect(() => {
    if (state.someProp !== props.someProp)
      state.setSomeProp(props.someProp)
  }, [state.someProp])
  

  return <>
    <div>{props.someProp}</div>
    <div>{state.count}</div>
    <div>{state.combinedNumber}</div>
    <button onClick={state.increment}>Incr</button>
  </>
})

//
// AFTER:
//

import { X } from '@n4s/xcomponent'

export const MyComponent = X<{ someProp: number }>((props) => {
  const state = X.useState(() => class {
    props = new X.Value(props) // initialized with `props` only for type inferrence
    count = new X.Value(0)

    get combinedNumber() {
      return this.count.value + this.props.value.someProp
    }

    increment = () => this.count.set(this.count.value + 1)
  })

  X.useProps(props, state.props) // Syncs prop changes with state.props efficiently
  X.useOnMounted(() => { console.log('mounted, do some setup') })
  X.useOnUnmounted(() => { console.log('unmounted, do some cleanup') })

  return <>
    <div>{props.someProp}</div>
    <div>{state.count.value}</div>
    <div>{state.combinedNumber}</div>
    <button onClick={state.increment}>Incr</button>
  </>
})
```

## Move class state wherever you need it

State should be decoupled completely from the component so that it may be reasoned with effectively. This keeps things sane as a project grows.

In this example the state lives in another file, and the component is just a view into that state.

- ./src/MyComponentState.ts
```tsx
import { X } from '@n4s/xcomponent'

export class MyComponentState {
  props = new X.Value({ someProp: 0 })
  count = new X.Value(0)

  get combinedNumber() {
    return this.count.value + this.props.value.someProp
  }

  increment = () => this.count.set(this.count.value + 1)
}
```
- ./src/MyComponent.tsx
```tsx
import { X } from '@n4s/xcomponent'
import { MyComponentState } from './MyComponentState'

// Can re-use the type defined by the state class to keep DRY
type MyComponentProps = typeof MyComponentState['props']['value']

export const MyComponent = X<MyComponentProps>((props) => {
  const state = X.useState(() => MyComponentState)
  X.useProps(props, state.props)

  return <>
    <div>{props.someProp}</div>
    <div>{state.count.value}</div>
    <div>{state.combinedNumber}</div>
    <button onClick={state.increment}>Incr</button>
  </>
})

```

## Expected application usage

It is encouraged to re-export your own `X` function/namespace, using `X.extend({})`, to provide any additional tools across your project.

- ./src/X.ts
```tsx
// The idea is to put everything in here related to the general tools needed to work within your project
// WARNING: Avoid expensive imports, stick to small generic tools that are frequently imported, this will keep things working fast and help avoid cyclic dependencies.

import { X as XComponent } from '@n4s/XComponent';
import { useRootState } from './RootState'; // Your custom hook
import { SomeValueModel } from './models/SomeValueModel'; // Your custom class

import dayjs from 'dayjs';
import timezonePlugin from 'dayjs/plugin/timezone';
import utcPlugin from 'dayjs/plugin/utc';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(timezonePlugin);
dayjs.extend(utcPlugin);
dayjs.extend(isBetween);

export const X = XComponent.extend({ dayjs, useRootState, SomeValueModel });
```

then

- ./src/MyComponent.tsx
```tsx
import { X } from '@/X'; // Or however you would like to import

const MyComponent = X<{ someProp: number }>((props) => {
  X.useRootState(); // Available project-wide now

  const state = X.useState(() => class {
    val = new X.SomeValueModel() // Available project-wide now

    get date() {
      return X.dayjs(this.val.value).tz('America/New_York').format('YYYY-MM-DD')
    }
  })

  // ...
  return <div css={{ color: 'red' }}>
    {state.val.value}
  </div>
})
```

## Conventions / Philosophy

### Use `class` syntax for all state

Mobx and classes go well together, and classes are a great structure to represent the imperative nature of state in Typescript.

Local and global state each use the same class structure, which makes it easy to refactor state into different locations.

Classes also double up as a type interface so that we may effectively define the shape of our data and avoid boilerplate and misdirection.

### Use `X` as a namespace for all generic component and state primitives

The idea is that `X` is a namespace for all the tools you need to work with state and view. This should be customized for each project. It should be a small set of tools that are frequently used across the project and which have no meaningful cost to import everywhere.

Examples:
- Hooks
- Utilities
- Primitives
- Simple structural components (X.Col, X.Row, X.Grid etc.)
  - Should not have dependencies on other components or large libraries
  - Avoid `X.Button`, `X.DateSelector`, `X.Select` etc. as these are too specific and should be in a component library, as they would likely include dependencies and significant runtime cost.

The goal is not to have a large library of components, but to have a small set of tools that are frequently used and which can be easily reviewed and understood by the team through a single compositional root where `X` is composed.

### Dismiss unecessary React hooks

Moving logic to `mobx` allows for the majority of React state-related hooks to be dismissed. The nature of observables means that many of React's lifecycle hooks corrupt the state lifecycle, and should be avoided. We want to let `mobx` handle it.

- Good:
  - `useEffect`
    - X Alternatives:
      -  `useOnMounted`
      -  `useOnUnmounted`
      -  `useProps`
      -  `useReaction`
  - `useLayoutEffect`
  - `useRef`
- Unecessary:
  - `useCallback`
  - `useState`
  - `useReducer`
  - `useMemo` maybe?
  - etc.

## Helper models

### Value

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

### AsyncValue

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
await v.query() // Don't need to provide params as none are defined
v.value // [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }]
```


### BoxedValue

Very similar to `Value`, however, allows for the getter and setter to be defined seperately, and additionally encapsulates the observable value inside the closure.

```tsx

const blah = { something: 'banana' }

const somethingFromUri = new BoxedValue(
  () => uriRoutes.someRoute.search.something,
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
somethingWrappedToOptimizeObservability.set('banana') // does nothing, as not setter was provided
  
```

### BoolValue

A `Value` that is specifically for boolean values. It has a few additional methods to make working with booleans easier.

```tsx

const isOpen = new BoolValue(true)

isOpen.toggle() // false
isOpen.toggle() // true
isOpen.setFalse()
isOpen.isTrue // false
isOpen.setTrue()
isOpen.isTrue // true

const Example = X(() => 
  <>
    <button onClick={isOpen.toggle}>Open</button>
    <Dialog onClose={isOpen.setFalse}>...</Dialog>
  </>
)
```


