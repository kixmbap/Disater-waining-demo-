import os
import json
import time
from datetime import datetime, timedelta

try:
    import requests
except ImportError:
    requests = None

OUTPUT_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'real_data.json')

# ตัวอย่างการดึงข้อมูลฝนจาก Open-Meteo API (แบบออฟไลน์ถ้าไม่มีเน็ต)
API_TEMPLATE = "https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&hourly=precipitation&timezone=Asia%2FBangkok"

# ตัวอย่างสถานีใกล้เคียง (ขยายเป็นหลายจังหวัดสุด)
CANDIDATES = [
    {'location': 'กรุงเทพมหานคร', 'lat': 13.736717, 'lon': 100.523186},
    {'location': 'นนทบุรี', 'lat': 13.873523, 'lon': 100.508998},
    {'location': 'ปทุมธานี', 'lat': 14.021353, 'lon': 100.525375},
    {'location': 'สมุทรปราการ', 'lat': 13.599083, 'lon': 100.604566},
    {'location': 'สมุทรสาคร', 'lat': 13.532701, 'lon': 100.265997},
    {'location': 'ชลบุรี', 'lat': 13.361143, 'lon': 100.984727},
    {'location': 'ระยอง', 'lat': 12.681779, 'lon': 101.250100},
    {'location': 'จันทบุรี', 'lat': 12.608136, 'lon': 102.101420},
    {'location': 'ตราด', 'lat': 12.243965, 'lon': 102.508098},
    {'location': 'นครราชสีมา', 'lat': 14.979889, 'lon': 102.097820},
    {'location': 'เชียงใหม่', 'lat': 18.787747, 'lon': 98.993095},
    {'location': 'เชียงราย', 'lat': 19.910215, 'lon': 99.840953},
    {'location': 'ขอนแก่น', 'lat': 16.441874, 'lon': 102.835264},
    {'location': 'อุบลราชธานี', 'lat': 15.235066, 'lon': 104.857515},
    {'location': 'สงขลา', 'lat': 7.205010, 'lon': 100.593930},
    {'location': 'ภูเก็ต', 'lat': 7.880448, 'lon': 98.392300},
    {'location': 'นครศรีธรรมราช', 'lat': 8.430503, 'lon': 99.962499},
    {'location': 'สุราษฎร์ธานี', 'lat': 9.133684, 'lon': 99.333908},
    {'location': 'อุดรธานี', 'lat': 17.415569, 'lon': 102.786022},
    {'location': 'พัทยา', 'lat': 12.923620, 'lon': 100.882517}
]


def fetch_open_meteo(lat, lon):
    if not requests:
        raise RuntimeError('ต้องติดตั้ง requests: pip install requests')

    url = API_TEMPLATE.format(lat=lat, lon=lon)
    r = requests.get(url, timeout=10)
    r.raise_for_status()
    return r.json()


def build_data_from_api():
    events = []
    now = datetime.utcnow().replace(minute=0, second=0, microsecond=0)

    for place in CANDIDATES:
        try:
            api = fetch_open_meteo(place['lat'], place['lon'])
            hourly = api.get('hourly', {})
            precip = hourly.get('precipitation', [])
            times = hourly.get('time', [])

            for i, t in enumerate(times[:6]):
                severity = min(1.0, precip[i] / 20.0)
                event = 'normal'
                if severity > 0.7:
                    event = 'danger'
                elif severity > 0.3:
                    event = 'rain'

                events.append({
                    'timestamp': t,
                    'event': event,
                    'severity': round(severity, 2),
                    'location': place['location'],
                    'description': f'ฝน {precip[i]:.2f} มม./ชม.'
                })

        except Exception as e:
            print(f'ไม่สามารถดึงข้อมูล {place["location"]}: {e}')

    if not events:
        raise RuntimeError('ดึงข้อมูล API ไม่สำเร็จ')

    return events


def build_sample_data():
    return [
        {'timestamp': (datetime.utcnow() - timedelta(minutes=15)).isoformat() + 'Z', 'event': 'normal', 'severity': 0.1, 'location': 'กรุงเทพฯ', 'description': 'สภาพปกติ'},
        {'timestamp': (datetime.utcnow() - timedelta(minutes=10)).isoformat() + 'Z', 'event': 'rain', 'severity': 0.35, 'location': 'ชลบุรี', 'description': 'ฝนฟ้าคะนอง'},
        {'timestamp': (datetime.utcnow() - timedelta(minutes=5)).isoformat() + 'Z', 'event': 'earthquake', 'severity': 0.8, 'location': 'ชลบุรี', 'description': 'แผ่นดินไหว 5.8'},
        {'timestamp': datetime.utcnow().isoformat() + 'Z', 'event': 'tsunami', 'severity': 0.92, 'location': 'ระยอง', 'description': 'เตือนสึนามิ'},
    ]


if __name__ == '__main__':
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

    try:
        data = build_data_from_api()
        source = 'Open-Meteo API'
    except Exception as err:
        print('ไม่สามารถดึง API:', err)
        print('ใช้ข้อมูลตัวอย่างแทน')
        data = build_sample_data()
        source = 'sample'

    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f'บันทึก {len(data)} เรคอร์ดลง {OUTPUT_PATH} (source={source})')
