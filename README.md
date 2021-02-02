# Register Machines

## Creating Machines

A machine is made up of nodes (starts, halts, registers & comments) and
connectors (arrows).

### Creating Nodes

Click and drag a node template from the top-left of the viewport onto the grid
to create a new node. Nodes will snap to the nearest grid line. Clicking and
dragging existing nodes will move them.

### Creating Connectors

Hover over the node you want to connect from. Click one of the connection points
(circle) on the edge of the node and drag it to another connection point.
Immediately releasing your mouse on the same connection point will create a
loopback connector to the same node. Press the <kbd>Shift</kbd> key when release
your mouse to create a double-headed connector.

> If you see a <span style="color: #f44336">red</span> connector, this means
> it's invalid. This could be because there are too many connectors coming out
> of a node, or the connector type is incorrect.

### Selecting Nodes and Connectors

Click on individual nodes or connectors to select them. Alternatively, click and
drag on an empty space on the grid to select multiple nodes and/or connectors.
Nodes and connectors will turn <span style="color: #0094ff">blue</span> when
selected.

### Deleting Nodes and Connectors

Once selected, you can delete nodes and/or connectors by pressing the
<kbd>Delete</kbd> key.

### Copying Nodes and Connectors

Once selected, you can copy nodes and/or connectors by pressing
<kbd>Ctrl</kbd> + <kbd>C</kbd>. To paste, move your mouse to where you'd like to
place the nodes/connectors and press the <kbd>Ctrl</kbd> key. You'll see a light
circle indicating the new position of the top-leftmost node in the clipboard.
Press <kbd>Ctrl</kbd> + <kbd>V</kbd> to actually paste. Note only connectors
that have both their start and end nodes copied too will be copied.

### Editing Register Indices

Select an individual register node, then use the number and <kbd>Backspace</kbd>
keys to edit the index. The maximum index is 99. Note that registers in the
right panel are automatically created as required.

### Editing Comments

Similarly to registers, select an individual comment node, then use the letter,
number and <kbd>Backspace</kbd> keys to edit the comment.

### Moving the Viewport

Click and drag on an empty space on the grid with the middle mouse button to
move the viewport.

## Running Machines

### Setting Register Values

To set register values, edit the text boxes in the right panel. If the text box
is empty, it is assumed to be 0. Note that only natural numbers can be stored.

### Stepping Through Execution

To begin, click the <kbd>Step</kbd> button. This will start execution from the
start node that was added first. Click the <kbd>Step</kbd> button again to
continue execution. Note that the currently active node, connector and register
are coloured <span style="color: #4caf50">green</span>.

### Automatic Execution

To automatically step through execution until the machine halts, click the
<kbd>Play</kbd> button. The slider to the right of this button controls
execution speed. Beware of infinite loops when setting this all the way to the
right, as this runs the machine as fast as possible. Note that you're not able
to make changes to the machine whilst playing, but you are able to when
stepping.

### Resetting Execution

To reset the active node and registers to their starting state, click the
<kbd>Reset</kbd> button.

## Saving and Opening Machines

Machines along with initial register contents can be saved to JSON files to be
opened again later. To save your machine, give it a name then click the
<kbd>Save</kbd> button. To open one, click the <kbd>Open</kbd> button. Note that
opening a file will overwrite everything currently in your grid and that you can
only save/open a machine when you're not executing one.
