/**
 * exportReportPdf
 * Renders the dedicated PdfReport component into a hidden off-screen div,
 * captures it with html2canvas, and tiles it across A4 PDF pages using jsPDF.
 * The dark-UI DOM is never touched — the PDF always uses the white-bg layout.
 *
 * @param {object} run      - Full run document from the API
 * @param {string} filename - Output filename (without .pdf extension)
 */
export async function exportReportPdf(run, filename = 'benchley-report') {
  // Dynamic imports — keep these out of the initial bundle (~1.4 MB combined)
  const [
    { default: jsPDF },
    { default: html2canvas },
    React,
    { createRoot },
  ] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
    import('react'),
    import('react-dom/client'),
  ]);

  const { default: PdfReport } = await import('@/components/report/PdfReport');

  // ── 1. Mount PdfReport into a hidden off-screen container ────────────────
  const container = document.createElement('div');
  container.style.cssText = [
    'position:fixed',
    'top:0',
    'left:-9999px',
    'width:900px',
    'background:#ffffff',
    'z-index:-1',
    'pointer-events:none',
  ].join(';');
  document.body.appendChild(container);

  // Render using React 18 createRoot
  const root = createRoot(container);
  await new Promise(resolve => {
    root.render(React.createElement(PdfReport, { run }));
    // Give React + recharts a tick to paint
    setTimeout(resolve, 600);
  });

  // ── 2. Snapshot ───────────────────────────────────────────────────────────
  const canvas = await html2canvas(container, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    scrollX: 0,
    scrollY: 0,
    windowWidth: 900,
    windowHeight: container.scrollHeight,
  });

  // ── 3. Clean up ───────────────────────────────────────────────────────────
  root.unmount();
  document.body.removeChild(container);

  // ── 4. Tile onto A4 pages ─────────────────────────────────────────────────
  const A4_W = 210;   // mm
  const A4_H = 297;   // mm
  const MARGIN = 10;  // mm
  const printW = A4_W - MARGIN * 2;
  const printH = A4_H - MARGIN * 2;

  const imgW = canvas.width;
  const imgH = canvas.height;
  const scale = printW / imgW;          // mm per px
  const totalMM = imgH * scale;         // total height in mm

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  let yMM = 0;   // mm consumed
  let page = 0;

  while (yMM < totalMM) {
    if (page > 0) pdf.addPage();

    const srcYpx    = yMM / scale;
    const sliceHpx  = Math.min(printH / scale, imgH - srcYpx);
    const sliceHmm  = sliceHpx * scale;

    // Slice canvas
    const slice = document.createElement('canvas');
    slice.width  = imgW;
    slice.height = sliceHpx;
    slice.getContext('2d').drawImage(
      canvas,
      0, srcYpx, imgW, sliceHpx,
      0, 0,      imgW, sliceHpx,
    );

    pdf.addImage(slice.toDataURL('image/png'), 'PNG', MARGIN, MARGIN, printW, sliceHmm);

    yMM  += printH;
    page += 1;
  }

  pdf.save(`${filename}.pdf`);
}
