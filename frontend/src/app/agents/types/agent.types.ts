export interface NetworkInterface {
    name: string;
    ips: string[];
  }
  
  export interface OSInfo {
    cpus: number;
    kernel: string;
    core: string;
    platform: string;
    os: string;
  }
  
  export interface ClientInfo {
    processid: number;
    ipaddress: string;
    netinterfaces: NetworkInterface[];
    osinfo: OSInfo;
    codename: string;
    hostname: string;
    username: string;
  }
  
  export interface Agent {
    _id: string;
    agent_id: string;
    conversation_id: string;
    status: string;
    client_info: ClientInfo;
  }
  