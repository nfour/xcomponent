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

## Conventions

### Use `class` syntax for all state

Mobx and classes go very well together, and classes are a great structure to represent the imperative nature of state. 

Local and global state each use the same class structure, which makes it easy to refactor state around.

### Use `X` as a namespace for all component and state primitives

A convenient singleton to compose all general component & state patterns in your project. Think of it like a toolbelt.

### Dismiss unecessary React hooks

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

## How does it compare?

The library provides ways to solve boilerplate and inconsistency issues that arise when using mobx with react, while being fairly intuitive & minimal for those familiar with mobx in react.


### Drop in replacement for `observer`

```tsx
// BEFORE:

import { observer } from 'mobx-react-lite'

const MyComponent = observer<{ someProp: number }>((props) => <>{props.someProp}</>)

// AFTER:
import { X } from '@n4s/xcomponent'

const MyComponent = X<{ someProp: number }>((props) => <>{props.someProp}</>)
```

### Enhanced composition pattern

```tsx
// BEFORE:

import { observer } from 'mobx-react-lite'

const Dialog = observer<{ children: ReactNode }>((props) =>
  <>
    {props.children}
  </>
)

const DialogHead = observer<{ children: ReactNode }>((props) =>
  <h2>
    {props.children}
  </h2>
)

<Dialog><DialogHead>Title</DialogHead>Content</Dialog>

// AFTER:
import { X } from '@n4s/xcomponent'

const Dialog = X<{ children: ReactNode }>((props) => <>{props.children}</>)
  .with({
    Head: X<{ children: ReactNode }>((props) => <h2 className={Dialog.classes.head}>{props.children}</h2>),

    // Can provide any static property, such as surfacing public classnames to override styles with.
    classes: {
      head: 'dialog-head',
    }
  })

<Dialog><Dialog.Head>Title</Dialog.Head>Content</Dialog>
```

### Full example comparison

```tsx
// BEFORE:

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
    <button onClick={() => state.setCount(state.count +1)}>Incr</button>
  </>
})

// AFTER:

import { X } from '@n4s/xcomponent'

export const MyComponent = X<{ someProp: number }>((props) => {
  const state = X.useState(() => class {
    count = new X.Value(0)
    props = new X.Value(props)

    get combinedNumber() {
      return this.count.value + this.props.value.someProp
    }
  })

  X.useOnMounted(() => { console.log('mounted, do some setup') })
  X.useOnUnmounted(() => { console.log('unmounted, do some cleanup') })
  X.useProps(props, state.props) // Syncs prop changes with state.props efficiently
  // X.useOnUpdated(props, (newProps) => state.props.set(newProps)) // Syncs prop changes with state.props efficiently

  return <>
    <div>{props.someProp}</div>
    <div>{state.count.value}</div>
    <div>{state.combinedNumber}</div>
    <button onClick={() => state.count.set(state.count.value +1)}>Incr</button>
  </>
})
```

## Move class state wherever you need it

```tsx
// FILE: ./MyComponentState.ts
import { X } from '@n4s/xcomponent'

// Can live outside of the react component, in this case it's in its own file and thus completely decoupled from React.
export class MyComponentState {
  props = new X.Value({ someProp: 0 })
  count = new X.Value(0)

  get combinedNumber() {
    return this.count.value + this.props.value.someProp
  }
}

// FILE: ./MyComponent.tsx
import { X } from '@n4s/xcomponent'
import { MyComponentState } from './MyComponentState'

// Can re-use the type defined by the state class!
type MyComponentProps = typeof MyComponentState['props']['value']

export const MyComponent = X<MyComponentProps>((props) => {
  const state = X.useState(() => MyComponentState)

  X.useProps(props, state.props) // Keeps props in sync with our class instance

  return <>
    <div>{props.someProp}</div>
    <div>{state.count.value}</div>
    <div>{state.combinedNumber}</div>
    <button onClick={() => state.count.set(state.count.value +1)}>Incr</button>
  </>
})

```

## Expected application usage

It is encouraged to re-export your own `X` function/namespace, using `X.extend({})`, to provide any additional tools across your project.

```tsx
// FILE: src/X.ts

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

```tsx
// FILE: ./MyComponent.tsx
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