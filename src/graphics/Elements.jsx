import rough from 'roughjs/bundled/rough.esm';
import {getStroke} from "perfect-freehand";
const generator = rough.generator();


export function createElement(id, x1, y1, x2, y2, elementType, color) {
    let roughElement;
    // console.log("Element Type Created", elementType)

    if (elementType === "line") {
        roughElement = generator.line(x1, y1, x2, y2, {stroke: color});
        return {id, x1, y1, x2, y2, elementType, roughElement, color};
    } else if (elementType === "pencil") {
        return {id, elementType, points: [{x: x1, y: y1}], color};
    } else if (elementType === "rectangle") {
        roughElement = generator.rectangle(x1, y1, x2 - x1, y2 - y1, {stroke: color});
        return {id, x1, y1, x2, y2, elementType, roughElement, color};
    } else if (elementType === "square") {
        const sideLength = Math.min(Math.abs(x2 - x1), Math.abs(y2 - y1));
        const centerX = (x1 + x2) / 2;
        const centerY = (y1 + y2) / 2;
        roughElement = generator.rectangle(centerX - sideLength / 2, centerY - sideLength / 2, sideLength, sideLength, {stroke: color});
        return {id, x1, y1, x2, y2, elementType, roughElement, color};
    } else if (elementType === "circle") {
        const radius = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2) / 2;
        const centerX = (x1 + x2) / 2;
        const centerY = (y1 + y2) / 2;
        roughElement = generator.circle(centerX, centerY, radius, {stroke: color});
        return {id, x1, y1, x2, y2, elementType, roughElement, color};
    } else if (elementType === "ellipse") {
        const rx = Math.abs(x2 - x1) / 2;
        const ry = Math.abs(y2 - y1) / 2;
        const centerX = (x1 + x2) / 2;
        const centerY = (y1 + y2) / 2;
        roughElement = generator.ellipse(centerX, centerY, rx, ry);
        return {id, x1, y1, x2, y2, elementType, roughElement, color};
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

        roughElement = generator.polygon(pentagonVertices, {stroke: color});
    }

    return {
        id, x1, y1, x2, y2, elementType, roughElement, color
    };
}


export function drawElement(element, context, roughCanvas) {
    // console.log("drawElement",element);
    if (element.elementType === "line") {
        roughCanvas.draw(element.roughElement);
    } else if (element.elementType === "pencil") {
        const stroke = getSvgPathFromStroke(getStroke(element.points));
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


export const getSvgPathFromStroke = stroke => {
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

