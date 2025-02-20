
from datetime import datetime
from zoneinfo import ZoneInfo


def current_utc_time():
    """Get the current UTC time as a timezone-aware datetime."""
    return datetime.now(ZoneInfo("UTC"))


def get_agent_id_by_sid(sid):
    from c2_server.events.agent_events import connected_agents
    for agent_id, stored_sid in connected_agents.items():
        if stored_sid == sid:
            return agent_id
    return None  # Return None if sid is not found

def format_agent_client_info(agent_data):
    client_info = agent_data.get("client_info", {})

    process_id = client_info.get("processid", "Unknown")
    ip_address = client_info.get("ipaddress", "Unknown")
    
    # Format network interfaces
    net_interfaces = client_info.get("netinterfaces", [])
    net_interfaces_str = "\n".join(
        f"  - {iface['name']}: {', '.join(iface['ips']) if iface['ips'] else 'No IPs'}"
        for iface in net_interfaces
    )

    # Format OS info
    os_info = client_info.get("osinfo", {})
    os_details = (
        f"  - CPUs: {os_info.get('cpus', 'Unknown')}\n"
        f"  - Kernel: {os_info.get('kernel', 'Unknown')}\n"
        f"  - Core Version: {os_info.get('core', 'Unknown')}\n"
        f"  - Platform: {os_info.get('platform', 'Unknown')}\n"
        f"  - OS: {os_info.get('os', 'Unknown')}"
    )

    # Additional system details
    codename = client_info.get("codename", "Unknown")
    hostname = client_info.get("hostname", "Unknown")
    username = client_info.get("username", "Unknown")

    formatted_str = (
        f"Client Info:\n"
        f"- Process ID: {process_id}\n"
        f"- IP Address: {ip_address}\n"
        f"- Network Interfaces:\n{net_interfaces_str}\n"
        f"- OS Info:\n{os_details}\n"
        f"- Codename: {codename}\n"
        f"- Hostname: {hostname}\n"
        f"- Username: {username}"
    )

    return formatted_str