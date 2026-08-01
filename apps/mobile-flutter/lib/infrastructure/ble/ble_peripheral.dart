/// BLE GATT server peripheral — Ledger Nano X-compatible.
///
/// Ported from iron-vault-mono: `apps/mobile/src/ble/BlePeripheral.ts`
///
/// Implements a real Android GATT server using `ble_gatt_server` so that
/// BLE centrals (MetaMask, OKX Wallet, Ledger Live) can discover and
/// connect to the device as if it were a Ledger Nano X.
///
/// GATT service UUID: `13d63400-2c97-0004-0000-4c6564676572` (Ledger Nano X)
///
/// Usage from VaultScreen:
/// ```dart
/// final ble = BlePeripheral();
/// ble.logStream.listen((log) => print(log));
/// ble.apduStream.listen((apdu) {
///   final cmd = ApduCommand.fromBytes(apdu);
///   final response = apduHandler.handle(cmd);
///   ble.sendApduResponse(response.toBytes());
/// });
/// await ble.startAdvertising();
/// ```
library;

import 'dart:async';

import 'package:ble_gatt_server/ble_gatt_server.dart';
import 'package:flutter/foundation.dart';
import 'package:permission_handler/permission_handler.dart';

import '../../core/models/ble_types.dart';

/// BLE peripheral acting as a Ledger Nano X-compatible GATT server.
///
/// State machine:
/// ```
/// idle → broadcasting → connected → error
///   ↑        ↑_______________|         |
///   |                ↓                 ↓
///   |_______________|_________________|
/// ```
class BlePeripheral {
  // ── BLE Protocol Constants ───────────────────────────────────────────

  /// APDU fragmentation tag — marks a fragment of an APDU command/response.
  static const int _tagApdu = 0x05;

  /// GET_MTU tag — client queries the negotiated MTU.
  static const int _tagGetMtu = 0x08;

  /// BLE channel prefix bytes (Ledger Nano X protocol).
  static const int _channelHi = 0x01;
  static const int _channelLo = 0x01;

  // ── State ────────────────────────────────────────────────────────────

  BleState _state = BleState.idle;
  String _deviceName = 'IronVault';
  bool _disposed = false;

  // ── BLE server ───────────────────────────────────────────────────────

  final BleGattServer _server = BleGattServer();
  BleGattCharacteristic? _responseChar;
  BleDevice? _connectedDevice;
  int _mtu = 20; // default BLE ATT MTU

  // ── CCCD notification state ──────────────────────────────────────────

  /// Addresses of BLE centrals that have subscribed to notifications
  /// by writing to the CCCD descriptor on the response characteristic.
  final Set<String> _subscribedDevices = {};

  /// Buffered APDU response bytes.
  ///
  /// When a BLE client reads the response characteristic (e.g. OKX Wallet
  /// uses GATT Read instead of Notify for APDU responses), we return the
  /// buffered response. Cleared after being read or on disconnect.
  Uint8List? _bufferedResponse;

  // ── APDU incoming fragmentation ──────────────────────────────────────

  /// Total expected APDU length (from the first fragment header), or 0.
  int _incomingTotalLen = 0;

  /// Accumulated payload chunks indexed by sequence number.
  final Map<int, Uint8List> _incomingChunks = {};

  // ── Stream controllers ───────────────────────────────────────────────

  final StreamController<String> _logController =
      StreamController<String>.broadcast();

  final StreamController<Uint8List> _apduController =
      StreamController<Uint8List>.broadcast();

  // ── Constructor ──────────────────────────────────────────────────────

  BlePeripheral() {
    _requestPermissions();
  }

  /// Request runtime BLE permissions at construction time.
  ///
  /// Denials are logged as warnings but never throw.
  void _requestPermissions() async {
    try {
      final advertiseStatus = await Permission.bluetoothAdvertise.request();
      final connectStatus = await Permission.bluetoothConnect.request();
      final scanStatus = await Permission.bluetoothScan.request();

      if (advertiseStatus.isDenied) {
        _log('⚠ BLE advertise permission denied');
      }
      if (connectStatus.isDenied) {
        _log('⚠ BLE connect permission denied');
      }
      if (scanStatus.isDenied) {
        _log('⚠ BLE scan permission denied');
      }

      if (advertiseStatus.isGranted && connectStatus.isGranted) {
        _log('BLE permissions granted');
      }
    } catch (e) {
      _log('⚠ BLE permission request failed: $e');
    }
  }

  // ── Public getters ───────────────────────────────────────────────────

  /// Current BLE state.
  BleState get state => _state;

  /// Human-readable log stream (for UI display).
  Stream<String> get logStream => _logController.stream;

  /// Stream of raw APDU command bytes from the connected client.
  Stream<Uint8List> get apduStream => _apduController.stream;

  /// Current device name used for advertising.
  String get deviceName => _deviceName;

  // ── Lifecycle ────────────────────────────────────────────────────────

  /// Start BLE advertising with the Ledger Nano X service UUID.
  ///
  /// Creates the GATT server, builds the Ledger Nano X-compatible service
  /// with three characteristics, and begins advertising so that BLE
  /// centrals (MetaMask, OKX Wallet, Ledger Live) can discover the device.
  Future<void> startAdvertising() async {
    _ensureNotDisposed();

    if (_state == BleState.broadcasting || _state == BleState.connected) {
      _log('Already advertising or connected.');
      return;
    }

    try {
      // ── Enable Bluetooth ──────────────────────────────────────────
      var btEnabled = await _server.isBluetoothEnabled();
      if (btEnabled != true) {
        btEnabled = await _server.enableBluetooth();
        if (btEnabled != true) {
          _log('⚠ Bluetooth could not be enabled.');
          return;
        }
      }

      // ── CCCD descriptor ───────────────────────────────────────────
      final cccdDescriptor = BleGattDescriptor(
        uuid: bleCccdDescriptorUuid,
        permissions:
            BleGattDescriptor.PERMISSION_READ | BleGattDescriptor.PERMISSION_WRITE,
      );

      // ── Response characteristic (notify) ──────────────────────────
      final responseChar = BleGattCharacteristic(
        uuid: bleApduResponseCharacteristicUuid,
        properties: BleGattCharacteristic.PROPERTY_NOTIFY,
        permissions: BleGattCharacteristic.PERMISSION_READ,
        descriptors: [cccdDescriptor],
      );

      // ── Command characteristic (write with response) ──────────────
      final commandChar = BleGattCharacteristic(
        uuid: bleApduCommandCharacteristicUuid,
        properties: BleGattCharacteristic.PROPERTY_WRITE,
        permissions: BleGattCharacteristic.PERMISSION_WRITE,
      );

      // ── WriteCmd characteristic (write without response) ──────────
      final writeCmdChar = BleGattCharacteristic(
        uuid: bleApduWriteCommandCharacteristicUuid,
        properties: BleGattCharacteristic.PROPERTY_WRITE_NO_RESPONSE,
        permissions: BleGattCharacteristic.PERMISSION_WRITE,
      );

      _responseChar = responseChar;

      // ── Build GATT service ────────────────────────────────────────
      final service = BleGattService(
        uuid: bleServiceUuid,
        serviceType: BleGattService.SERVICE_TYPE_PRIMARY,
        characteristics: [responseChar, commandChar, writeCmdChar],
      );

      // ── Start server and add service ──────────────────────────────
      // Server must be started before adding services.
      await _server.startServer();
      await _server.addService(service);

      // ── Create advertisement ──────────────────────────────────────
      final advertisement = BleAdvertisement(
        dataContainer: BleAdvertisementDataContainer(
          advertisementData: BleAdvertisementData(
            localName: _deviceName,
            includeTxPower: false,
          ),
          scanResponseData: BleAdvertisementData(
            serviceUUIDList: [bleServiceUuid],
          ),
        ),
        settings: BleAdvertisementSettings(
          advertiseMode: BleAdvertisementSettings.ADVERTISE_MODE_LOW_LATENCY,
          timeout: 0,
          connectable: true,
        ),
      );

      // ── Register event handlers ───────────────────────────────────
      _server.handleEvents(
        onAdvertiseStartFailure: (errorCode) {
          _log('⚠ Advertising start failed: code=$errorCode');
          _transition(BleState.error);
        },
        onAdvertiseStartSuccess: (_) {
          _log('BLE advertising started — device "$_deviceName", '
              'service $bleServiceUuid');
        },
        onConnectionStateChange: _onConnectionStateChange,
        onCharacteristicReadRequest: _onCharacteristicReadRequest,
        onCharacteristicWriteRequest: _onCharacteristicWriteRequest,
        onDescriptorReadRequest: _onDescriptorReadRequest,
        onDescriptorWriteRequest: _onDescriptorWriteRequest,
        onExecuteWrite: (device, requestId, execute) {
          _log('Execute write: requestId=$requestId, execute=$execute');
        },
        onNotificationSent: (device, status) {
          _log('Notification sent: ${device?.address ?? "unknown"}, status=$status');
          print('[NOTIFY SENT] device=${device?.address ?? "unknown"} status=$status');
        },
        onMtuChanged: _onMtuChanged,
      );

      // ── Start advertising ─────────────────────────────────────────
      await _server.startAdvertising(advertisement);
      _transition(BleState.broadcasting);
    } catch (e) {
      _log('⚠ BLE startAdvertising error: $e');
      _transition(BleState.error);
    }
  }

  /// Stop advertising and disconnect.
  ///
  /// Transitions back to [BleState.idle], releasing BLE resources.
  Future<void> stopAdvertising() async {
    _ensureNotDisposed();

    try {
      await _server.stopAdvertising();
      await _server.stopServer();
    } catch (e) {
      _log('⚠ BLE stop error: $e');
    }

    _connectedDevice = null;
    _bufferedResponse = null;
    _subscribedDevices.clear();
    _incomingChunks.clear();
    _incomingTotalLen = 0;
    _responseChar = null;

    _transition(BleState.idle);
    _log('BLE advertising stopped.');
  }

  /// Send an APDU response back to the connected client.
  ///
  /// Fragments the response according to the Ledger BLE APDU
  /// fragmentation protocol and delivers each fragment via GATT
  /// notifications on the response characteristic.
  Future<void> sendApduResponse(Uint8List response) async {
    _ensureNotDisposed();

    if (_state != BleState.connected) {
      _log('Cannot send APDU response — not connected.');
      return;
    }

    final device = _connectedDevice;
    final responseChar = _responseChar;
    if (device == null || responseChar == null) {
      _log('Cannot send APDU response — no connected device or characteristic.');
      return;
    }

    final hex = _bytesToHex(response);
    _log('APDU response sending: $hex');
    print('[SEND APDU] response=$hex mtu=$_mtu');

    try {
      final fragments = _fragmentOutgoingApdu(response);
      // Buffer the first fragment for GATT read access.
      _bufferedResponse = fragments.isNotEmpty ? fragments.first : null;
      print('[SEND APDU] ${fragments.length} fragments, buf=${_bufferedResponse != null ? _bytesToHex(_bufferedResponse!) : "null"}');
      for (final fragment in fragments) {
        print('[SEND APDU] notify fragment: ${_bytesToHex(fragment)}');
        await _server.notifyCharacteristic(device, responseChar, fragment);
      }
      _log('APDU response sent: $hex (${fragments.length} fragment${fragments.length == 1 ? '' : 's'})');
      print('[SEND APDU] done — all fragments sent');
    } catch (e) {
      _log('⚠ APDU response send error: $e');
      print('[SEND APDU] ERROR: $e');
    }
  }

  /// Set the BLE device name that will be advertised.
  ///
  /// Must be called **before** [startAdvertising] to take effect on the
  /// currently-active advertisement. Calling it during advertising will
  /// not change the advertisement data; restart advertising to apply.
  Future<void> setDeviceName(String name) async {
    _ensureNotDisposed();

    if (name.isEmpty) {
      _log('⚠ Device name cannot be empty.');
      return;
    }

    _deviceName = name;
    _log('Device name set to "$_deviceName".');
  }

  /// Dispose all resources: stream controllers and BLE server.
  ///
  /// After calling this, the instance is no longer usable.
  void dispose() {
    if (_disposed) return;
    _disposed = true;

    // Best-effort stop of BLE — fire-and-forget since dispose() is sync.
    try {
      _server.stopAdvertising();
    } catch (_) {}
    try {
      _server.stopServer();
    } catch (_) {}

    _transition(BleState.idle);

    _subscribedDevices.clear();
    _incomingChunks.clear();
    _incomingTotalLen = 0;
    _connectedDevice = null;
    _responseChar = null;

    if (!_logController.isClosed) {
      _logController.close();
    }
    if (!_apduController.isClosed) {
      _apduController.close();
    }
  }

  // ── Event handlers ───────────────────────────────────────────────────

  /// Handle connection state changes from the BLE stack.
  void _onConnectionStateChange(
      BleDevice? device, int status, int newState) {
    if (newState == BleGattServer.DEVICE_STATE_CONNECTED) {
      _connectedDevice = device;
      _incomingChunks.clear();
      _incomingTotalLen = 0;
      _transition(BleState.connected);
      _log('BLE client connected — ${device?.address ?? "unknown"}, '
          'status=${_bleStatusDescription(status)}');
    } else if (newState == BleGattServer.DEVICE_STATE_DISCONNECTED) {
      _subscribedDevices.remove(device?.address);
      _bufferedResponse = null;
      _connectedDevice = null;
      _incomingChunks.clear();
      _incomingTotalLen = 0;
      _transition(BleState.idle);
      _log('BLE client disconnected — ${device?.address ?? "unknown"}, '
          'status=${_bleStatusDescription(status)}');
    }
  }

  /// Handle GATT characteristic read requests from the client.
  ///
  /// Responds to reads on the response characteristic with empty success.
  /// Unknown characteristics are rejected with GATT_FAILURE.
  Future<void> _onCharacteristicReadRequest(
    BleDevice? device,
    int requestId,
    int offset,
    BleGattCharacteristic? characteristic,
  ) async {
    if (device == null) return;
    final uuid = characteristic?.uuid ?? '';
    if (uuid == bleApduResponseCharacteristicUuid) {
      // Return buffered APDU response if available, otherwise empty.
      final buf = _bufferedResponse;
      _bufferedResponse = null; // consume once
      print('[GATT READ] response char, offset=$offset, buf=${buf != null ? _bytesToHex(buf) : "null"}');
      await _server.sendResponse(
          device, requestId, BleGattServer.GATT_SUCCESS, offset, buf);
    } else {
      print('[GATT READ] unknown char uuid=$uuid — rejected');
      await _server.sendResponse(
          device, requestId, BleGattServer.GATT_FAILURE, offset, null);
    }
  }

  /// Handle GATT characteristic write requests from the client.
  ///
  /// Processes incoming APDU fragments on the command and write-command
  /// characteristics. Handles GET_MTU queries inline.
  Future<void> _onCharacteristicWriteRequest(
    BleDevice? device,
    int requestId,
    BleGattCharacteristic? characteristic,
    bool preparedWrite,
    bool responseNeeded,
    int offset,
    Uint8List? value,
  ) async {
    final charUuid = characteristic?.uuid ?? '';
    final valHex = value != null
        ? value.map((b) => b.toRadixString(16).padLeft(2, '0')).join(' ')
        : '(null)';
    _log('GATT write: uuid=${charUuid.substring(charUuid.length > 8 ? charUuid.length - 8 : 0)} len=${value?.length ?? 0} prepared=$preparedWrite respNeeded=$responseNeeded offset=$offset bytes=$valHex');
    print('[GATT WRITE] uuid=$charUuid len=${value?.length ?? 0} prepared=$preparedWrite respNeeded=$responseNeeded offset=$offset $valHex');

    // Ignore prepared writes — the Ledger BLE protocol uses its own
    // application-level fragmentation, not GATT prepared writes.
    if (preparedWrite) {
      _log('⚠ Ignoring prepared write (not supported)');
      return;
    }

    if (value == null || value.isEmpty) {
      if (responseNeeded && device != null) {
        await _server.sendResponse(
            device, requestId, BleGattServer.GATT_SUCCESS, offset, null);
      }
      return;
    }

    // Only process writes to the two command characteristics.
    if (charUuid != bleApduCommandCharacteristicUuid &&
        charUuid != bleApduWriteCommandCharacteristicUuid) {
      _log('⚠ Write to unknown characteristic uuid=$charUuid — ignored');
      if (responseNeeded && device != null) {
        await _server.sendResponse(
            device, requestId, BleGattServer.GATT_SUCCESS, offset, null);
      }
      return;
    }

    final tag = value[0];

    if (tag == _tagGetMtu) {
      // GET_MTU query — respond with the current negotiated MTU.
      // Format matching mono BleModule.java: [0x08, 0x00, 0x00, 0x00, 0x02, mtu_hi, mtu_lo]
      _log('GET_MTU received, MTU=$_mtu');
      final mtuResponse = Uint8List.fromList(
          [_tagGetMtu, 0x00, 0x00, 0x00, 0x02, (_mtu >> 8) & 0xFF, _mtu & 0xFF]);
      if (_connectedDevice != null && _responseChar != null) {
        try {
          await _server.notifyCharacteristic(
              _connectedDevice!, _responseChar!, mtuResponse);
        } catch (e) {
          _log('⚠ GET_MTU response error: $e');
        }
      }
    } else if (tag == _tagApdu) {
      _processIncomingApduFragment(value);
    }

    // Acknowledge the GATT write.
    if (responseNeeded && device != null) {
      await _server.sendResponse(
          device, requestId, BleGattServer.GATT_SUCCESS, offset, null);
    }
  }

  /// Handle GATT descriptor read requests.
  ///
  /// The BLE central reads the CCCD descriptor to check whether
  /// notifications are currently enabled. We respond with the
  /// current notification subscription state.
  Future<void> _onDescriptorReadRequest(
    BleDevice? device,
    int requestId,
    int offset,
    BleGattDescriptor? descriptor,
  ) async {
    if (device == null) return;
    final isSubscribed = _subscribedDevices.contains(device.address);
    final value = isSubscribed
        ? BleGattDescriptor.ENABLE_NOTIFICATION_VALUE
        : BleGattDescriptor.DISABLE_NOTIFICATION_VALUE;
    await _server.sendResponse(
        device, requestId, BleGattServer.GATT_SUCCESS, offset, value);
  }

  /// Handle GATT descriptor write requests.
  ///
  /// The BLE central writes to the CCCD descriptor to subscribe to or
  /// unsubscribe from APDU response notifications. We track the
  /// subscription state so read requests can report it correctly.
  Future<void> _onDescriptorWriteRequest(
    BleDevice? device,
    int requestId,
    BleGattDescriptor? descriptor,
    bool preparedWrite,
    bool responseNeeded,
    int offset,
    Uint8List? value,
  ) async {
    if (device == null || value == null) return;

    print('[DESC WRITE] addr=${device.address} valHex=${value.map((b) => b.toRadixString(16).padLeft(2, '0')).join(' ')}');

    // Track CCCD notification subscription state.
    if (listEquals(value, BleGattDescriptor.ENABLE_NOTIFICATION_VALUE)) {
      _subscribedDevices.add(device.address);
      _log('Client subscribed to notifications: ${device.address}');
    } else if (listEquals(value, BleGattDescriptor.DISABLE_NOTIFICATION_VALUE)) {
      _subscribedDevices.remove(device.address);
      _log('Client unsubscribed from notifications: ${device.address}');
    }

    if (responseNeeded) {
      await _server.sendResponse(
          device, requestId, BleGattServer.GATT_SUCCESS, offset, null);
    }
  }

  /// Handle MTU change notifications.
  void _onMtuChanged(BleDevice? device, int mtu) {
    _mtu = mtu;
    _log('MTU changed: $mtu — ${device?.address ?? "unknown"}');
  }

  // ── APDU fragmentation (incoming) ────────────────────────────────────

  /// Process a single incoming APDU fragment.
  ///
  /// Implements the Ledger BLE APDU reassembly protocol:
  /// - First chunk: `[0x05, seq_hi, seq_lo, total_len_hi, total_len_lo, payload...]`
  /// - Subsequent:  `[0x05, seq_hi, seq_lo, payload...]`
  ///
  /// When all bytes are received, the complete APDU is emitted on [apduStream].
  void _processIncomingApduFragment(Uint8List chunk) {
    if (chunk.length < 3) {
      _log('⚠ APDU fragment too short: ${chunk.length} bytes');
      return;
    }

    // Read sequence index (16-bit big-endian).
    final seqIndex = (chunk[1] << 8) | chunk[2];

    int headerSize;
    int totalLen;

    if (seqIndex == 0 && chunk.length >= 5) {
      // First chunk carries the total APDU length.
      totalLen = (chunk[3] << 8) | chunk[4];
      headerSize = 5;
      _incomingTotalLen = totalLen;
      _incomingChunks.clear();
      _log('APDU incoming: total_len=$totalLen, seq=$seqIndex, '
          'payload=${chunk.length - headerSize} bytes');
    } else {
      totalLen = _incomingTotalLen;
      headerSize = 3;
      _log('APDU incoming: seq=$seqIndex, '
          'payload=${chunk.length - headerSize} bytes');
    }

    if (totalLen <= 0) {
      _log('⚠ APDU fragment: invalid total_len=$totalLen');
      return;
    }

    // Extract payload bytes (skip the header).
    final payload = Uint8List.sublistView(chunk, headerSize);
    _incomingChunks[seqIndex] = payload;

    // Check if all expected bytes have arrived.
    int accumulatedLen = 0;
    for (final entry in _incomingChunks.entries) {
      accumulatedLen += entry.value.length;
    }

    if (accumulatedLen >= totalLen) {
      _emitCompleteApdu(totalLen);
    }
  }

  /// Reassemble accumulated chunks and emit the complete APDU.
  void _emitCompleteApdu(int totalLen) {
    final sortedKeys = _incomingChunks.keys.toList()..sort();
    final buffer = Uint8List(totalLen);
    int offset = 0;

    for (final key in sortedKeys) {
      final chunk = _incomingChunks[key]!;
      final copyLen =
          (offset + chunk.length <= totalLen) ? chunk.length : totalLen - offset;
      buffer.setRange(offset, offset + copyLen, chunk);
      offset += copyLen;
      if (offset >= totalLen) break;
    }

    _incomingChunks.clear();
    _incomingTotalLen = 0;

    _log('APDU command received: ${_bytesToHex(buffer)}');

    if (!_apduController.isClosed) {
      _apduController.add(buffer);
    }
  }

  // ── APDU fragmentation (outgoing) ────────────────────────────────────

  /// Fragment an APDU response into Ledger BLE protocol chunks.
  ///
  /// Matches mono's Android native BleModule.java `sendApduResponseBytes()`:
  /// NO channel prefix bytes — the frame starts directly with the tag.
  /// - First fragment header = 5 bytes (tag + seq + total_len)
  /// - Subsequent header      = 3 bytes (tag + seq)
  List<Uint8List> _fragmentOutgoingApdu(Uint8List apdu) {
    final mtu = _mtu > 0 ? _mtu : 20;
    final totalLen = apdu.length;
    final fragments = <Uint8List>[];

    int offset = 0;
    int seqIndex = 0;

    while (offset < totalLen) {
      final isFirst = seqIndex == 0;
      final headerSize = isFirst ? 5 : 3;
      final maxPayload = mtu - headerSize;
      final remaining = totalLen - offset;
      final payloadSize = remaining < maxPayload ? remaining : maxPayload;

      final fragment = Uint8List(headerSize + payloadSize);
      fragment[0] = _tagApdu;
      fragment[1] = (seqIndex >> 8) & 0xFF;
      fragment[2] = seqIndex & 0xFF;

      if (isFirst) {
        fragment[3] = (totalLen >> 8) & 0xFF;
        fragment[4] = totalLen & 0xFF;
      }

      fragment.setRange(headerSize, headerSize + payloadSize, apdu, offset);

      fragments.add(fragment);
      offset += payloadSize;
      seqIndex++;
    }

    return fragments;
  }

  // ── Private helpers ──────────────────────────────────────────────────

  /// Ensure the instance has not been disposed.
  void _ensureNotDisposed() {
    if (_disposed || _logController.isClosed) {
      throw StateError('BlePeripheral has been disposed.');
    }
  }

  /// Transition to a new state and log it.
  void _transition(BleState newState) {
    if (_state == newState) return;
    _state = newState;
    _log('BLE state → ${newState.name}');
  }

  /// Emit a log message on [logStream].
  void _log(String message) {
    if (!_logController.isClosed) {
      _logController.add(message);
    }
  }

  /// Convert bytes to a space-delimited uppercase hex string for logging.
  static String _bytesToHex(Uint8List bytes) {
    return bytes
        .map((b) => b.toRadixString(16).padLeft(2, '0').toUpperCase())
        .join(' ');
  }

  /// Translate a BLE GATT status code into a human-readable description.
  static String _bleStatusDescription(int status) {
    switch (status) {
      case 0x00: return 'GATT_SUCCESS';
      case 0x05: return 'GATT_INSUFFICIENT_ENCRYPTION';
      case 0x08: return 'GATT_INSUFFICIENT_AUTHENTICATION';
      case 0x13: return 'GATT_CONN_TERMINATE_PEER_USER';
      case 0x16: return 'GATT_CONN_TERMINATE_LOCAL_HOST';
      case 0x22: return 'GATT_CONN_LMP_TIMEOUT';
      case 0x3E: return 'GATT_CONN_FAIL_ESTABLISH';
      case 0x85: return 'GATT_CONN_TIMEOUT';
      default: return 'UNKNOWN($status)';
    }
  }
}
