import { useState } from 'react'

export default function AddHabit({ onAdd }) {
  const [name, setName] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    onAdd(name)
    setName('')
  }

  return (
    <form className="add-habit" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Add a new habit..."
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={50}
      />
      <button type="submit">Add</button>
    </form>
  )
}
