import { getESXiClient } from '../esxi-client.js';

export async function listVMs(args: { filter?: string }) {
  const client = getESXiClient();
  const vms = await client.listVMs();

  if (args.filter) {
    const filterLower = args.filter.toLowerCase();
    return vms.filter(
      (vm) =>
        vm.name.toLowerCase().includes(filterLower) ||
        vm.power_state.toLowerCase().includes(filterLower)
    );
  }

  return vms;
}

export async function getVM(args: { vm_id?: string; vm_name?: string }) {
  const client = getESXiClient();

  let vmId = args.vm_id;

  if (!vmId && args.vm_name) {
    const vm = await client.findVMByName(args.vm_name);
    if (!vm) {
      throw new Error(`VM not found: ${args.vm_name}`);
    }
    vmId = vm.vm;
  }

  if (!vmId) {
    throw new Error('Either vm_id or vm_name is required');
  }

  const vmDetail = await client.getVM(vmId);
  const powerState = await client.getVMPowerState(vmId);

  return {
    ...vmDetail,
    power_state: powerState,
  };
}

export async function powerOn(args: { vm_id: string }) {
  const client = getESXiClient();
  await client.powerOn(args.vm_id);
  return { success: true, message: `VM ${args.vm_id} powered on` };
}

export async function powerOff(args: { vm_id: string; force?: boolean }) {
  const client = getESXiClient();

  if (args.force) {
    await client.powerOff(args.vm_id, true);
  } else {
    try {
      // Try graceful shutdown first (requires VMware Tools)
      await client.guestShutdown(args.vm_id);
    } catch {
      // Fallback to hard power off
      await client.powerOff(args.vm_id, true);
    }
  }

  return { success: true, message: `VM ${args.vm_id} powered off` };
}

export async function restartVM(args: { vm_id: string; graceful?: boolean }) {
  const client = getESXiClient();

  if (args.graceful) {
    try {
      await client.guestReboot(args.vm_id);
    } catch {
      await client.restart(args.vm_id);
    }
  } else {
    await client.restart(args.vm_id);
  }

  return { success: true, message: `VM ${args.vm_id} restarted` };
}

export async function suspendVM(args: { vm_id: string }) {
  const client = getESXiClient();
  await client.suspend(args.vm_id);
  return { success: true, message: `VM ${args.vm_id} suspended` };
}
