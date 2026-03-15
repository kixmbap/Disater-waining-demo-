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

