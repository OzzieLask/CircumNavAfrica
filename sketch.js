let hoverShapes = [];
let pathPoints = [];
let bgImg = null;
let dividerX = 0;
let rectHotspot = null;

function preload() {
    bgImg = loadImage('Map.svg'); // map image SVG VECTOR
}

function setup() {
    let canvas = createCanvas(windowWidth, windowHeight);

    // Ensure there is a container to parent the canvas to. If not, create one.
    let containerEl = document.getElementById('canvasContainer');
    if (!containerEl) {
        containerEl = document.createElement('div');
        containerEl.id = 'canvasContainer';
        document.body.appendChild(containerEl);
    }
    canvas.parent(containerEl);

    dividerX = width / 2;

    // create invisible hover ellipses and initialize layout
    createHoverShapes();
    windowResized();

    cursor('crosshair');
}

function draw() {
    // draw SVG background if loaded, otherwise solid background
    if (bgImg) {
        image(bgImg, 0, 0, width, height);
    } else {
        background(240);
        noStroke();
        fill(220, 235, 255);
        rect(width * 0.05, height * 0.05, width * 0.9, height * 0.85, 8);
    }

    // mouse position
    noStroke();
    fill(0);
    textSize(12);
    text(`mouse: ${Math.round(mouseX)}, ${Math.round(mouseY)}`, 10, height - 10);

    drawHoverShapes();
}




function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    // recompute rectangle and path so they scale with canvas
    rectHotspot = {
        x: width * 0.20,
        y: height * 0.30,
        w: width * 0.35,
        h: height * 0.35
    };
    pathPoints = [
        { x: width * 0.15, y: height * 0.75 },
        { x: width * 0.32, y: height * 0.5 },
        { x: width * 0.6, y: height * 0.35 },
        { x: width * 0.85, y: height * 0.18 }
    ];
    dividerX = width / 2;

    // Recompute positions for hoverShapes so they scale on resize
    if (hoverShapes && hoverShapes.length > 0) {
        let leftArea = dividerX - 100;
        let cols = 3;
        let rows = 3;
        let spacingX = leftArea / (cols + 1);
        let spacingY = (height - 150) / (rows + 1);
        let idx = 0;
        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                if (hoverShapes[idx]) {
                    hoverShapes[idx].x = spacingX * (i + 1);
                    hoverShapes[idx].y = spacingY * (j + 1) + 80;
                }
                idx++;
            }
        }
    }

}

function drawHoverShapes() {
    for (let shape of hoverShapes) {
        // Check if mouse is hovering
        let d = dist(mouseX, mouseY, shape.x, shape.y);
        shape.isHovered = d < shape.size / 2;

        // If dragging, treat as hovered to keep visible
        if (shape.dragging) shape.isHovered = true;

        // Smooth color transition
        let targetColor = shape.isHovered ? shape.hoverColor : shape.baseColor;
        shape.currentColor = lerpColor(shape.currentColor, targetColor, 0.15);

        // Draw shape
        fill(shape.currentColor);
        noStroke();

        push();
        translate(shape.x, shape.y);

        // Scale up slightly when hovered
        let s = shape.isHovered ? 1.2 : 1;
        scale(s);

        if (shape.shape === 0) {
            ellipse(0, 0, shape.size);
        } else if (shape.shape === 1) {
            rectMode(CENTER);
            rect(0, 0, shape.size * 0.8, shape.size * 0.8, 8);
        } else {
            let r = shape.size / 2;
            triangle(0, -r, -r * 0.866, r * 0.5, r * 0.866, r * 0.5);
        }
        pop();
    }
}


function createHoverShapes() {
    hoverShapes = [];
    let leftArea = dividerX - 100;
    let cols = 3;
    let rows = 3;
    let spacingX = leftArea / (cols + 1);
    let spacingY = (height - 150) / (rows + 1);

    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            hoverShapes.push({
                x: spacingX * (i + 1),
                y: spacingY * (j + 1) + 80,
                size: 60,
                // start fully transparent (invisible)
                baseColor: color(60, 60, 70, 0),
                // hover color gets an alpha so it becomes visible
                hoverColor: color(60, 120, 200, 220),
                currentColor: color(60, 60, 70, 0),
                isHovered: false,
                dragging: false,
                dragOffsetX: 0,
                dragOffsetY: 0,
                shape: floor(random(3)) // 0: circle, 1: square, 2: triangle
            });
        }
    }
}

function mousePressed() {
    // Start dragging the first shape under the mouse
    for (let shape of hoverShapes) {
        let d = dist(mouseX, mouseY, shape.x, shape.y);
        if (d < shape.size / 2) {
            shape.dragging = true;
            shape.dragOffsetX = shape.x - mouseX;
            shape.dragOffsetY = shape.y - mouseY;
            break;
        }
    }
}

function mouseDragged() {
    for (let shape of hoverShapes) {
        if (shape.dragging) {
            shape.x = mouseX + shape.dragOffsetX;
            shape.y = mouseY + shape.dragOffsetY;
        }
    }
}

function mouseReleased() {
    for (let shape of hoverShapes) {
        shape.dragging = false;
    }
}

// ...existing code..

