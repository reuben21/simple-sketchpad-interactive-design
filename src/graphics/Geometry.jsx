export const adjustElementCoordinates = element => {
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



export const nearPoint = (x, y, x1, y1, name) => {

    return Math.abs(x - x1) < 5 && Math.abs(y - y1) < 5 ? name : null;
};
export const distance = (a, b) => Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
export const onLine = (x1, y1, x2, y2, x, y, maxDistance = 1) => {
    const a = {x: x1, y: y1};
    const b = {x: x2, y: y2};
    const c = {x, y};
    const offset = distance(a, b) - (distance(a, c) + distance(b, c));
    return Math.abs(offset) < maxDistance ? "inside" : null;
};

export function isPointInsidePolygon(point, polygon) {
    const [x, y] = point;
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i][0];
        const yi = polygon[i][1];
        const xj = polygon[j][0];
        const yj = polygon[j][1];

        const intersect =
            yi > y !== yj > y &&
            x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

        if (intersect) {
            inside = !inside;
        }
    }

    return inside;
}

export const positionWithinElement = (x, y, element) => {
    const {elementType, x1, x2, y1, y2} = element;

    //For for checking the mouse on the element of Square and Rectangle
    const topLeft = nearPoint(x, y, x1, y1, "tl");
    const topRight = nearPoint(x, y, x2, y1, "tr");
    const bottomLeft = nearPoint(x, y, x1, y2, "bl");
    const bottomRight = nearPoint(x, y, x2, y2, "br");
    const inside = x >= x1 && x <= x2 && y >= y1 && y <= y2 ? "inside" : null;

    switch (elementType) {
        case "line": {
            const on = onLine(x1, y1, x2, y2, x, y);
            const start = nearPoint(x, y, x1, y1, "start");
            const end = nearPoint(x, y, x2, y2, "end");
            return start || end || on;
        }

        case "rectangle": {
            return topLeft || topRight || bottomLeft || bottomRight || inside;
        }
        case "square": {
            return topLeft || topRight || bottomLeft || bottomRight || inside;}
        case "circle": {
            const centerX = (x1 + x2) / 2;
            const centerY = (y1 + y2) / 2;
            const distanceToCenter = distance({x, y}, {x: centerX, y: centerY});
            const radius = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2) / 2;

            if (distanceToCenter <= radius) {

                return "inside";
            }
            break;

        }
        case "ellipse": {
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
        }
        case "pentagon": {

            const sideLength = Math.min(Math.abs(element.x2 - element.x1), Math.abs(element.y2 - element.y1));
            const centerXPentagon = (element.x1 + element.x2) / 2;
            const centerYPentagon = (element.y1 + element.y2) / 2;
            const angleStep = (2 * Math.PI) / 5;
            const pentagonVertices = [];

            for (let i = 0; i < 5; i++) {
                const angle = i * angleStep - Math.PI / 2;
                const vertexX = centerXPentagon + sideLength * Math.cos(angle);
                const vertexY = centerYPentagon + sideLength * Math.sin(angle);
                pentagonVertices.push([vertexX, vertexY]);
            }

            // Check if (x, y) is inside the pentagon using a point-in-polygon algorithm
            if (isPointInsidePolygon([x, y], pentagonVertices)) {
                return "inside";
            }
            break;

        }
        case "pencil": {
            const betweenAnyPoint = element.points.some((point, index) => {
                const nextPoint = element.points[index + 1];
                if (!nextPoint) return false;
                return onLine(point.x, point.y, nextPoint.x, nextPoint.y, x, y, 5) != null;
            });
            return betweenAnyPoint ? "inside" : null;
        }
        case "text": {
            return x >= x1 && x <= x2 && y >= y1 && y <= y2 ? "inside" : null;
        }
        default:
            throw new Error(`Type not recognised: ${elementType}`);
    }
};
export const getElementAtPosition = (x, y, elements) => {

    return elements
        .map(element => ({...element, position: positionWithinElement(x, y, element)}))
        .find(element => element.position !== null);
};
// const average = (a, b) => (a + b) / 2

export const cursorForPosition = position => {
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