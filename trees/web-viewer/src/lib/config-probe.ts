/**
 * Configuration defaults derived from hardware probe or network detection
 */

/**
 * Detect local IP address using WebRTC
 * Returns the first non-localhost IPv4 address found
 */
export async function detectLocalIP(): Promise<string | null> {
  return new Promise((resolve) => {
    const RTCPeerConnection = window.RTCPeerConnection || 
      (window as any).webkitRTCPeerConnection || 
      (window as any).mozRTCPeerConnection;

    if (!RTCPeerConnection) {
      resolve(null);
      return;
    }

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    const ips: string[] = [];
    
    pc.createDataChannel('');
    
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const candidate = event.candidate.candidate;
        const match = candidate.match(/([0-9]{1,3}(\.[0-9]{1,3}){3})/);
        if (match) {
          const ip = match[1];
          // Filter out localhost and link-local addresses
          if (ip !== '127.0.0.1' && !ip.startsWith('169.254.')) {
            if (!ips.includes(ip)) {
              ips.push(ip);
            }
          }
        }
      } else {
        // All candidates gathered
        pc.close();
        // Return first non-localhost IP, or null
        resolve(ips.length > 0 ? ips[0] : null);
      }
    };

    pc.createOffer()
      .then(offer => pc.setLocalDescription(offer))
      .catch(() => {
        pc.close();
        resolve(null);
      });

    // Timeout after 3 seconds
    setTimeout(() => {
      pc.close();
      resolve(ips.length > 0 ? ips[0] : null);
    }, 3000);
  });
}

/**
 * Get hostname from current window location
 */
export function getHostname(): string {
  if (typeof window === 'undefined') {
    return 'localhost';
  }
  return window.location.hostname;
}

/**
 * Load hardware probe data and extract network configuration
 */
export async function loadProbeConfig(): Promise<{
  mqttBrokerHost?: string;
  websocketUrl?: string;
  detectedIP?: string;
}> {
  const config: {
    mqttBrokerHost?: string;
    websocketUrl?: string;
    detectedIP?: string;
  } = {};

  try {
    // Try to load canonical hardware record
    const canonRes = await fetch('/hardware/canon.json');
    if (canonRes.ok) {
      const canon = await canonRes.json();
      
      // Look for network-related fields in the canonical record
      // Example: network.mqtt_broker, network.websocket_host, etc.
      if (canon.fields) {
        const fields = canon.fields;
        
        if (fields['network.mqtt_broker']?.v) {
          config.mqttBrokerHost = fields['network.mqtt_broker'].v;
        }
        if (fields['network.websocket_host']?.v) {
          config.websocketUrl = `ws://${fields['network.websocket_host'].v}:8080`;
        }
        if (fields['network.local_ip']?.v) {
          config.detectedIP = fields['network.local_ip'].v;
        }
      }
    }
  } catch (err) {
    console.log('Could not load hardware probe config:', err);
  }

  // If no IP from probe, try to detect it
  if (!config.detectedIP) {
    try {
      const localIP = await detectLocalIP();
      if (localIP) {
        config.detectedIP = localIP;
      }
    } catch (err) {
      console.log('Could not detect local IP:', err);
    }
  }

  return config;
}

/**
 * Derive default configuration from probe data and network detection
 */
export async function deriveDefaultsFromProbe(): Promise<{
  mqttBrokerHost: string;
  websocketUrl: string;
}> {
  const probeConfig = await loadProbeConfig();
  const hostname = getHostname();

  // Determine MQTT broker host
  let mqttBrokerHost = probeConfig.mqttBrokerHost;
  if (!mqttBrokerHost) {
    // Use detected IP if available, otherwise use hostname, fallback to default
    if (probeConfig.detectedIP) {
      mqttBrokerHost = probeConfig.detectedIP;
    } else if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      mqttBrokerHost = hostname;
    } else {
      mqttBrokerHost = '192.168.8.1'; // Default fallback
    }
  }

  // Determine WebSocket URL
  let websocketUrl = probeConfig.websocketUrl;
  if (!websocketUrl) {
    // Use detected IP if available, otherwise use hostname, fallback to localhost
    if (probeConfig.detectedIP) {
      websocketUrl = `ws://${probeConfig.detectedIP}:8080`;
    } else if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      websocketUrl = `ws://${hostname}:8080`;
    } else {
      websocketUrl = 'ws://localhost:8080'; // Default fallback
    }
  }

  return {
    mqttBrokerHost,
    websocketUrl
  };
}

