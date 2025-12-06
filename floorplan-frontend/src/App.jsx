import { useEffect, useRef, useState } from 'react'

const API_BASE = 'http://localhost:8080/api/rooms' // Spring Boot backend

const CANVAS_WIDTH = 1435
const CANVAS_HEIGHT = 700
const HANDLE_SIZE = 10

// VIBGYOR + extras
const COLOR_PALETTE = [
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Black', value: '#000000' },
  { name: 'Grey', value: '#6b7280' },
  { name: 'White', value: '#ffffff' },
]

function App() {
  const canvasRef = useRef(null)

  const [rooms, setRooms] = useState([])
  const [selectedId, setSelectedId] = useState(null)

  const [drag, setDrag] = useState({
    mode: null, // 'move' | 'resize' | null
    offsetX: 0,
    offsetY: 0,
    startX: 0,
    startY: 0,
    originalW: 0,
    originalH: 0,
    roomId: null,
  })

  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    roomId: null,
  })

  const [renameValue, setRenameValue] = useState('')
  const saveTimerRef = useRef(null)

  // Load all rooms on mount
  useEffect(() => {
    loadAll()
  }, [])

  // Draw whenever rooms or selection changes
  useEffect(() => {
    draw()
  }, [rooms, selectedId])

  // ------------- DRAWING -------------

  const draw = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    rooms.forEach((r) => {
      ctx.save()
      ctx.fillStyle = r.color || '#eef2ff'
      ctx.strokeStyle = r.id === selectedId ? '#4338ca' : '#111827'
      ctx.lineWidth = r.id === selectedId ? 2 : 1
      roundRect(ctx, r.x, r.y, r.w, r.h, 4, true, true)
      ctx.restore()

      // label
      ctx.fillStyle = '#111827'
      ctx.font = '14px sans-serif'
      ctx.fillText(r.label || 'Room', r.x + 8, r.y + 20)

      // resize handle
      if (r.id === selectedId) {
        ctx.fillStyle = '#4338ca'
        ctx.fillRect(
          r.x + r.w - HANDLE_SIZE,
          r.y + r.h - HANDLE_SIZE,
          HANDLE_SIZE,
          HANDLE_SIZE
        )
      }
    })
  }

  const roundRect = (ctx, x, y, w, h, r, fill, stroke) => {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.arcTo(x + w, y, x + w, y + h, r)
    ctx.arcTo(x + w, y + h, x, y + h, r)
    ctx.arcTo(x, y + h, x, y, r)
    ctx.arcTo(x, y, x + w, y, r)
    ctx.closePath()
    if (fill) ctx.fill()
    if (stroke) ctx.stroke()
  }

  const getRoomAt = (x, y) => {
    for (let i = rooms.length - 1; i >= 0; i--) {
      const r = rooms[i]
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
        return r
      }
    }
    return null
  }

  const isOnHandle = (room, x, y) => {
    return (
      x >= room.x + room.w - HANDLE_SIZE &&
      x <= room.x + room.w &&
      y >= room.y + room.h - HANDLE_SIZE &&
      y <= room.y + room.h
    )
  }

  const getCanvasCoords = (evt) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top,
    }
  }

  // ------------- AUTO SAVE -------------

  const autoSaveRoom = (room) => {
    if (!room.id) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)

    saveTimerRef.current = setTimeout(async () => {
      await fetch(`${API_BASE}/${room.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(room),
      })
    }, 200)
  }

  // ------------- MOUSE HANDLERS -------------

  const handleMouseDown = (evt) => {
    // hide context menu on left click
    if (evt.button === 0 && contextMenu.visible) {
      setContextMenu((prev) => ({ ...prev, visible: false }))
    }

    const { x, y } = getCanvasCoords(evt)
    const room = getRoomAt(x, y)

    if (room) {
      setSelectedId(room.id)

      if (isOnHandle(room, x, y)) {
        // resize
        setDrag({
          mode: 'resize',
          offsetX: 0,
          offsetY: 0,
          startX: x,
          startY: y,
          originalW: room.w,
          originalH: room.h,
          roomId: room.id,
        })
      } else {
        // move
        setDrag({
          mode: 'move',
          offsetX: x - room.x,
          offsetY: y - room.y,
          startX: 0,
          startY: 0,
          originalW: room.w,
          originalH: room.h,
          roomId: room.id,
        })
      }
    } else {
      setSelectedId(null)
      setDrag((prev) => ({ ...prev, mode: null, roomId: null }))
    }
  }

  const handleMouseMove = (evt) => {
    const { x, y } = getCanvasCoords(evt)
    const canvas = canvasRef.current

    const hit = getRoomAt(x, y)
    if (hit) {
      if (isOnHandle(hit, x, y)) {
        canvas.style.cursor = 'nwse-resize'
      } else {
        canvas.style.cursor = 'move'
      }
    } else {
      canvas.style.cursor = 'default'
    }

    if (!drag.mode || !drag.roomId) return

    if (drag.mode === 'move') {
      const newX = Math.max(
        0,
        Math.min(x - drag.offsetX, CANVAS_WIDTH - drag.originalW)
      )
      const newY = Math.max(
        0,
        Math.min(y - drag.offsetY, CANVAS_HEIGHT - drag.originalH)
      )

      setRooms((prev) => {
        const updated = prev.map((r) =>
          r.id === drag.roomId ? { ...r, x: newX, y: newY } : r
        )
        const room = updated.find((r) => r.id === drag.roomId)
        autoSaveRoom(room)
        return updated
      })
    } else if (drag.mode === 'resize') {
      const dx = x - drag.startX
      const dy = y - drag.startY

      setRooms((prev) => {
        const updated = prev.map((r) => {
          if (r.id !== drag.roomId) return r
          let w = Math.max(40, drag.originalW + dx)
          let h = Math.max(30, drag.originalH + dy)
          w = Math.min(w, CANVAS_WIDTH - r.x)
          h = Math.min(h, CANVAS_HEIGHT - r.y)
          return { ...r, w, h }
        })
        const room = updated.find((r) => r.id === drag.roomId)
        autoSaveRoom(room)
        return updated
      })
    }
  }

  const handleMouseUp = () => {
    setDrag((prev) => ({ ...prev, mode: null, roomId: null }))
  }

  // RIGHT CLICK → CUSTOM CONTEXT MENU
  const handleContextMenu = (evt) => {
    evt.preventDefault()
    const { x, y } = getCanvasCoords(evt)
    const room = getRoomAt(x, y)

    if (!room) {
      setContextMenu((prev) => ({ ...prev, visible: false }))
      return
    }

    setSelectedId(room.id)
    setRenameValue(room.label || '')
    setContextMenu({
      visible: true,
      x: evt.clientX,
      y: evt.clientY,
      roomId: room.id,
    })
  }

  // ------------- API CALLS -------------

  const loadAll = async () => {
    const resp = await fetch(API_BASE)
    const data = await resp.json()
    setRooms(
      data.map((d) => ({
        id: d.id,
        x: d.x,
        y: d.y,
        w: d.w,
        h: d.h,
        label: d.label || 'Room',
        color: d.color || '#eef2ff',
      }))
    )
    setSelectedId(null)
    setContextMenu((prev) => ({ ...prev, visible: false }))
  }

  const addRoom = async () => {
    const newRoom = {
      x: 100,
      y: 100,
      w: 160,
      h: 100,
      label: 'Meeting Room',
      color: '#bfdbfe', // light blue default
    }

    const resp = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRoom),
    })
    const saved = await resp.json()

    setRooms((prev) => [...prev, saved])
    setSelectedId(saved.id)
  }

  const deleteSelected = async () => {
    if (!selectedId) return
    await fetch(`${API_BASE}/${selectedId}`, { method: 'DELETE' })
    setRooms((prev) => prev.filter((r) => r.id !== selectedId))
    setSelectedId(null)
    setContextMenu((prev) => ({ ...prev, visible: false }))
  }

  const clearAll = async () => {
    if (!window.confirm('Clear all rooms?')) return
    await fetch(API_BASE, { method: 'DELETE' })
    setRooms([])
    setSelectedId(null)
    setContextMenu((prev) => ({ ...prev, visible: false }))
  }

  const handleRenameSave = () => {
    const trimmed = renameValue.trim()
    if (!trimmed || !contextMenu.roomId) return

    setRooms((prev) => {
      const updated = prev.map((r) =>
        r.id === contextMenu.roomId ? { ...r, label: trimmed } : r
      )
      const room = updated.find((r) => r.id === contextMenu.roomId)
      autoSaveRoom(room)
      return updated
    })
  }

  const handleColorChange = (color) => {
    if (!contextMenu.roomId) return

    setRooms((prev) => {
      const updated = prev.map((r) =>
        r.id === contextMenu.roomId ? { ...r, color } : r
      )
      const room = updated.find((r) => r.id === contextMenu.roomId)
      autoSaveRoom(room)
      return updated
    })
  }

  // ------------- RENDER -------------

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: '8px',
          padding: '8px',
          background: '#f3f4f6',
          borderBottom: '1px solid #e5e7eb',
        }}
      >
        <button onClick={addRoom}>Add Room</button>
        <button onClick={deleteSelected}>Delete Selected</button>
        <button onClick={clearAll}>Clear All</button>
        <button onClick={loadAll}>Reload</button>
        <div style={{ marginLeft: 'auto', fontSize: 13, color: '#374151' }}>
          Left-click: move/resize. Right-click on a room for options.
        </div>
      </div>

      <div
        style={{
          flex: 1,
          background: 'linear-gradient(180deg,#ffffff,#f8fafc)',
          overflow: 'auto',
        }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          style={{
            background: 'white',
            margin: 16,
            border: '1px solid #e5e7eb',
            boxShadow: '0 6px 18px rgba(0,0,0,0.04)',
            display: 'block',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onContextMenu={handleContextMenu}
        />
      </div>

      {contextMenu.visible && (
        <div
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            background: 'white',
            border: '1px solid #e5e7eb',
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
            borderRadius: 8,
            padding: 10,
            zIndex: 1000,
            minWidth: 220,
          }}
        >
          <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 600 }}>
            Room options
          </div>

          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 12, marginBottom: 4 }}>Rename</div>
            <div style={{ display: 'flex', gap: 4 }}>
              <input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                style={{
                  flex: 1,
                  fontSize: 13,
                  padding: '4px 6px',
                  borderRadius: 4,
                  border: '1px solid #d1d5db',
                }}
                placeholder="Room name"
              />
              <button
                onClick={handleRenameSave}
                style={{
                  fontSize: 12,
                  padding: '4px 8px',
                  borderRadius: 4,
                  border: '1px solid #d1d5db',
                  background: '#f3f4f6',
                  cursor: 'pointer',
                }}
              >
                Save
              </button>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, marginBottom: 4 }}>Color</div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
              }}
            >
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c.name}
                  onClick={() => handleColorChange(c.value)}
                  title={c.name}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '999px',
                    border:
                      rooms.find(
                        (r) =>
                          r.id === contextMenu.roomId && r.color === c.value
                      )
                        ? '2px solid #111827'
                        : '1px solid #d1d5db',
                    background: c.value,
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
