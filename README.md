# Internet of Brains (BCI Disaster Network Simulator)

Welcome to the **Internet of Brains** Interactive Simulation for Disaster Warning Networks!

This is a front-end web application (HTML, CSS, JavaScript) that demonstrates an advanced, state-of-the-art 4-layer disaster warning infrastructure. The focus of the project is on minimizing latency for critical alerts, prioritizing emergency data (QoS), and demonstrating network self-healing capabilities using a "Mycelium Edge AI" concept.

## Key Features

1. **Environmental Simulation (Live Camera)** 📸
   Experience disaster states visually through the bottom-left Live Camera panel.
   * **สภาวะปกติ (Normal State)**
   * **สึนามิ (Tsunami):** Water level rises, waves crash, and the sensor dynamically changes to an Ocean Buoy (`เซนเซอร์ทุ่นทะเล`).
   * **แผ่นดินไหว (Earthquake):** The screen violently shakes, ground cracks appear, and the sensor changes to a Seismic Sensor (`เซนเซอร์แผ่นดินไหว`).
   * **ไฟป่า (Wildfire):** The environment burns, embers fly, and the sensor transforms into a Thermal Sensor (`เซนเซอร์ความร้อน`).

2. **Network Flow Visualization & QoS Prioritization** 💨
   Watch data packets actively traversing the 4 architectural layers:
   * **ปกติ (Normal Packets - Green):** Move at standard speeds with artificial jitter.
   * **วิกฤต (Danger Packets - Red):** Bypass the queue via "Neuron-Stream" and travel 3x faster, highlighting high-priority Quality of Service (QoS) implementation.
   
3. **Mycelium Self-Healing Network** 
   * Click **"ทำลายเสาสัญญาณหลัก" (Destroy Edge Node)** to simulate a structural network failure.
   * The system immediately reroutes danger packets and normal packets through alternate mini-nodes, ensuring zero data loss and maintaining active connections.

4. **Real-time Metrics Dashboard** 📊
   * **Latency Tracker**: Showcases the speed of Neuron-Stream bypasses (< 0.5s) compared to normal TCP/IP delivery (1-2s).
   * **QoS Queue**: See standard background traffic queueing while emergency signals jump the line.
   * **System Logs**: Follow along with plain-language backend tracking messages describing the current state.

## How to Run

Since the application was entirely rewritten to be client-side only (Vanilla JS), there is *no server installation required*.

1. Double-click `index.html` to open it in any modern web browser.
2. The simulation will begin immediately.
3. Use the **Control Center (Left Panel)** to trigger different events and explain your architecture dynamically.

## System Architecture Layers Demonstrated

1. **Layer 1: เซนเซอร์จับคลื่นวิกฤต (Sensors):** Edge devices collecting environmental anomaly data. Includes dynamic icon swapping based on the active disaster.
2. **Layer 2: Mycelium Edge AI:** Intermediate routing nodes capable of autonomous self-healing and rapid packet prioritization.
3. **Layer 3: โครงข่ายควอนตัม (Quantum Backbone):** The long-range core, efficiently handling massive throughput across continents.
4. **Layer 4: ระบบประสาทผู้รับ (Brain / Receiver):** The final BCI (Brain-Computer Interface) terminal that bypasses language barriers directly delivering alerts.

## Technology Stack
* **HTML5**: Semantic web structure.
* **Vanilla JavaScript (ES6)**: Canvas animations (packet rendering), state management, DOM manipulation, queue/latency math.
* **Modern CSS3**: Dynamic CSS variables, smooth UI transitions, glassmorphism hints, and custom CSS Keyframe animations for the disaster effects.
* **FontAwesome 6**: Extensive library for the minimal, highly-contextual UI icons.
* **Google Fonts**: `Kanit` & `Orbitron` to give it a clean, readable, yet slightly futuristic feel.

## Real Data Integration

เพิ่มโหมด “real-data” เพื่อให้โปรเจคไม่ใช่แค่เดโม:

1. สร้างไฟล์ `data/real_data.json` (ตัวอย่าง JSON อยู่ใน repo) หรือรัน Python script:

```bash
python -m pip install requests
python python/fetch_real_data.py
```

2. รัน FastAPI server (realtime API):

```bash
python -m pip install fastapi uvicorn
uvicorn python.realtime_server:app --reload --host 0.0.0.0 --port 8000
```

3. `app.js` จะโหลดข้อมูลจาก API `/api/realtime` และ fallback ไป `data/real_data.json` ถ้า service ไม่พร้อม

4. `app.js` มี polling ทุก 20 วินาที เพื่อดึงข้อมูลใหม่อย่างเรียลไทม์ (live refresh)

5. หากไม่มี server หรือโหลดล้มเหลว จะกลับมาต่อที่ Demo mode ของเดิม

6. ปรับ `app.js` ที่ค่า `isRealDataMode` เป็น `false` หากต้องการทดสอบเดโมเท่านั้น

## ตัวอย่างการเรียกใช้งาน (Workflow)

* Sensor -> Edge -> Backbone -> Brain
* Danger event จาก real_data.json จะถูกแทนที่เป็น DANGER packet (priority 100)
* Normal event จะถูกส่งเป็น NORMAL packet (priority 10)
* QoS queue ใช้คิวลำดับความสำคัญแบบเดียวกับโครงงาน

## Verification Checklist (ตรวจสอบการทำงาน)

1. ตรวจว่ามีไฟล์ข้อมูลล่าสุด
   * `python python/fetch_real_data.py` (จะได้ `data/real_data.json`)
   * สังเกต output `บันทึก 120 เรคอร์ดลง ...` (หรือจำนวนใกล้เคียง)
2. รัน FastAPI service
   * `python -m pip install fastapi uvicorn`
   * `uvicorn python.realtime_server:app --reload --host 0.0.0.0 --port 8000`
3. ตรวจ API ตรง
   * เปิด http://localhost:8000/api/realtime
   * ควรเห็น JSON response `{ "timestamp": ..., "count": ..., "events": [...] }`
4. เปิดเว็บ UI
   * http://localhost/Disater-waining-demo-/index.html
   * ตรวจ log ว่า `โหลดข้อมูลจริงจาก API /api/realtime สำเร็จ` หรือ `fallback data/real_data.json`
5. ถ้าไม่อยากเปิด terminal ตลอดให้ใช้ Windows service หรือ `run_realtime.bat`

## การใช้งานหลังจากเซ็ตอัพเสร็จ

* รันสคริปต์ทุกครั้งก่อนเริ่มการสาธิต
  * `python python/fetch_real_data.py`
* เช็คสถานะ network (Latency, QoS, Self-healing) ผ่าน UI
* เก็บ screenshot log % scenario สำหรับรายงานงานอาจารย์

<p align="center">
<img src="imgdemo/demo.png" width="700">
</p>

## ลิงก์อ้างอิง

- วีดีโอสาธิต: https://kku.world/vdonetwork
- NotebookLM: https://notebooklm.google.com/notebook/dd78cf01-5c52-4ca6-b505-042d661a80ff?authuser=3&pageId=none

