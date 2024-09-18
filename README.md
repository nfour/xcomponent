# XComponent

This is a micro framework that brings together MobX and React in order to solve performance, boilerplate and lifecycle issues with React.

+ [1. Why](#1-why)
+ [2. How does it compare?](#2-how-does-it-compare)
  + [2.1. Drop in replacement for `observer`](#21-drop-in-replacement-for-observer)
  + [2.2. Full example comparison](#22-full-example-comparison)
  + [2.3. Extended example pattern](#23-extended-example-pattern)
+ [3. Details of the API](#3-details-of-the-api)
+ [4. State should be decoupled from the component](#4-state-should-be-decoupled-from-the-component)
  + [4.1. Component composition extender](#41-component-composition-extender)
+ [5. Conventions / Philosophy](#5-conventions--philosophy)
  + [5.1. Use either `class` or `function` syntax consistently for all state](#51-use-either-class-or-function-syntax-consistently-for-all-state)
  + [5.2. As a compositional root toolbox for your project](#52-as-a-compositional-root-toolbox-for-your-project)
  + [5.3. Dismiss unecessary React hooks](#53-dismiss-unecessary-react-hooks)
+ [6. Helper models](#6-helper-models)
  + [6.1. Value](#61-value)
  + [6.2. AsyncValue](#62-asyncvalue)
  + [6.3. BoxedValue](#63-boxedvalue)
  + [6.4. BoolValue](#64-boolvalue)
+ [Guides](#guides)
  + [Working with class-based state](#working-with-class-based-state)
    + [Scaffolding a new project](#scaffolding-a-new-project)


##  1. Why

React's ecosystem is a great place to be, so we do not want to leave it just because of how annoying `hooks`, state management and render performance tweaking is.

So we use an signals/observables solution, like mobx.

It solves the performance problems, but it also adds boilerplate and isn't cleanly interoperable with React's lifecycle. There is also no "correct" convention, so your team is left to "figure it out" on each new project, which further deteriorates consistency.

This is a micro framework which exists to define a convention while also being simple enough to review or copy paste parts of it into your own project as desired.

##  2. How does it compare?

###  2.1. Drop in replacement for `observer`

```tsx
import { observer } from 'mobx-react-lite'

const MyComponent = observer((props: { someProp: number }) => <>{props.someProp}</>)

import { X } from '@n4s/xcomponent'

const MyComponent = X((props: { someProp: number }) => <>{props.someProp}</>)
```

###  2.2. Full example comparison

```tsx
//
// BEFORE:
//

import { observer } from 'mobx-react-lite'
import React from 'react'

// Standard mobx component with some inline class state
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

You'll notice first off a few things:
- Far less boilerplate
- Specific hooks for specific lifecycles
- Props are made and kept observable
  - Instead of using complicated `useEffect` to sync props with state, we use `X.useProps`
  - Then you can use `X.useReaction` or `X.useAutorun` to react to specific prop changes, just like any other observable, anywhere you want to, not just within a react hook.


### 2.3. Extended example pattern

Want to emulate Vue's `setup()` pattern?

```tsx

import { X } from '@n4s/xcomponent'

type Props = { someProp: number }

// By making this another function we have nicely seperated concerns
// And we can make additional hooks calls/lifecycle management which is all state-related
// So that we do not pollute the view component with state management
const useMyComponentState = (props: Props) => {
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

  // This is a custom hook that will run whenever `state.count` changes
  X.useReaction(
    () => state.count,
    () => console.log('count changed to', state.count.value)
  )

  // This is a custom hook that will run whenever `props.someProp` changes
  X.useReaction(
    () => state.props.value.someProp,
    () => console.log('someProp changed to', state.props.value.someProp)
  )

  return state
}

export const MyComponent = X<Props>((props) => {
  const state = useMyComponentState(props)
  
  return <>
    <div>{props.someProp}</div>
    <div>{state.count.value}</div>
    <div>{state.combinedNumber}</div>
    <button onClick={state.increment}>Incr</button>
  </>
})
```

##  3. Details of the API

You can use a class based styled (my preference currently!), or a functional style.

```tsx

// Functional style
export const MyStateFn = () => {
  const count = new X.Value(0)
  const increment = () => count.set(count.value + 1)

  return { count, increment }
}

// Class style
export class MyStateClass {
  count = new X.Value(0)
  increment = () => this.count.set(this.count.value + 1)
}

// and both inside a component, inlined look like this:
export const MyComponent = X(() => {
  // Functional
  const state = X.useState(() => {
    const count = new X.Value(0)
    const increment = () => count.set(count.value + 1)

    return {
      count,
      get someComputed() { return count.value + 999 }
      increment,
    }
  })

  // Class
  const state2 = X.useState(() => class {
    count = new X.Value(0)
    get someComputed() { return this.count.value + 999 }
    increment = () => this.count.set(this.count.value + 1)
  })

  return <></>
})
```

Note: When defining GLOBAL state functions or classes you will still need to add in `makeAutoObservable` or `makeObservable` as needed - it's just standard mobx at this point, no react compatability needed - these mobx utilities could be added to `X`, too, for convenience. 

```tsx
import { makeAutoObservable } from 'mobx'

// standard mobx class state
export class MyGlobalState {
  constructor() {
    makeAutoObservable(this)
  }

  count = new X.Value(0)
  get someComputed() { return this.count.value + 999 }
  increment = () => this.count.set(this.count.value + 1)
}

export function MyGlobalStateFn() {
  const count = new X.Value(0)
  const increment = () => count.set(count.value + 1)

  return makeAutoObservable({
    count,
    increment, 
    get someComputed() { return count.value + 999 }})
   })
}

```


##  4. State should be decoupled from the component

State should be decoupled completely from the component so that it may be reasoned with effectively. This keeps things sane as a project grows.

In this example the state lives in another file, and the component is just a view into that state.

- ./src/MyComponentState.ts
```tsx
import { X } from '@n4s/xcomponent'

export class MyComponentState {
  props = new X.Value({ someProp: 0 }) // Here we store the component's props, but observable
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

// Can re-use the type defined by the state
type MyComponentProps = typeof MyComponentState['props']['value']

export const MyComponent = X((props: MyComponentProps) => {
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

###  4.1. Component composition extender

```tsx
//
// BEFORE:
//

import { observer } from 'mobx-react-lite'

const Dialog = observer<{ children: ReactNode }>((props) => <> {props.children} </> )
const DialogHead = observer<{ children: ReactNode }>((props) => <h2>{props.children}</h2> )
const Example = () => <Dialog><DialogHead>Title</DialogHead>Content</Dialog>

//
// AFTER:
//

import { X } from '@n4s/xcomponent'

const DialogBody = X((props) => <h2 className={Dialog.classes.body}>{props.children}</h2> )

const Dialog = X((props) => <>{props.children}</> )
  .with({
    // Inline component
    Head: X((props) => <h2 className={Dialog.classes.head}>{props.children}</h2> ),
    // Referenced
    Body: DialogBody,

    // Lets add some class names to make it easier to style externally
    classes: {
      head: 'my-fancy-dialog-head',
      body: 'my-fancy-dialog-body',
    }
  })

const Example = () =>
  <Dialog>
    <Dialog.Head>Title</Dialog.Head>
    <Dialog.Body>Content</Dialog.Body>  
  </Dialog>
```

##  5. <a name='ConventionsPhilosophy'></a>Conventions / Philosophy

###  5.1. <a name='Useeitherclassorfunctionsyntaxconsistentlyforallstate'></a>Use either `class` or `function` syntax consistently for all state

Mobx and classes go well together, and classes are a great structure to represent the imperative nature of state.

However, state functions can be more concise.

Ideally you should choose one pattern and roll with it throughout the project. I personally find classes easier to construct trees with, handle dependency injection etc.

Classes also double up as a type interface. The key issue people find with classes is that it can become easier than other structures to become careless, and to overload them with too many responsibilities, which is why we should take note of the single responsibility principal.

Functional code can also suffer from the same issues, but it can be easier to refactor and move around. That flexibility can be a double edged sword, however.

###  5.2. <a name='Asacompositionalroottoolboxforyourproject'></a>As a compositional root toolbox for your project

I also posit the idea that we should encourage a single compositional root for all tools and generic components that are frequently used across a single project.

You would re-export your own `X` to use throughout your projects state & components. Ideally no-where else, leave that to regular imports & conventions.

This pattern would then serve to bring together consistency within a project - there is something to be said for a curated, deliberate namespace with auto-discovery - so that one doesn't have to sift through a sea of tsconfig path aliases, components & utility dumping folders etc. in order to be consistent with the project's conventions.

Only the most battle hardened, necessary tools should appear in your projects `X` root.

A good rule of thumb would be to analyze a project and find the patterns that are heavily repeated, that which an abstraction would actually benefit from.

- ./src/X.ts
```tsx
// Your compositional root for `X`
import { X as XComponent } from '@n4s/XComponent';
import { useRootState } from './RootState'; // Your custom hook
import { SomeDateRelatedModel } from './models/SomeDateRelatedModel'; // Your custom class

import dayjs from 'dayjs';
import timezonePlugin from 'dayjs/plugin/timezone';
import utcPlugin from 'dayjs/plugin/utc';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(timezonePlugin);
dayjs.extend(utcPlugin);
dayjs.extend(isBetween);

export const X = XComponent.extend({ dayjs, useRootState, SomeDateRelatedModel });
```

then

- ./src/MyComponent.tsx
```tsx
import { X } from '@/X'; // Or however you would like to import

const MyComponent = X<{ someProp: number }>((props) => {
  const { api } = X.useRootState();

  const state = X.useState(() => class {
    dateRange = new X.SomeDateRelatedModel()

    orders = new X.AsyncValue(async () =>
      api.fetch(`/orders?from=${this.dateRange.from.getTime()}&to=${this.dateRange.to.getTime()}`)
    )

    get dateText() {
      return X.dayjs(this.dateRange.from).tz('America/New_York').format('YYYY-MM-DD')
    }
  })

  // lets imagine we want to automatically fetch data
  // whenever the selected date range changes
  X.useReaction(
    () => state.dateRange.from,
    () => state.orders.query(),
    { delay: 2000 }
  )

  return <div>
    {/*
      by passing the model in, we are letting the component set & read the value in a succinct way
      and the props type definition for MyDateRangePicker need only be a subset, such as:
      { from: Date, to: Date, set: (from: Date, to: Date) => void }
      or to be even more lazy, use type SomeDateRelatedModel, thus making it coupled to that model.
     */}
    <MyDateRangePicker value={state.dateRange} />
    <p>Selected date: {state.dateText}</p>
    {state.orders.isPending && 'Loading...'}
    {state.orders.error && <>{state.orders.error.message}</>}
    {state.orders.value?.map(({ user, time }) => <div>{time} {user.name}</div>)}
  </div>
})
```


###  5.3. Dismiss unecessary React hooks

Moving logic to `mobx` allows for the majority of React state-related hooks to be dismissed. The nature of observables means that many of React's lifecycle hooks corrupt the state lifecycle, and should be avoided. We want to let `mobx` handle it.

- Good:
  - `useEffect`
    - X Alternatives:
      -  `useOnMounted`
      -  `useOnUnmounted`
      -  `useProps`
      -  `useReaction`
      -  `useAutorun`
  - `useLayoutEffect`
  - `useRef`
- Unecessary:
  - `useCallback`
  - `useState`
  - `useReducer`
  - `useMemo` maybe?
  - etc.

##  6. Helper models

###  6.1. Value

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

###  6.2. AsyncValue

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


###  6.3. BoxedValue

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

###  6.4. BoolValue

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


## Guides

### Working with class-based state

#### Scaffolding a new project

Please check out this folder for a (currently WIP) full project structure example:

- [./src/stories/demoApp](./src/stories/demoApp)