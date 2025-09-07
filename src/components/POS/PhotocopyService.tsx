import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PhotocopyDialog } from './PhotocopyDialog';
import { Product } from '@/types/pos';
import { Copy, FileText } from 'lucide-react';

interface PhotocopyServiceProps {
  onAddToCart: (product: Product, quantity: number, customPrice?: number) => void;
  formatPrice: (price: number) => string;
}

export const PhotocopyService = ({ onAddToCart, formatPrice }: PhotocopyServiceProps) => {
  const [showDialog, setShowDialog] = useState(false);

  // Default fotocopy product with a consistent UUID
  const photocopyProduct: Product = {
    id: '00000000-0000-0000-0000-000000000001', // Fixed UUID for photocopy service
    name: 'Layanan Fotocopy A4',
    costPrice: 0,
    sellPrice: 300,
    stock: 999999, // Unlimited service
    category: 'Layanan',
    isPhotocopy: true
  };

  return (
    <>
      <div className="mb-4">
        <Card className="pos-card pos-card-hover group cursor-pointer bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20" onClick={() => setShowDialog(true)}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Copy className="h-5 w-5 text-primary" />
              🖨️ Layanan Fotocopy A4
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Hitam Putih • Kertas A4</span>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Mulai dari</div>
                <div className="font-semibold text-primary">{formatPrice(260)}</div>
              </div>
            </div>
            
            <div className="bg-secondary/30 p-3 rounded-lg">
              <div className="text-xs text-muted-foreground mb-2 font-medium">💰 Harga Berjenjang:</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span>1-149</span>
                  <span className="font-medium">{formatPrice(300)}</span>
                </div>
                <div className="flex justify-between">
                  <span>150-399</span>
                  <span className="font-medium">{formatPrice(285)}</span>
                </div>
                <div className="flex justify-between">
                  <span>400-999</span>
                  <span className="font-medium">{formatPrice(275)}</span>
                </div>
                <div className="flex justify-between">
                  <span>1000+</span>
                  <span className="font-medium text-success">{formatPrice(260)}</span>
                </div>
              </div>
            </div>

            <Button className="w-full" variant="default" size="sm">
              <Copy className="w-4 h-4 mr-2" />
              Buat Pesanan Fotocopy
            </Button>
          </CardContent>
        </Card>
      </div>

      <PhotocopyDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        product={photocopyProduct}
        onAddToCart={onAddToCart}
      />
    </>
  );
};