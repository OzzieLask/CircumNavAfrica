// Educational Journey: Vasco da Gama's Path to India
// Cursor-based discovery - hover over the path to learn

let bgImg = null;
let hoveredWaypoint = -1;
let infoBoxAlpha = 0;
let pathSegmentAlpha = 0;
let maxUnlockedWaypoint = 0; // Track progress through journey
let waypointOpacities = []; // Store eased opacity for each waypoint
let pathDrawProgress = 0; // Eased progress for drawing the path
let examModalOpen = false; // Track if exam modal is displayed
let examAnswers = [null, null, null]; // Store user answers: [q1, q2, q3]
let examSubmitted = false; // Track if exam has been graded
let lastInfoBoxBounds = null; // Store info box position to keep it visible when hovering over it
let examUnlocked = false; // Track if exam icon should be unlocked (after viewing waypoint 6)
let pulseAnimation = 0; // Track pulse animation for next waypoint

// SVG Configuration
const SVG_W = 1440;
const SVG_H = 1024;

// Vasco da Gama's Journey Waypoints
const JOURNEY_WAYPOINTS = [
    {
        id: 0,
        name: "Lisbon, Portugal",
        x: 479.786,
        y: 220,
        title: "The Beginning",
        content: "In 1497, Vasco da Gama departed from Lisbon, Portugal with four ships and a crew of 170 men. His mission: to find a sea route to India.",
        details: "This journey would take nearly 2 years and cover over 24,000 miles."
    },
    {
        id: 1,
        name: "Cape Verde Islands",
        x: 264,
        y: 457,
        title: "Island Resupply",
        content: "Da Gama's fleet stopped at the Cape Verde Islands off the African coast to resupply with fresh water, fruit, and provisions for the long ocean crossing ahead.",
        details: "These Portuguese islands were a crucial waypoint for Atlantic voyages."
    },
    {
        id: 2,
        name: "West African Coast",
        x: 323,
        y: 565,
        title: "Last Stop Before the Ocean",
        content: "Before venturing into the deep Atlantic, the fleet made its final sighting of the African coast. This would be the last land they would see for months.",
        details: "From here, they would take a bold southwestern route into open ocean."
    },
    {
        id: 3,
        name: "Deep Atlantic",
        x: 450,
        y: 720,
        title: "The Bold Path",
        content: "Unlike Bartolomeu Dias before him, da Gama ventured far into the open Atlantic, taking a daring southern route away from the African coast. This bold path would become the standard for future Indian Ocean voyages.",
        details: "This maneuver avoided the dangerous African coast and proved more efficient than hugging the shore."
    },
    {
        id: 4,
        name: "Cape of Good Hope",
        x: 728,
        y: 972,
        title: "Rounding the Cape",
        content: "After months at sea, da Gama reached the Cape of Good Hope in South Africa. This was a critical navigation point where many ships had previously failed.",
        details: "Strong currents and storms made this one of the most dangerous passages of the voyage."
    },
    {
        id: 5,
        name: "Mozambique & Mombasa",
        x: 900,
        y: 750,
        title: "East African Ports",
        content: "The fleet sailed up Africa's eastern coast, stopping at ports in Mozambique and Mombasa. Here they encountered established trading networks and Muslim merchants who had traded with India for centuries.",
        details: "These cosmopolitan ports revealed that others had long known the route to the East."
    },
    {
        id: 6,
        name: "Calicut, India",
        x: 1216,
        y: 507,
        title: "Arrival in India",
        content: "In May 1498, da Gama reached Calicut on the Indian coast after crossing the Indian Ocean with monsoon winds. Europeans had finally found a sea route to Asia!",
        details: "This voyage revolutionized global trade and marked the beginning of European influence in the Indian Ocean."
    }
];

// Coordinate conversion functions
function svgToScreen(sx, sy) {
    const scaleX = width / SVG_W;
    const scaleY = height / SVG_H;
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

function screenToSvg(px, py) {
    const scaleX = width / SVG_W;
    const scaleY = height / SVG_H;
    const scale = Math.min(scaleX, scaleY);
    const drawW = SVG_W * scale;
    const drawH = SVG_H * scale;
    const offsetX = (width - drawW) / 2;
    const offsetY = (height - drawH) / 2;
    return {
        x: (px - offsetX) / scale,
        y: (py - offsetY) / scale
    };
}

// Utility functions
function distanceToLineSegment(px, py, x1, y1, x2, y2) {
    let A = px - x1;
    let B = py - y1;
    let C = x2 - x1;
    let D = y2 - y1;

    let dot = A * C + B * D;
    let lenSq = C * C + D * D;
    let param = lenSq !== 0 ? dot / lenSq : 0;

    let xx, yy;
    if (param < 0) {
        xx = x1;
        yy = y1;
    } else if (param > 1) {
        xx = x2;
        yy = y2;
    } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }

    let dx = px - xx;
    let dy = py - yy;
    return sqrt(dx * dx + dy * dy);
}

function wrapText(text, maxWidth, fontSize) {
    let words = text.split(' ');
    let lines = [];
    let currentLine = '';
    
    textSize(fontSize);
    
    for (let word of words) {
        let testLine = currentLine + (currentLine ? ' ' : '') + word;
        let w = textWidth(testLine);
        
        if (w > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
}

//Preloads Map
function preload() {
    loadImage('Map.svg',
        img => { bgImg = img; },
        err => { console.warn('Map.svg failed to load'); }
    );
}

// Menu overlay logic and fade-in for experience
let menuActive = true;
let menuFading = false;
let experienceFadingIn = false;
let experienceFadeAlpha = 1;

function hideMenuOverlay() {
    const menu = document.getElementById('menu-overlay');
    if (menu) {
        menu.classList.add('menu-fade');
        menuFading = true;
        setTimeout(() => {
            menu.style.display = 'none';
            menuActive = false;
            menuFading = false;
            // Start fade-in for experience
            experienceFadingIn = true;
            experienceFadeAlpha = 1;
        }, 700);
    } else {
        menuActive = false;
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('explore-btn');
    if (btn) {
        btn.addEventListener('click', hideMenuOverlay);
    }
});

function setup() {
    let canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('canvas-container');
    textFont('Inter');
    noSmooth();
    
    // Initialize waypoint opacities
    for (let i = 0; i < JOURNEY_WAYPOINTS.length; i++) {
        waypointOpacities[i] = 0;
    }
    waypointOpacities[0] = 1; // First waypoint starts unlocked
}
// DRAWDRAWDRAW DRAW DRAW
function draw() {
    frameRate(60);
    // Pause experience if menu is active or fading
    if (menuActive || menuFading) {
        background(232, 220, 200, 255); // match menu bg
        return;
    }
    // Fade-in effect for experience
    if (experienceFadingIn) {
        experienceFadeAlpha -= 0.04;
        if (experienceFadeAlpha <= 0) {
            experienceFadeAlpha = 0;
            experienceFadingIn = false;
        }
    }
    // Update pulse animation
    pulseAnimation += 0.08;
    // Background (match menu)
    background(232, 220, 200, 255);
    // Draw map if loaded
    if (bgImg) {
        push();
        const s = svgToScreen(0, 0);
        tint(255, 220);
        image(bgImg, s.offsetX, s.offsetY, SVG_W * s.scale, SVG_H * s.scale);
        pop();
    }
    // Update hover state
    updateHoveredWaypoint();
    // Draw path and waypoints
    drawJourneyPath();
    drawWaypoints();
    // Draw exam icon
    drawExamIcon();
    // Draw info box when hovering
    if (hoveredWaypoint >= 0) {
        drawCurrentInfoBox();
    }
    // Draw exam modal if open
    drawExamModal();
    // Fade-in overlay
    if (experienceFadingIn && experienceFadeAlpha > 0) {
        push();
        noStroke();
        fill(232, 220, 200, 255 * experienceFadeAlpha);
        rect(0, 0, width, height);
        pop();
    }
    updateCursorPositionDisplay();
}

// Hover detection
function updateHoveredWaypoint() {
    let closestDist = Infinity;
    let closestIndex = -1;
    
    // Check distance to path segments (only if next waypoint is unlocked)
    for (let i = 0; i < JOURNEY_WAYPOINTS.length - 1; i++) {
        if (i > maxUnlockedWaypoint) continue; // Skip locked paths
        
        let p1 = svgToScreen(JOURNEY_WAYPOINTS[i].x, JOURNEY_WAYPOINTS[i].y);
        let p2 = svgToScreen(JOURNEY_WAYPOINTS[i + 1].x, JOURNEY_WAYPOINTS[i + 1].y);
        
        let d = distanceToLineSegment(mouseX, mouseY, p1.x, p1.y, p2.x, p2.y);
        
        if (d < 35 && d < closestDist) {
            closestDist = d;
            closestIndex = i;
        }
    }
    
    // Check distance to waypoints themselves (higher priority)
    for (let i = 0; i < JOURNEY_WAYPOINTS.length; i++) {
        if (i > maxUnlockedWaypoint + 1) continue; // Can only hover on unlocked waypoints and the next one
        
        let pos = svgToScreen(JOURNEY_WAYPOINTS[i].x, JOURNEY_WAYPOINTS[i].y);
        let d = dist(mouseX, mouseY, pos.x, pos.y);
        
        if (d < 45) {
            closestIndex = i;
            closestDist = 0;
            break;
        }
    }
    
    // Only set hoveredWaypoint to unlocked/next waypoints
    if (closestIndex < 0 || closestIndex > maxUnlockedWaypoint + 1) {
        // Check if mouse is over the info box to keep it visible
        if (lastInfoBoxBounds && 
            mouseX > lastInfoBoxBounds.x && mouseX < lastInfoBoxBounds.x + lastInfoBoxBounds.w &&
            mouseY > lastInfoBoxBounds.y && mouseY < lastInfoBoxBounds.y + lastInfoBoxBounds.h) {
            // Keep the current hovered waypoint
        } else {
            hoveredWaypoint = -1;
        }
    } else {
        hoveredWaypoint = closestIndex;
    }
    
    // Unlock next waypoint when hovering on current one
    if (hoveredWaypoint >= 0 && hoveredWaypoint <= maxUnlockedWaypoint) {
        if (hoveredWaypoint === maxUnlockedWaypoint && maxUnlockedWaypoint < JOURNEY_WAYPOINTS.length - 1) {
            maxUnlockedWaypoint = hoveredWaypoint + 1;
        }
        
        // Unlock exam icon when viewing waypoint 6 (Calicut, India)
        if (hoveredWaypoint === 6) {
            examUnlocked = true;
        }
    }
    
    // Update waypoint opacities with easing
    for (let i = 0; i < JOURNEY_WAYPOINTS.length; i++) {
        let targetOpacity = 0.2; // Default locked
        if (i <= maxUnlockedWaypoint) {
            targetOpacity = 1; // Unlocked
        } else if (i === maxUnlockedWaypoint + 1) {
            targetOpacity = 0.5; // Next waypoint
        }
        
        // Smooth easing toward target opacity
        waypointOpacities[i] = lerp(waypointOpacities[i], targetOpacity, 0.08);
    }
    
    // Smooth alpha transition
    if (hoveredWaypoint >= 0) {
        infoBoxAlpha = min(1, infoBoxAlpha + 0.12);
        pathSegmentAlpha = min(1, pathSegmentAlpha + 0.12);
    } else {
        infoBoxAlpha = max(0, infoBoxAlpha - 0.08);
        pathSegmentAlpha = max(0, pathSegmentAlpha - 0.08);
    }
}


// PATH DRAWS
function drawJourneyPath() {
    // Ease the path drawing progress
    let targetProgress = maxUnlockedWaypoint;
    pathDrawProgress = lerp(pathDrawProgress, targetProgress, 0.06);
    
    // Draw only the animated drawing line (no static path)
    stroke(160, 100, 60, 180);
    strokeWeight(5);
    noFill(); 
    
    beginShape();
    for (let i = 0; i < JOURNEY_WAYPOINTS.length; i++) {
        let wp = JOURNEY_WAYPOINTS[i];
        let pos = svgToScreen(wp.x, wp.y);
        
        if (i < floor(pathDrawProgress)) {
            // Fully drawn segments
            vertex(pos.x, pos.y);
        } else if (i === floor(pathDrawProgress)) {
            // Current segment being drawn - interpolate to next point
            vertex(pos.x, pos.y);
            
            if (i < JOURNEY_WAYPOINTS.length - 1) {
                let nextWp = JOURNEY_WAYPOINTS[i + 1];
                let nextPos = svgToScreen(nextWp.x, nextWp.y);
                
                // Draw from current point toward next point based on progress
                let t = pathDrawProgress - floor(pathDrawProgress); // 0 to 1
                let interpX = lerp(pos.x, nextPos.x, t);
                let interpY = lerp(pos.y, nextPos.y, t);
                vertex(interpX, interpY);
            }
            break; // Don't draw future segments
        }
    }
    endShape();
    
    // Highlight hovered segment with easing
    if (hoveredWaypoint >= 0 && hoveredWaypoint < JOURNEY_WAYPOINTS.length - 1) {
        let p1 = svgToScreen(JOURNEY_WAYPOINTS[hoveredWaypoint].x, JOURNEY_WAYPOINTS[hoveredWaypoint].y);
        let p2 = svgToScreen(JOURNEY_WAYPOINTS[hoveredWaypoint + 1].x, JOURNEY_WAYPOINTS[hoveredWaypoint + 1].y);
        
        stroke(200, 120, 60, 0 * pathSegmentAlpha);
        strokeWeight(8);
        line(p1.x, p1.y, p2.x, p2.y);
    }
}

function drawWaypoints() {
    for (let i = 0; i < JOURNEY_WAYPOINTS.length; i++) {
        let wp = JOURNEY_WAYPOINTS[i];
        let pos = svgToScreen(wp.x, wp.y);
        
        let isHovered = (hoveredWaypoint === i);
        let currentOpacity = waypointOpacities[i];
        let isActiveWaypoint = (i === maxUnlockedWaypoint);
        // Calculate pulse scale for active waypoint
        let pulseScale = 1;
        if (isActiveWaypoint) {
            // Create a pulsing effect: scales from 1 to 1.3 and back
            pulseScale = 1 + 0.3 * abs(sin(pulseAnimation));
        }
        // Pulsing glow effect for active waypoint
        if (isActiveWaypoint) {
            noStroke();
            fill(220, 150, 80, 80 * abs(sin(pulseAnimation)) * currentOpacity);
            ellipse(pos.x, pos.y, 110 * pulseScale);
        }
        
        // Glow effect (only for unlocked and hovered)
        if (isHovered && currentOpacity > 0.7) {
            noStroke();
            fill(180, 110, 50, 50 * infoBoxAlpha);
            ellipse(pos.x, pos.y, 110);
        }
        
        // Waypoint circle - smoothly transition based on eased opacity
        let col = isHovered && currentOpacity > 0.7 ? color(180, 110, 50) : color(140, 90, 40);
        
        fill(col);
        stroke(100, 60, 30, 120 * currentOpacity);
        strokeWeight(2);
        
        push();
        let r = red(col);
        let g = green(col);
        let b = blue(col);
        fill(r, g, b, 255 * currentOpacity);
        ellipse(pos.x, pos.y, 55 * pulseScale);
        pop();
        
    }
}

function drawExamIcon() {
    let iconX = width - 50;
    let iconY = 30;
    let iconSize = 40;
    
    push();
    
    // Background circle
    if (examUnlocked) {
        fill(150, 110, 70, 200);
        stroke(100, 70, 40, 200);
    } else {
        fill(180, 170, 160, 120);
        stroke(120, 110, 100, 120);
    }
    strokeWeight(2);
    ellipse(iconX, iconY, iconSize, iconSize);
    
    // exmam icon
    fill(240, 235, 225, examUnlocked ? 255 : 150);
    textAlign(CENTER, CENTER);
    textSize(24);
    textStyle(NORMAL);
    
    if (examUnlocked) {
        text("!", iconX, iconY); // Test unlocked
    } else {
        text("?", iconX, iconY); // TEst Locked
    }
    
    pop();
}

// TEXT BOXES
function drawCurrentInfoBox() {
    if (hoveredWaypoint < 0 || hoveredWaypoint > maxUnlockedWaypoint) return;
    
    let wpIndex = hoveredWaypoint;
    if (wpIndex >= JOURNEY_WAYPOINTS.length) wpIndex = JOURNEY_WAYPOINTS.length - 1;
    
    let wp = JOURNEY_WAYPOINTS[wpIndex];
    
    push();
    
    // Position box to the right of cursor
    let boxW = min(600, width - 100);
    let boxH = 280;
    let boxX, boxY;
    
    // Place box to the right of cursor with some padding
    boxX = mouseX + 25;
    boxY = mouseY - boxH / 2; // Center vertically on cursor
    
    // Keep box within bounds
    if (boxX + boxW > width - 20) {
        boxX = width - boxW - 20; // Move left if it goes off-screen
    }
    if (boxY < 20) {
        boxY = 20;
    }
    if (boxY + boxH > height - 20) {
        boxY = height - boxH - 20;
    }
    
    // Background OF TEXT BOX
    fill(240, 235, 225, 240 * infoBoxAlpha);
    stroke(150, 110, 70, 150 * infoBoxAlpha);
    strokeWeight(2);
    rect(boxX, boxY, boxW, boxH, 12);

    
    // Title
    fill(60, 40, 20, 240 * infoBoxAlpha);
    textSize(28);
    textStyle(NORMAL);
    textAlign(LEFT);
    text(wp.title, boxX + 30, boxY + 50);
    
    // Location
    fill(100, 70, 40, 200 * infoBoxAlpha);
    textSize(13);
    textStyle(NORMAL);
    text("▪ " + wp.name, boxX + 30, boxY + 85);
    
    // Content
    fill(80, 60, 40, 200 * infoBoxAlpha);
    textSize(14);
    textAlign(LEFT);
    let contentY = boxY + 120;
    let contentW = boxW - 60;
    
    let lines = wrapText(wp.content, contentW, 14);
    for (let line of lines) {
        text(line, boxX + 30, contentY);
        contentY += 24;
    }
    
    // Details
    fill(100, 80, 60, 160 * infoBoxAlpha);
    textSize(12);
    contentY += 8;
    let detailLines = wrapText(wp.details, contentW, 12);
    for (let line of detailLines) {
        text(line, boxX + 30, contentY);
        contentY += 20;
    }
    
    // Store box bounds so we can keep it visible when hovering over it
    lastInfoBoxBounds = {
        x: boxX,
        y: boxY,
        w: boxW,
        h: boxH
    };
    
    pop();

    pop();
}

// EXAM
function drawExamModal() {
    if (!examModalOpen) return;
    
    push();
    
    // Semi-transparent overlay
    fill(0, 0, 0, 180);
    rect(0, 0, width, height);
    
    // Modal background
    let modalW = width * 0.85;
    let modalH = height * 0.85;
    let modalX = (width - modalW) / 2;
    let modalY = (height - modalH) / 2;
    
    fill(240, 235, 225, 255);
    stroke(150, 110, 70, 200);
    strokeWeight(3);
    rect(modalX, modalY, modalW, modalH, 16);
    
    // Close button (X in top right)
    let closeX = modalX + modalW - 40;
    let closeY = modalY + 30;
    
    noStroke();
    fill(150, 110, 70, 200);
    textSize(32);
    textStyle(NORMAL);
    textAlign(CENTER, CENTER);
    text("✕", closeX, closeY);
    
    // Title
    fill(60, 40, 20, 255);
    textSize(44);
    textStyle(NORMAL);
    textAlign(LEFT);
    text("Journey Knowledge Exam", modalX + 50, modalY + 60);
    
    
    // Questions
    let questions = [
        {
            q: "1. In what year did Vasco da Gama depart \nfrom Lisbon?",
            options: ["1497", "1498", "1492", "1500"],
            correct: 0
        },
        {
            q: "2. How many ships sailed in da Gama's fleet?",
            options: ["2", "4", "6", "8"],
            correct: 1
        },
        {
            q: "3. In what month did he arrive in India?",
            options: ["March", "April", "May", "June"],
            correct: 2
        }
    ];

    let qY = modalY + 130;
    let optionSpacing = 50;
    let btnH = 35;
    let colGap = 120;// change collunm
    let colW = 300;

    // Layout: Q1 and Q2 in left column, Q3 in right column (both at top)
    let q1 = questions[0];
    let q2 = questions[1];
    let q3 = questions[2];
    
    let leftX = modalX + 50;
    let rightX = leftX + colW + colGap;

    // Q1 (left column, top)
    noStroke();
    fill(60, 40, 20, 255);
    textSize(18);
    textStyle(NORMAL);
    textAlign(LEFT);
    text(q1.q, leftX, qY);
    let q1OptY = qY + 35;
    for (let j = 0; j < q1.options.length; j++) {
        let optY = q1OptY + j * optionSpacing;
        let isSelected = examAnswers[0] === j;
        let isCorrect = j === q1.correct;
        if (examSubmitted) {
            fill(isCorrect ? color(100, 180, 100, 220) : (isSelected && !isCorrect ? color(200, 100, 100, 220) : color(200, 190, 170, 150)));
        } else {
            fill(isSelected ? color(150, 110, 70, 220) : color(200, 190, 170, 150));
        }
        noStroke();
        rect(leftX, optY, colW, btnH, 6);
        fill(60, 40, 20, 255);
        textSize(14);
        textStyle(NORMAL);
        textAlign(LEFT, CENTER);
        text("  ○ " + q1.options[j], leftX + 10, optY + btnH / 2);
    }

    // Q2 (left column, below Q1)
    let q2Y = q1OptY + optionSpacing * 4 + 25;
    fill(60, 40, 20, 255);
    textSize(18);
    textStyle(NORMAL);
    textAlign(LEFT);
    text(q2.q, leftX, q2Y);
    let q2OptY = q2Y + 35;
    for (let j = 0; j < q2.options.length; j++) {
        let optY = q2OptY + j * optionSpacing;
        let isSelected = examAnswers[1] === j;
        let isCorrect = j === q2.correct;
        if (examSubmitted) {
            fill(isCorrect ? color(100, 180, 100, 220) : (isSelected && !isCorrect ? color(200, 100, 100, 220) : color(200, 190, 170, 150)));
        } else {
            fill(isSelected ? color(150, 110, 70, 220) : color(200, 190, 170, 150));
        }
        noStroke();
        rect(leftX, optY, colW, btnH, 6);
        fill(60, 40, 20, 255);
        textSize(14);
        textStyle(NORMAL);
        textAlign(LEFT, CENTER);
        text("  ○ " + q2.options[j], leftX + 10, optY + btnH / 2);
    }

    // Q3 (right column, aligned with Q1 at top)
    fill(60, 40, 20, 255);
    textSize(18);
    textStyle(NORMAL);
    textAlign(LEFT);
    text(q3.q, rightX, qY);
    let q3OptY = qY + 35;
    for (let j = 0; j < q3.options.length; j++) {
        let optY = q3OptY + j * optionSpacing;
        let isSelected = examAnswers[2] === j;
        let isCorrect = j === q3.correct;
        if (examSubmitted) {
            fill(isCorrect ? color(100, 180, 100, 220) : (isSelected && !isCorrect ? color(200, 100, 100, 220) : color(200, 190, 170, 150)));
        } else {
            fill(isSelected ? color(150, 110, 70, 220) : color(200, 190, 170, 150));
        }
        noStroke();
        rect(rightX, optY, colW, btnH, 6);
        fill(60, 40, 20, 255);
        textSize(14);
        textStyle(NORMAL);
        textAlign(LEFT, CENTER);
        text("  ○ " + q3.options[j], rightX + 10, optY + btnH / 2);
    }
    
    // Submit/Results button (centered at bottom)
    let submitY = modalY + modalH - 80;
    let submitX = (width / 2) - 100;
    if (!examSubmitted) {
        // Submit button
        fill(150, 110, 70, 220);
        stroke(100, 70, 40, 200);
        strokeWeight(2);
        rect(submitX, submitY, 200, 45, 8);
        
        fill(240, 235, 225, 255);
        textSize(18);
        textStyle(BOLD);
        textAlign(CENTER, CENTER);
        text("Submit Exam", submitX + 100, submitY + 22);
    } else {
        // Show score
        let correct = 0;
        for (let i = 0; i < questions.length; i++) {
            if (examAnswers[i] === questions[i].correct) correct++;
        }
        let score = Math.round((correct / questions.length) * 100);
        
        fill(60, 40, 20, 255);
        textSize(28);
        textStyle(BOLD);
        textAlign(CENTER);
        if (score === 100) {
            text("Perfect Score!", submitX + 100, submitY);
        } else if (score >= 67) {
            text("Great job! " + score + "%", submitX + 100, submitY);
        } else {
            text("Score: " + score + "% - Try again!", submitX + 100, submitY);
        }
        
        textSize(14);
        textStyle(ITALIC);
        textAlign(CENTER);
        fill(100, 80, 60, 200);
        text("Click ✕ to close", submitX + 100, submitY + 45);
    }
    
    pop();
}


function wrapText(text, maxWidth, fontSize) {
    let words = text.split(' ');
    let lines = [];
    let currentLine = '';
    
    textSize(fontSize);
    
    for (let word of words) {
        let testLine = currentLine + (currentLine ? ' ' : '') + word;
        let w = textWidth(testLine);
        
        if (w > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
}

// Input handling
function updateCursorPositionDisplay() {
    const coordsElement = document.getElementById('cursor-coords');
    if (coordsElement) {
        const svgCoords = screenToSvg(mouseX, mouseY);
        coordsElement.textContent = `${Math.round(svgCoords.x)}, ${Math.round(svgCoords.y)}`;
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function mousePressed() {
    // Check if clicking the exam icon
    let iconX = width - 50;
    let iconY = 30;
    let iconSize = 40;
    
    if (examUnlocked && dist(mouseX, mouseY, iconX, iconY) < iconSize / 2 + 5) {
        examModalOpen = true;
        examAnswers = [null, null, null];
        examSubmitted = false;
        return false;
    }
    
    // Handle exam modal interactions
    if (examModalOpen) {
        let modalW = width * 0.85;
        let modalH = height * 0.85;
        let modalX = (width - modalW) / 2;
        let modalY = (height - modalH) / 2;

        // Close button
        let closeX = modalX + modalW - 40;
        let closeY = modalY + 30;
        if (dist(mouseX, mouseY, closeX, closeY) < 25) {
            examModalOpen = false;
            examAnswers = [null, null, null];
            examSubmitted = false;
            return false;
        }

        // Question answers and submit button
        if (!examSubmitted) {
            let questions = [
                { correct: 0 },
                { correct: 1 },
                { correct: 2 }
            ];

            let qY = modalY + 130;
            let optionSpacing = 50;
            let btnH = 35;
            let colGap = 120;
            let colW = 300;
            let leftX = modalX + 50;
            let rightX = leftX + colW + colGap;

            // Q1 (left col, top)
            let q1OptY = qY + 35;
            for (let j = 0; j < 4; j++) {
                let optY = q1OptY + j * optionSpacing;
                if (mouseX > leftX && mouseX < leftX + colW && mouseY > optY && mouseY < optY + btnH) {
                    examAnswers[0] = j;
                    return false;
                }
            }

            // Q2 (left col, below Q1)
            let q2Y = q1OptY + optionSpacing * 4 + 25;
            let q2OptY = q2Y + 35;
            for (let j = 0; j < 4; j++) {
                let optY = q2OptY + j * optionSpacing;
                if (mouseX > leftX && mouseX < leftX + colW && mouseY > optY && mouseY < optY + btnH) {
                    examAnswers[1] = j;
                    return false;
                }
            }

            // Q3 (right col, aligned with Q1)
            let q3OptY = qY + 35;
            for (let j = 0; j < 4; j++) {
                let optY = q3OptY + j * optionSpacing;
                if (mouseX > rightX && mouseX < rightX + colW && mouseY > optY && mouseY < optY + btnH) {
                    examAnswers[2] = j;
                    return false;
                }
            }

            // Submit button (centered at bottom)
            let submitY = modalY + modalH - 80;
            let submitX = (width / 2) - 100;
            if (mouseX > submitX && mouseX < submitX + 200 && mouseY > submitY && mouseY < submitY + 45) {
                examSubmitted = true;
                return false;
            }
        }
    }
}

