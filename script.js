let SCALE = 1.05;

const canvas = document.getElementById("mazeCanvas");
const ctx = canvas.getContext("2d");

const tockeResitve = [
    [234, 2],[234, 10],[250, 10],[250, 26],[234, 26],[234, 58],[266, 58],[266, 42],
    [282, 42],[282, 90],[266, 90],[266, 106],[298, 106],[298, 90],[330, 90],[330, 154],
    [362, 154],[362, 138],[378, 138],[378, 154],[394, 154],[394, 90],[410, 90],[410, 106],
    [426, 106],[426, 90],[458, 90],[458, 106],[442, 106],[442, 122],[410, 122],[410, 138],
    [426, 138],[426, 154],[410, 154],[410, 170],[378, 170],[378, 202],[442, 202],[442, 218],
    [458, 218],[458, 234],[442, 234],[442, 250],[410, 250],[410, 234],[394, 234],[394, 282],
    [410, 282],[410, 298],[426, 298],[426, 282],[458, 282],[458, 314],[410, 314],[410, 330],
    [378, 330],[378, 346],[394, 346],[394, 362],[378, 362],[378, 458],[346, 458],[346, 474],
    [298, 474],[298, 442],[282, 442],[282, 426],[266, 426],[266, 458],[250, 458],[250, 482]
];

let walls = [];

// slike
let rocketImg = new Image();
rocketImg.src = "img/rocket.png";

let goalImg = new Image();
goalImg.src = "img/cilj.png";

let starImg = new Image();
starImg.src = "img/zvezda.png";

// igralec in cilj
const START_POS = { x: 234 * SCALE, y: 10 * SCALE };

let player = { x: START_POS.x, y: START_POS.y, r: 6 * SCALE };
let goal = { x: 251 * SCALE, y: 475 * SCALE, r: 6 * SCALE };

let playing = false;

// zvezdice
let stars = [
    { x: 450 * SCALE, y: 10 * SCALE, r: 8 * SCALE, collected: false },
    { x: 155 * SCALE, y: 120 * SCALE, r: 8 * SCALE, collected: false },
    { x: 200 * SCALE, y: 200 * SCALE, r: 8 * SCALE, collected: false }
];

// PREBERI SVG
const svgContainer = document.getElementById("mazeSVG");
svgContainer.querySelectorAll("line").forEach(l => {
    walls.push({
        x1: parseFloat(l.getAttribute("x1")) * SCALE,
        y1: parseFloat(l.getAttribute("y1")) * SCALE,
        x2: parseFloat(l.getAttribute("x2")) * SCALE,
        y2: parseFloat(l.getAttribute("y2")) * SCALE
    });
});

// =====================
// RISANJE
// =====================
function drawMaze() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "grey";
    ctx.lineWidth = 2 * SCALE;
    ctx.beginPath();

    walls.forEach(w => {
        ctx.moveTo(w.x1, w.y1);
        ctx.lineTo(w.x2, w.y2);
    });

    ctx.stroke();

    // cilj
    if (goalImg.complete) {
        ctx.drawImage(
            goalImg,
            goal.x - goal.r,
            goal.y - goal.r,
            goal.r * 2,
            goal.r * 2
        );
    }
}

function drawPlayer() {
    if (!rocketImg.complete) return;

    ctx.drawImage(
        rocketImg,
        player.x - player.r,
        player.y - player.r,
        player.r * 2,
        player.r * 2
    );
}

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

// =====================
// UPDATE
// =====================
function update() {
    drawMaze();
    drawStars();
    drawPlayer();
    checkStars();
}

// =====================
// LOGIKA
// =====================
function resetPlayer() {
    player.x = START_POS.x;
    player.y = START_POS.y;
    stars.forEach(star => star.collected = false);
}

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

// =====================
// KOLIZIJE
// =====================
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

function canMove(x, y) {
    if (x < 0 || x > canvas.width || y < 0 || y > canvas.height) return false;

    for (let w of walls) {
        if (distToSegment(x, y, w.x1, w.y1, w.x2, w.y2) < player.r + 1) return false;
    }

    return true;
}

// =====================
// PREMIKANJE
// =====================
document.addEventListener("keydown", e => {
    if (!playing) return;

    if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) {
        e.preventDefault();
    }

    let step = 3 * SCALE;
    let nx = player.x;
    let ny = player.y;

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

// =====================
// ZMAGA
// =====================
function checkWin() {
    let dx = player.x - goal.x;
    let dy = player.y - goal.y;
    let d = Math.sqrt(dx * dx + dy * dy);

    if (d < goal.r + player.r) {
        let allCollected = stars.every(star => star.collected);

        if (!allCollected) {
            alert("⚠️ Najprej poberi vse zvezdice!");
            return;
        }

        alert("🎉 Labirint rešen!");
        playing = false;
    }
}

// =====================
// REŠITEV
// =====================
function narisiResitev() {
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(tockeResitve[0][0]*SCALE, tockeResitve[0][1]*SCALE);

    for (let i = 1; i < tockeResitve.length; i++) {
        ctx.lineTo(tockeResitve[i][0]*SCALE, tockeResitve[i][1]*SCALE);
    }

    ctx.stroke();
}

// =====================
// GUMBI
// =====================
document.getElementById("playBtn").onclick = () => {
    resetPlayer();
    playing = true;
    update();
};

document.getElementById("solveBtn").onclick = narisiResitev;

document.getElementById("resetBtn").onclick = () => {
    resetPlayer();
    playing = false;
    update();
};

document.getElementById("instructionsBtn").onclick = () => {
    alert(
        "🛸 Navodila:\n\n" +
        "- Premikaš se z puščicami.\n" +
        "- Zberi vse zvezdice.\n" +
        "- Nato pojdi do cilja."
    );
};

// inicializacija
rocketImg.onload = () => update();
update();