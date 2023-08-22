import './App.css'
import { useEffect, useLayoutEffect, useRef, useState} from "react";
import {SketchPicker} from 'react-color'
import {Tooltip} from 'antd';
import "./App.css";
import rough from 'roughjs/bundled/rough.esm';
import {
    LineIcon,
    RectangleIcon,
    CircleIcon,
    SelectionIcon,
    EllipseIcon,
    SquareIcon,
    UndoIcon,
    RedoIcon,
    PencilIcon,
    PentagonIcon
} from './assets/Icons';
import ToolButton from "./components/ToolButton.jsx";
import {useHistory} from "./hooks/History.jsx";
import {usePressedKeys} from "./hooks/PressedKeys.jsx";
import {createElement, drawElement} from "./graphics/Elements.jsx";
import {adjustElementCoordinates, cursorForPosition, getElementAtPosition} from "./graphics/Geometry.jsx";


const generator = rough.generator();



const adjustmentRequired = type => ["line", "rectangle", "square", "circle", "ellipse", "pentagon"].includes(type);



function App() {
    const canvasRef = useRef(null);
    const [elements, setElements, undo, redo] = useHistory([]); // [{}, {}, {}
    const [action, setAction] = useState('none');
    const [tool, setTool] = useState("pencil");
    const [selectedElement, setSelectedElement] = useState(null);
    const [copiedElement, setCopiedElement] = useState({});
    const [boundingBox, setBoundingBox] = useState(null);
    const [selectedColor, setSelectedColor] = useState("blue"); // Step 1: Color state
    const [showColorPicker, setShowColorPicker] = useState(false); // Step 1: Color state
    const [panOffset, setPanOffset] = useState({x: 0, y: 0});
    const [startPanMousePosition, setStartPanMousePosition] = useState({x: 0, y: 0});
    const pressedKeys = usePressedKeys();
    // const [selectedObjectIndex, setSelectedObjectIndex] = useState(null);

    const getMouseCoordinates = event => {
        const clientX = event.clientX - panOffset.x;
        const clientY = event.clientY - panOffset.y;
        return { clientX, clientY };
    };

    useEffect(() => {
        const panFunction = event => {
            setPanOffset(prevState => ({
                x: prevState.x - event.deltaX,
                y: prevState.y - event.deltaY,
            }));
        };

        document.addEventListener("wheel", panFunction);
        return () => {
            document.removeEventListener("wheel", panFunction);
        };
    }, []);

    useLayoutEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, window.innerWidth, window.innerHeight);
        context.save();
        context.translate(panOffset.x, panOffset.y);

        let roughCanvas = rough.canvas(canvas);
        elements.forEach(element => drawElement(element, context, roughCanvas));

        if (setCopiedElement !== null && boundingBox) {
            const {x, y, width, height} = boundingBox;
            const roughBoundingBox = generator.rectangle(x - 10, y - 10, width + 20, height + 20, {
                fill: 'transparent',
                roughness: 0.5,
                stroke: 'red',
                strokeWidth: 2,
                strokeLineDash: [5, 5],
            });
            roughCanvas.draw(roughBoundingBox);
        }

        // Add touch event listeners
        canvas.addEventListener('touchstart', handleTouchStart);
        canvas.addEventListener('touchmove', handleTouchMove);
        canvas.addEventListener('touchend', handleTouchEnd);

        return () => {
            // Remove touch event listeners when the component unmounts
            canvas.removeEventListener('touchstart', handleTouchStart);
            canvas.removeEventListener('touchmove', handleTouchMove);
            canvas.removeEventListener('touchend', handleTouchEnd);
        };

    }, [elements, setCopiedElement, boundingBox,panOffset]);

    const handleTouchStart = (event) => {
        event.preventDefault(); // Prevent the default touch behavior
        const touch = event.touches[0]; // Get the first touch point
        handleMouseDown(touch);
    };

    const handleTouchMove = (event) => {
        event.preventDefault();
        const touch = event.touches[0];
        handleMouseMove(touch);
    };

    const handleTouchEnd = (event) => {
        event.preventDefault();
        handleMouseUp();
    };
    // Cleanup context menu when clicking outside
    useEffect(() => {
        // const panFunction = event => {
        //     setPanOffset(prevState => ({
        //         x: prevState.x - event.deltaX,
        //         y: prevState.y - event.deltaY,
        //     }));
        // };

        // document.addEventListener("wheel", panFunction);
        // return () => {
        //     document.removeEventListener("wheel", panFunction);
        // };

        const handleKeyPress = (event) => {
            if (event.ctrlKey && event.key === 'z') {
                // Ctrl+Z is pressed
                undo();
                console.log('Ctrl+Z pressed');
                // Add your undo logic here
            } else if (event.ctrlKey && event.key === 'y') {
                // Ctrl+Y is pressed
                redo();
                console.log('Ctrl+Y pressed');
                // Add your redo logic here
            }
        };

        // Add the event listener when the component mounts
        document.addEventListener('keydown', handleKeyPress);

        // Remove the event listener when the component unmounts
        return () => {
            document.removeEventListener('keydown', handleKeyPress);
        };



    }, [undo,redo]);
    const updateElement = (id, x1, y1, x2, y2, elementType) => {
        const elementsCopy = [...elements];
        switch (elementType) {
            case "pencil":
                elementsCopy[id].points = [...elementsCopy[id].points, {x: x2, y: y2}];
                break;
            case "line":
            case "rectangle":
            case "square":
            case "circle":
            case "ellipse":
            case "pentagon":
                elementsCopy[id] = createElement(id, x1, y1, x2, y2, elementType, selectedColor);
                break;

            default:
                throw new Error(`Unhandled type: ${elementType}`);


        }
        setElements(elementsCopy, true);
    }
    const handleMouseDown = (event) => {
        const { clientX, clientY } = getMouseCoordinates(event);

        if (event.button === 1 || pressedKeys.has(" ")) {
            setAction("panning");
            setStartPanMousePosition({ x: clientX, y: clientY });
            return;
        }

        if (tool === "selection") {

            const element = getElementAtPosition(clientX, clientY, elements);

            if (element) {
                if (element.elementType === "pencil") {

                    const offsetX = element.points.map(point => clientX - point.x);
                    const offsetY = element.points.map(point => clientY - point.y);
                    setSelectedElement({...element, offsetX, offsetY});

                } else if (element.elementType === "pentagon") {
                    // Extract the pentagon points from the roughElement data
                    const pentagonPoints = element.roughElement.sets[0].ops
                        .filter(op => op.op === "bcurveTo")
                        .map(op => op.data);

                    // Initialize variables to store the minimum and maximum coordinates
                    let minX = Infinity;
                    let minY = Infinity;
                    let maxX = -Infinity;
                    let maxY = -Infinity;

                    // Loop through the pentagon points to find the minimum and maximum coordinates
                    pentagonPoints.forEach(point => {
                        const [x, y] = point;
                        if (x < minX) minX = x;
                        if (x > maxX) maxX = x;
                        if (y < minY) minY = y;
                        if (y > maxY) maxY = y;
                    });

                    const offsetX = clientX - minX;
                    const offsetY = clientY - minY;

                    // Set the bounding box coordinates and dimensions
                    setBoundingBox({
                        x: minX,
                        y: minY,
                        width: maxX - minX,
                        height: maxY - minY,
                    });

                    setSelectedElement({...element, offsetX, offsetY});
                } else if (element.elementType === "circle") {
                    const offsetX = clientX - element.x1;
                    const offsetY = clientY - element.y1;
                    setBoundingBox({
                        x: element.x1,
                        y: element.y1,
                        width: element.x2 - element.x1,
                        height: element.y2 - element.y1,
                    });
                    setSelectedElement({...element, offsetX, offsetY});
                } else {
                    const offsetX = clientX - element.x1;
                    const offsetY = clientY - element.y1;
                    setBoundingBox({
                        x: element.x1,
                        y: element.y1,
                        width: element.x2 - element.x1,
                        height: element.y2 - element.y1,
                    });
                    setSelectedElement({...element, offsetX, offsetY});
                }
                setElements(prevState => prevState);
                setAction("moving");

            }
            setAction("moving");

        } else {

            setAction("drawing");


            const canvas = canvasRef.current;
            const {left, top} = canvas.getBoundingClientRect();

            const id = elements.length;

            const newElement = createElement(
                id,
                clientX - left, // Adjusted x-coordinate
                clientY - top,  // Adjusted y-coordinate
                clientX,
                clientY,
                tool,
                selectedColor
            );

            setElements(prevElements => [...prevElements, newElement]);
        }
    }

    const handleMouseUp = () => {
        // const { clientX, clientY } = getMouseCoordinates(event);
        if (!action) return;
        setBoundingBox(null);
        setShowColorPicker(false)
        if (action === "choose_object") {
            setCopiedElement(null);
        }
        if (selectedElement) {


            const index = selectedElement.id;
            const {id, type, color} = elements[index];
            console.log(color)
            if ((action === "drawing" || action === "resizing") && adjustmentRequired(type)) {
                const {x1, y1, x2, y2} = adjustElementCoordinates(elements[index]);
                updateElement(id, x1, y1, x2, y2, type, color);
            }
        }
        setAction("none");
        setSelectedElement(null);
        // const {clientX, clientY} = event;
        // console.log(clientX, clientY);

    }

    const handleMouseMove = (event) => {

        const { clientX, clientY } = getMouseCoordinates(event);
        // MOUSE PANNING LOGIC
        if (action === "panning") {
            const deltaX = clientX - startPanMousePosition.x;
            const deltaY = clientY - startPanMousePosition.y;
            setPanOffset({
                x: panOffset.x + deltaX,
                y: panOffset.y + deltaY,
            });
            return;
        }

        if (tool === "selection") {
            const element = getElementAtPosition(clientX, clientY, elements);
            event.target.style.cursor = element ? cursorForPosition(element.position) : "default";
        }

        if (action === "drawing") {
            setBoundingBox(null);
            const index = elements.length - 1;
            const {x1, y1, color} = elements[index];
            updateElement(index, x1, y1, clientX, clientY, tool, color);

        } else if (action === "moving") {
            if (selectedElement === null) return;
            if (selectedElement.elementType === "pencil") {
                const newPoints = selectedElement.points.map((_, index) => ({
                    x: clientX - selectedElement.offsetX[index],
                    y: clientY - selectedElement.offsetY[index],
                }));
                const elementsCopy = [...elements];
                elementsCopy[selectedElement.id] = {
                    ...elementsCopy[selectedElement.id],
                    points: newPoints,
                };
                setElements(elementsCopy, true);
            } else if (selectedElement.elementType === "pentagon") {
                const {id, x1, y1, x2, y2, elementType, offsetX, offsetY, color} = selectedElement;
                const width = x2 - x1;
                const height = y2 - y1;
                const newX1 = clientX - offsetX;
                const newY1 = clientY - offsetY;
                updateElement(id, newX1, newY1, newX1 + width, newY1 + height, elementType, color);
                setBoundingBox({
                    x: newX1,
                    y: newY1,
                    width: x2 - x1,
                    height: y2 - y1
                });
                setCopiedElement(selectedElement);
            } else if (selectedElement.elementType === "circle") {
                const {id, x1, y1, x2, y2, elementType, offsetX, offsetY, color} = selectedElement;
                const width = x2 - x1;
                const height = y2 - y1;
                const newX1 = clientX - offsetX;
                const newY1 = clientY - offsetY;
                updateElement(id, newX1, newY1, newX1 + width, newY1 + height, elementType, color);
                setBoundingBox({
                    x: newX1,
                    y: newY1,
                    width: x2 - x1,
                    height: y2 - y1
                });
                setCopiedElement(selectedElement);
            } else {

                const {id, x1, y1, x2, y2, elementType, offsetX, offsetY, color} = selectedElement;
                const width = x2 - x1;
                const height = y2 - y1;
                const newX1 = clientX - offsetX;
                const newY1 = clientY - offsetY;
                updateElement(id, newX1, newY1, newX1 + width, newY1 + height, elementType, color);
                setBoundingBox({
                    x: newX1,
                    y: newY1,
                    width: x2 - x1,
                    height: y2 - y1
                });
                setCopiedElement(selectedElement);
            }


        }
    }

    const handleContextMenu = (event) => {
        event.preventDefault(); // Prevent the default browser context menu
        const {clientX, clientY} = event;
        console.log("Context Menu", clientX, clientY, elements);
        // Create a context menu element with cut, copy, and paste options
        const contextMenu = document.createElement("div");
        contextMenu.className = "context-menu";
        contextMenu.style.position = "fixed";
        contextMenu.style.top = `${clientY}px`;
        contextMenu.style.left = `${clientX}px`;
        contextMenu.innerHTML = `
            <div class="context-option">Cut</div>
            <div class="context-option">Copy</div>
            <div class="context-option">Paste</div>
        `;

        // Attach event listeners to context menu options
        const contextOptions = contextMenu.querySelectorAll(".context-option");
        contextOptions.forEach((option) => {
            option.addEventListener("click", handleContextOptionClick);
        });

        // Append the context menu to the body
        document.body.appendChild(contextMenu);
    };

    // Handle context menu option click
    const handleContextOptionClick = (event) => {
        const optionText = event.target.textContent;
        console.log("handleContextOptionClick", optionText)
        console.log("handleContextOptionClick -cl ", copiedElement)
        const {clientX, clientY} = event;

        try {

            if (optionText === "Cut") {
                const element = getElementAtPosition(clientX, clientY, elements);
                const {id} = element; // Get the id of the selected element
                console.log("handleContextOptionClick", element)
                // Implement cut logic
                const updatedElements = elements.filter(element => element.id !== id);
                setElements(updatedElements);
                setSelectedElement(null);
                console.log(`Cutting element with id: ${id}`);
            } else if (optionText === "Copy") {
                // Implement copy logic
                const element = getElementAtPosition(clientX, clientY, elements);
                const {id} = element; // Get the id of the selected element
                console.log("handleContextOptionClick", element)
                setCopiedElement({...element});
                console.log("inside copy", copiedElement)
                console.log(`Copying element with id: ${id}`);
            } else if (optionText === "Paste") {
                // Implement paste logic
                console.log("inside paste", copiedElement)
                const newId = elements.length;

                // Calculate the new position for pasting
                const offsetX = clientX; // Use the current clientX position as offsetX
                const offsetY = clientY; // Use the current clientY position as offsetY

                // Calculate the dimensions of the copied element
                const {x1, y1, x2, y2, elementType, color} = copiedElement;
                const width = x2 - x1;
                const height = y2 - y1;

                // Create the pasted element based on the copied element's properties
                const pastedElement = createElement(newId, offsetX, offsetY, offsetX + width, offsetY + height, elementType, color);

                // Add the pasted element to the elements array
                setElements([...elements, pastedElement]);
                // console.log(`Pasting element with id: ${id}`);
            }
        } catch (e) {
            console.log(e)
        }

    }



    return (
        <div>
            <div style={{position: "relative"}}>
                <div className="toolbar">
                    <ToolButton
                        name="selection"
                        icon={<SelectionIcon width={25} height={25} strokeWidth={2}/>}
                        onClick={() => setTool("selection")}
                        tooltip="Select Tool"
                        tool={tool}
                    />
                    <ToolButton
                        name="pencil"
                        icon={<PencilIcon width={25} height={25} strokeWidth={2}/>}
                        onClick={() => setTool("pencil")}
                        tooltip="Pencil Tool"
                        tool={tool}
                    />
                    <ToolButton
                        name="line"
                        icon={<LineIcon width={25} height={25} strokeWidth={2}/>}
                        onClick={() => setTool("line")}
                        tooltip="Line Tool"
                        tool={tool}
                    />
                    <ToolButton
                        name="rectangle"
                        icon={<RectangleIcon width={25} height={25} strokeWidth={2}/>}
                        onClick={() => setTool("rectangle")}
                        tooltip="Rectangle Tool"
                        tool={tool}
                    />
                    <ToolButton
                        name="circle"
                        icon={<CircleIcon width={25} height={25} strokeWidth={2}/>}
                        onClick={() => setTool("circle")}
                        tooltip="Circle Tool"
                          tool={tool}
                    />
                    <ToolButton
                        name="ellipse"
                        icon={<EllipseIcon width={25} height={25} strokeWidth={2}/>}
                        onClick={() => setTool("ellipse")}
                        tooltip="Ellipse Tool"
                          tool={tool}
                    />
                    <ToolButton
                        name="square"
                        icon={<SquareIcon width={25} height={25} strokeWidth={2}/>}
                        onClick={() => setTool("square")}
                        tooltip="Square Tool"
                         tool={tool}
                    />
                    <ToolButton
                        name="pentagon"
                        icon={<PentagonIcon width={25} height={25} strokeWidth={2}/>}
                        onClick={() => setTool("pentagon")}
                        tooltip="Pentagon Tool"
                         tool={tool}
                    />
                    <ToolButton
                        name="undo"
                        icon={<UndoIcon width={25} height={25}/>}
                        onClick={() => {
                            setBoundingBox(null);
                            undo();

                        }}
                        tooltip="Undo"
                         tool={tool}
                    />
                    <ToolButton
                        name="redo"
                        icon={<RedoIcon width={25} height={25}/>}
                        onClick={() => {
                            setBoundingBox(null);
                            redo();
                        }}
                        tooltip="Redo"
                          tool={tool}
                    />
                    <Tooltip title={"Select Color"}>
                        <button
                            style={{
                                width: 45,
                                height: 45,
                                border: "none",
                                borderRadius: 10,
                                margin: 10,
                                backgroundColor: selectedColor,
                                boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
                            }}

                            onClick={() => setShowColorPicker(true)}
                        >

                        </button>
                    </Tooltip>

                    {
                        showColorPicker && <div style={{
                            position: "relative",
                            marginTop: 360,
                            marginLeft: -138,
                        }}><SketchPicker color={selectedColor} onChange={(color) => setSelectedColor(color.hex)}/>
                        </div>
                    }
                </div>

                <canvas
                    style={{
                        width: window.outerWidth,
                        height: window.outerHeight,

                        position: "fixed",
                    }
                    }
                    ref={canvasRef}
                    width={window.innerWidth}
                    height={window.innerHeight}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseMove={handleMouseMove}
                    onContextMenu={handleContextMenu}
                ></canvas>
                <div
                    style={{
                        position: "fixed",
                        bottom: "20px",
                        right: "50px",
                        color: "gray",
                        fontFamily: "monospace",
                    }}
                >
                    <h3> Developed By Reuben Coutinho</h3>
                </div>
            </div>
        </div>

    );
}

export default App;
