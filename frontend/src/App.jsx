// Root component of the starter: a heading and a counter button.
import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <main>
      <h1>Get started</h1>
      <button type="button" onClick={() => setCount((count) => count + 1)}>
        Count is {count}
      </button>
    </main>
  )
}

export default App
