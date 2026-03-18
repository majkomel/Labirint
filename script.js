let SCALE = 1.05;

const canvas = document.getElementById("mazeCanvas");
const ctx = canvas.getContext("2d");

let walls = [];

let rocketImg = new Image();
rocketImg.src = "img/rocket.png";
let goalImg = new Image();
goalImg.src = "img/cilj.png";

const START_POS = { x: 234 * SCALE, y: 10 * SCALE };

let player = { x: START_POS.x, y: START_POS.y, r: 6 * SCALE };
let goal = { x: 251 * SCALE, y: 475 * SCALE, r: 6 * SCALE };

let playing = false;

// PREBERI SVG in shrani stene
const svgContainer = document.getElementById("mazeSVG");
svgContainer.querySelectorAll("line").forEach(l => {
    walls.push({
        x1: parseFloat(l.getAttribute("x1")) * SCALE,
        y1: parseFloat(l.getAttribute("y1")) * SCALE,
        x2: parseFloat(l.getAttribute("x2")) * SCALE,
        y2: parseFloat(l.getAttribute("y2")) * SCALE
    });
});

/// --------------------
// RISANJE LABIRINTA
// --------------------
function drawMaze() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // stene
    ctx.strokeStyle = "grey";
    ctx.lineWidth = 2 * SCALE;
    ctx.beginPath();
    walls.forEach(w => {
        ctx.moveTo(w.x1, w.y1);
        ctx.lineTo(w.x2, w.y2);
    });
    ctx.stroke();

    // cilj - nariši sliko
    if (goalImg.complete) {
        ctx.drawImage(
            goalImg,
            goal.x - goal.r, // center slike na cilj
            goal.y - goal.r,
            goal.r * 2,
            goal.r * 2
        );
    }
}
// RISANJE igralca
function drawPlayer() {
    if (!rocketImg.complete) return;
    ctx.drawImage(rocketImg, player.x - player.r, player.y - player.r, player.r * 2, player.r * 2);
}

// POSODOBITEV zaslona
function update() {
    drawMaze();
    drawPlayer();
}

// RESET igralca na start
function resetPlayer() {
    player.x = START_POS.x;
    player.y = START_POS.y;
}

// GEOMETRIJA za stene
function distToSegment(px, py, x1, y1, x2, y2) {
    let A = px - x1, B = py - y1, C = x2 - x1, D = y2 - y1;
    let dot = A * C + B * D;
    let len = C * C + D * D;
    let param = len !== 0 ? dot / len : -1;
    let xx, yy;

    if (param < 0) { xx = x1; yy = y1; }
    else if (param > 1) { xx = x2; yy = y2; }
    else { xx = x1 + param * C; yy = y1 + param * D; }

    let dx = px - xx, dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
}

// PREVERI trk
function canMove(x, y) {
    if (x < 0 || x > canvas.width || y < 0 || y > canvas.height) return false;
    for (let w of walls) {
        if (distToSegment(x, y, w.x1, w.y1, w.x2, w.y2) < player.r + 1) return false;
    }
    return true;
}

// Nadzor igralca
document.addEventListener("keydown", e => {
    if (!playing) return;

    // PREVENT DEFAULT za puščice
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
    }

    let step = 2 * SCALE;
    let nx = player.x, ny = player.y;

    if (e.key === "ArrowUp") ny -= step;
    if (e.key === "ArrowDown") ny += step;
    if (e.key === "ArrowLeft") nx -= step;
    if (e.key === "ArrowRight") nx += step;

    if (canMove(nx, ny)) {
        player.x = nx;
        player.y = ny;
        update();
        checkWin();
    }
});
// PREVERI zmago
function checkWin() {
    // Preveri, ali je igralec dosegel cilj
    let dx = player.x - goal.x;
    let dy = player.y - goal.y;
    let d = Math.sqrt(dx * dx + dy * dy);

    if (d < goal.r + player.r) {
        // Preveri, ali so vse zvezdice pobrane
        let allCollected = stars.every(star => star.collected);

        if (!allCollected) {
            // Igra se ne konča, lahko pokaže opozorilo
            alert("⚠️ Najprej poberi vse zvezdice!");
            return; // ne nadaljuj
        }

        // Če so vse zvezdice pobrane, zmaga
        alert("🎉 Labirint rešen!");
        playing = false;
    }
}

// Heuristika za A*
function heuristic(a, b) {
    let dx = a.x - b.x, dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}

// REŠEVANJE labirinta (A*)
function solveMaze() {
    let start = { x: START_POS.x, y: START_POS.y };
    let end = { x: goal.x, y: goal.y };

    let open = [{ ...start, g: 0, f: 0, path: [start] }];
    let visited = new Set();
    let step = 4 * SCALE;

    while (open.length) {
        open.sort((a, b) => a.f - b.f);
        let current = open.shift();
        let key = Math.round(current.x) + "," + Math.round(current.y);
        if (visited.has(key)) continue;
        visited.add(key);

        if (heuristic(current, end) < goal.r + 3) {
            drawSolution(current.path);
            return;
        }

        let dirs = [
            { dx: step, dy: 0 }, { dx: -step, dy: 0 },
            { dx: 0, dy: step }, { dx: 0, dy: -step }
        ];

        for (let d of dirs) {
            let nx = current.x + d.dx, ny = current.y + d.dy;
            if (!canMove(nx, ny)) continue;

            let g = current.g + 1;
            let h = heuristic({ x: nx, y: ny }, end);

            open.push({ x: nx, y: ny, g, f: g + h, path: [...current.path, { x: nx, y: ny }] });
        }
    }

    alert("Rešitve ni bilo mogoče najti");
}

// RISANJE rešitve
function drawSolution(path) {
    update();
    ctx.strokeStyle = "#3311ff";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);

    let i = 1;
    function animate() {
        if (i >= path.length) { ctx.stroke(); return; }
        ctx.lineTo(path[i].x, path[i].y);
        ctx.stroke();
        i++;
        requestAnimationFrame(animate);
    }
    animate();
}
// =====================
// ZVEZDICE - slika
// =====================
let starImg = new Image();
starImg.src = "img/zvezda.png"; // tvoja slika

let stars = [
    { x: 80 * SCALE, y: 30 * SCALE, r: 8 * SCALE, collected: false },
    { x: 150 * SCALE, y: 100 * SCALE, r: 8 * SCALE, collected: false },
    { x: 200 * SCALE, y: 200 * SCALE, r: 8 * SCALE, collected: false }
];

function drawStars() {
    stars.forEach(star => {
        if (!star.collected && starImg.complete) {
            ctx.drawImage(
                starImg,
                star.x - star.r,
                star.y - star.r,
                star.r * 2,
                star.r * 2
            );
        }
    });
}

// Preveri pobiranje zvezdic
function checkStars() {
    stars.forEach(star => {
        if (!star.collected) {
            let dx = player.x - star.x;
            let dy = player.y - star.y;
            if (Math.sqrt(dx * dx + dy * dy) < player.r + star.r) {
                star.collected = true;
            }
        }
    });
}

// Posodobi update, da nariše zvezdice in preveri pobiranje
function update() {
    drawMaze();
    drawStars();
    drawPlayer();
    checkStars();
	updateStars();
}
function updateStars() {
    stars.forEach(star => {
        if (!star.collected) {
            let dx = player.x - star.x;
            let dy = player.y - star.y;
            let d = Math.sqrt(dx * dx + dy * dy);
            if (d < player.r + star.r) {
                star.collected = true;
            }
        }
    });
}
// Reset igralca in zvezdic
function resetPlayer() {
    player.x = START_POS.x;
    player.y = START_POS.y;
    stars.forEach(star => star.collected = false);
}
// GUMBI
document.getElementById("playBtn").onclick = () => { resetPlayer(); playing = true; update(); };
document.getElementById("solveBtn").onclick = () => solveMaze();
document.getElementById("resetBtn").onclick = () => { resetPlayer(); playing = false; update(); };

document.getElementById("instructionsBtn").onclick = () => {
    alert(
        "🛸 Navodila:\n\n" +
        "- Premikaš se z puščicami na tipkovnici.\n" +
        "- Zberi vse 3 zvezdice pred koncem labirinta.\n" +
        "- Doseži cilj po tem, ko pobereš zvezdice.\n" +
        "- Če ne zbereš vseh zvezdic, rešitev labirinta ne moreš končati."
    );
};
// ZAGOTOVI, da se raketa nariše
rocketImg.onload = () => update();

update();