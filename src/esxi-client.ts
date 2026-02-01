import axios, { AxiosInstance, AxiosError } from 'axios';
import https from 'https';
import { config } from './config.js';

export interface VMInfo {
  vm: string;
  name: string;
  power_state: string;
  cpu_count?: number;
  memory_size_MiB?: number;
}

export interface VMDetail {
  name: string;
  power_state: string;
  cpu: {
    count: number;
    cores_per_socket: number;
    hot_add_enabled: boolean;
    hot_remove_enabled: boolean;
  };
  memory: {
    size_MiB: number;
    hot_add_enabled: boolean;
  };
  guest_OS: string;
  hardware: {
    version: string;
  };
  nics: Array<{
    nic: string;
    label: string;
    type: string;
    mac_address: string;
    backing: {
      network: string;
      network_name: string;
    };
    state: string;
  }>;
  disks: Array<{
    disk: string;
    label: string;
    type: string;
    capacity: number;
  }>;
}

export interface HostInfo {
  name: string;
  product: {
    name: string;
    version: string;
    build: string;
  };
  cpu: {
    model: string;
    count: number;
    cores: number;
    threads: number;
  };
  memory: {
    total_MiB: number;
  };
}

export interface DatastoreInfo {
  datastore: string;
  name: string;
  type: string;
  free_space: number;
  capacity: number;
}

export interface NetworkInfo {
  network: string;
  name: string;
  type: string;
}

export interface SnapshotInfo {
  snapshot: string;
  name: string;
  description: string;
  create_time: string;
  parent?: string;
}

export class ESXiClient {
  private client: AxiosInstance;
  private sessionId: string | null = null;
  private baseUrl: string;

  constructor() {
    this.baseUrl = `https://${config.esxi.host}`;

    const httpsAgent = new https.Agent({
      rejectUnauthorized: !config.esxi.insecure,
    });

    this.client = axios.create({
      baseURL: this.baseUrl,
      httpsAgent,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for session expiry
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401 && this.sessionId) {
          // Session expired, try to re-authenticate
          this.sessionId = null;
          await this.authenticate();
          // Retry the request
          if (error.config) {
            error.config.headers['vmware-api-session-id'] = this.sessionId;
            return this.client.request(error.config);
          }
        }
        throw error;
      }
    );
  }

  async authenticate(): Promise<void> {
    try {
      const response = await this.client.post(
        '/api/session',
        null,
        {
          auth: {
            username: config.esxi.username,
            password: config.esxi.password,
          },
        }
      );

      this.sessionId = response.data;
      this.client.defaults.headers.common['vmware-api-session-id'] = this.sessionId;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Authentication failed: ${error.message}`);
      }
      throw error;
    }
  }

  private async ensureAuthenticated(): Promise<void> {
    if (!this.sessionId) {
      await this.authenticate();
    }
  }

  // VM Operations
  async listVMs(): Promise<VMInfo[]> {
    await this.ensureAuthenticated();
    const response = await this.client.get('/api/vcenter/vm');
    return response.data;
  }

  async getVM(vmId: string): Promise<VMDetail> {
    await this.ensureAuthenticated();
    const response = await this.client.get(`/api/vcenter/vm/${vmId}`);
    return response.data;
  }

  async findVMByName(name: string): Promise<VMInfo | null> {
    const vms = await this.listVMs();
    return vms.find((vm) => vm.name.toLowerCase() === name.toLowerCase()) || null;
  }

  async powerOn(vmId: string): Promise<void> {
    await this.ensureAuthenticated();
    await this.client.post(`/api/vcenter/vm/${vmId}/power?action=start`);
  }

  async powerOff(vmId: string, force: boolean = false): Promise<void> {
    await this.ensureAuthenticated();
    const action = force ? 'stop' : 'stop';  // Both use stop, guest shutdown is different
    await this.client.post(`/api/vcenter/vm/${vmId}/power?action=${action}`);
  }

  async restart(vmId: string): Promise<void> {
    await this.ensureAuthenticated();
    await this.client.post(`/api/vcenter/vm/${vmId}/power?action=reset`);
  }

  async suspend(vmId: string): Promise<void> {
    await this.ensureAuthenticated();
    await this.client.post(`/api/vcenter/vm/${vmId}/power?action=suspend`);
  }

  async getVMPowerState(vmId: string): Promise<string> {
    await this.ensureAuthenticated();
    const response = await this.client.get(`/api/vcenter/vm/${vmId}/power`);
    return response.data.state;
  }

  // Guest Operations (requires VMware Tools)
  async guestShutdown(vmId: string): Promise<void> {
    await this.ensureAuthenticated();
    await this.client.post(`/api/vcenter/vm/${vmId}/guest/power?action=shutdown`);
  }

  async guestReboot(vmId: string): Promise<void> {
    await this.ensureAuthenticated();
    await this.client.post(`/api/vcenter/vm/${vmId}/guest/power?action=reboot`);
  }

  // Host Operations
  async getHostInfo(): Promise<HostInfo> {
    await this.ensureAuthenticated();

    // Get host list first (for standalone ESXi, there's usually just one)
    const hostsResponse = await this.client.get('/api/vcenter/host');
    const hosts = hostsResponse.data;

    if (hosts.length === 0) {
      throw new Error('No hosts found');
    }

    const hostId = hosts[0].host;
    const hostResponse = await this.client.get(`/api/vcenter/host/${hostId}`);

    return {
      name: hosts[0].name,
      product: hostResponse.data.product || {},
      cpu: hostResponse.data.cpu || {},
      memory: hostResponse.data.memory || {},
    };
  }

  // Datastore Operations
  async listDatastores(): Promise<DatastoreInfo[]> {
    await this.ensureAuthenticated();
    const response = await this.client.get('/api/vcenter/datastore');
    return response.data;
  }

  async getDatastore(datastoreId: string): Promise<DatastoreInfo> {
    await this.ensureAuthenticated();
    const response = await this.client.get(`/api/vcenter/datastore/${datastoreId}`);
    return response.data;
  }

  // Network Operations
  async listNetworks(): Promise<NetworkInfo[]> {
    await this.ensureAuthenticated();
    const response = await this.client.get('/api/vcenter/network');
    return response.data;
  }

  // Snapshot Operations (Note: REST API snapshot support may be limited on standalone ESXi)
  async listSnapshots(vmId: string): Promise<SnapshotInfo[]> {
    await this.ensureAuthenticated();
    try {
      const response = await this.client.get(`/api/vcenter/vm/${vmId}/snapshots`);
      return response.data || [];
    } catch (error) {
      // Snapshot API might not be available on standalone ESXi 6.x
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.warn('Snapshot API not available, returning empty list');
        return [];
      }
      throw error;
    }
  }

  async createSnapshot(
    vmId: string,
    name: string,
    description: string = '',
    memory: boolean = false
  ): Promise<string> {
    await this.ensureAuthenticated();
    const response = await this.client.post(`/api/vcenter/vm/${vmId}/snapshots`, {
      name,
      description,
      memory,
    });
    return response.data;
  }

  async deleteSnapshot(vmId: string, snapshotId: string): Promise<void> {
    await this.ensureAuthenticated();
    await this.client.delete(`/api/vcenter/vm/${vmId}/snapshots/${snapshotId}`);
  }

  async revertSnapshot(vmId: string, snapshotId: string): Promise<void> {
    await this.ensureAuthenticated();
    await this.client.post(`/api/vcenter/vm/${vmId}/snapshots/${snapshotId}?action=revert`);
  }

  // Utility method to close session
  async disconnect(): Promise<void> {
    if (this.sessionId) {
      try {
        await this.client.delete('/api/session');
      } catch {
        // Ignore disconnect errors
      }
      this.sessionId = null;
    }
  }
}

// Singleton instance
let clientInstance: ESXiClient | null = null;

export function getESXiClient(): ESXiClient {
  if (!clientInstance) {
    clientInstance = new ESXiClient();
  }
  return clientInstance;
}
