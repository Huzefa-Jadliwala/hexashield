# agent/helper.py

import os
import platform
import subprocess
import socket
import psutil
import logging


def get_agent_id():
    """
    Retrieve a unique agent identifier based on the operating system.

    This function fetches the machine or system-specific identifier to be used as the agent ID.
    It supports Linux, Windows, and macOS operating systems. The agent ID is fetched using
    system-specific commands.

    Returns:
        tuple: A tuple containing:
            - agent_id (str): The unique agent ID if successfully retrieved, otherwise `None`.
            - error (str): An error message if an error occurred, otherwise `None`.

    Supported Platforms:
        - Linux: Fetches the machine ID from `/etc/machine-id`.
        - Windows: Retrieves the UUID using PowerShell and the `Win32_ComputerSystemProduct` WMI class.
        - macOS: Extracts the UUID using `system_profiler SPHardwareDataType`.

    Exceptions:
        - Returns an error message if the OS is unsupported or if a command fails.

    Examples:
        >>> get_agent_id()
        ('c81c25d3-2e6c-46c2-a3b6-bd86eb04c6df', None)

        >>> get_agent_id()
        (None, 'Unsupported OS')
    """
    current_os = platform.system().lower()
    agent_id = None

    try:
        if current_os == "linux":
            # Fetch machine ID for Linux
            result = subprocess.run(
                ["cat", "/etc/machine-id"], capture_output=True, text=True, check=True
            )
            agent_id = result.stdout.strip()
        elif current_os == "windows":
            # Fetch UUID for Windows
            result = subprocess.run(
                [
                    "powershell",
                    "-Command",
                    "Get-WmiObject Win32_ComputerSystemProduct | Select-Object -ExpandProperty UUID",
                ],
                capture_output=True,
                text=True,
                check=True,
            )
            agent_id = result.stdout.strip()
        elif current_os == "darwin":
            # Fetch UUID for macOS
            cmd = subprocess.Popen(
                ["system_profiler", "SPHardwareDataType"], stdout=subprocess.PIPE
            )
            awk = subprocess.Popen(
                ["awk", "/UUID/ { print $3; }"],
                stdin=cmd.stdout,
                stdout=subprocess.PIPE,
                text=True,
            )
            cmd.stdout.close()  # Allow cmd to receive a SIGPIPE if awk exits
            agent_id, _ = awk.communicate()
            agent_id = agent_id.strip()
        else:
            return None, "Unsupported OS"
    except subprocess.CalledProcessError as e:
        return None, f"Command failed: {e}"
    except FileNotFoundError as e:
        return None, f"File not found: {e}"
    except OSError as e:
        return None, f"OS error: {e}"
    except Exception as e:
        return None, f"Unexpected error: {e}"

    return agent_id, None


def get_os_info():
    """
    Retrieve operating system information.
    """
    cpus = os.cpu_count()
    if platform.system().lower() == "linux":
        uname_info = run_command("uname -srio")["output"].split()
        return {
            "cpus": cpus,
            "kernel": uname_info[0],
            "core": uname_info[1],
            "platform": uname_info[2],
            "os": uname_info[3],
        }
    elif platform.system().lower() == "darwin":
        uname_info = run_command("uname -srm")["output"].split()
        return {
            "cpus": cpus,
            "kernel": uname_info[0],
            "core": uname_info[1],
            "platform": uname_info[2],
            "os": "macOS",
        }
    elif platform.system().lower() == "windows":
        os_version = run_command("ver")["output"]
        return {
            "cpus": cpus,
            "kernel": "windows",
            "core": os_version,
            "platform": platform.machine(),
            "os": "windows",
        }
    else:
        return {
            "cpus": cpus,
            "kernel": platform.system(),
            "core": "unknown",
            "platform": platform.machine(),
            "os": platform.system(),
        }


def get_network_interfaces():
    """
    Retrieve network interfaces and their IP addresses.
    """
    interfaces = []
    for iface_name, iface_addrs in psutil.net_if_addrs().items():
        ips = [
            addr.address
            for addr in iface_addrs
            if addr.family == socket.AF_INET or addr.family == socket.AF_INET6
        ]
        interfaces.append({"name": iface_name, "ips": ips})
    return interfaces


def get_client_info():
    """
    Gather client information.
    """
    process_id = os.getpid()
    ip_address = f"{socket.gethostbyname(socket.gethostname())}:{os.getpid()}"
    net_interfaces = get_network_interfaces()
    os_info = get_os_info()
    codename = "daring-giraffe"
    hostname = socket.gethostname()
    username = os.getlogin()

    client_info = {
        "processid": process_id,
        "ipaddress": ip_address,
        "netinterfaces": net_interfaces,
        "osinfo": os_info,
        "codename": codename,
        "hostname": hostname,
        "username": username,
    }

    return client_info


def run_command(command):
    """
    Executes a shell command and captures its output.

    Args:
        command (str): The shell command to execute.

    Returns:
        dict: A dictionary containing the output or error.
    """
    try:
        result = subprocess.run(
            command, shell=True, text=True, capture_output=True, check=True
        )
        return {"status": "success", "output": result.stdout.strip()}
    except subprocess.CalledProcessError as e:
        return {"status": "error", "error": e.stderr.strip()}


def run_command_in_script_mode(command: str) -> (bool, str):
    """
    Run a given command in script mode and return its success status and output.

    Returns:
        (bool, str): Tuple of (is_success, output_string)
                     - is_success: True if the command ran with exit code 0, else False.
                     - output_string: stdout if success, or stderr if failure.
    """
    try:
        result = subprocess.run(
            command,
            shell=True,
            text=True,
            capture_output=True,
            check=True,  # Raises CalledProcessError for non-zero exit codes
        )
        # If we reach here, return code is 0
        return (True, result.stdout.strip())
    except subprocess.CalledProcessError as e:
        # Non-zero exit code (e.g., command not found or other error)
        if e.stderr.strip():
            return (False, e.stderr.strip())
        else:
            return (False, "command could not be executed")
    except Exception as e:
        # Any other unexpected error
        return (False, str(e))
