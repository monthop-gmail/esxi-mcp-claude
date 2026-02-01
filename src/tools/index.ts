import { Tool } from '@modelcontextprotocol/sdk/types.js';
import * as vmTools from './vm-tools.js';
import * as hostTools from './host-tools.js';
import * as snapshotTools from './snapshot-tools.js';

export const TOOLS: Tool[] = [
  // VM Management Tools
  {
    name: 'esxi_list_vms',
    description: 'List all VMs on the ESXi host with their power state',
    inputSchema: {
      type: 'object',
      properties: {
        filter: {
          type: 'string',
          description: 'Filter VMs by name or power state (optional)',
        },
      },
    },
  },
  {
    name: 'esxi_get_vm',
    description: 'Get detailed information about a specific VM',
    inputSchema: {
      type: 'object',
      properties: {
        vm_id: {
          type: 'string',
          description: 'VM identifier (e.g., vm-1)',
        },
        vm_name: {
          type: 'string',
          description: 'VM name (alternative to vm_id)',
        },
      },
    },
  },
  {
    name: 'esxi_power_on',
    description: 'Power on a VM',
    inputSchema: {
      type: 'object',
      properties: {
        vm_id: {
          type: 'string',
          description: 'VM identifier to power on',
        },
      },
      required: ['vm_id'],
    },
  },
  {
    name: 'esxi_power_off',
    description: 'Power off a VM. Uses graceful shutdown if VMware Tools is installed, otherwise forces power off',
    inputSchema: {
      type: 'object',
      properties: {
        vm_id: {
          type: 'string',
          description: 'VM identifier to power off',
        },
        force: {
          type: 'boolean',
          description: 'Force power off without graceful shutdown (default: false)',
        },
      },
      required: ['vm_id'],
    },
  },
  {
    name: 'esxi_restart_vm',
    description: 'Restart a VM',
    inputSchema: {
      type: 'object',
      properties: {
        vm_id: {
          type: 'string',
          description: 'VM identifier to restart',
        },
        graceful: {
          type: 'boolean',
          description: 'Use graceful reboot via VMware Tools if available (default: false)',
        },
      },
      required: ['vm_id'],
    },
  },
  {
    name: 'esxi_suspend_vm',
    description: 'Suspend a VM',
    inputSchema: {
      type: 'object',
      properties: {
        vm_id: {
          type: 'string',
          description: 'VM identifier to suspend',
        },
      },
      required: ['vm_id'],
    },
  },

  // Host Information Tools
  {
    name: 'esxi_host_info',
    description: 'Get ESXi host information including CPU, memory, and version',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'esxi_list_datastores',
    description: 'List all datastores with capacity and usage information',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'esxi_list_networks',
    description: 'List all networks and port groups',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  // Snapshot Management Tools
  {
    name: 'esxi_list_snapshots',
    description: 'List all snapshots of a VM',
    inputSchema: {
      type: 'object',
      properties: {
        vm_id: {
          type: 'string',
          description: 'VM identifier',
        },
      },
      required: ['vm_id'],
    },
  },
  {
    name: 'esxi_create_snapshot',
    description: 'Create a snapshot of a VM',
    inputSchema: {
      type: 'object',
      properties: {
        vm_id: {
          type: 'string',
          description: 'VM identifier',
        },
        name: {
          type: 'string',
          description: 'Snapshot name',
        },
        description: {
          type: 'string',
          description: 'Snapshot description (optional)',
        },
        memory: {
          type: 'boolean',
          description: 'Include memory state in snapshot (default: false)',
        },
      },
      required: ['vm_id', 'name'],
    },
  },
  {
    name: 'esxi_delete_snapshot',
    description: 'Delete a snapshot from a VM',
    inputSchema: {
      type: 'object',
      properties: {
        vm_id: {
          type: 'string',
          description: 'VM identifier',
        },
        snapshot_id: {
          type: 'string',
          description: 'Snapshot identifier to delete',
        },
      },
      required: ['vm_id', 'snapshot_id'],
    },
  },
  {
    name: 'esxi_revert_snapshot',
    description: 'Revert a VM to a specific snapshot',
    inputSchema: {
      type: 'object',
      properties: {
        vm_id: {
          type: 'string',
          description: 'VM identifier',
        },
        snapshot_id: {
          type: 'string',
          description: 'Snapshot identifier to revert to',
        },
      },
      required: ['vm_id', 'snapshot_id'],
    },
  },
];

export type ToolArguments = Record<string, unknown>;

export async function handleToolCall(
  name: string,
  args: ToolArguments
): Promise<unknown> {
  switch (name) {
    // VM Tools
    case 'esxi_list_vms':
      return vmTools.listVMs(args as { filter?: string });
    case 'esxi_get_vm':
      return vmTools.getVM(args as { vm_id?: string; vm_name?: string });
    case 'esxi_power_on':
      return vmTools.powerOn(args as { vm_id: string });
    case 'esxi_power_off':
      return vmTools.powerOff(args as { vm_id: string; force?: boolean });
    case 'esxi_restart_vm':
      return vmTools.restartVM(args as { vm_id: string; graceful?: boolean });
    case 'esxi_suspend_vm':
      return vmTools.suspendVM(args as { vm_id: string });

    // Host Tools
    case 'esxi_host_info':
      return hostTools.getHostInfo();
    case 'esxi_list_datastores':
      return hostTools.listDatastores();
    case 'esxi_list_networks':
      return hostTools.listNetworks();

    // Snapshot Tools
    case 'esxi_list_snapshots':
      return snapshotTools.listSnapshots(args as { vm_id: string });
    case 'esxi_create_snapshot':
      return snapshotTools.createSnapshot(
        args as {
          vm_id: string;
          name: string;
          description?: string;
          memory?: boolean;
        }
      );
    case 'esxi_delete_snapshot':
      return snapshotTools.deleteSnapshot(
        args as { vm_id: string; snapshot_id: string }
      );
    case 'esxi_revert_snapshot':
      return snapshotTools.revertSnapshot(
        args as { vm_id: string; snapshot_id: string }
      );

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
