import { toPng } from 'html-to-image';

/**
 * Generates a high-resolution PNG from an HTML element using html-to-image.
 * Renders with pixelRatio: 2 on a solid white background for high-contrast thermal readability.
 */
export async function generateSlipPng(element: HTMLElement): Promise<string> {
  return await toPng(element, {
    pixelRatio: 2,
    backgroundColor: '#FFFFFF',
    cacheBust: true,
  });
}

/**
 * Converts a data URL to a File object for the Web Share API.
 */
export function dataUrlToFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(',');
  const mimeMatch = arr[0]?.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] ?? 'image/png' : 'image/png';
  const bstr = atob(arr[1] ?? '');
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

/**
 * Triggers a download of a PNG data URL.
 */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Shares or downloads the slip image.
 * Uses Web Share API (with files) if supported, else falls back to direct download and opening in a new tab.
 */
export async function shareOrDownloadSlip(
  element: HTMLElement,
  slipCode: string
): Promise<{ method: 'shared' | 'downloaded' | 'opened' }> {
  const filename = `mandi-slip-${slipCode}.png`;
  const dataUrl = await generateSlipPng(element);

  // Check if Web Share API with file support is available
  if (navigator.canShare) {
    try {
      const file = dataUrlToFile(dataUrl, filename);
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Mandi Slip ${slipCode}`,
          text: `Mandi Weighment Slip #${slipCode}`,
        });
        return { method: 'shared' };
      }
    } catch (err: unknown) {
      // If user aborted/cancelled share dialog, don't trigger fallback download
      if (err instanceof Error && err.name === 'AbortError') {
        return { method: 'shared' };
      }
      // Otherwise proceed to fallback
    }
  }

  // Fallback: direct download
  downloadDataUrl(dataUrl, filename);
  return { method: 'downloaded' };
}
