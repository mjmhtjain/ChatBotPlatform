# Frontend Context

## Glossary

### Flow Chain
The ordered, left-to-right sequence that makes up a single Flow. A Flow Chain always begins with a **Start Anchor**, ends with an **End Anchor**, and has zero or more **Node Slots** in between. The chain is linear — no branching.

### Anchor Point
A structural marker that bounds the Flow Chain. There are exactly two per flow: **Start** (green circle, play icon) and **End** (red circle, square icon). Anchor points are:
- Not editable
- Not deletable
- Not draggable
- Not part of future execution logic
- Rendered as React Flow nodes with `draggable: false` and `deletable: false`

### Node Slot
A position in the Flow Chain. A slot is either **Empty** or **Occupied**.

### Empty Slot
An unoccupied Node Slot. Rendered as a dashed drop-target box ("+ Drop node here"). The user can drag a node from the NodePalette and drop it onto an Empty Slot to occupy it. Empty Slots are persisted to the backend as React Flow nodes.

### Occupied Slot
A Node Slot that contains a node (e.g. a MessageNode). When a node is dropped into an Empty Slot, the slot becomes Occupied and two new Empty Slots are inserted — one immediately before and one immediately after the new node.

### Chain Growth Rule
Dropping a node into an Empty Slot transforms:
```
... → [Empty] → ...
```
into:
```
... → [Empty] → [Node] → [Empty] → ...
```

### Chain Collapse Rule
Deleting a node from an Occupied Slot merges the two flanking Empty Slots back into one:
```
... → [Empty] → [Node] → [Empty] → ...
```
becomes:
```
... → [Empty] → ...
```

### Node Deletion
A node is deleted by clicking the ✕ button that appears on hover/selection, or by pressing `Delete`/`Backspace` when the node is selected. Dragging a node freely on the canvas is disabled.

### MessageNode
The only current executable node type. Displays a message string. Selectable — clicking it opens the NodeConfigPanel on the right for editing. Rendered as a React Flow node with a white rounded box and indigo handle indicators.

### NodePalette
The left sidebar. Lists available node types that can be dragged onto Empty Slots. Currently contains one item: Message.

### NodeConfigPanel
The right sidebar. Appears when a node (MessageNode) is selected. Contains editable fields for that node's data. Hidden when nothing is selected or when an Anchor Point is clicked.
