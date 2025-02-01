# XComponent Patterns

XComponent is a lightweight framework that combines MobX and React. These patterns demonstrate how to convert standard React/MobX code to XComponent code, focusing on state management, component composition, and prop handling.

## Core Patterns

### 1. Basic Observer Pattern
Convert a MobX observer component to XComponent:

```tsx
// BEFORE: MobX Observer
import { observer } from 'mobx-react-lite'
const MyComponent = observer((props: { someProp: number }) => <>{props.someProp}</>)

// AFTER: XComponent
import { X } from '@n4s/xcomponent'
const MyComponent = X((props: { someProp: number }) => <>{props.someProp}</>)
```

### 2. State Management Pattern
Handle component state with reactive updates:

```tsx
// BEFORE: React State Hooks
const Component = () => {
  const [count, setCount] = useState(0)
  const [data, setData] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const doubledCount = useMemo(() => count * 2, [count])
  
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
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
      {isLoading ? <div>Loading...</div> : <div>{data.length} items</div>}
    </div>
  )
}

// AFTER: XComponent State
const Component = X(() => {
  const state = X.useState(() => class {
    count = new X.Value(0)
    data = new AsyncValue(async () => fetchData())
    
    get doubledCount() {
      return this.count.value * 2
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
      <button onClick={state.increment}>Increment</button>
      {state.data.isPending ? <div>Loading...</div> : 
       <div>{state.data.value?.length} items</div>}
    </div>
  )
})
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
const Filter = X((reactProps: { items: string[], filter: string }) => {
  const state = X.useState(reactProps, (props) => class {
    filtered = new X.Value<string[]>([])
    
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
})
```

### 4. Component Composition Pattern
Create composable components with shared styles:

```tsx
// BEFORE: Separate Components
const Dialog = observer<{ children: ReactNode }>((props) => <>{props.children}</>)
const DialogHead = observer<{ children: ReactNode }>((props) => <h2>{props.children}</h2>)
const Example = () => <Dialog><DialogHead>Title</DialogHead>Content</Dialog>

// AFTER: XComponent Composition
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
const count = new X.Value(0)
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
const Component = X(() => {
  const state = X.useState(() => class {
    value = new X.Value(0)
    increment = () => this.value.set(this.value.value + 1)
  })
  return <button onClick={state.increment}>{state.value.value}</button>
})
```

### 2. Separated State
```tsx
// state.ts
export class ComponentState {
  constructor(public props: Props) {
    makeAutoObservable(this)
  }
  value = new X.Value(0)
  increment = () => this.value.set(this.value.value + 1)
}

// component.tsx
const Component = X((props: Props) => {
  const state = X.useState(props, props => new ComponentState(props))
  return <button onClick={state.increment}>{state.value.value}</button>
})
