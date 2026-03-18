// DOM Elements
const btnNormal = document.getElementById('btn-normal');
const btnTsunami = document.getElementById('btn-tsunami');
const btnEarthquake = document.getElementById('btn-earthquake');
const btnFire = document.getElementById('btn-fire');
const btnDestroy = document.getElementById('btn-destroy');
const btnRepair = document.getElementById('btn-repair');
const latencyVal = document.getElementById('latency-val');
const systemLogs = document.getElementById('system-logs');
const qosQueue = document.getElementById('qos-queue');
const canvas = document.getElementById('packetCanvas');
const ctx = canvas.getContext('2d');

// Environment & Effect Elements
const dangerOverlay = document.getElementById('danger-overlay');
const appContainer = document.getElementById('app-container');
const oceanContainer = document.getElementById('ocean');
const statusIndicator = document.getElementById('status-indicator');
const statusText = document.getElementById('status-text');

// Node Elements for coordinates
const nodeSensor = document.getElementById('node-sensor');
const nodeEdgeMain = document.getElementById('node-edge-2');
const nodeEdgeAlt1 = document.getElementById('node-edge-1');
const nodeEdgeAlt2 = document.getElementById('node-edge-3');
const nodeBackbone = document.getElementById('node-backbone');
const nodeBrain = document.getElementById('node-brain');
const badgeAuth = document.getElementById('brain-print-auth');

// Simulation State
let isDangerMode = false;
let isNodeDestroyed = false;
let packets = [];
let packetIdCounter = 0;
let queueData = [];
let spawnInterval;

// Real data mode
let realEvents = [];
let realDataIndex = 0;
let isRealDataMode = true; // set false to force demo only

async function loadRealData() {
    if (!isRealDataMode) {
        addLog('Real data mode ปิดไว้, ใช้ demo เท่านั้น', 'warning');
        return;
    }

    try {
        const res = await fetch('/api/realtime');
        // Fallback to local file if no server running
        if (res.status === 404) {
            throw new Error('API 404');
        }

        const payload = await res.json();
        realEvents = Array.isArray(payload.events) ? payload.events : [];

        if (realEvents.length > 0) {
            addLog(`โหลดข้อมูลจริงจาก API /api/realtime สำเร็จ (${realEvents.length} บันทึก)`, 'success');
        } else {
            addLog('API real-time ให้ข้อมูลว่าง อัพเดต demo data', 'warning');
            realEvents = [];
        }
    } catch (err) {
        addLog(`API realtime ล้มเหลว (${err}). โหลดจาก data/real_data.json`, 'warning');
        try {
            const res2 = await fetch('data/real_data.json');
            if (res2.ok) {
                const json = await res2.json();
                realEvents = Array.isArray(json) ? json : [];
                addLog(`โหลดข้อมูลจริงจาก data/real_data.json สำเร็จ (${realEvents.length} บันทึก)`, 'success');
            } else {
                throw new Error(`HTTP ${res2.status}`);
            }
        } catch (err2) {
            realEvents = [];
            addLog(`ไม่สามารถโหลดข้อมูลสำรองได้ (${err2}), ใช้ demo ต่อ`, 'danger');
        }
    }
}

// Poll realtime data every 20 seconds
setInterval(() => {
    if (isRealDataMode) loadRealData();
}, 20000);


function getPacketTypeFromEvent(eventObj) {
    const severity = Number(eventObj.severity || 0);
    if (severity >= 0.7) return 'danger';
    if (eventObj.event === 'earthquake' || eventObj.event === 'tsunami' || eventObj.event === 'fire') return 'danger';
    return 'normal';
}

function spawnFromRealData() {
    if (realEvents.length === 0) return;

    const event = realEvents[realDataIndex];
    realDataIndex = (realDataIndex + 1) % realEvents.length;

    const type = getPacketTypeFromEvent(event);
    packets.push(new Packet(type));

    addLog(`โหลดเหตุการณ์จริง ${event.event} (${event.location}) severity=${event.severity}`, type === 'danger' ? 'danger' : 'normal');

    // Update UI mode flags
    if (type === 'danger') {
        triggerDisaster(event.event, `เตือนภัยจริง: ${event.description}`, `เหตุการณ์: ${event.event} ที่ ${event.location}`);
    }
}

// Resize canvas to match container
function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}
window.addEventListener('resize', resizeCanvas);
// Call once initially but delay slightly to ensure DOM is rendered
setTimeout(resizeCanvas, 100);

// Helper: Get center coordinates of a DOM element relative to canvas
function getCenter(el) {
    const containerRect = canvas.parentElement.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
    return {
        x: rect.left - containerRect.left + rect.width / 2,
        y: rect.top - containerRect.top + rect.height / 2
    };
}

// Log System
function addLog(msg, type = 'normal') {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    const time = new Date().toISOString().split('T')[1].substring(0, 8);
    entry.textContent = `[${time}] ${msg}`;
    systemLogs.appendChild(entry);
    systemLogs.scrollTop = systemLogs.scrollHeight;

    // Keep max 50 logs
    if (systemLogs.children.length > 50) {
        systemLogs.removeChild(systemLogs.firstChild);
    }
}

// QoS Queue Visulization
function updateQueueVisuals() {
    qosQueue.innerHTML = '';
    if (queueData.length === 0) {
        qosQueue.innerHTML = '<div class="empty-queue-msg">คิวว่าง</div>';
        return;
    }

    // Note: To mimic Priority Queue, danger items are always processed first.
    // In our visual, we show what's waiting.
    queueData.forEach(item => {
        const div = document.createElement('div');
        div.className = `queue-item ${item.type}`;
        div.innerHTML = `
            <span>${item.type === 'danger' ? '🔴 DANGER' : '🟢 NORMAL'}</span>
            <span>Priority: ${item.priority}</span>
        `;
        qosQueue.appendChild(div);
    });
}

// Packet Class for Animation
class Packet {
    constructor(type) {
        this.id = packetIdCounter++;
        this.type = type; // 'normal' or 'danger'
        this.color = type === 'danger' ? '#ff3366' : '#00ff88';
        this.size = type === 'danger' ? 7 : 4;
        this.speed = type === 'danger' ? 0.06 : 0.02; // Danger is significantly faster
        this.t = 0;
        this.phase = 0; // 0: Sensor->Edge, 1: Edge->Backbone, 2: Backbone->Brain
        this.active = true;
        this.priority = type === 'danger' ? 100 : 10;

        // Tracking latency
        this.startTime = performance.now();

        // Define paths
        this.updatePaths();
    }

    updatePaths() {
        const pSensor = getCenter(nodeSensor);
        const pEdgeMain = getCenter(nodeEdgeMain);
        const pEdgeAlt = Math.random() > 0.5 ? getCenter(nodeEdgeAlt1) : getCenter(nodeEdgeAlt2);
        const pBackbone = getCenter(nodeBackbone);
        const pBrain = getCenter(nodeBrain);

        // Route selection based on Self-Healing
        let targetEdge = isNodeDestroyed ? pEdgeAlt : pEdgeMain;

        this.paths = [
            { start: pSensor, end: targetEdge, label: 'Intrabody Comm' },
            { start: targetEdge, end: pBackbone, label: 'Edge Comm' },
            { start: pBackbone, end: pBrain, label: 'Neuron-Stream' }
        ];
    }

    draw(ctx) {
        if (!this.active) return;

        const path = this.paths[this.phase];
        if (!path) return;

        // Add some jitter for normal data, but straight line for danger
        let jitterX = 0;
        let jitterY = 0;
        if (this.type === 'normal') {
            jitterX = (Math.random() - 0.5) * 10;
            jitterY = (Math.random() - 0.5) * 10;
        }

        const currX = path.start.x + (path.end.x - path.start.x) * this.t + jitterX;
        const currY = path.start.y + (path.end.y - path.start.y) * this.t + jitterY;

        ctx.beginPath();
        ctx.arc(currX, currY, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = this.type === 'danger' ? 20 : 10;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    update() {
        if (!this.active) return;

        this.t += this.speed;

        if (this.t >= 1) {
            this.t = 0;
            this.phase++;

            // Re-evaluate paths in case of node destruction during transit
            this.updatePaths();

            if (this.phase >= this.paths.length) {
                // Packet arrived at brain
                this.active = false;
                this.finish();
            } else if (this.phase === 2) {
                // Entering backbone queue
                this.enqueue();
                // Pause animation slightly to simulate queue/processing
                this.t = -0.5; // Artificial delay before proceeding
            } else if (this.phase === 1) {
                if (this.type === 'danger' && !isNodeDestroyed) {
                    // Danger packet bypasses normally
                    badgeAuth.classList.remove('hidden');
                    setTimeout(() => badgeAuth.classList.add('hidden'), 1000);
                }
            }
        }
    }

    enqueue() {
        queueData.push(this);
        // Sort queue: higher priority first
        queueData.sort((a, b) => b.priority - a.priority);
        updateQueueVisuals();

        setTimeout(() => {
            const idx = queueData.findIndex(p => p.id === this.id);
            if (idx !== -1) queueData.splice(idx, 1);
            updateQueueVisuals();
        }, 300); // Simulate processing time
    }

    finish() {
        // Convert to seconds
        let latencyCalc;
        if (this.type === 'danger') {
            // Force it to be < 0.5s for demonstration (simulating Neuron-Stream)
            latencyCalc = (Math.random() * 0.2 + 0.1).toFixed(3);
            latencyVal.textContent = latencyCalc;
            latencyVal.className = 'metric-value danger';
            addLog(`Neuron-Stream ทำงานสำเร็จ: ส่งความรู้สึกถึงสมองใน ${latencyCalc} วินาที!`, 'danger');

            // Visual feedback on brain node
            nodeBrain.classList.add('brain-active');
            setTimeout(() => nodeBrain.classList.remove('brain-active'), 500);

        } else {
            // Normal TCP/IP latency (1-2 seconds)
            latencyCalc = (Math.random() * 1.0 + 1.0).toFixed(3);
            latencyVal.textContent = latencyCalc;
            latencyVal.className = 'metric-value';
        }
    }
}

// Animation Loop
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw connections (faint lines)
    drawBackgroundConnections();

    packets.forEach(p => {
        p.update();
        p.draw(ctx);
    });

    // Clean up inactive
    packets = packets.filter(p => p.active);

    requestAnimationFrame(animate);
}

function drawBackgroundConnections() {
    const pSensor = getCenter(nodeSensor);
    const pEdgeMain = getCenter(nodeEdgeMain);
    const pEdgeAlt1 = getCenter(nodeEdgeAlt1);
    const pEdgeAlt2 = getCenter(nodeEdgeAlt2);
    const pBackbone = getCenter(nodeBackbone);
    const pBrain = getCenter(nodeBrain);

    ctx.strokeStyle = 'rgba(64, 112, 203, 0.2)';
    ctx.lineWidth = 1;

    // Sensor to edges
    ctx.beginPath();
    ctx.setLineDash([5, 5]);
    ctx.moveTo(pSensor.x, pSensor.y); ctx.lineTo(pEdgeAlt1.x, pEdgeAlt1.y);
    ctx.moveTo(pSensor.x, pSensor.y); ctx.lineTo(pEdgeMain.x, pEdgeMain.y);
    ctx.moveTo(pSensor.x, pSensor.y); ctx.lineTo(pEdgeAlt2.x, pEdgeAlt2.y);

    // Edges to backbone
    ctx.moveTo(pEdgeAlt1.x, pEdgeAlt1.y); ctx.lineTo(pBackbone.x, pBackbone.y);
    ctx.moveTo(pEdgeMain.x, pEdgeMain.y); ctx.lineTo(pBackbone.x, pBackbone.y);
    ctx.moveTo(pEdgeAlt2.x, pEdgeAlt2.y); ctx.lineTo(pBackbone.x, pBackbone.y);

    // Backbone to brain
    ctx.setLineDash([]);
    ctx.moveTo(pBackbone.x, pBackbone.y); ctx.lineTo(pBrain.x, pBrain.y);
    ctx.stroke();
}

// Control Event Listeners
btnNormal.addEventListener('click', () => {
    isDangerMode = false;
    btnNormal.classList.add('active');
    btnTsunami.classList.remove('active');
    btnEarthquake.classList.remove('active');
    btnFire.classList.remove('active');

    // Reset Visuals
    dangerOverlay.classList.remove('active');
    oceanContainer.className = 'live-cam'; // Reset all extra classes
    nodeSensor.classList.remove('danger');
    nodeSensor.innerHTML = '<i class="fa-solid fa-satellite-dish"></i><span>เซนเซอร์เรดาร์รวม</span>';
    statusIndicator.parentElement.classList.remove('danger');
    statusText.textContent = "ระบบทำงานปกติ";

    addLog('กลับสู่สภาวะเฝ้าระวังปกติ (Normal State)', 'info');
});

function triggerScreenShake() {
    // Shake effect
    appContainer.classList.add('shake-hard');
    setTimeout(() => {
        appContainer.classList.remove('shake-hard');
    }, 500);
}

function triggerDisaster(type, titleInfo, statusMsg) {
    isDangerMode = true;
    btnNormal.classList.remove('active');
    btnTsunami.classList.toggle('active', type === 'tsunami');
    btnEarthquake.classList.toggle('active', type === 'earthquake');
    btnFire.classList.toggle('active', type === 'fire');

    // Environment Effects!
    dangerOverlay.classList.add('active');
    oceanContainer.className = `live-cam ${type}`;
    nodeSensor.classList.add('danger');

    let sensorIcon = 'fa-satellite-dish';
    let sensorName = 'เซนเซอร์เรดาร์รวม';
    if (type === 'tsunami') {
        sensorIcon = 'fa-water';
        sensorName = 'เซนเซอร์ทุ่นทะเล';
    } else if (type === 'earthquake') {
        sensorIcon = 'fa-wave-square';
        sensorName = 'เซนเซอร์แผ่นดินไหว';
    } else if (type === 'fire') {
        sensorIcon = 'fa-temperature-high';
        sensorName = 'เซนเซอร์ความร้อน';
    }
    nodeSensor.innerHTML = `<i class="fa-solid ${sensorIcon}"></i><span>${sensorName}</span>`;

    statusIndicator.parentElement.classList.add('danger');
    statusText.textContent = statusMsg;

    if (type === 'earthquake') {
        appContainer.classList.add('shake-hard');
        setTimeout(() => appContainer.classList.remove('shake-hard'), 2000);
    } else {
        triggerScreenShake();
    }

    addLog(`🚨 ภัยพิบัติ: ${titleInfo}`, 'danger');
    addLog('QoS Priority ปรับเป็นสูงสุด (100) สัญญาณเตือนภัยลัดคิวข้อมูลทั้งหมด', 'warning');

    // Instantly spawn a danger packet
    packets.push(new Packet('danger'));

    // Spawn normal packets to show bypassing visually in the queue
    packets.push(new Packet('normal'));
    packets.push(new Packet('normal'));
}

btnTsunami.addEventListener('click', () => {
    triggerDisaster('tsunami', 'ตรวจพบสึนามิ! เซนเซอร์เปลี่ยนสถานะเป็น DANGER', 'วิกฤต: สึนามิกำลังก่อตัว!');
});

btnEarthquake.addEventListener('click', () => {
    triggerDisaster('earthquake', 'แผ่นดินไหวรุนแรง! เซนเซอร์จับแรงสั่นสะเทือนได้', 'วิกฤต: แผ่นดินไหว 7.5 แมกนิจูด!');
});

btnFire.addEventListener('click', () => {
    triggerDisaster('fire', 'ไฟป่าลุกลามอย่างรวดเร็ว! ตรวจจับความร้อนสูง', 'วิกฤต: ไฟป่าระดับรุนแรงบริเวณป่าไม้!');
});

btnDestroy.addEventListener('click', () => {
    if (isNodeDestroyed) return;
    isNodeDestroyed = true;
    nodeEdgeMain.classList.add('destroyed');
    btnDestroy.disabled = true;
    btnRepair.disabled = false;

    triggerScreenShake(); // Small shake when node breaks

    addLog('⚠️ รุนแรง: เสาสัญญาณหลักถูกทำลายจากแรงสั่นสะเทือน!', 'danger');
    addLog('กำลังเปิดใช้งาน Mycelium Network... สลับไปใช้เสารองอัตโนมัติ (Self-healing)', 'warning');

    setTimeout(() => {
        addLog('การเชื่อมต่อเส้นทางใหม่สำเร็จ ข้อมูลไม่สูญหาย', 'success');
    }, 1000);
});

btnRepair.addEventListener('click', () => {
    isNodeDestroyed = false;
    nodeEdgeMain.classList.remove('destroyed');
    btnDestroy.disabled = false;
    btnRepair.disabled = true;
    addLog('เสาสัญญาณหลักซ่อมแซมเสร็จสิ้น ระบบกลับสู่สภาวะปกติ', 'success');
});

// Simulation spawner function
function runSimulation() {
    spawnInterval = setInterval(() => {
        // ถ้ามีข้อมูลจริง ให้ใช้ฟีเจอร์ "real data" (Full workflow) โดย priority และภัยจากข้อมูลจริง
        if (realEvents.length > 0) {
            spawnFromRealData();
            return;
        }

        // อยู่ใน demo mode แบบปกติ
        if (!isDangerMode) {
            packets.push(new Packet('normal'));
        } else {
            if (Math.random() > 0.4) {
                packets.push(new Packet('danger'));
            } else {
                packets.push(new Packet('normal'));
            }
        }
    }, 1500); // 1.5s interval
}

// Init
addLog('อินเทอร์เฟซพร้อมใช้งาน เริ่มการจำลองเครือข่าย', 'success');
requestAnimationFrame(animate);
loadRealData().then(() => runSimulation());
