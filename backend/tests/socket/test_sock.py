import socketio

# Define the C2 server address
C2_HOST = "http://localhost:5003"  # Ensure this matches your server's host and port

# Simulated agent data
agent_data = {
    "agent_id": "63A2CE8B-23F0-5179-B0B7-6AFA5D6B8541",
    "client_info": {
        "processid": 27446,
        "ipaddress": "localhost:27446",
        "netinterfaces": [
            {"name": "lo0", "ips": ["localhost", "::1", "fe80::1%lo0"]},
            {"name": "en0", "ips": ["192.168.0.100", "fe80::1813:eaba:6de7:fef0%en0"]},
            {"name": "utun4", "ips": ["10.2.1.11"]},
        ],
        "osinfo": {
            "cpus": 8,
            "kernel": "Darwin",
            "core": "24.0.0",
            "platform": "arm64",
            "os": "macOS",
        },
        "codename": "daring-giraffe",
        "hostname": "mbp.local",
        "username": "root",
    },
}

# Initialize a Socket.IO client
sio = socketio.Client()


@sio.event
def connect():
    print("Connected to the Socket server")
    # Send the agent registration data
    sio.emit("on_agent_registration", agent_data)
    print(f"Agent data sent: {agent_data}")


@sio.event
def connect_error(data):
    print(f"Connection failed: {data}")


@sio.event
def disconnect():
    print("Disconnected from the Socket server")


# Connect to the server
try:
    sio.connect(C2_HOST)
    sio.wait()  # Wait for events to process
except Exception as e:
    print(f"Failed to connect to Socket server: {e}")
