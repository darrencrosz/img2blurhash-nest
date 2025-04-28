import axios from 'axios';

export async function downloadImageBuffer(url: string): Promise<Buffer> {
  const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 10000 });
  return Buffer.from(response.data);
}
