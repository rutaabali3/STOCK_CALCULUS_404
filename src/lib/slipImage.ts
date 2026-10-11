import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

/**
 * Sanitizes a string for safe filesystem filename.
 */
export function sanitizeFilename(name: string): string {
  // eslint-disable-next-line no-control-regex
  return name.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').trim();
}

/**
 * Generates a high-resolution PNG from an HTML element using html-to-image.
 * Renders with pixelRatio: 2 on a solid white background for high-contrast thermal readability.
 * Explicitly forces unconstrained targetWidth and targetHeight so images are never cut off on mobile viewports.
 */
export async function generateSlipPng(
  element: HTMLElement,
  explicitWidthPx?: number
): Promise<string> {
  const targetWidth = explicitWidthPx || element.scrollWidth || element.offsetWidth || 384;
  const targetHeight = element.scrollHeight || element.offsetHeight || 600;

  return await toPng(element, {
    width: targetWidth,
    height: targetHeight,
    canvasWidth: targetWidth * 2,
    canvasHeight: targetHeight * 2,
    pixelRatio: 2,
    backgroundColor: '#FFFFFF',
    cacheBust: true,
    style: {
      width: `${targetWidth}px`,
      minWidth: `${targetWidth}px`,
      maxWidth: `${targetWidth}px`,
      margin: '0',
      transform: 'none',
      position: 'static',
    },
  });
}

/**
 * Generates and downloads a custom-sized PDF receipt from an HTML element.
 */
export async function generateSlipPdf(
  element: HTMLElement,
  filename: string,
  widthMm: number
): Promise<void> {
  const widthPx = widthMm === 90 ? 648 : widthMm === 80 ? 576 : 384;
  const dataUrl = await generateSlipPng(element, widthPx);
  const targetHeight = element.scrollHeight || element.offsetHeight || 600;
  // Calculate proportional height in mm
  const heightMm = Math.max(80, Math.round((targetHeight / widthPx) * widthMm));

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [widthMm, heightMm],
  });

  doc.addImage(dataUrl, 'PNG', 0, 0, widthMm, heightMm);
  const pdfName = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;
  doc.save(pdfName);
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
 * Uses Web Share API (with files) if supported, else falls back to direct download.
 */
export async function shareOrDownloadSlip(
  element: HTMLElement,
  slipCode: string,
  customFilename?: string,
  widthMm: 58 | 80 | 90 = 90
): Promise<{ method: 'shared' | 'downloaded' | 'opened' }> {
  const widthPx = widthMm === 90 ? 648 : widthMm === 80 ? 576 : 384;
  const baseName = customFilename?.trim()
    ? sanitizeFilename(customFilename)
    : `mandi-slip-${slipCode}`;
  const filename = baseName.toLowerCase().endsWith('.png') ? baseName : `${baseName}.png`;
  const dataUrl = await generateSlipPng(element, widthPx);

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
    }
  }

  // Fallback: direct download
  downloadDataUrl(dataUrl, filename);
  return { method: 'downloaded' };
}
