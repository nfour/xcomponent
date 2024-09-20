# Demo app structure

This is a demo app that shows how to scaffold a project with xcomponent and xroute.

Features:
- Fast and easy to use routing
- Fast and easy to use state management
- Conherent convention for structuring an app

+ [Routing with XRoute](#routing-with-xroute)
+ [`ctx` pure dependency injection pattern](#ctx-pure-dependency-injection-pattern)
+ [Sharing global state with local state](#sharing-global-state-with-local-state)
+ [Sharing state via props (Boxed values)](#sharing-state-via-props-boxed-values)
+ [Sharing state via props (fn closures)](#sharing-state-via-props-fn-closures)


## Routing with XRoute

Uses the XRoute library to manage routing. XRoute is a simple and fast routing library that allows you to define routes in a type-safe declarative way, while exposing the URI as MobX signals.

It enables a convention of putting all user input state foremost in the URL.

Consider XRoute URL state as the "source of truth" for the application's view state. This is a powerful pattern that allows you to easily share links, to have reproducable UI states, and to have a clear separation of concerns between UI state and business logic.

XRoute has also been optimized to trigger as few re-renders as possible, even when a nested search parameter is updated - only components which directly access the properties that were updated will re-render.

## `ctx` pure dependency injection pattern

Nested classes within global scope utilize this pattern to handle dependency injection:

```typescript
class Root {
   auth = new Auth();
   api = new Api(() => this); // or { auth: this.auth }
}

class Auth {
  // imagine fetch, and login, accessToken being available here.

  accessToken = new Value<string|null>(null)

  login = async (username: string, password: string) => {
    // login logic to set accessToken
  }

  fetch = async (url: string) => {
    // fetch with accessToken
  }
}

class Api {
    constructor(public ctx: () => { auth: Auth }) {}

    users = new AsyncValue(() => this, async () => 
      // Here we access the `auth` context from within the `api` context
      await this.ctx().auth.fetch('/api/users')
    );
}
```

By using `ctx` consistently across the project we get:

- Consistent dependency injection
- Can reconstruct classes with an existing class instance's `ctx`
  - Eg. `someMapLayer = new Api(() => this.mainMapLayer.ctx())`
  - This allows you to compose multiple instances of classes without having to redefine `ctx` "defaults". Can also spread in overrides as needed
    - Eg. `redMapLayer = new Api(() => ({ ...this.blueMapLayer.ctx(), color: 'red'}))`

## Sharing global state with local state

We also demonstrate how to mix local component state with global state, which becomes quite intuitive as one does not need to worry about React-isms like reconstructing state when useMemo or useEffect dependencies change - because the state is already in the form of signals and can be tracked through the closure's context.

Just make sure not to destructure before using signal values as that would break the MobX dependency tracking.

```tsx
const MyComponent = X(() => {
  const { api } = useRootState();

  const state = X.useState(() => class {
    get users() {
      return api.users.value;
    }
    get userCount() {
      return this.users.length;
    }
  })

  // ...
})
```

## Sharing state via props (Boxed values)

You can also handle props in the same way, provided you pass around a boxed value, such as Value, BoxedValue, AsyncValue, or a makeAutoObservable object of any kind - mobx tracks dependencies through property access, so you must access the value within the computed getter so that the getter is then aware of the dependency.

```tsx
const MyComponent = X((props: { users: AsyncValue<IUsers> }) => {
  const { api } = useRootState();

  const state = X.useState(() => class {
    get users() {
      return props.users.value;
    }
    get userCount() {
      return this.users.length;
    }
  })

  // ...
})

<MyComponent users={someApi.users} />
```

DON'T do stuff like this:

```tsx
const MyComponent = X((props: { users: AsyncValue<IUsers> }) => {
  const { api } = useRootState();

  const users = props.users.value;

  const state = X.useState(() => class {
    get users() {
      return users; // Will never update!
    }
    get userCount() {
      return this.users.length; // Will never update!
    }
  })

  // ...
})

<MyComponent users={someApi.users} />
```

## Sharing state via props (fn closures)

Alternatively you may provide observables within the return value of a function, provided as a prop. This ensures that the observables are accessed upon function execution, and this also preserves the dependency tracking.


**Warning**:
There is an issue with this, however. Within the context of development, hot reloading may be affected by this pattern. This is because the function content may be edited in the parent component, however the child component will not re-create its state using that new function. This can lead to weird issues where you update code and you don't see the changes reflected in the child component.

To see the changes, you must refresh the page. 

It is recommended that one does not use this pattern unless you are aware of the implications within development. It does not have any production implications.

```tsx
const MyComponent = X(({ users }: { users: () => IUsers }) => {
  const { api } = useRootState();

  const state = X.useState(() => class {
    get users() {
      // Will update because we are "accessing" it within a MobX computed getter
      return users()
    }
    get userCount() {
      return this.users.length; // Will update
    }
  })

  // ...
})

<MyComponent users={() => someApi.users.value} />
```

