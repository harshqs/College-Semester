/**
 * Encodes a File object into a Base64 data URL string.
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Formats a size in bytes to a human-readable string.
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Extract repository or file name details from a GitHub URL for prettier display tags
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string; branchUrl?: string } | null {
  try {
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (match) {
      return {
        owner: match[1],
        repo: match[2].replace(/.git$/, ''),
      };
    }
  } catch (e) {
    // Ignore invalid parsing
  }
  return null;
}

/**
 * Clean a link to make sure it is a valid secure URL
 */
export function cleanUrl(url: string): string {
  if (!url) return '';
  if (!/^https?:\/\//i.test(url)) {
    return `https://${url}`;
  }
  return url;
}
