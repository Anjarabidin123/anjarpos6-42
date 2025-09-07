import { Capacitor } from '@capacitor/core';
import { BleClient, BleDevice, numbersToDataView, textToDataView } from '@capacitor-community/bluetooth-le';

// Robust native Bluetooth LE thermal printer implementation
export class NativeThermalPrinter {
  private device: BleDevice | null = null;
  private serviceUuid = '';
  private characteristicUuid = '';
  private initialized = false;

  private PRINTER_SERVICES = [
    // Common BLE UART / printer services
    '000018f0-0000-1000-8000-00805f9b34fb', // Many thermal printers
    '49535343-fe7d-4ae5-8fa9-9fafd205e455', // HM-10 / BT05
    '0000ff00-0000-1000-8000-00805f9b34fb', // Custom FF00
    '6e400001-b5a3-f393-e0a9-e50e24dcca9e', // Nordic UART
    '0000180f-0000-1000-8000-00805f9b34fb', // Battery (optional)
  ];

  async initialize(): Promise<void> {
    if (this.initialized) return;
    if (Capacitor.isNativePlatform()) {
      await BleClient.initialize();
      this.initialized = true;
      console.log('Native BLE initialized');
    }
  }

  async connect(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      throw new Error('Native Bluetooth hanya tersedia di aplikasi mobile');
    }

    try {
      await this.initialize();

      // Already connected
      if (this.device && this.serviceUuid && this.characteristicUuid) {
        return true;
      }

      // Let user pick the device (more reliable than raw scanning on mobile)
      const req: any = {
        acceptAllDevices: true,
        optionalServices: this.PRINTER_SERVICES,
      };

      const picked = (await BleClient.requestDevice(req)) as unknown as BleDevice;
      if (!picked) {
        console.log('User cancelled device selection');
        return false;
      }

      this.device = picked;
      console.log(`Connecting to: ${this.device.name || this.device.deviceId}`);

      await BleClient.connect(this.device.deviceId);

      const services = await BleClient.getServices(this.device.deviceId);
      console.log(`Found ${services.length} services`);

      // Find writable characteristic
      for (const service of services) {
        for (const characteristic of service.characteristics) {
          const props: any = characteristic.properties;
          if (props?.write || props?.writeWithoutResponse) {
            this.serviceUuid = service.uuid;
            this.characteristicUuid = characteristic.uuid;
            console.log(`✓ Using service: ${this.serviceUuid}, characteristic: ${this.characteristicUuid}`);
            return true;
          }
        }
      }

      throw new Error('Tidak ditemukan characteristic yang bisa ditulis');
    } catch (error) {
      console.error('Failed to connect to native printer:', error);
      return false;
    }
  }

  async print(text: string): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return false;

    if (!this.device || !this.serviceUuid || !this.characteristicUuid) {
      const ok = await this.connect();
      if (!ok) return false;
    }

    try {
      const ESC = '\x1B';
      const GS = '\x1D';

      let commands = ESC + '@'; // Initialize
      commands += ESC + 'a' + '\x01'; // Center align
      commands += text;
      commands += '\n\n\n';
      commands += GS + 'V' + '\x42' + '\x00'; // Partial cut

      // Convert to bytes and chunk for BLE write (MTU ~ 180 bytes is safe)
      const encoder = new TextEncoder();
      const data = encoder.encode(commands);
      const chunkSize = 180;

      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        const view = numbersToDataView(Array.from(chunk));
        await BleClient.write(this.device!.deviceId, this.serviceUuid, this.characteristicUuid, view);
        // Small delay to avoid buffer overflow on some printers
        if (i + chunkSize < data.length) {
          await new Promise((r) => setTimeout(r, 50));
        }
      }

      console.log('✓ Native print command sent successfully');
      return true;
    } catch (error) {
      console.error('Failed to print via native BLE:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.device) {
      try {
        await BleClient.disconnect(this.device.deviceId);
      } catch (e) {
        console.warn('Disconnect warning:', e);
      }
      console.log('Disconnected from native printer');
    }
    this.device = null;
    this.serviceUuid = '';
    this.characteristicUuid = '';
  }

  isConnected(): boolean {
    return !!this.device && !!this.serviceUuid && !!this.characteristicUuid;
  }
}

export const nativeThermalPrinter = new NativeThermalPrinter();