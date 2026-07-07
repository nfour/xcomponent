---
name: xcomponent
description: 'Use when building React components with @n4s/xcomponent, converting MobX observer/useEffect code to X, X.useState, Value, AsyncValue, BoxedValue, BoolValue, lifecycle hooks, observable props, or component composition with .with().'
argument-hint: 'Describe the component, state shape, props, and whether you need async state, reactions, or composition.'
user-invocable: true
---

# XComponent Usage

## What This Skill Covers

Use this skill when writing or refactoring application code that consumes `@n4s/xcomponent`.

This skill is for:
- Creating React components with `X`
- Creating components in projects that use a build-time auto observer wrapper
- Replacing `observer`, `useMemo`, `useEffect`, and ad hoc MobX wiring with xcomponent patterns
- Building local component state with `X.useState`
- Working with observable props
- Using `Value`, `AsyncValue`, `BoxedValue`, and `BoolValue`
- Composing components with `.with()` static members

This skill is not for:
- Changing xcomponent internals
- Designing new public APIs for the library
- Debugging bundler or TypeScript configuration outside normal library consumption

## Mental Model

`X` is a thin wrapper around `mobx-react-lite` `observer` with a few attached helpers.

There are two valid component authoring modes:
- Manual wrap mode: write components as `X((props) => ...)`
- Build-time auto-wrap mode: write plain function components and let the compiler/plugin inject MobX observation

In auto-wrap mode, you still use `X` for helpers such as `X.useState`, `X.useReaction`, `X.useAutorun`, `X.useOnMounted`, and `X.useOnUnmounted`. What becomes optional is only the outer `X(...)` component wrapper.

The usual workflow is:
1. Choose whether the component itself will be wrapped manually with `X(...)` or observed by a build-time auto wrapper.
2. Create local state with `X.useState(...)`.
3. Put mutable values in `Value` or `BoolValue`.
4. Put async request state in `AsyncValue`.
5. Use `X.useOnMounted`, `X.useOnUnmounted`, `X.useReaction`, and `X.useAutorun` at the component or custom-hook top level.
6. Read observable values inside render or computed getters so MobX can track them.

## Public Surface

### `X`

- `X(Component)` returns an observed component.
- `X(Component).with({...})` attaches static members such as subcomponents or class name maps.
- `X` also exposes the hooks below as static members.

If your project uses a build-time auto observer wrapper:
- You may omit `X(Component)` for ordinary components.
- You still import `X` to access `X.useState` and the other xcomponent helpers.
- You still need `X(Component)` when you want `.with(...)` composition on the exported component.

### `X.useState`

Creates component-scoped observable state.

Supported forms:

```tsx
const state = X.useState(() => class {
  count = 0
})

const state = X.useState(() => ({
  count: 0,
  get doubled() {
    return this.count * 2
  },
}))

const state = X.useState(props, (props) => class {
  get total() {
    return props.a + props.b
  }
})
```

Behavior:
- If the returned store is not already observable, xcomponent applies `makeAutoObservable` automatically.
- If the initializer returns a class constructor, xcomponent instantiates it once.
- If you pass `props`, xcomponent mirrors prop updates into an observable object and preserves the store instance across rerenders.
- The `props` parameter inside the initializer is the reactive object itself. Prefer `props.someField`, not `props.value.someField`.

### Lifecycle and reaction helpers

- `X.useOnMounted(fn)` runs once on mount.
- `X.useOnUnmounted(fn)` registers unmount cleanup.
- `X.useAutorun(fn)` runs a MobX autorun inside a React effect.
- `X.useReaction(dataFn, effectFn, opts?)` runs a MobX reaction inside a React effect.

Important defaults for `X.useReaction`:
- `fireImmediately` defaults to `true`
- `equals` defaults to `comparer.structural`

That means a reaction will run on first render and compares structured values by default.

### Helper value types

#### `Value<T>`

Use for simple mutable values.

```tsx
const count = new Value(0)
count.set(count.value + 1)
```

#### `BoolValue`

Use for booleans with convenience helpers.

```tsx
const isOpen = new BoolValue(false)
isOpen.toggle()
isOpen.setTrue()
isOpen.setFalse()
```

#### `AsyncValue<T, P>`

Use for async request state.

```tsx
const users = new AsyncValue(async ({ orgId }: { orgId: string }) => {
  return fetchUsers(orgId)
})

await users.query({ orgId: 'acme' })
users.value
users.error
users.isPending
```

Key behavior:
- `query(...)` clears the previous error, tracks pending work, sets `value` on success, and sets `error` on failure.
- `query(...)` returns the `AsyncValue` instance, so chaining like `await state.users.query(...); state.users.value` is normal.
- `reset()` clears the current value and cancels queued promises when supported.
- `clone()` creates a separate instance with the same query function and config.

#### `BoxedValue<T>`

Use to expose an existing source of truth through a `value` getter and optional setter.

```tsx
const selectedId = new BoxedValue(
  () => route.search.userId,
  (userId) => route.push((uri) => ({ search: { userId } })),
)
```

This is useful when a child should consume a value-like object without owning the underlying state.

## Preferred Patterns

### 1. Basic observed component

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

### 2. Local class-based state

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

Use this as the default pattern for local state.

Functional style is also supported when it is a better fit:

```tsx
const state = X.useState(() => {
  const count = new Value(0)

  return {
    count,
    get doubled() {
      return count.value * 2
    },
    increment: () => count.set(count.value + 1),
  }
})
```

Use class style by default for larger state objects and functional style for smaller closure-based stores.

### 3. Extract state into a custom hook

```tsx
type Props = { someProp: number }

const useMyComponentState = (props: Props) => {
  const state = X.useState(props, (props) => class {
    props = props
    count = new Value(0)

    get combinedNumber() {
      return this.count.value + this.props.someProp
    }

    increment = () => this.count.set(this.count.value + 1)
  })

  X.useOnMounted(() => {
    console.log('mounted')
  })

  X.useReaction(
    () => state.props.someProp,
    () => {
      console.log('prop changed', state.props.someProp)
    },
  )

  return state
}

export const MyComponent = X((props: Props) => {
  const state = useMyComponentState(props)

  return <button onClick={state.increment}>{state.combinedNumber}</button>
})
```

Use this pattern when you want Vue-like `setup()` separation without moving the state into a separate file yet.

### 4. Observable props in local state

```tsx
type Props = { initialCount: number; multiplier: number }

export const Counter = X((props: Props) => {
  const state = X.useState(props, (props) => class {
    count = new Value(props.initialCount)

    get multiplied() {
      return this.count.value * props.multiplier
    }

    increment = () => this.count.set(this.count.value + 1)
  })

  return (
    <button onClick={state.increment}>
      {state.multiplied}
    </button>
  )
})
```

Rules:
- Read the reactive props inside computed getters, reactions, or render.
- Prefer the `props` closure passed to `X.useState(props, ...)` for derived state.
- If you want the prop object available on the instance, store it as `props = props` and access `this.props.someField`.

### 5. Async data in component state

```tsx
export const UserList = X((props: { orgId: string }) => {
  const state = X.useState(props, (props) => class {
    props = props
    users = new AsyncValue(async () => fetchUsers(props.orgId))
  })

  X.useReaction(
    () => state.props.orgId,
    () => {
      state.users.query()
    },
  )

  if (state.users.isPending) return <div>Loading...</div>
  if (state.users.error) return <div>{state.users.error.message}</div>

  return <div>{state.users.value?.length ?? 0}</div>
})
```

For async work that depends on changing props or state, combine `AsyncValue` with `X.useReaction` and make sure the query function reads reactive sources.

### 6. Side effects and reactions

```tsx
export const Example = X((props: { filter: string }) => {
  const state = X.useState(props, (props) => class {
    props = props
    value = new Value('')
  })

  X.useReaction(
    () => state.props.filter,
    () => {
      state.value.set('')
    },
  )

  X.useAutorun(() => {
    console.log(state.value.value)
  })

  return <input value={state.value.value} />
})
```

Treat these like React hooks:
- Call them at component or custom-hook top level
- Do not call them conditionally
- Do not bury them inside class methods or constructors
- Make sure their tracking functions read MobX observables, not plain destructured React values

### 7. Separate state from view

```tsx
export class UserCardState {
  constructor(public props: { name: string }) {}

  expanded = new BoolValue(false)

  get title() {
    return this.props.name
  }
}

export const UserCard = X((props: { name: string }) => {
  const state = X.useState(props, (props) => new UserCardState(props))

  return <button onClick={state.expanded.toggle}>{state.title}</button>
})
```

Use this when the view is simple but the local state needs its own file.

### 8. Component composition with `.with()`

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

Use this for component families like `Dialog.Header`, `Dialog.Body`, `Table.Row`, or `Form.Field`.

### 9. Global state outside components

`X.useState` auto-observes local component state, but global or shared stores outside React should still be normal MobX stores.

```tsx
import { makeAutoObservable } from 'mobx'

export class UserStore {
  constructor() {
    makeAutoObservable(this)
  }

  selectedId = new Value<string | undefined>(undefined)

  get hasSelection() {
    return !!this.selectedId.value
  }
}
```

For global state, use standard MobX conventions and consume that store from `X` components.

### 10. React hooks to replace versus keep

Usually replaced by xcomponent patterns:
- `useState`
- `useReducer`
- `useMemo`
- `useCallback`

Usually still valid when needed:
- `useEffect`, but prefer `X.useOnMounted`, `X.useOnUnmounted`, `X.useReaction`, or `X.useAutorun` for observable-driven lifecycles
- `useLayoutEffect`
- `useRef`

The goal is not to ban React hooks. The goal is to avoid using React hooks to simulate observable state machines that MobX already models directly.

## Procedure

When implementing a new component with xcomponent:

1. Start with either `X((props) => ...)` or a plain function component if the project uses build-time auto observer wrapping.
2. Decide whether local state is needed.
3. If state is needed, default to `X.useState(() => class { ... })`.
4. Use `Value` or `BoolValue` for scalar mutable state.
5. Use computed getters for derived values.
6. Use `AsyncValue` for request state instead of parallel `value/loading/error` fields.
7. If component behavior depends on prop changes, pass `props` into `X.useState(props, ...)`.
8. If state logic starts crowding the view, extract it into a custom hook or separate state file.
9. Put mount, unmount, autorun, and reaction logic at the component or custom-hook top level.
10. If the component has related subcomponents or static class maps, attach them with `.with()`.

When refactoring existing React or MobX code:

1. Replace `observer(...)` with `X(...)`, or with a plain function component if the project has a build-time auto observer wrapper.
2. Collapse local `useState` values into a single `X.useState` store when the values belong together.
3. Move derived `useMemo` logic into MobX computed getters.
4. Replace effect-driven prop synchronization with `X.useState(props, ...)` and computed getters or reactions.
5. Replace manual async flags with `AsyncValue`.

## Caveats

- `X.useState(props, ...)` keeps the store instance stable and updates the observable props object across rerenders. Do not recreate local state just to mirror props.
- Do not destructure observable values too early if you expect reactivity. Read them at the point where MobX should track them.
- For `BoxedValue`, the dependency is tracked when the getter is read. Read `boxed.value` inside render or a computed getter, not once outside and then reuse the plain value.
- For function props that return observables, reactivity works if the function is invoked inside a computed getter or render path, but hot reload can become confusing because child state is not recreated automatically.
- `X.useReaction` uses structural comparison by default. If you need identity semantics or different timing, pass explicit MobX reaction options.
- `X.useReaction` and `X.useAutorun` must observe MobX state. A plain React prop or local variable is not reactive unless it is read through an observable object or value wrapper.
- If an `AsyncValue` query depends on props, read those props from the reactive object or pass them as query payload. Do not accidentally close over first-render values.
- Build-time auto-wrap only replaces the component-level observer wrapper. It does not replace `X.useState`, lifecycle helpers, or `.with(...)` composition.
- If your project does not actually auto-wrap components, a bare function component that reads MobX state will not rerender correctly. In that case, use `X(...)`.
- `X.useOnUnmounted` is the right place for interval, timeout, subscription, and manual cleanup logic.
- `X` sets a display name for debugging when one is not already present.

## What Good Usage Usually Looks Like

- One `X.useState` store per component concern, not one per field
- Computed getters for derived data
- `Value` and `BoolValue` for simple mutable state
- `AsyncValue` for async state machines
- Observable props read inside computed getters instead of copied into ad hoc React state
- Reactions used for side effects, not for ordinary derivation

## When Not To Use These Patterns

- If the component is fully static and has no MobX-driven reads, `X` may be unnecessary.
- If state is truly global and reused broadly, define a normal MobX store outside the component and consume it from an `X` component.
- If you only need a one-off render-only transform, a computed getter may be heavier than a plain inline expression.

## Further References

- `README.md` for the compact public overview
- `src/stories/demoApp` for a larger end-to-end example structure