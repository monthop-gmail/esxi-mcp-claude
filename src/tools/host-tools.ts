import { getESXiClient } from '../esxi-client.js';

export async function getHostInfo() {
  const client = getESXiClient();
  return await client.getHostInfo();
}

export async function listDatastores() {
  const client = getESXiClient();
  const datastores = await client.listDatastores();

  // Add human-readable sizes
  return datastores.map((ds) => ({
    ...ds,
    free_space_GB: Math.round(ds.free_space / (1024 * 1024 * 1024)),
    capacity_GB: Math.round(ds.capacity / (1024 * 1024 * 1024)),
    used_percent: Math.round(((ds.capacity - ds.free_space) / ds.capacity) * 100),
  }));
}

export async function listNetworks() {
  const client = getESXiClient();
  return await client.listNetworks();
}
