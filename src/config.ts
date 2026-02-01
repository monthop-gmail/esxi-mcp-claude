import dotenv from 'dotenv';

dotenv.config();

export const config = {
  esxi: {
    host: process.env.ESXI_HOST || '',
    username: process.env.ESXI_USERNAME || 'root',
    password: process.env.ESXI_PASSWORD || '',
    insecure: process.env.ESXI_INSECURE === 'true',
  },
  sse: {
    host: process.env.SSE_HOST || '0.0.0.0',
    port: parseInt(process.env.SSE_PORT || '3000', 10),
  },
};

export function validateConfig(): void {
  if (!config.esxi.host) {
    throw new Error('ESXI_HOST environment variable is required');
  }
  if (!config.esxi.password) {
    throw new Error('ESXI_PASSWORD environment variable is required');
  }
}
