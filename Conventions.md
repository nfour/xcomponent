# XComponent Patterns

XComponent is a lightweight framework that combines MobX and React. These patterns demonstrate how to convert standard React/MobX code to XComponent code, focusing on state management, component composition, and prop handling.

## Core Patterns

### 1. Basic Observer Pattern
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

### 2. State Management Pattern
Handle component state with reactive updates:

```tsx
// BEFORE, regular react state:
const Component = () => {
  const [count, setCount] = useState(0)
  const [data, setData] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const doubledCount = useMemo(() => count * 2, [count])
  const multipliedByData = useMemo(() => data.length * count, [data, count])
  
  useEffect(() => {
    setIsLoading(true)
    fetchData().then(data => {
      setData(data)
      setIsLoading(false)
    })
  }, [])

  return (
    <div>
      <h1>Count: {count}</h1>
      <h2>Doubled: {doubledCount}</h2>
      <h3>Multiplied by data: {multipliedByData}</h3>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
      {isLoading ? <div>Loading...</div> : <div>{data.length} items</div>}
    </div>
  )
}

// AFTER, MobX XComponent State:
const Component = () => {
  const state = X.useState(() => class {
    count = new Value(0)
    data = new AsyncValue(async () => fetchData())
    
    get doubledCount() {
      return this.count.value * 2
    }

    get multipliedByData() {
      if (!this.data.value) return
      return this.data.value.length * this.count.value
    }

    increment = () => this.count.set(this.count.value + 1)
  })

  X.useOnMounted(() => {
    state.data.query()
  })

  return (
    <div>
      <h1>Count: {state.count.value}</h1>
      <h2>Doubled: {state.doubledCount}</h2>
      <h3>Multiplied by data: {state.multipliedByData ?? 'N/A'}</h3>
      <button onClick={state.increment}>Increment</button>
      {state.data.isPending ? <div>Loading...</div> : 
       <div>{state.data.value?.length} items</div>}
    </div>
  )
}
```

### 3. Reactive Props Pattern
Handle prop updates reactively:

```tsx
// BEFORE: React Props Effect
const Filter = ({ items, filter }: { items: string[], filter: string }) => {
  const [filtered, setFiltered] = useState<string[]>([])
  
  useEffect(() => {
    setFiltered(items.filter(item => item.includes(filter)))
  }, [items, filter])

  return <ul>{filtered.map(item => <li>{item}</li>)}</ul>
}

// AFTER: XComponent Reactive Props
const Filter = (reactProps: { items: string[], filter: string }) => {
  const state = X.useState(reactProps, (props) => class {
    filtered = new Value<string[]>([])
    
    constructor() {
      this.updateFilter()
      this.useReactions()
    }

    updateFilter = () => {
      this.filtered.set(
        props.items.filter(item => item.includes(props.filter))
      )
    }

    useReactions = () => {
      X.useReaction(
        () => [props.items, props.filter],
        () => this.updateFilter()
      )
    }
  })

  return <ul>{state.filtered.value.map(item => <li>{item}</li>)}</ul>
}
```

### 4. Component Composition Pattern
Create composable components with shared styles:

```tsx
// BEFORE: Separate Components
const Dialog = observer<{ children: ReactNode }>((props) => <>{props.children}</>)
const DialogHead = observer<{ children: ReactNode }>((props) => <h2>{props.children}</h2>)
const Example = () => <Dialog><DialogHead>Title</DialogHead>Content</Dialog>

// AFTER: XComponent Composition using X wrapper and with() method.
const Dialog = X((props) => <>{props.children}</> )
  .with({
    Head: X((props) => <h2 className={Dialog.classes.head}>{props.children}</h2>),
    Body: X((props) => <div className={Dialog.classes.body}>{props.children}</div>),
    classes: {
      head: 'dialog-head',
      body: 'dialog-body',
    }
  })

const Example = () => (
  <Dialog>
    <Dialog.Head>Title</Dialog.Head>
    <Dialog.Body>Content</Dialog.Body>
  </Dialog>
)
```

## Value Types

### 1. Basic Value
```tsx
const count = new Value(0)
count.set(count.value + 1)
```

### 2. AsyncValue
```tsx
const data = new AsyncValue(async () => fetchData())
await data.query() // Start loading
console.log(data.isPending, data.value, data.error)
```

### 3. BoxedValue
```tsx
const value = new BoxedValue(
  () => store.value,    // Getter
  value => store.setValue(value)  // Optional setter
)
```

### 4. BoolValue
```tsx
const isOpen = new BoolValue(false)
isOpen.toggle()  // true
isOpen.setTrue() // true
isOpen.setFalse() // false
```

## State Organization Pattern

### 1. Inline State
```tsx
const Component = () => {
  const state = X.useState(() => class {
    value = new Value(0)
    increment = () => this.value.set(this.value.value + 1)
  })
  return <button onClick={state.increment}>{state.value.value}</button>
}
```

### 2. Separated State
```tsx
// ComponentState.ts
export class ComponentState {
  constructor(public props: { someProp: number }) {
    makeAutoObservable(this)
  }
  value = new Value(0)
  increment = () => this.value.set(this.value.value + 1)
  get computed() {
    return this.value.value + this.props.someProp
  }
}

// Component.tsx
export const Component = (props: ComponentState['props']) => {
  const state = X.useState(props, props => new ComponentState(props))
  return <button onClick={state.increment}>{state.computed}</button>
}
