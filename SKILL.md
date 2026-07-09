---
name: xcomponent
description: 'Use when building React components with @n4s/xcomponent, converting MobX observer/useEffect code to X, X.useState, Value, Value.Async, Value.Boxed, Value.Bool, lifecycle hooks, observable props, or component composition with .with().'
argument-hint: 'Describe the component, state shape, props, and whether you need async state, reactions, or composition.'
user-invocable: true
---

# XComponent Usage

## What This Skill Covers

Use this skill when writing or refactoring application code that consumes `@n4s/xcomponent`.

This skill is for:
- Creating React components with `X`
- Creating components under the strongly preferred build-time auto observer wrapper, falling back to manual `X(...)` wrapping only for edge cases
- Replacing `observer`, `useMemo`, `useEffect`, and ad hoc MobX wiring with xcomponent patterns
- Building local component state with `X.useState`
- Applying the repo convention of class-based MobX state with `ctx` dependency injection
- Working with observable props
- Using `Value`, `Value.Async`, `Value.Boxed`, and `Value.Bool`
- Composing components with `.with()` static members

This skill is not for:
- Changing xcomponent internals
- Designing new public APIs for the library
- Debugging bundler or TypeScript configuration outside normal library consumption

## Mental Model

`X` is a thin wrapper around `mobx-react-lite` `observer` with a few attached helpers.

There are two valid component authoring modes, but they are not equally preferred:
- Build-time auto-wrap mode (strongly preferred): write plain function components and let the [`mobx-react-observer`](https://github.com/christianalfoni/mobx-react-observer) Vite plugin inject MobX observation automatically.
- Manual wrap mode (edge cases only): write components as `X((props) => ...)`.

Default to auto-wrap mode whenever the project has the compiler plugin configured. Reach for manual `X(...)` wrapping only for edge cases, such as files the plugin excludes (for example `*.stories.tsx`) or projects that have not adopted the plugin yet.

In auto-wrap mode, you still use `X` for helpers such as `X.useState`, `X.useReaction`, `X.useAutorun`, `X.useOnMounted`, and `X.useOnUnmounted`. What becomes optional is only the outer `X(...)` component wrapper.

The usual workflow is:
1. Prefer build-time auto-wrap for the component itself; only fall back to manual `X(...)` wrapping for edge cases such as files the plugin excludes.
2. Default to class-based state created with `X.useState(...)`.
3. Put mutable values in `Value` or `Value.Bool`.
4. Put async request state in `Value.Async`.
5. Use `X.useOnMounted`, `X.useOnUnmounted`, `X.useReaction`, and `X.useAutorun` at the component or custom-hook top level.
6. Read observable values inside render or computed getters so MobX can track them.

### Build-Time Auto-Wrap Setup (Reference)

This skill assumes the auto-wrap plugin is already configured for the project; configuring a build from scratch is outside this skill's scope. The following is a reference example of what that setup looks like, useful when reading or troubleshooting a project's existing config.

```ts
import reactPlugin from "@vitejs/plugin-react";
import observerPlugin from "mobx-react-observer/vite-plugin";
import { join, resolve } from "path";
import { defineConfig } from "vite";

/** Use this to resolve ~ alias to the absoluteFolderPath for imports */
export const tildeImportAlias = (o: { absoluteFolderPath: string }) => ({
  find: /^~\/(.+)/,
  replacement: join(o.absoluteFolderPath, "$1"),
});

export default defineConfig({
  plugins: [
    reactPlugin({ jsxImportSource: "@emotion/react" }),
    observerPlugin({ exclude: ["**/*.stories.tsx"] }),
  ],
  // ...
  resolve: {
    alias: [
      tildeImportAlias({ absoluteFolderPath: resolve(__dirname, "src") }),
    ],
  },
});
```

Notable details:
- `mobx-react-observer` (`npm install mobx-react-observer`) is the package that wraps every component export in `observer` (re-exported from `mobx-react-lite`, the same implementation `X` wraps) — the same rendering behavior as `X(Component)`.
- It is a standalone Vite plugin, not a babel-preset addition — add it as its own entry in `plugins`, independent from `@vitejs/plugin-react`'s `babel` option. It works with any Vite version and either underlying transformer (SWC or Babel), so no babel config is required.
- The predecessor `babel-plugin-observing-components`/`swc-plugin-observing-components` packages are deprecated; do not add new setups with them. Existing projects should migrate to `mobx-react-observer`.
- `*.stories.tsx` is typically excluded from wrapping (Storybook has trouble with the wrapped form) via the `exclude` option — see the Caveats section.
- For server-side rendering, call `enableStaticRendering(typeof window === "undefined")` (also exported from `mobx-react-observer`) once at app startup.
- This example also wires up an unrelated `~/` import alias, shown because it's commonly configured alongside the auto-wrap plugin in this stack.

## Project Conventions

These are the preferred conventions in this codebase, even when xcomponent supports other styles.

- Default new state to local `X.useState`; promote to global state only once more than one unrelated part of the tree genuinely needs it. Local state also keeps hot-reloading reliable — editing a global singleton commonly forces a full page refresh, while local state does not.
- Prefer classes for MobX state, local or global.
- Outside `X.useState`, call `makeAutoObservable(this)` in the constructor of state classes.
- Prefer arrow functions for class methods.
- Use private `#methods` for implementation details that should not become observable API.
- Prefer composition over inheritance.
- For composed classes, use `public ctx: () => { ... }` constructor injection.
- For global state, expose state through React context and mutate it through actions on the state classes, not directly from components.

## Public Surface

### `X`

- `X(Component)` returns an observed component. Prefer configuring build-time auto-wrap instead of calling this directly on ordinary components; use it explicitly only for edge cases.
- `X(Component).with({...})` attaches static members such as subcomponents or class name maps.
- `X` also exposes the hooks below as static members.

Strongly prefer build-time auto-wrap for ordinary components:
- Omit `X(Component)` for ordinary components once the project has the compiler plugin configured — this is the default, not a fallback.
- You still import `X` to access `X.useState` and the other xcomponent helpers.
- You still need `X(Component)` when you want `.with(...)` composition on the exported component, or when the file is excluded from auto-wrapping (for example `*.stories.tsx`).

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

`Value.Async`, `Value.Boxed`, and `Value.Bool` work as both runtime constructors (`new Value.Boxed(...)`) and type annotations (`users: Value.Async<IUser[]>`), via a type-only `namespace Value { ... }` merged with the class. The standalone class names (`AsyncValue<T, P>`, `BoxedValue<T>`, `BoolValue`) remain valid too — both forms refer to the same classes, so pick whichever reads better at the call site.

#### `Value<T>`

Use for simple mutable values.

```tsx
const count = new Value(0)
count.set(count.value + 1)
```

#### `Value.Bool`

Use for booleans with convenience helpers.

```tsx
const isOpen = new Value.Bool(false)
isOpen.toggle()
isOpen.setTrue()
isOpen.setFalse()
```

#### `Value.Async<T, P>`

Use for async request state.

```tsx
const users = new Value.Async(async ({ orgId }: { orgId: string }) => {
  return fetchUsers(orgId)
})

await users.query({ orgId: 'acme' })
users.value
users.error
users.isPending
```

Key behavior:
- `query(...)` clears the previous error, tracks pending work, sets `value` on success, and sets `error` on failure.
- `query(...)` returns the `Value.Async` instance, so chaining like `await state.users.query(...); state.users.value` is normal.
- `reset()` clears the current value and cancels queued promises when supported.
- `clone()` creates a separate instance with the same query function and config.

#### `Value.Boxed<T>`

Use to expose an existing source of truth through a `value` getter and optional setter.

```tsx
const selectedId = new Value.Boxed(
  () => route.search.userId,
  (userId) => route.push((uri) => ({ search: { userId } })),
)
```

This is useful when a child should consume a value-like object without owning the underlying state.

For URI-backed input state, prefer `Value.Boxed` together with `xroute` so serialization and deserialization stay explicit.

```tsx
import { Value } from '@n4s/xcomponent'

class SomePageInputState {
  constructor(public ctx: () => SomePageState) {
    makeAutoObservable(this)
  }

  private get route() {
    return this.ctx().ctx().router.routes.somePage
  }

  someDate = new Value.Boxed(
    () => dayjs(this.route.search.someDate),
    (someDate) =>
      this.route.push({
        search: { someDate: someDate.format('YYYY-MM-DD') },
      }),
  )
}
```

## Preferred Patterns

### 1. Basic observed component

Build-time auto-wrap mode (strongly preferred):

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

Manual wrap mode (edge cases only — files excluded from the compiler plugin such as `*.stories.tsx`, or projects without the plugin configured):

```tsx
import { X } from '@n4s/xcomponent'

export const UserName = X(({ name }: { name: string }) => {
  return <span>{name}</span>
})
```

Default to plain function components under auto-wrap. Reach for `X(...)` manual wrapping only when the plugin genuinely does not apply to that file.

### 2. Local class-based state

```tsx
import { X, Value } from '@n4s/xcomponent'

export const Counter = () => {
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
}
```

Use this as the default pattern for local state. This component relies on build-time auto-wrap; add `X(...)` around it only for the edge cases described above.

Conventional class-state rules:
- Prefer classes for local MobX state.
- Prefer arrow-function methods such as `increment = () => ...`.
- Use private `#methods` for non-observable implementation details.
- Prefer composition over inheritance.

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

Use functional style only when it materially improves a very small local store. The team default is still class state.

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

export const MyComponent = (props: Props) => {
  const state = useMyComponentState(props)

  return <button onClick={state.increment}>{state.combinedNumber}</button>
}
```

Use this pattern when you want Vue-like `setup()` separation without moving the state into a separate file yet.

### 4. Observable props in local state

```tsx
type Props = { initialCount: number; multiplier: number }

export const Counter = (props: Props) => {
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
}
```

Rules:
- Read the reactive props inside computed getters, reactions, or render.
- Prefer the `props` closure passed to `X.useState(props, ...)` for derived state.
- If you want the prop object available on the instance, store it as `props = props` and access `this.props.someField`.

### 5. Async data in component state

```tsx
export const UserList = (props: { orgId: string }) => {
  const state = X.useState(props, (props) => class {
    props = props
    users = new Value.Async(async () => fetchUsers(props.orgId))
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
}
```

For async work that depends on changing props or state, combine `Value.Async` with `X.useReaction` and make sure the query function reads reactive sources.

### 6. Side effects and reactions

```tsx
export const Example = (props: { filter: string }) => {
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
}
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

  expanded = new Value.Bool(false)

  get title() {
    return this.props.name
  }
}

export const UserCard = (props: { name: string }) => {
  const state = X.useState(props, (props) => new UserCardState(props))

  return <button onClick={state.expanded.toggle}>{state.title}</button>
}
```

Use this when the view is simple but the local state needs its own file — for example once the component file grows too large, or once a child component needs to import the state's type directly.

If the extracted state is a class defined outside `X.useState`, add `makeAutoObservable(this)` in its constructor unless you are deliberately controlling annotations manually.

### 8. Component composition with `.with()`

`.with()` is one of the few places manual `X(...)` wrapping is required even under auto-wrap, because `.with()` needs the object `X(...)` returns in order to attach static members.

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

export class UserState {
  constructor() {
    makeAutoObservable(this)
  }

  selectedId = new Value<string | undefined>(undefined)

  get hasSelection() {
    return !!this.selectedId.value
  }
}
```

For global state, prefer a hierarchy of discrete classes that each do one thing well.

```tsx
interface RootState {
  routing: XRouter
  app: AppState
  admin: AdminState
}

interface AppState {
  api: ApiState
  auth: AuthState
  pages: {
    overview: AppOverviewState
    editor: AppEditorState
  }
}
```

Global-state rules:
- Name classes `SomethingState`.
- Store them in `.ts` files near the feature they belong to.
- Access them from components through React context.
- Do not directly mutate global state from components; call actions on the state classes.
- Keep classes focused and compose them with other classes as needed.
- Use `ctx: () => { ... }` constructor injection for dependencies.

For composed state classes, prefer `ctx` dependency injection over inheritance or broad global reach.

```tsx
class AuthState {
  constructor(public ctx: () => ApiState) {
    makeAutoObservable(this)
  }

  login = () => {
    this.ctx().loginQuery()
  }

  get authToken() {
    return this.ctx().loginQuery.value?.token
  }
}

class ApiState {
  constructor(public ctx: () => AuthState) {
    makeAutoObservable(this)
  }

  loginQuery = new Value.Async(async () => {
    return this.fetch()
  })

  fetch = () => {
    // request logic
  }
}

class RootState {
  api = new ApiState(() => this.auth)
  auth = new AuthState(() => this.api)
}
```

Provide the minimal dependencies to `ctx` where practical. Passing top-level state is acceptable when boundaries are not clear yet, but avoid turning everything into implicit global reach.

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

### 11. Expose local state to a parent (`onInit` callback)

For generic/atomic components (inputs, dialogs, and similar reusable primitives), avoid lifting all state up or prop-drilling every field just so a parent can occasionally reach in. Instead, surface the constructed state instance once via an `onInit` callback.

```tsx
class GenericInputState {
  constructor(public props: { initialValue: string }) {
    makeAutoObservable(this)
  }

  value = new Value(this.props.initialValue)
}

export const GenericInput = (props: {
  initialValue: string
  onInit?: (state: GenericInputState) => void
}) => {
  const state = X.useState(props, (props) => new GenericInputState(props))

  X.useOnMounted(() => {
    props.onInit?.(state)
  })

  return (
    <input
      value={state.value.value}
      onChange={(e) => state.value.set(e.target.value)}
    />
  )
}
```

Use this only for components meant to be generic/reusable; for feature-specific components, prefer §7's separated state file so the parent can just import the state class directly.

## Procedure

When implementing a new component with xcomponent:

1. Start with a plain function component under build-time auto-wrap; only start with `X((props) => ...)` for edge cases where the plugin does not apply.
2. Decide whether local state is needed.
3. If state is needed, default to `X.useState(() => class { ... })`.
4. Use `Value` or `Value.Bool` for scalar mutable state.
5. Use computed getters for derived values.
6. Use `Value.Async` for request state instead of parallel `value/loading/error` fields.
7. If component behavior depends on prop changes, pass `props` into `X.useState(props, ...)`.
8. If URI state is user-editable, prefer `Value.Boxed` over ad hoc parsing and syncing.
9. If state logic starts crowding the view, extract it into a custom hook or separate state file.
10. Put mount, unmount, autorun, and reaction logic at the component or custom-hook top level.
11. If the component has related subcomponents or static class maps, attach them with `.with()`.

When refactoring existing React or MobX code:

1. Replace `observer(...)` with a plain function component under build-time auto-wrap; use `X(...)` only for edge cases the plugin doesn't cover.
2. Collapse local `useState` values into a single `X.useState` store when the values belong together.
3. Move derived `useMemo` logic into MobX computed getters.
4. Replace effect-driven prop synchronization with `X.useState(props, ...)` and computed getters or reactions.
5. Replace manual async flags with `Value.Async`.
6. Move multi-class dependencies to explicit `ctx: () => { ... }` injection.
7. Rename broad global stores toward focused `SomethingState` classes where practical.

## Caveats

- `X.useState(props, ...)` keeps the store instance stable and updates the observable props object across rerenders. Do not recreate local state just to mirror props.
- Do not destructure observable values too early if you expect reactivity. Read them at the point where MobX should track them.
- For `Value.Boxed`, the dependency is tracked when the getter is read. Read `boxed.value` inside render or a computed getter, not once outside and then reuse the plain value.
- For URI state, keep serialization and deserialization at the `Value.Boxed` boundary rather than scattering it through components.
- For function props that return observables, reactivity works if the function is invoked inside a computed getter or render path, but hot reload can become confusing because child state is not recreated automatically.
- `X.useReaction` uses structural comparison by default. If you need identity semantics or different timing, pass explicit MobX reaction options.
- `X.useReaction` and `X.useAutorun` must observe MobX state. A plain React prop or local variable is not reactive unless it is read through an observable object or value wrapper.
- If a `Value.Async` query depends on props, read those props from the reactive object or pass them as query payload. Do not accidentally close over first-render values.
- Build-time auto-wrap only replaces the component-level observer wrapper. It does not replace `X.useState`, lifecycle helpers, or `.with(...)` composition.
- The `mobx-react-observer` Vite plugin's `exclude` option commonly excludes certain file patterns (for example `*.stories.tsx`); for files outside its scope, wrap manually with `X(...)`.
- If your project does not actually auto-wrap components (`mobx-react-observer` not configured), a bare function component that reads MobX state will not rerender correctly. In that case, use `X(...)`.
- When classes depend on each other cyclically during construction, defer constructor-time work until the next tick so object references exist before use.
- `X.useOnUnmounted` is the right place for interval, timeout, subscription, and manual cleanup logic.
- `X` sets a display name for debugging when one is not already present.
- `Value.Async`, `Value.Boxed`, and `Value.Bool` work as both constructors and type annotations (a type-only namespace is merged with the `Value` class for this). `Value['Boxed']<T>` bracket-indexed syntax still does not work either way — use the dotted form `Value.Boxed<T>`, or the standalone `BoxedValue<T>`.
- Avoid non-trivial derived computation (`.filter()`, `.map()` chains, etc.) inline in JSX, even if it looks like "just one line" — move it to a computed getter on state so it is memoized and named.
- A whole local state instance can be passed down to a child component as a prop when useful, not just its individual `Value`/`Value.Boxed`/`Value.Async` fields.

## What Good Usage Usually Looks Like

- One `X.useState` store per component concern, not one per field
- Class-based state as the default MobX style
- Computed getters for derived data
- `Value` and `Value.Bool` for simple mutable state
- `Value.Async` for async state machines
- `Value.Boxed` for URI-backed user input
- Observable props read inside computed getters instead of copied into ad hoc React state
- Explicit `ctx` dependency injection between composed classes
- Reactions used for side effects, not for ordinary derivation

## When Not To Use These Patterns

- If the component is fully static and has no MobX-driven reads, `X` may be unnecessary.
- If state is truly global and reused broadly, define a normal MobX store outside the component and consume it from an `X` component.
- If you only need a one-off render-only transform, a computed getter may be heavier than a plain inline expression.

## Further References

- [README.md](./README.md) for the compact public overview
- [src/stories/demoApp](./src/stories/demoApp) for a larger end-to-end example structure