import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

/**
 * Sanitizes a string for safe filesystem filename.
 */
export function sanitizeFilename(name: string): string {
  return name.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').trim();
}

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
 * Generates and downloads a custom-sized PDF receipt from an HTML element.
 */
export async function generateSlipPdf(
  element: HTMLElement,
  filename: string,
  widthMm: number
): Promise<void> {
  const dataUrl = await generateSlipPng(element);
  const elWidth = element.offsetWidth || 384;
  const elHeight = element.offsetHeight || 600;
  // Calculate proportional height in mm
  const heightMm = Math.max(80, Math.round((elHeight / elWidth) * widthMm));

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
  customFilename?: string
): Promise<{ method: 'shared' | 'downloaded' | 'opened' }> {
  const baseName = customFilename?.trim()
    ? sanitizeFilename(customFilename)
    : `mandi-slip-${slipCode}`;
  const filename = baseName.toLowerCase().endsWith('.png') ? baseName : `${baseName}.png`;
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
    }
  }

  // Fallback: direct download
  downloadDataUrl(dataUrl, filename);
  return { method: 'downloaded' };
}
