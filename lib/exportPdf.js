/**
 * exportReportPdf
 * Captures the report DOM node as a high-resolution canvas and
 * tiles it across A4 PDF pages using jsPDF.
 *
 * @param {HTMLElement} element  - The DOM node to capture
 * @param {string}      filename - Output filename (without extension)
 */
export async function exportReportPdf(element, filename = 'benchley-report') {
  // Dynamic imports so the ~1 MB libs are never loaded on page load
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ]);

  // ── 1. Snapshot the element ──────────────────────────────────────────────
  const canvas = await html2canvas(element, {
    scale: 2,                   // 2× for retina-quality text
    useCORS: true,
    backgroundColor: '#09090b', // zinc-950 — match the dark bg
    logging: false,
    // Scroll the element into view before capture
    scrollX: 0,
    scrollY: -window.scrollY,
    windowWidth: document.documentElement.scrollWidth,
    windowHeight: document.documentElement.scrollHeight,
  });

  // ── 2. Measure and tile onto A4 pages ────────────────────────────────────
  const A4_W_MM = 210;
  const A4_H_MM = 297;
  const MARGIN_MM = 10;
  const printableW = A4_W_MM - MARGIN_MM * 2;
  const printableH = A4_H_MM - MARGIN_MM * 2;

  const imgData = canvas.toDataURL('image/png');
  const imgW = canvas.width;
  const imgH = canvas.height;

  // Scale factor: fit image width into printable area
  const scale = printableW / imgW;
  const scaledH = imgH * scale; // total height in mm if printed at full width

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  let yOffset = 0; // how many mm of the image we've already placed
  let page = 0;

  while (yOffset < scaledH) {
    if (page > 0) pdf.addPage();

    // Source rect in canvas pixels for this page slice
    const srcY = yOffset / scale;          // px
    const srcH = printableH / scale;       // px — height of one page slice

    // Clamp to actual image height
    const actualSrcH = Math.min(srcH, imgH - srcY);
    const actualPrintH = actualSrcH * scale;

    // Slice canvas into a temporary canvas
    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width = imgW;
    sliceCanvas.height = actualSrcH;
    const ctx = sliceCanvas.getContext('2d');
    ctx.drawImage(canvas, 0, srcY, imgW, actualSrcH, 0, 0, imgW, actualSrcH);

    const sliceData = sliceCanvas.toDataURL('image/png');
    pdf.addImage(sliceData, 'PNG', MARGIN_MM, MARGIN_MM, printableW, actualPrintH);

    yOffset += printableH;
    page++;
  }

  pdf.save(`${filename}.pdf`);
}
