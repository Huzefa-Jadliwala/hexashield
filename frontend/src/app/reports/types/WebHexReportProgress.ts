export interface PluginData {
    Plugin: [
      string, // Plugin name
      string, // Plugin ID
      string, // Release type
      string, // Status
      string, // Some numeric value
      string, // Another numeric value
      string  // Another numeric value
    ];
  }
  
  export interface ScanProgress {
    HostProcess: PluginData[];
  }
  
  export interface WebHexReportProgress {
    progress: number;
    scan_progress: ScanProgress;
  }