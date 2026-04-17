package com.ironvault;

import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothGatt;
import android.bluetooth.BluetoothGattCharacteristic;
import android.bluetooth.BluetoothGattDescriptor;
import android.bluetooth.BluetoothGattServer;
import android.bluetooth.BluetoothGattServerCallback;
import android.bluetooth.BluetoothGattService;
import android.bluetooth.BluetoothManager;
import android.bluetooth.le.AdvertiseCallback;
import android.bluetooth.le.AdvertiseData;
import android.bluetooth.le.AdvertiseSettings;
import android.bluetooth.le.BluetoothLeAdvertiser;
import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.os.ParcelUuid;
import android.util.Log;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

public class BleModule extends ReactContextBaseJavaModule {

    private static final String TAG = "BleModule";

    private BluetoothGattServer gattServer;
    private BluetoothLeAdvertiser advertiser;
    private BluetoothGattCharacteristic notifyChar;
    private BluetoothDevice notifyDevice;
    private final Map<String, BluetoothDevice> connectedDevices = new HashMap<>();

    // APDU reassembly
    private byte[] apduBuffer;
    private int apduLength, apduReceived, expectedChunk;
    private int mtu = LedgerBleConstants.MTU_SIZE;

    public BleModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    @NonNull
    public String getName() { return "BleModule"; }

    // ── React Methods ─────────────────────────────────────────────────────────

    @ReactMethod
    public void startAdvertising() {
        new Handler(Looper.getMainLooper()).post(() -> {
            BluetoothManager btManager =
                (BluetoothManager) getReactApplicationContext()
                    .getSystemService(Context.BLUETOOTH_SERVICE);
            if (btManager == null || btManager.getAdapter() == null) {
                emitLog("蓝牙不可用");
                return;
            }
            if (!btManager.getAdapter().isEnabled()) {
                emitLog("请先开启蓝牙");
                return;
            }
            try {
                boolean nameSet = btManager.getAdapter().setName(LedgerBleConstants.DEVICE_NAME);
                String actualName = btManager.getAdapter().getName();
                if (nameSet) emitLog("设备名已设置: \"" + actualName + "\"");
                else emitLog("设备名设置失败，当前名称: \"" + actualName + "\"");
            } catch (Exception e) { emitLog("设置设备名异常: " + e.getMessage()); }
            // Reuse existing GATT server to keep attribute handles stable for bonded devices
            if (gattServer == null) {
                setupGattServer(btManager);
            }
            startBleAdvertising(btManager);
        });
    }

    @ReactMethod
    public void stopAdvertising() {
        if (advertiser != null) {
            try { advertiser.stopAdvertising(advertiseCallback); } catch (Exception ignored) {}
            advertiser = null;
        }
        // Keep GATT server alive — OKX caches attribute handles from bonding.
        // Closing & re-creating causes "format mismatch" and breaks reconnection.
        connectedDevices.clear();
        notifyDevice = null;
        emitLog("BLE 已停止");
        emitStatus("已停止");
    }

    @ReactMethod
    public void sendApduResponse(String hexResponse) {
        if (notifyDevice == null) { emitLog("无连接设备，忽略响应"); return; }
        sendApduResponseBytes(notifyDevice, hexToBytes(hexResponse));
    }

    // Required by RN EventEmitter
    @ReactMethod public void addListener(String eventName) {}
    @ReactMethod public void removeListeners(Integer count) {}

    // ── GATT Server ───────────────────────────────────────────────────────────

    private void setupGattServer(BluetoothManager btManager) {
        try {
        gattServer = btManager.openGattServer(getReactApplicationContext(), gattCallback);
        } catch (SecurityException e) {
            emitLog("BLE 权限不足: " + e.getMessage());
            return;
        }

        BluetoothGattService service = new BluetoothGattService(
            LedgerBleConstants.SERVICE_UUID, BluetoothGattService.SERVICE_TYPE_PRIMARY);

        notifyChar = new BluetoothGattCharacteristic(
            LedgerBleConstants.NOTIFY_UUID,
            BluetoothGattCharacteristic.PROPERTY_NOTIFY,
            BluetoothGattCharacteristic.PERMISSION_READ);

        BluetoothGattDescriptor cccd = new BluetoothGattDescriptor(
            LedgerBleConstants.CCCD_UUID,
            BluetoothGattDescriptor.PERMISSION_READ | BluetoothGattDescriptor.PERMISSION_WRITE);
        cccd.setValue(BluetoothGattDescriptor.DISABLE_NOTIFICATION_VALUE);
        notifyChar.addDescriptor(cccd);

        BluetoothGattCharacteristic writeChar = new BluetoothGattCharacteristic(
            LedgerBleConstants.WRITE_UUID,
            BluetoothGattCharacteristic.PROPERTY_WRITE,
            BluetoothGattCharacteristic.PERMISSION_WRITE);

        BluetoothGattCharacteristic writeCmdChar = new BluetoothGattCharacteristic(
            LedgerBleConstants.WRITE_CMD_UUID,
            BluetoothGattCharacteristic.PROPERTY_WRITE_NO_RESPONSE,
            BluetoothGattCharacteristic.PERMISSION_WRITE);

        service.addCharacteristic(notifyChar);
        service.addCharacteristic(writeChar);
        service.addCharacteristic(writeCmdChar);
        gattServer.addService(service);
        emitLog("GATT 服务已创建");
    }

    // ── BLE Advertising ───────────────────────────────────────────────────────

    private void startBleAdvertising(BluetoothManager btManager) {
        BluetoothLeAdvertiser adv = btManager.getAdapter().getBluetoothLeAdvertiser();
        if (adv == null) { emitLog("不支持 BLE 广播"); return; }
        // Stop any lingering advertiser before starting fresh.
        if (advertiser != null) {
            try { advertiser.stopAdvertising(advertiseCallback); } catch (Exception ignored) {}
        }
        advertiser = adv;

        AdvertiseSettings settings = new AdvertiseSettings.Builder()
            .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
            .setConnectable(true).setTimeout(0)
            .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_HIGH).build();

        AdvertiseData advData = new AdvertiseData.Builder()
            .setIncludeDeviceName(false)
            .addServiceUuid(new ParcelUuid(LedgerBleConstants.SERVICE_UUID)).build();

        AdvertiseData scanResp = new AdvertiseData.Builder()
            .setIncludeDeviceName(true).build();

        advertiser.startAdvertising(settings, advData, scanResp, advertiseCallback);
    }

    // ── Protocol Handling ─────────────────────────────────────────────────────

    private void handleWrite(BluetoothDevice device, byte[] value) {
        if (value == null || value.length == 0) return;
        emitLog("← RX: " + hex(value));
        if (value[0] == LedgerBleConstants.TAG_MTU) {
            byte[] resp = {0x08, 0x00, 0x00, 0x00, 0x00, (byte) mtu};
            sendNotification(device, resp);
            emitLog("→ MTU 响应: " + mtu);
        } else if (value[0] == LedgerBleConstants.TAG_APDU) {
            handleApduChunk(device, value);
        }
    }

    private void handleApduChunk(BluetoothDevice device, byte[] chunk) {
        int chunkIdx = ((chunk[1] & 0xFF) << 8) | (chunk[2] & 0xFF);
        if (chunkIdx == 0) {
            int totalLen = ((chunk[3] & 0xFF) << 8) | (chunk[4] & 0xFF);
            apduBuffer = new byte[totalLen];
            apduLength = totalLen; apduReceived = 0; expectedChunk = 0;
            int dataLen = Math.min(chunk.length - 5, totalLen);
            System.arraycopy(chunk, 5, apduBuffer, 0, dataLen);
            apduReceived += dataLen;
        } else {
            if (apduBuffer == null) { emitLog("未收到首帧，丢弃"); return; }
            if (chunkIdx != expectedChunk) { emitLog("帧序号错误"); return; }
            int dataLen = Math.min(chunk.length - 3, apduLength - apduReceived);
            System.arraycopy(chunk, 3, apduBuffer, apduReceived, dataLen);
            apduReceived += dataLen;
        }
        expectedChunk++;
        if (apduReceived >= apduLength) {
            emitLog("APDU 完整 (" + apduLength + " bytes): " + hex(apduBuffer));
            // Emit to JS — no spaces in hex
            emitApdu(hex(apduBuffer).replace(" ", ""));
        }
    }

    private void sendApduResponseBytes(BluetoothDevice device, byte[] apdu) {
        int maxFirst = mtu - 5, maxSubseq = mtu - 3;
        int offset = 0, chunkIdx = 0;
        while (offset < apdu.length) {
            byte[] frame;
            if (chunkIdx == 0) {
                int len = Math.min(maxFirst, apdu.length);
                frame = new byte[5 + len];
                frame[0] = LedgerBleConstants.TAG_APDU;
                frame[1] = 0; frame[2] = 0;
                frame[3] = (byte)((apdu.length >> 8) & 0xFF);
                frame[4] = (byte)(apdu.length & 0xFF);
                System.arraycopy(apdu, 0, frame, 5, len);
                offset += len;
            } else {
                int len = Math.min(maxSubseq, apdu.length - offset);
                frame = new byte[3 + len];
                frame[0] = LedgerBleConstants.TAG_APDU;
                frame[1] = (byte)((chunkIdx >> 8) & 0xFF);
                frame[2] = (byte)(chunkIdx & 0xFF);
                System.arraycopy(apdu, offset, frame, 3, len);
                offset += len;
            }
            sendNotification(device, frame);
            emitLog("→ TX[" + chunkIdx + "]: " + hex(frame));
            chunkIdx++;
            try { Thread.sleep(20); } catch (Exception ignored) {}
        }
    }

    private void sendNotification(BluetoothDevice device, byte[] data) {
        if (gattServer == null || notifyChar == null) return;
        notifyChar.setValue(data);
        gattServer.notifyCharacteristicChanged(device, notifyChar, false);
    }

    // ── GATT Callbacks ────────────────────────────────────────────────────────

    private final BluetoothGattServerCallback gattCallback = new BluetoothGattServerCallback() {
        @Override
        public void onConnectionStateChange(BluetoothDevice device, int status, int newState) {
            if (newState == BluetoothGattServer.STATE_CONNECTED) {
                connectedDevices.put(device.getAddress(), device);
                // Set notifyDevice eagerly — bonded devices may not re-write CCCD on reconnect,
                // so onDescriptorWriteRequest never fires and notifyDevice stays null.
                notifyDevice = device;
                emitLog("已连接: " + device.getAddress()); emitStatus("已连接");
            } else {
                connectedDevices.remove(device.getAddress());
                if (device.equals(notifyDevice)) notifyDevice = null;
                emitLog("已断开: " + device.getAddress()); emitStatus("广播中");
            }
        }

        @Override
        public void onCharacteristicWriteRequest(BluetoothDevice device, int requestId,
            BluetoothGattCharacteristic c, boolean prep, boolean needResp, int offset, byte[] value) {
            if (needResp) gattServer.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, 0, null);
            handleWrite(device, value);
        }

        @Override
        public void onDescriptorWriteRequest(BluetoothDevice device, int requestId,
            BluetoothGattDescriptor descriptor, boolean prep, boolean needResp, int offset, byte[] value) {
            if (LedgerBleConstants.CCCD_UUID.equals(descriptor.getUuid())) {
                if (Arrays.equals(value, BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE)) {
                    notifyDevice = device; emitLog("通知已启用: " + device.getAddress());
                } else {
                    if (device.equals(notifyDevice)) notifyDevice = null;
                    emitLog("通知已禁用");
                }
            }
            if (needResp) gattServer.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, 0, null);
        }

        @Override
        public void onMtuChanged(BluetoothDevice device, int mtu) {
            BleModule.this.mtu = mtu - 3;
            emitLog("ATT MTU → 帧大小: " + BleModule.this.mtu);
        }
    };

    private final AdvertiseCallback advertiseCallback = new AdvertiseCallback() {
        @Override public void onStartSuccess(AdvertiseSettings s) {
            emitLog("BLE 广播已启动 (\"" + LedgerBleConstants.DEVICE_NAME + "\")");
            emitStatus("广播中");
        }
        @Override public void onStartFailure(int errorCode) {
            emitLog("广播失败: code=" + errorCode); emitStatus("广播失败");
        }
    };

    // ── Event Emission ────────────────────────────────────────────────────────

    private void emitApdu(String hex) { emit("onApduReceived", hex); }
    private void emitLog(String msg)  { Log.d(TAG, msg); emit("onBleLog", msg); }
    private void emitStatus(String s) { emit("onBleStatus", s); }

    private void emit(String event, String data) {
        getReactApplicationContext()
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit(event, data);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static String hex(byte[] b) {
        StringBuilder sb = new StringBuilder();
        for (byte x : b) sb.append(String.format("%02X ", x));
        return sb.toString().trim();
    }

    private static byte[] hexToBytes(String hex) {
        hex = hex.replaceAll("\\s+", "");
        byte[] out = new byte[hex.length() / 2];
        for (int i = 0; i < out.length; i++)
            out[i] = (byte)((Character.digit(hex.charAt(i*2),16)<<4)
                           + Character.digit(hex.charAt(i*2+1),16));
        return out;
    }
}
