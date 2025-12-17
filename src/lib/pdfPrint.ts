import type jsPDF from 'jspdf';

interface PrintOptions {
  /** When to revoke the created object URL (ms). */
  revokeDelayMs?: number;
}

/**
 * Opens the browser print dialog for a jsPDF instance.
 *
 * Strategy:
 * 1) Try opening a new tab (works best with built-in PDF viewers).
 * 2) If popups are blocked, fall back to a hidden iframe.
 */
export function openPrintDialogForJsPdf(doc: jsPDF, options: PrintOptions = {}) {
  const revokeDelayMs = options.revokeDelayMs ?? 15000;

  const pdfBlob = doc.output('blob') as Blob;
  const pdfUrl = URL.createObjectURL(pdfBlob);

  const revoke = () => {
    try {
      URL.revokeObjectURL(pdfUrl);
    } catch {
      // ignore
    }
  };

  // Try popup/tab first (usually the most reliable for PDFs)
  const popup = window.open(pdfUrl, '_blank', 'noopener,noreferrer');
  if (popup) {
    // Give the PDF viewer a moment to initialize
    const t = window.setTimeout(() => {
      try {
        popup.focus();
        popup.print();
      } catch {
        // ignore
      }
    }, 800);

    window.setTimeout(() => {
      window.clearTimeout(t);
      revoke();
    }, revokeDelayMs);

    return;
  }

  // Fallback: hidden iframe (no popup required)
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';

  let printed = false;
  const doPrint = () => {
    if (printed) return;
    printed = true;

    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      // ignore
    }

    window.setTimeout(() => {
      try {
        iframe.remove();
      } catch {
        // ignore
      }
      revoke();
    }, 1000);
  };

  iframe.onload = () => window.setTimeout(doPrint, 200);
  document.body.appendChild(iframe);
  iframe.src = pdfUrl;

  // Safety fallback if onload doesn't fire (some PDF viewers)
  window.setTimeout(doPrint, 1500);
}
