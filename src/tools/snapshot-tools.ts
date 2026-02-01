import { getESXiClient } from '../esxi-client.js';

export async function listSnapshots(args: { vm_id: string }) {
  const client = getESXiClient();
  return await client.listSnapshots(args.vm_id);
}

export async function createSnapshot(args: {
  vm_id: string;
  name: string;
  description?: string;
  memory?: boolean;
}) {
  const client = getESXiClient();
  const snapshotId = await client.createSnapshot(
    args.vm_id,
    args.name,
    args.description || '',
    args.memory || false
  );

  return {
    success: true,
    snapshot_id: snapshotId,
    message: `Snapshot "${args.name}" created for VM ${args.vm_id}`,
  };
}

export async function deleteSnapshot(args: { vm_id: string; snapshot_id: string }) {
  const client = getESXiClient();
  await client.deleteSnapshot(args.vm_id, args.snapshot_id);

  return {
    success: true,
    message: `Snapshot ${args.snapshot_id} deleted from VM ${args.vm_id}`,
  };
}

export async function revertSnapshot(args: { vm_id: string; snapshot_id: string }) {
  const client = getESXiClient();
  await client.revertSnapshot(args.vm_id, args.snapshot_id);

  return {
    success: true,
    message: `VM ${args.vm_id} reverted to snapshot ${args.snapshot_id}`,
  };
}
