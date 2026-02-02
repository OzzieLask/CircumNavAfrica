// Hover/Click Reveals - Basic Interaction Demo
// Left side: Hover elements to change color
//push


let hoverShapes = [];
let clickElement;
let dividerX;
let bgImg = null;
let showMap = false;
let showHoverShapes = false; // Toggle visibility after click
let clickElementClicked = false; // Track if click element has been clicked
let easeInStartTime = null; // Track when ease-in animation starts
let waveStartTime = null;
let waveSourceIndex = null;
let fadeOutStartTime = null;

// --- SVG anchor config (edit these SVG coords to move hover shapes) ---
const SVG_W = 1440; // svg viewBox width or intrinsic width
const SVG_H = 1024; // svg viewBox height or intrinsic height

// Provide anchors in SVG coordinate space (x,y). Change these to reposition shapes.
// size is optional and in pixels (SVG units) — will be scaled to canvas.
const SVG_ANCHORS = [
    { x: 479.786, y: 285.024, size: 60 },
    { x: 982.000, y: 511.900, size: 60 },
    { x: 927.131, y: 523.244, size: 60 },
    { x: 539.174, y: 557.943, size: 58 },
    { x: 424.917, y: 581.965, size: 80 },
    { x: 642.457, y: 285.024, size: 66 }
];

// Map an (x,y) in SVG coordinates to canvas pixel coordinates, preserving aspect ratio.
function svgToScreen(sx, sy) {
    const scaleX = width / SVG_W;
    const scaleY = height / SVG_H;
    // keep uniform scale to preserve aspect
    const scale = Math.min(scaleX, scaleY);
    const drawW = SVG_W * scale;
    const drawH = SVG_H * scale;
    const offsetX = (width - drawW) / 2;
    const offsetY = (height - drawH) / 2;
    return {
        x: offsetX + sx * scale,
        y: offsetY + sy * scale,
        scale: scale,
        offsetX: offsetX,
        offsetY: offsetY
    };
}

// Compatibility stubs for missing grid code (prevents runtime errors if those modules/files aren't present)
let circles = [];
let cols = 6;
let rows = 6;
function initializeColors() { /* no-op stub - replace with real implementation if you have it */ }
function createGrid() { /* no-op stub - replace with real implementation if you have it */ }

// Easy config for click element position
const CLICK_ELEMENT_CONFIG = {
    xOffset: 0, // 0 = center horizontally
    yOffset: 0.5  // 0.5 = center vertically
};

function preload() {
    // attempt to load the SVG map (place map.svg in project root)
    // use callbacks so failure won't throw and we can log a helpful message
    loadImage('Map.svg',
        img => { bgImg = img; },
        err => { console.warn('Map.svg failed to load — check path and casing or hosting.'); }
    );
}

function setup() {
    let canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('canvas-container');

    dividerX = width / 2;

    // Create hover shapes on left side
    createHoverShapes();

    // Create click element on right side
    createClickElement();


}

function createHoverShapes() {
    hoverShapes = [];

    // If SVG_ANCHORS is provided, map those SVG coordinates to canvas positions.
    if (Array.isArray(SVG_ANCHORS) && SVG_ANCHORS.length > 0) {
        for (let i = 0; i < SVG_ANCHORS.length; i++) {
            const a = SVG_ANCHORS[i];
            const s = svgToScreen(a.x, a.y);
            const sizeScaled = (a.size || 60) * s.scale; // scale size from SVG units to pixels
            hoverShapes.push({
                x: s.x,
                y: s.y,
                size: sizeScaled,
                baseColor: color(60, 60, 70, 30),
                hoverColor: color(255, 90),
                currentColor: color(60, 60, 70),
                isHovered: false,
                isWaving: false,
                isFadingOut: false,
                index: i,
                number: i + 1,
                shape: 0
            });
        }
        return;
    }

    // Fallback: place shapes using normalized positions in left area (legacy behavior)
    const leftWidth = max(100, dividerX - 100); // space available on left
    const leftXOffset = 50; // left margin
    const topOffset = 80; // top margin
    const availHeight = max(100, height - 160);

    const positions = [ 
        { nx: 0.85, ny: 0.14, size: 60, shape: 0 },
        { nx: 0.32, ny: 0.35, size: 60, shape: 0 },
        { nx: 0.55, ny: 0.25, size: 58, shape: 0 },
        { nx: 0.18, ny: 0.65, size: 64, shape: 0 },
        { nx: 0.42, ny: 0.55, size: 80, shape: 0 },
        { nx: 0.68, ny: 0.45, size: 66, shape: 0 }
    ];

    for (let i = 0; i < positions.length; i++) {
        let p = positions[i];
        hoverShapes.push({
            x: leftXOffset + p.nx * leftWidth,
            y: topOffset + p.ny * availHeight,
            size: p.size || 60,
            baseColor: color(60, 60, 70, 30),
            hoverColor: color(255, 90),
            currentColor: color(60, 60, 70),
            isHovered: false,
            isWaving: false,
            isFadingOut: false,
            index: i,
            number: i + 1,
            shape: (typeof p.shape === 'number') ? p.shape : floor(random(3))
        });
    }
}

function createClickElement() {
    const rightAreaWidth = width - dividerX;
    const rightAreaHeight = height;
    clickElement = {
        x: dividerX + rightAreaWidth * CLICK_ELEMENT_CONFIG.xOffset,
        y: rightAreaHeight * CLICK_ELEMENT_CONFIG.yOffset,
        size: 100,
        baseColor: color(160, 121, 74),
        hoverColor: color(187, 152, 107),
        currentColor: color(0), // ????
        isHovered: false,
        pulsePhase: 0
    };
}

function draw() {
    // Calculate ease-in opacity for all elements
    let easeInOpacity = 1;
    if (easeInStartTime !== null) {
        let timeSinceEaseStart = millis() - easeInStartTime;
        let easeDuration = 800; // ms for ease-in
        if (timeSinceEaseStart < easeDuration) {
            // Smooth ease-in (quadratic)
            easeInOpacity = (timeSinceEaseStart / easeDuration) ** 2;
        } else {
            // Ease-in complete
            easeInStartTime = null;
            easeInOpacity = 1;
        }
    }
    
    // If map is toggled on and loaded, draw it as background (preserve aspect ratio)
    if (showMap && bgImg) {
        push();
        tint(255, 255 * easeInOpacity); // Apply opacity to map
        // compute aspect-fit dimensions based on SVG intrinsic size
        const scaleX = width / SVG_W;
        const scaleY = height / SVG_H;
        const scale = Math.min(scaleX, scaleY);
        const drawW = SVG_W * scale;
        const drawH = SVG_H * scale;
        const offsetX = (width - drawW) / 2;
        const offsetY = (height - drawH) / 2;
        image(bgImg, offsetX, offsetY, drawW, drawH);
        pop();
    } else {
        background(171, 171, 135); // BACKGROUND COLOR pre map load
    }

    // Update and draw hover shapes (only if click interaction happened)
    if (showHoverShapes) {
        drawHoverShapes();
    }

    // Update and draw click element (only if not clicked yet)
    if (!clickElementClicked) {
        drawClickElement();
    }



}

function drawHoverShapes() {
    // Check which shape is currently hovered
    let currentlyHoveredIndex = null;
    for (let i = 0; i < hoverShapes.length; i++) {
        let d = dist(mouseX, mouseY, hoverShapes[i].x, hoverShapes[i].y);
        if (d < hoverShapes[i].size / 2) {
            currentlyHoveredIndex = i;
            break;
        }
    }

    // Start or reset wave based on hover
    if (currentlyHoveredIndex !== null) {
        // If hovering a shape, start/maintain wave from that shape
        if (waveStartTime === null || waveSourceIndex !== currentlyHoveredIndex) {
            waveStartTime = millis();
            waveSourceIndex = currentlyHoveredIndex;
            fadeOutStartTime = null; // reset fade out when new hover starts
        }
    } else {
        // Not hovering any shape
        if (waveStartTime !== null) {
            // Start fade out sequence
            fadeOutStartTime = millis();
            waveStartTime = null;
        }
    }

    for (let shape of hoverShapes) {
        // Check direct mouse hover
        let d = dist(mouseX, mouseY, shape.x, shape.y);
        shape.isHovered = d < shape.size / 2;

        // Check if shape should be waving (wave effect cascades from hovered shape onward)
        shape.isWaving = false;
        shape.isFadingOut = false;
        
        if (waveSourceIndex !== null) {
            // Calculate delay from the source shape
            let distanceFromSource = shape.index - waveSourceIndex;
            
            if (distanceFromSource >= 0) {
                let timeSinceWaveStart = millis() - waveStartTime;
                let delayPerShape = 150; // ms delay between each shape in the wave
                let shapeStartTime = distanceFromSource * delayPerShape;

                // Keep shape lit as long as source is hovered
                if (timeSinceWaveStart >= shapeStartTime) {
                    shape.isWaving = true;
                }
            }
        } else if (fadeOutStartTime !== null) {
            // Fade out is happening
            let timeSinceFadeStart = millis() - fadeOutStartTime;
            let fadeDuration = 500; // ms for all shapes to fade out
            
            if (timeSinceFadeStart < fadeDuration) {
                shape.isFadingOut = true;
            } else {
                // Fade out complete, reset
                fadeOutStartTime = null;
            }
        }

        // Smooth color transition (prioritize wave/hover, then fading out)
        let targetColor;
        if (shape.isWaving || shape.isHovered) {
            targetColor = shape.hoverColor;
        } else if (shape.isFadingOut) {
            // Fade toward base color
            targetColor = shape.baseColor;
        } else {
            targetColor = shape.baseColor;
        }
        shape.currentColor = lerpColor(shape.currentColor, targetColor, 0.15);

        // Draw shape
        fill(shape.currentColor);
        noStroke();
        
        // Apply ease-in opacity from global timing
        let opacityMultiplier = 1;
        if (easeInStartTime !== null) {
            let timeSinceEaseStart = millis() - easeInStartTime;
            let easeDuration = 800; // ms for ease-in
            if (timeSinceEaseStart < easeDuration) {
                // Smooth ease-in (quadratic)
                opacityMultiplier = (timeSinceEaseStart / easeDuration) ** 2;
            } else {
                // Ease-in complete
                opacityMultiplier = 1;
            }
        }
        
        // Apply opacity to color
        let r = red(shape.currentColor);
        let g = green(shape.currentColor);
        let b = blue(shape.currentColor);
        let a = alpha(shape.currentColor) * opacityMultiplier;
        fill(r, g, b, a);

        push();
        translate(shape.x, shape.y);

        // Scale up slightly when hovered or waving
        let s = (shape.isHovered || shape.isWaving) ? 1.2 : 1;
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
        
        // Draw number on the shape
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(20);
        textFont('Arial');
        textStyle(BOLD);
        text(shape.number, 0, 0);
        
        pop();
    }
}

function drawClickElement() {
    // Check hover state
    let d = dist(mouseX, mouseY, clickElement.x, clickElement.y);
    clickElement.isHovered = d < clickElement.size / 2;

    // Smooth color transition NOTED COME BACK TO THIS
    let targetColor = clickElement.isHovered ? clickElement.hoverColor : clickElement.baseColor;
    clickElement.currentColor = lerpColor(clickElement.currentColor, targetColor, 0.1);

    // Pulse animation
    clickElement.pulsePhase += 0.05;
    let pulse = sin(clickElement.pulsePhase) * 5;

    // Draw main element
    fill(clickElement.currentColor);
    noStroke();
    ellipse(clickElement.x, clickElement.y, clickElement.size + pulse);

    // Draw "Click me" text
    fill(200);
    textAlign(CENTER, CENTER);
    textSize(12);
    text('Explore', clickElement.x, clickElement.y);
}



function drawSmiley() { // I dont know why i cant remove this
    pop(); // or this
}

function mousePressed() {
    // Check if click element was clicked
    if (!clickElementClicked) {
        let d = dist(mouseX, mouseY, clickElement.x, clickElement.y);
        if (d < clickElement.size / 2) {
            // Toggle map display 
            showMap = !showMap;
            // Reveal hover shapes on click
            showHoverShapes = true;
            // Start ease-in animation
            easeInStartTime = millis();
            // Hide click element after interaction
            clickElementClicked = true;
            // Fade out the TopText element to match other elements
            const topText = document.querySelector('.TopText');
            if (topText) topText.classList.add('fade-out');
        }
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    dividerX = width / 2;
    createHoverShapes();
    createClickElement();


}
// Staggered reveal animation on page load
function revealCircles() {
    circles.forEach((circle, index) => {
        const col = parseInt(circle.dataset.col);
        const row = parseInt(circle.dataset.row);

        // Stagger based on column (left to right) with slight row variation
        const delay = col * 50 + row * 15;

        setTimeout(() => {
            circle.classList.add('visible');
        }, delay + 500); // Initial 500ms delay before animation starts
    });
}

// Mouse interaction - reveal/hide based on horizontal position
let mouseX = 0;
let isInitialized = false;

function updateCirclesVisibility() {
    if (!isInitialized) return;

    const windowWidth = window.innerWidth;
    const threshold = mouseX / windowWidth; // 0 to 1

    circles.forEach((circle) => {
        const col = parseInt(circle.dataset.col);
        const row = parseInt(circle.dataset.row);
        const circleThreshold = col / (cols - 1);

        // Staggered delay for smooth wave effect
        const delay = Math.abs(circleThreshold - threshold) * 100 + row * 10;

        circle.style.transitionDelay = `${delay}ms`;

        if (circleThreshold <= threshold) {
            circle.classList.add('visible');
            circle.classList.remove('hidden');
        } else {
            circle.classList.remove('visible');
            circle.classList.add('hidden');
        }
    });
}

// Track mouse movement
document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    if (isInitialized) {
        updateCirclesVisibility();
    }
});

// Handle mouse leaving the window
document.addEventListener('mouseleave', () => {
    if (isInitialized) {
        // Keep current state when mouse leaves
    }
});

// Initialize
function init() {
    initializeColors();
    createGrid();

    // Reveal animation plays first
    revealCircles();

    // After reveal completes, enable mouse interaction
    const totalRevealTime = cols * 50 + rows * 15 + 500 + 400;
    setTimeout(() => {
        isInitialized = true;
        // Set initial mouse position to right side (all visible)
        mouseX = window.innerWidth;
    }, totalRevealTime);
}



// Start when DOM is ready
init();
