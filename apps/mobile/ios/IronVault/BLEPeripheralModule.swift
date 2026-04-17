import Foundation
import CoreBluetooth
import React

// MARK: - Ledger BLE GATT UUIDs
private let kServiceUUID      = CBUUID(string: "13D63400-2C97-0004-0000-4C6564676572")
private let kNotifyCharUUID   = CBUUID(string: "13D63400-2C97-0004-0001-4C6564676572")
private let kWriteCharUUID    = CBUUID(string: "13D63400-2C97-0004-0002-4C6564676572")
private let kWriteCmdCharUUID = CBUUID(string: "13D63400-2C97-0004-0003-4C6564676572")

private let kTagAPDU: UInt8 = 0x05
private let kTagPing: UInt8 = 0x08

// MARK: - BLEPeripheralModule

@objc(BLEPeripheralModule)
class BLEPeripheralModule: RCTEventEmitter, CBPeripheralManagerDelegate {

  private var manager: CBPeripheralManager?
  private var notifyChar: CBMutableCharacteristic?
  private var central: CBCentral?

  // Frame assembly state
  private var frameBuffer: [UInt8] = []
  private var expectedApduLen: Int = 0
  private var nextSeq: Int = 0

  // Notify queue for BLE flow control
  private var notifyQueue: [Data] = []
  private var mtu: Int = 20

  // UDP logger
  private let udpHost = "192.168.1.121"
  private let udpPort: UInt16 = 8765
  private var udpSocket: Int32 = -1

  // MARK: - RCTEventEmitter

  override func supportedEvents() -> [String]! {
    return ["onAPDU", "onBLEStatus", "onLog"]
  }

  @objc override static func requiresMainQueueSetup() -> Bool { return false }

  // MARK: - JS Methods

  @objc func startBLEPeripheral() {
    if manager == nil {
      manager = CBPeripheralManager(delegate: self, queue: DispatchQueue.global(qos: .userInitiated))
    } else if manager?.state == .poweredOn {
      setupGATT()
    }
    addLog("startBLEPeripheral called")
  }

  @objc func stopBLEPeripheral() {
    manager?.stopAdvertising()
    manager?.removeAllServices()
    central = nil
    notifyQueue.removeAll()
    frameBuffer.removeAll()
    addLog("BLE stopped")
    emitStatus("stopped")
  }

  @objc func sendResponse(_ hexResponse: String) {
    let frames = frameLedgerResponse(hexResponse)
    for frame in frames {
      enqueue(Data(frame))
    }
  }

  // MARK: - GATT Setup

  private func setupGATT() {
    manager?.removeAllServices()
    frameBuffer.removeAll()
    notifyQueue.removeAll()

    notifyChar = CBMutableCharacteristic(
      type: kNotifyCharUUID,
      properties: [.notify, .notifyEncryptionRequired],
      value: nil,
      permissions: []
    )
    let writeChar = CBMutableCharacteristic(
      type: kWriteCharUUID,
      properties: [.write],
      value: nil,
      permissions: [.writeable]
    )
    let writeCmdChar = CBMutableCharacteristic(
      type: kWriteCmdCharUUID,
      properties: [.writeWithoutResponse],
      value: nil,
      permissions: [.writeable]
    )

    let service = CBMutableService(type: kServiceUUID, primary: true)
    service.characteristics = [notifyChar!, writeChar, writeCmdChar]
    manager?.add(service)
    addLog("GATT service added")
  }

  private func startAdvertising() {
    manager?.startAdvertising([
      CBAdvertisementDataLocalNameKey: "IRON Vault",
      CBAdvertisementDataServiceUUIDsKey: [kServiceUUID],
    ])
    addLog("Advertising started as 'IRON Vault'")
    emitStatus("advertising")
  }

  // MARK: - CBPeripheralManagerDelegate

  func peripheralManagerDidUpdateState(_ peripheral: CBPeripheralManager) {
    addLog("BLE state: \(peripheral.state.rawValue)")
    switch peripheral.state {
    case .poweredOn:
      setupGATT()
    case .poweredOff:
      emitStatus("poweredOff")
    case .unauthorized:
      emitStatus("unauthorized")
    default:
      break
    }
  }

  func peripheralManager(_ peripheral: CBPeripheralManager, didAdd service: CBService, error: Error?) {
    if let err = error {
      addLog("Add service error: \(err.localizedDescription)")
      return
    }
    startAdvertising()
  }

  func peripheralManager(_ peripheral: CBPeripheralManager,
                          central: CBCentral,
                          didSubscribeTo characteristic: CBCharacteristic) {
    self.central = central
    mtu = min(central.maximumUpdateValueLength, 512)
    addLog("Central subscribed MTU=\(mtu)")
    emitStatus("connected")
  }

  func peripheralManager(_ peripheral: CBPeripheralManager,
                          central: CBCentral,
                          didUnsubscribeFrom characteristic: CBCharacteristic) {
    self.central = nil
    frameBuffer.removeAll()
    notifyQueue.removeAll()
    addLog("Central unsubscribed")
    emitStatus("disconnected")
  }

  func peripheralManager(_ peripheral: CBPeripheralManager,
                          didReceiveWrite requests: [CBATTRequest]) {
    for req in requests {
      peripheral.respond(to: req, withResult: .success)
      if let data = req.value, !data.isEmpty {
        processFrame([UInt8](data))
      }
    }
  }

  func peripheralManagerIsReady(toUpdateSubscribers peripheral: CBPeripheralManager) {
    flushQueue()
  }

  // MARK: - Frame Processing

  private func processFrame(_ frame: [UInt8]) {
    guard !frame.isEmpty else { return }
    let tag = frame[0]

    if tag == kTagPing {
      let pong = Data(frame.prefix(6))
      enqueue(pong)
      addLog("MTU ping -> pong")
      return
    }
    guard tag == kTagAPDU, frame.count >= 3 else { return }

    let seq = (Int(frame[1]) << 8) | Int(frame[2])

    if seq == 0 {
      guard frame.count >= 5 else { return }
      expectedApduLen = (Int(frame[3]) << 8) | Int(frame[4])
      frameBuffer = Array(frame.dropFirst(5))
      nextSeq = 1
      addLog("First frame totalLen=\(expectedApduLen) got=\(frameBuffer.count)")
    } else {
      guard seq == nextSeq else {
        addLog("Seq mismatch exp=\(nextSeq) got=\(seq) — reset")
        frameBuffer.removeAll()
        return
      }
      frameBuffer.append(contentsOf: frame.dropFirst(3))
      nextSeq += 1
      addLog("Cont frame seq=\(seq) total=\(frameBuffer.count)/\(expectedApduLen)")
    }

    if frameBuffer.count >= expectedApduLen {
      let apduBytes = Array(frameBuffer.prefix(expectedApduLen))
      frameBuffer.removeAll()
      let hexApdu = apduBytes.map { String(format: "%02x", $0) }.joined()
      addLog("APDU -> \(hexApdu.prefix(32))...")
      sendEvent(withName: "onAPDU", body: hexApdu)
    }
  }

  // MARK: - Response Framing

  private func frameLedgerResponse(_ hex: String) -> [[UInt8]] {
    let bytes: [UInt8] = stride(from: 0, to: hex.count, by: 2).compactMap {
      let start = hex.index(hex.startIndex, offsetBy: $0)
      let end = hex.index(start, offsetBy: 2, limitedBy: hex.endIndex) ?? hex.endIndex
      return UInt8(hex[start..<end], radix: 16)
    }

    var frames: [[UInt8]] = []
    let totalLen = bytes.count
    var seq = 0
    var offset = 0
    let firstPayloadSize = mtu - 5
    let contPayloadSize = mtu - 3

    // First frame
    let firstPay = Array(bytes[offset..<min(offset + firstPayloadSize, totalLen)])
    var first: [UInt8] = [
      kTagAPDU,
      UInt8((seq >> 8) & 0xff), UInt8(seq & 0xff),
      UInt8((totalLen >> 8) & 0xff), UInt8(totalLen & 0xff),
    ]
    first.append(contentsOf: firstPay)
    frames.append(first)
    offset += firstPay.count
    seq += 1

    while offset < totalLen {
      let pay = Array(bytes[offset..<min(offset + contPayloadSize, totalLen)])
      var frame: [UInt8] = [kTagAPDU, UInt8((seq >> 8) & 0xff), UInt8(seq & 0xff)]
      frame.append(contentsOf: pay)
      frames.append(frame)
      offset += pay.count
      seq += 1
    }

    return frames
  }

  // MARK: - Notify Queue

  private func enqueue(_ data: Data) {
    notifyQueue.append(data)
    flushQueue()
  }

  private func flushQueue() {
    guard let c = central, let ch = notifyChar else { return }
    while let next = notifyQueue.first {
      let sent = manager?.updateValue(next, for: ch, onSubscribedCentrals: [c]) ?? false
      if sent { notifyQueue.removeFirst() } else { break }
    }
  }

  // MARK: - Logging

  private func addLog(_ msg: String) {
    let ts = DateFormatter.localizedString(from: Date(), dateStyle: .none, timeStyle: .medium)
    let line = "[\(ts)] \(msg)"
    sendEvent(withName: "onLog", body: line)
    sendUDP(line)
  }

  private func emitStatus(_ s: String) {
    sendEvent(withName: "onBLEStatus", body: s)
  }

  private func sendUDP(_ msg: String) {
    guard let data = (msg + "\n").data(using: .utf8) else { return }
    if udpSocket < 0 {
      udpSocket = socket(AF_INET, SOCK_DGRAM, 0)
    }
    guard udpSocket >= 0 else { return }
    var addr = sockaddr_in()
    addr.sin_family = sa_family_t(AF_INET)
    addr.sin_port = udpPort.bigEndian
    addr.sin_addr.s_addr = inet_addr(udpHost)
    withUnsafePointer(to: &addr) { ptr in
      ptr.withMemoryRebound(to: sockaddr.self, capacity: 1) { saddrPtr in
        data.withUnsafeBytes { raw in
          _ = sendto(udpSocket, raw.baseAddress, data.count, 0, saddrPtr,
                     socklen_t(MemoryLayout<sockaddr_in>.size))
        }
      }
    }
  }
}
