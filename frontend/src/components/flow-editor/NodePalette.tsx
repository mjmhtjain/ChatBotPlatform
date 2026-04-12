function PaletteItem({ label, nodeType }: { label: string; nodeType: string }) {
  function onDragStart(e: React.DragEvent) {
    e.dataTransfer.setData('application/reactflow-nodetype', nodeType)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg cursor-grab active:cursor-grabbing hover:border-indigo-400 hover:shadow-sm transition-all text-sm text-gray-700 select-none"
    >
      <svg className="w-4 h-4 text-indigo-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M8 10h.01M12 10h.01M16 10h.01M21 16c0 1.1-.9 2-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h14a2 2 0 012 2v8z" />
      </svg>
      {label}
    </div>
  )
}

export default function NodePalette() {
  return (
    <div className="w-52 shrink-0 bg-gray-50 border-r border-gray-200 p-4 flex flex-col gap-2 overflow-y-auto">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Nodes</p>
      <PaletteItem label="Message" nodeType="messageNode" />
    </div>
  )
}
