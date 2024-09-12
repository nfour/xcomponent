<!-- vscode-markdown-toc -->
* 1. [Why](#Why)
* 2. [How does it compare?](#Howdoesitcompare)
	* 2.1. [Drop in replacement for `observer`](#Dropinreplacementforobserver)
	* 2.2. [Full example comparison](#Fullexamplecomparison)
* 3. [Details of the API](#DetailsoftheAPI)
* 4. [State should be decoupled from the component](#Stateshouldbedecoupledfromthecomponent)
	* 4.1. [Component composition extender](#Componentcompositionextender)
* 5. [Conventions / Philosophy](#ConventionsPhilosophy)
	* 5.1. [Use either `class` or `function` syntax consistently for all state](#Useeitherclassorfunctionsyntaxconsistentlyforallstate)
	* 5.2. [As a compositional root toolbox for your project](#Asacompositionalroottoolboxforyourproject)
	* 5.3. [Dismiss unecessary React hooks](#DismissunecessaryReacthooks)
* 6. [Helper models](#Helpermodels)
	* 6.1. [Value](#Value)
	* 6.2. [AsyncValue](#AsyncValue)
	* 6.3. [BoxedValue](#BoxedValue)
	* 6.4. [BoolValue](#BoolValue)

<!-- vscode-markdown-toc-config
	numbering=true
	autoSave=true
	/vscode-markdown-toc-config -->
<!-- /vscode-markdown-toc -->

# XComponent

This is a micro framework that brings together MobX and React in order to solve performance, boilerplate and lifecycle issues with React.



##  1. <a name='Why'></a>Why

React's ecosystem is a great place to be, so we do not want to leave it just because of how annoying `hooks`, state management and render performance tweaking is.

So we use an observable solution, like mobx.

It solves the performance problems, but it also adds boilerplate but isn't quite interoperable with React state & props. There is no "correct" convention either, so your team is left to "figure it out" on each new project.

This micro frameworks exists to define a convention while being simple enough to review or copy paste parts of it into your own project as desired.

##  2. <a name='Howdoesitcompare'></a>How does it compare?

###  2.1. <a name='Dropinreplacementforobserver'></a>Drop in replacement for `observer`

```tsx
import { observer } from 'mobx-react-lite'

const MyComponent = observer<{ someProp: number }>((props) => <>{props.someProp}</>)

import { X } from '@n4s/xcomponent'

const MyComponent = X<{ someProp: number }>((props) => <>{props.someProp}</>)
```

###  2.2. <a name='Fullexamplecomparison'></a>Full example comparison

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

##  3. <a name='DetailsoftheAPI'></a>Details of the API

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


##  4. <a name='Stateshouldbedecoupledfromthecomponent'></a>State should be decoupled from the component

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

###  4.1. <a name='Componentcompositionextender'></a>Component composition extender

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

I *tentatively* posit the idea that we could encourage a single compositional root for all tools and generic components that are frequently used across a single project.

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
    date = new X.SomeDateRelatedModel()

    orders = new X.AsyncValue(async ({ from, to }: { from: Date, to: Date}) =>
      api.fetch(`/orders?from=${from.getTime()}&to=${to.getTime()}`)
    )

    get date() {
      return X.dayjs(this.val.value).tz('America/New_York').format('YYYY-MM-DD')
    }
  })

  // lets imagine we want to automatically fetch data
  // whenever the selected date range changes
  X.useReaction(
    () => state.date.value,
    () => state.orders.query(state.date.value),
    { delay: 1000 }
  )

  // ... blah blah ...

  return <div css={{ color: 'red' }}>
    {/* ... do something here related to setting dates ... */}
    {state.orders.isPending && 'Loading...'}
    {state.orders.error && <>{state.orders.error.message}</>}
    {state.orders.value?.map(({ user, time }) => <div>{time} {user.name}</div>)}
  </div>
})
```


###  5.3. <a name='DismissunecessaryReacthooks'></a>Dismiss unecessary React hooks

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

##  6. <a name='Helpermodels'></a>Helper models

###  6.1. <a name='Value'></a>Value

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

###  6.2. <a name='AsyncValue'></a>AsyncValue

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


###  6.3. <a name='BoxedValue'></a>BoxedValue

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

###  6.4. <a name='BoolValue'></a>BoolValue

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

```tsx

// ./X.ts

import { X as XComponent } from '@n4s/XComponent';
import { useRootState } from './useRootState';

export const X = XComponent.extend({
  useRootState
});

// ./src/RootState.ts

// 
import { X } from '@/X'

export class RootState {
  router = new RouterState(() => this)
  dataApi = new DataApiState(() => this)
  authApi = new AuthApiState(() => this)
}

// ./src/RouterState.ts

import { X } from '@/X'
import { XRouter, XRoute } from 'xroute
import { createBrowserHistory } from 'history

export class RouterState {
  router = new XRouter([
    XRoute('home')
      .Resource('/') // @example url: /
      .Type<{
        pathname: {},
        search: { section?: string },
      }>(),
    XRoute('login').Resource('/login'), // @example url: /login
    XRoute('logout').Resource('/logout'), // @example url: /logout
    XRoute('profile')
      .Resource('/profile/:userId')
      .Type<{
        pathname: { userId: string },
        search: {},
      }>(),
    XRoute('app').Resource('/app'),
    XRoute('notFound').Resource('*'),
  ], createBrowserHistory())

}

// ./src/useRootState.ts

import { useContext } from 'react'
import { type RootState } from './RootState'

export const RootStateContext = React.createContext<RootState>(null)
export function useRootState() {
  return useContext(RootStateContext)
}

// ./src/Root.tsx

import { X } from '@/X'

export const Root = X(() => {
  const state = X.useState(() => new RootState())

  return <RootStateContext.Provider value={state}>
    <Routing />
  </RootStateContext.Provider>
})

// ./src/Routing.tsx

import { X } from '@/X'

export const Routing = X(() => {
  const { router } = X.useRootState()

  return <Router>
    <Route path="/home" component={Home} />
    <Route path="/login" component={Login} />
  </Router>
})