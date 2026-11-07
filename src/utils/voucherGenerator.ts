import { Offer, Lead } from '../types';

/**
 * Triggers browser print dialog for the voucher card element
 */
export function printVoucher(elementId: string) {
  const element = document.getElementById(elementId);
  if (!element) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    // If popup is blocked, fallback to window.print on current window
    window.print();
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Cupom VTXMais - ${elementId}</title>
        <meta charset="utf-8" />
        <style>
          body { font-family: sans-serif; margin: 20px; background: #fff; color: #111; }
          .voucher-box { border: 2px dashed #0284c7; padding: 24px; border-radius: 12px; max-width: 600px; margin: 0 auto; }
          .code-box { background: #f0fdf4; border: 2px solid #22c55e; padding: 12px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 2px; color: #166534; margin: 16px 0; border-radius: 8px; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; }
          .details { margin: 16px 0; line-height: 1.6; }
          .footer { font-size: 12px; color: #64748b; margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 12px; }
        </style>
      </head>
      <body>
        ${element.outerHTML}
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
