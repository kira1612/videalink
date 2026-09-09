const mqtt = require('mqtt');
const axios = require('axios');

// Connect to Mosquitto Broker
const brokerUrl = 'mqtt://test.mosquitto.org:1883';
const client = mqtt.connect(brokerUrl);

// Laravel Backend API URLs
const apiBaseUrl = 'http://127.0.0.1:8000/api/v1';
const mqttMapUrl = `${apiBaseUrl}/buckets/mqtt-map`;

let topicMap = {}; // Maps topic to bucketId
let currentSubscriptions = new Set();

console.log(`[Listener] Connecting to broker at ${brokerUrl}...`);

const fetchMapAndSubscribe = async () => {
    try {
        const response = await axios.get(mqttMapUrl);
        const buckets = response.data;
        
        const newTopicMap = {};
        const newSubscriptions = new Set();

        buckets.forEach(bucket => {
            if (bucket.topic) {
                newTopicMap[bucket.topic] = bucket.id;
                newSubscriptions.add(bucket.topic);
            }
        });

        // Unsubscribe from topics that are no longer in the map
        for (const topic of currentSubscriptions) {
            if (!newSubscriptions.has(topic)) {
                client.unsubscribe(topic);
                console.log(`[Listener] Unsubscribed from topic: ${topic}`);
            }
        }

        // Subscribe to new topics
        for (const topic of newSubscriptions) {
            if (!currentSubscriptions.has(topic)) {
                client.subscribe(topic, (err) => {
                    if (!err) {
                        console.log(`[Listener] Subscribed to topic: ${topic}`);
                    } else {
                        console.error(`[Listener] Subscription error for ${topic}:`, err);
                    }
                });
            }
        }

        topicMap = newTopicMap;
        currentSubscriptions = newSubscriptions;
    } catch (error) {
        console.error(`[Listener] Error fetching MQTT map from API:`, error.message);
    }
};

client.on('connect', () => {
    console.log(`[Listener] Connected to broker successfully!`);
    console.log(`[Listener] Starting dynamic subscription polling...`);
    
    // Initial fetch
    fetchMapAndSubscribe();

    // Poll every 10 seconds for new buckets/topics
    setInterval(fetchMapAndSubscribe, 10000);
});

client.on('message', async (topic, message) => {
    const bucketId = topicMap[topic];
    
    if (!bucketId) {
        // We received a message for an unknown topic
        return;
    }

    let payload;
    try {
        payload = JSON.parse(message.toString());
    } catch (e) {
        console.error(`[Listener] [Bucket ${bucketId}] Error parsing JSON payload:`, message.toString());
        return;
    }

    console.log(`[Listener] [Bucket ${bucketId}] Received telemetry on '${topic}':`, payload);

    // Forward to Laravel API
    try {
        const response = await axios.post(`${apiBaseUrl}/buckets/${bucketId}/records`, payload, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        console.log(`[Listener] [Bucket ${bucketId}] Forwarded to API successfully.`);
    } catch (error) {
        if (error.response) {
            console.error(`[Listener] [Bucket ${bucketId}] API Error (${error.response.status}):`, error.response.data);
        } else {
            console.error(`[Listener] [Bucket ${bucketId}] Failed to reach API:`, error.message);
        }
    }
});

client.on('error', (err) => {
    console.error(`[Listener] MQTT Connection Error:`, err);
});
