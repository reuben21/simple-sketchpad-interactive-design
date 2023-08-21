import './App.css'
import {useEffect, useLayoutEffect, useRef, useState} from "react";
import { SketchPicker } from 'react-color'
import {Tooltip} from 'antd';
import "./App.css";
import rough from 'roughjs/bundled/rough.esm';
import {getStroke} from "perfect-freehand";
import { ReactComponent as LineIcon } from "./assets/line.svg";
import { ReactComponent as RectangleIcon} from "./assets/rectangle.svg";
import { ReactComponent as CircleIcon} from "./assets/circle.svg";
import { ReactComponent as SelectionIcon} from "./assets/selection.svg";
import { ReactComponent as EllipseIcon} from "./assets/ellipse.svg";
import { ReactComponent as SquareIcon} from "./assets/square.svg";
import { ReactComponent as UndoIcon} from "./assets/undo.svg";
import { ReactComponent as RedoIcon }from "./assets/redo.svg";
import { ReactComponent as PencilIcon } from './assets/pencil.svg';

const generator = rough.generator();

const adjustElementCoordinates = element => {
    const {type, x1, y1, x2, y2} = element;
    if (type === "rectangle") {
        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        const minY = Math.min(y1, y2);
        const maxY = Math.max(y1, y2);
        return {x1: minX, y1: minY, x2: maxX, y2: maxY};
    } else {
        if (x1 < x2 || (x1 === x2 && y1 < y2)) {
            return {x1, y1, x2, y2};
        } else {
            return {x1: x2, y1: y2, x2: x1, y2: y1};
        }
    }
};

function createElement(id, x1, y1, x2, y2, elementType,color) {
    let roughElement;
    console.log("Element Type Created", elementType)

    if (elementType === "line") {
        roughElement = generator.line(x1, y1, x2, y2,{stroke:color});
        return {id, x1, y1, x2, y2, elementType, roughElement,color};
    } else if (elementType === "pencil") {
        return {id, elementType, points: [{x: x1, y: y1}],color};
    } else if (elementType === "rectangle") {
        roughElement = generator.rectangle(x1, y1, x2 - x1, y2 - y1,{stroke:color});
        return {id, x1, y1, x2, y2, elementType, roughElement,color};
    } else if (elementType === "square") {
        const sideLength = Math.min(Math.abs(x2 - x1), Math.abs(y2 - y1));
        const centerX = (x1 + x2) / 2;
        const centerY = (y1 + y2) / 2;
        roughElement = generator.rectangle(centerX - sideLength / 2, centerY - sideLength / 2, sideLength, sideLength,{stroke:color});
        return {id, x1, y1, x2, y2, elementType, roughElement,color};
    } else if (elementType === "circle") {
        const radius = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2) / 2;
        const centerX = (x1 + x2) / 2;
        const centerY = (y1 + y2) / 2;
        roughElement = generator.circle(centerX, centerY, radius,{stroke:color});
        return {id, x1, y1, x2, y2, elementType, roughElement,color};
    } else if (elementType === "ellipse") {
        const rx = Math.abs(x2 - x1) / 2;
        const ry = Math.abs(y2 - y1) / 2;
        const centerX = (x1 + x2) / 2;
        const centerY = (y1 + y2) / 2;
        roughElement = generator.ellipse(centerX, centerY, rx, ry);
        return {id, x1, y1, x2, y2, elementType, roughElement,color};
    } else if (elementType === "pentagon") {
        const sideLength = Math.min(Math.abs(x2 - x1), Math.abs(y2 - y1));
        const centerX = (x1 + x2) / 2;
        const centerY = (y1 + y2) / 2;
        const angleStep = (2 * Math.PI) / 5;
        const pentagonVertices = [];

        for (let i = 0; i < 5; i++) {
            const angle = i * angleStep - Math.PI / 2;
            const vertexX = centerX + sideLength * Math.cos(angle);
            const vertexY = centerY + sideLength * Math.sin(angle);
            pentagonVertices.push([vertexX, vertexY]);
        }

        roughElement = generator.polygon(pentagonVertices,{stroke:color});
    }

    return {
        id, x1, y1, x2, y2, elementType, roughElement,color
    };
}

const nearPoint = (x, y, x1, y1, name) => {

    return Math.abs(x - x1) < 5 && Math.abs(y - y1) < 5 ? name : null;
};
const distance = (a, b) => Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
const onLine = (x1, y1, x2, y2, x, y, maxDistance = 1) => {
    const a = {x: x1, y: y1};
    const b = {x: x2, y: y2};
    const c = {x, y};
    const offset = distance(a, b) - (distance(a, c) + distance(b, c));
    return Math.abs(offset) < maxDistance ? "inside" : null;
};

const positionWithinElement = (x, y, element) => {
    const {elementType, x1, x2, y1, y2} = element;

    switch (elementType) {
        case "line":
            const on = onLine(x1, y1, x2, y2, x, y);
            const start = nearPoint(x, y, x1, y1, "start");
            const end = nearPoint(x, y, x2, y2, "end");
            return start || end || on;
        case "rectangle":
            const topLeft = nearPoint(x, y, x1, y1, "tl");
            const topRight = nearPoint(x, y, x2, y1, "tr");
            const bottomLeft = nearPoint(x, y, x1, y2, "bl");
            const bottomRight = nearPoint(x, y, x2, y2, "br");
            const inside = x >= x1 && x <= x2 && y >= y1 && y <= y2 ? "inside" : null;
            return topLeft || topRight || bottomLeft || bottomRight || inside;
        case "square":
            const topLeftSquare = nearPoint(x, y, x1, y1, "tl");
            const topRightSquare = nearPoint(x, y, x2, y1, "tr");
            const bottomLeftSquare = nearPoint(x, y, x1, y2, "bl");
            const bottomRightSquare = nearPoint(x, y, x2, y2, "br");
            const insideSquare = x >= x1 && x <= x2 && y >= y1 && y <= y2 ? "inside" : null;
            return topLeftSquare || topRightSquare || bottomLeftSquare || bottomRightSquare || insideSquare;
        case "circle":
            const centerX = (x1 + x2) / 2;
            const centerY = (y1 + y2) / 2;
            const distanceToCenter = distance({x, y}, {x: centerX, y: centerY});
            const radius = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2) / 2;

            if (distanceToCenter <= radius) {

                return "inside";
            }
            break;


        case "ellipse":
            const ellipseCenterX = (x1 + x2) / 2;
            const ellipseCenterY = (y1 + y2) / 2;
            const rx = Math.abs(x2 - x1) / 2;
            const ry = Math.abs(y2 - y1) / 2;
            const normalizedX = (x - ellipseCenterX) / rx;
            const normalizedY = (y - ellipseCenterY) / ry;
            const isInsideEllipse = normalizedX ** 2 + normalizedY ** 2 <= 1;

            if (isInsideEllipse) {
                return "inside";
            }
            break;
        // case "pentagon":
        //     break;


        case "pencil":
            const betweenAnyPoint = element.points.some((point, index) => {
                const nextPoint = element.points[index + 1];
                if (!nextPoint) return false;
                return onLine(point.x, point.y, nextPoint.x, nextPoint.y, x, y, 5) != null;
            });
            return betweenAnyPoint ? "inside" : null;
        case "text":
            return x >= x1 && x <= x2 && y >= y1 && y <= y2 ? "inside" : null;
        default:
            throw new Error(`Type not recognised: ${elementType}`);
    }
};
const getElementAtPosition = (x, y, elements) => {


    return elements
        .map(element => ({...element, position: positionWithinElement(x, y, element)}))
        .find(element => element.position !== null);
};
// const average = (a, b) => (a + b) / 2

const getSvgPathFromStroke = stroke => {
    if (!stroke.length) return "";

    const d = stroke.reduce(
        (acc, [x0, y0], i, arr) => {
            const [x1, y1] = arr[(i + 1) % arr.length];
            acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
            return acc;
        },
        ["M", ...stroke[0], "Q"]
    );

    d.push("Z");
    return d.join(" ");
};

const cursorForPosition = position => {
    switch (position) {
        case "tl":
        case "br":
        case "start":
        case "end":
            return "nwse-resize";
        case "tr":
        case "bl":
            return "nesw-resize";
        default:
            return "move";
    }
};

function drawElement(element, context, roughCanvas) {
    // console.log("drawElement",element);
    if (element.elementType === "line") {
        roughCanvas.draw(element.roughElement);
    } else if (element.elementType === "pencil") {
        const stroke = getSvgPathFromStroke(getStroke(element.points, {size: 5, thinning: 0.5}));
        context.fillStyle = element.color;
        context.fill(new Path2D(stroke));


    } else if (element.elementType === "rectangle") {
        roughCanvas.draw(element.roughElement);
    } else if (element.elementType === "square") {
        roughCanvas.draw(element.roughElement);
    } else if (element.elementType === "circle") {
        roughCanvas.draw(element.roughElement);
    } else if (element.elementType === "ellipse") {
        roughCanvas.draw(element.roughElement);
    } else if (element.elementType === "pentagon") {
        roughCanvas.draw(element.roughElement);
    }
    return undefined;
}

const adjustmentRequired = type => ["line", "rectangle", "square", "circle", "ellipse", "pentagon"].includes(type);

const useHistory = (initialState) => {
    // console.log("initialState", initialState)
    const [index, setIndex] = useState(0);
    const [history, setHistory] = useState([initialState]);

    const setState = (action, overwrite = false) => {
        const newState = typeof action === "function" ? action(history[index]) : action;
        if (overwrite) {
            const historyCopy = [...history];
            historyCopy[index] = newState;
            setHistory(historyCopy);
        } else {
            const updatedState = [...history].slice(0, index + 1);
            setHistory(prevState => [...updatedState, newState])
            setIndex(prevState => prevState + 1)
        }


    }

    const undo = () => index > 0 && setIndex(prevState => prevState - 1);

    const redo = () => index < history.length && setIndex(prevState => prevState + 1);
    return [history[index], setState, undo, redo]
}

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
    // const [panOffset, setPanOffset] = React.useState({x: 0, y: 0});
    // const [startPanMousePosition, setStartPanMousePosition] = React.useState({x: 0, y: 0});
    // const [selectedObjectIndex, setSelectedObjectIndex] = useState(null);


    useLayoutEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, window.innerWidth, window.innerHeight);
        context.save();


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
    }, [elements, setCopiedElement, boundingBox]);

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

        const handleClickOutside = (event) => {
            const contextMenu = document.querySelector(".context-menu");
            if (contextMenu && !contextMenu.contains(event.target)) {
                contextMenu.remove();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);
    const updateElement = (id, x1, y1, x2, y2, elementType,color) => {
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
                elementsCopy[id] = createElement(id, x1, y1, x2, y2, elementType,selectedColor);
                break;

            default:
                throw new Error(`Unhandled type: ${elementType}`);


        }
        setElements(elementsCopy, true);
    }
    const handleMouseDown = (event) => {
        const {clientX, clientY} = event;

        if (tool === "selection") {

            const element = getElementAtPosition(clientX, clientY, elements);

            if (element) {
                if (element.elementType === "pencil") {

                    const offsetX = element.points.map(point => clientX - point.x);
                    const offsetY = element.points.map(point => clientY - point.y);
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

    const handleMouseUp = (event) => {
        if (!action) return;
        setShowColorPicker(false)
        if (action === "choose_object") {
            setCopiedElement(null);
        }
        if (selectedElement) {


            const index = selectedElement.id;
            const {id, type,color} = elements[index];
            console.log(color)
            if ((action === "drawing" || action === "resizing") && adjustmentRequired(type)) {
                const {x1, y1, x2, y2} = adjustElementCoordinates(elements[index]);
                updateElement(id, x1, y1, x2, y2, type,color);
            }
        }
        setAction("none");
        setSelectedElement(null)
        // const {clientX, clientY} = event;
        // console.log(clientX, clientY);

    }

    const handleMouseMove = (event) => {

        const {clientX, clientY} = event;
        // MOUSE PANNING LOGIC
        // if (action === "panning") {
        //     const deltaX = clientX - startPanMousePosition.x;
        //     const deltaY = clientY - startPanMousePosition.y;
        //     setPanOffset({
        //         x: panOffset.x + deltaX,
        //         y: panOffset.y + deltaY,
        //     });
        //     return;
        // }

        if (tool === "selection") {
            const element = getElementAtPosition(clientX, clientY, elements);
            event.target.style.cursor = element ? cursorForPosition(element.position) : "default";
        }

        if (action === "drawing") {

            const index = elements.length - 1;
            const {x1, y1,color} = elements[index];
            updateElement(index, x1, y1, clientX, clientY, tool,color);

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
            } else {

                const {id, x1, y1, x2, y2, elementType, offsetX, offsetY,color} = selectedElement;
                const width = x2 - x1;
                const height = y2 - y1;
                const newX1 = clientX - offsetX;
                const newY1 = clientY - offsetY;
                updateElement(id, newX1, newY1, newX1 + width, newY1 + height, elementType,color);
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
                const {x1, y1, x2, y2, elementType,color} = copiedElement;
                const width = x2 - x1;
                const height = y2 - y1;

                // Create the pasted element based on the copied element's properties
                const pastedElement = createElement(newId, offsetX, offsetY, offsetX + width, offsetY + height, elementType,color);

                // Add the pasted element to the elements array
                setElements([...elements, pastedElement]);
                // console.log(`Pasting element with id: ${id}`);
            }
        } catch (e) {
            console.log(e)
        }

    }

    const ToolButton = ({ name, icon, onClick, tooltip }) => (
        <div style={{ position: "relative" }}>
            <Tooltip title={tooltip}>
                <button
                    style={{
                        width: 45,
                        height: 45,
                        border: "none",
                        borderRadius: 10,
                        margin: 10,
                        backgroundColor: tool === name ? "lightblue" : "white",
                        boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
                    }}
                    onClick={onClick}
                >
                    {icon}
                </button>
            </Tooltip>
        </div>
    );

    console.log("selectedColor",selectedColor.hex)

    return (
        <div >
            <div  style={{ position: "relative" }}>
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: "50%",
                    transform: "translateX(-50%)",
                    zIndex: 2,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    width: "100%",
                    height: 60,
                    backgroundColor: "white",
                    boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
                }} >
                    <ToolButton
                        name="selection"
                        icon={<SelectionIcon width={25} height={25} strokeWidth={2} />}
                        onClick={() => setTool("selection")}
                        tooltip="Select Tool"
                    />
                    <ToolButton
                        name="pencil"
                        icon={<PencilIcon width={25} height={25} strokeWidth={2} />}
                        onClick={() => setTool("pencil")}
                        tooltip="Pencil Tool"
                    />
                    <ToolButton
                        name="line"
                        icon={<LineIcon width={25} height={25} strokeWidth={2} />}
                        onClick={() => setTool("line")}
                        tooltip="Line Tool"
                    />
                    <ToolButton
                        name="rectangle"
                        icon={<RectangleIcon width={25} height={25} strokeWidth={2} />}
                        onClick={() => setTool("rectangle")}
                        tooltip="Rectangle Tool"
                    />
                    <ToolButton
                        name="circle"
                        icon={<CircleIcon width={25} height={25} strokeWidth={2} />}
                        onClick={() => setTool("circle")}
                        tooltip="Circle Tool"
                    />
                    <ToolButton
                        name="ellipse"
                        icon={<EllipseIcon width={25} height={25} strokeWidth={2} />}
                        onClick={() => setTool("ellipse")}
                        tooltip="Ellipse Tool"
                    />
                    <ToolButton
                        name="square"
                        icon={<SquareIcon width={25} height={25} strokeWidth={2} />}
                        onClick={() => setTool("square")}
                        tooltip="Square Tool"
                    />
                    <ToolButton
                        name="undo"
                        icon={<UndoIcon width={25} height={25} />}
                        onClick={undo}
                        tooltip="Undo"
                    />
                    <ToolButton
                        name="redo"
                        icon={<RedoIcon width={25} height={25} />}
                        onClick={redo}
                        tooltip="Redo"
                    />
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

                        onClick={()=>setShowColorPicker(true)}
                    >

                    </button>

                    {
                        showColorPicker && <div style={{
                            position:"relative",
                            marginTop: 360,
                            marginLeft: -138,
                        }}  ><SketchPicker color={selectedColor} onChange={(color)=>setSelectedColor(color.hex)} />
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
