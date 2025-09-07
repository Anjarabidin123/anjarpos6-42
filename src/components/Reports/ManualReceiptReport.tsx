import { useState } from 'react';
import { Receipt } from '@/types/pos';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FileText, TrendingUp, DollarSign, Package, Eye, Printer } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { id } from 'date-fns/locale';

interface ManualReceiptReportProps {
  receipts: Receipt[];
  formatPrice: (price: number) => string;
  onViewReceipt: (receipt: Receipt) => void;
  onPrintReceipt: (receipt: Receipt) => void;
}

type ReportPeriod = '1d' | '7d' | '30d' | '60d' | '365d';

export const ManualReceiptReport = ({ receipts, formatPrice, onViewReceipt, onPrintReceipt }: ManualReceiptReportProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('1d');

  const getDateRange = (period: ReportPeriod) => {
    const now = new Date();
    const today = startOfDay(now);
    
    switch (period) {
      case '1d':
        return { start: today, end: endOfDay(now) };
      case '7d':
        return { start: subDays(today, 6), end: endOfDay(now) };
      case '30d':
        return { start: subDays(today, 29), end: endOfDay(now) };
      case '60d':
        return { start: subDays(today, 59), end: endOfDay(now) };
      case '365d':
        return { start: subDays(today, 364), end: endOfDay(now) };
      default:
        return { start: today, end: endOfDay(now) };
    }
  };

  const getPeriodLabel = (period: ReportPeriod) => {
    switch (period) {
      case '1d': return 'Hari Ini';
      case '7d': return '7 Hari Terakhir';
      case '30d': return '30 Hari Terakhir';
      case '60d': return '60 Hari Terakhir';
      case '365d': return '1 Tahun Terakhir';
      default: return 'Hari Ini';
    }
  };

  const { start, end } = getDateRange(selectedPeriod);
  
  // Filter manual receipts only
  const filteredReceipts = receipts.filter(receipt => {
    const receiptDate = new Date(receipt.timestamp);
    const isManual = receipt.isManual || receipt.id.startsWith('MNL-');
    return isManual && receiptDate >= start && receiptDate <= end;
  });

  // Calculate manual receipt statistics
  const totalSales = filteredReceipts.reduce((sum, receipt) => sum + receipt.total, 0);
  const totalDiscount = filteredReceipts.reduce((sum, receipt) => sum + receipt.discount, 0);
  const totalTransactions = filteredReceipts.length;
  const totalItems = filteredReceipts.reduce((sum, receipt) => sum + receipt.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);

  // Calculate photocopy revenue from manual receipts
  const photocopyRevenue = filteredReceipts.reduce((sum, receipt) => {
    const photocopyItems = receipt.items.filter(item => 
      item.product.isPhotocopy || 
      item.product.category === 'Fotocopy' ||
      item.product.name.toLowerCase().includes('fotocopy')
    );
    return sum + photocopyItems.reduce((itemSum, item) => 
      itemSum + (item.finalPrice || item.product.sellPrice) * item.quantity, 0
    );
  }, 0);

  const handlePrint = () => {
    const reportContent = `
===============================
    LAPORAN NOTA MANUAL
    TOKO ANJAR
===============================
Periode: ${getPeriodLabel(selectedPeriod)}
${format(start, 'dd/MM/yyyy', { locale: id })} - ${format(end, 'dd/MM/yyyy', { locale: id })}
===============================

RINGKASAN:
• Total Penjualan: ${formatPrice(totalSales)}
• Total Transaksi: ${totalTransactions}
• Total Item: ${totalItems}
• Penghasilan Fotocopy: ${formatPrice(photocopyRevenue)}
${totalDiscount > 0 ? `• Total Diskon: ${formatPrice(totalDiscount)}` : ''}

===============================
DETAIL TRANSAKSI MANUAL:
===============================

${filteredReceipts.length === 0 ? 'Tidak ada transaksi manual pada periode ini.' : 
  filteredReceipts.map(receipt => `
Nota: ${receipt.id}
Tanggal: ${format(receipt.timestamp, 'dd/MM/yyyy HH:mm', { locale: id })}
Items: ${receipt.items.map(item => `${item.product.name} (${item.quantity}x @${formatPrice(item.finalPrice || item.product.sellPrice)})`).join(', ')}
Subtotal: ${formatPrice(receipt.subtotal)}${receipt.discount > 0 ? `
Diskon: ${formatPrice(receipt.discount)}` : ''}
Total: ${formatPrice(receipt.total)}
Penghasilan Fotocopy: ${formatPrice(photocopyRevenue)}
${receipt.paymentMethod ? `Metode: ${receipt.paymentMethod}` : ''}
-------------------------------`).join('')}

===============================
Dicetak pada: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: id })}
===============================
    `;

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Laporan Nota Manual - ${getPeriodLabel(selectedPeriod)}</title>
            <style>
              body {
                font-family: 'Courier New', monospace;
                font-size: 12px;
                line-height: 1.4;
                margin: 20px;
                white-space: pre-line;
              }
              @media print {
                body { margin: 0; }
                @page { size: A4; margin: 1cm; }
              }
            </style>
          </head>
          <body>${reportContent}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Laporan Nota Manual</h2>
          <p className="text-muted-foreground">
            Laporan khusus untuk transaksi nota manual
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Periode:</span>
            <Select value={selectedPeriod} onValueChange={(value: ReportPeriod) => setSelectedPeriod(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">Hari Ini</SelectItem>
                <SelectItem value="7d">7 Hari</SelectItem>
                <SelectItem value="30d">30 Hari</SelectItem>
                <SelectItem value="60d">60 Hari</SelectItem>
                <SelectItem value="365d">1 Tahun</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={handlePrint}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Cetak Laporan
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendapatan Manual</p>
                <p className="text-lg font-semibold">{formatPrice(totalSales)}</p>
              </div>
            </div>
          </CardContent>
        </Card>


        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FileText className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Transaksi Manual</p>
                <p className="text-lg font-semibold text-orange-600">{totalTransactions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Nota Manual ({getPeriodLabel(selectedPeriod)})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredReceipts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Tidak ada nota manual pada periode ini</p>
              <p className="text-sm">Coba ubah periode atau buat nota manual baru</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredReceipts.map((receipt) => (
                <div 
                  key={receipt.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm bg-orange-100 text-orange-600 px-2 py-1 rounded">
                        {receipt.id}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {format(receipt.timestamp, 'dd/MM/yyyy HH:mm', { locale: id })}
                      </span>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      {receipt.items.map(item => `${item.product.name} (${item.quantity}x)`).join(', ')}
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <span className="font-semibold">{formatPrice(receipt.total)}</span>
                      {receipt.paymentMethod && (
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {receipt.paymentMethod}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onViewReceipt(receipt)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onPrintReceipt(receipt)}
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};