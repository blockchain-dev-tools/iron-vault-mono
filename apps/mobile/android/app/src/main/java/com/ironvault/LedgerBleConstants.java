package com.ironvault;

import java.util.UUID;

public class LedgerBleConstants {
    public static final UUID SERVICE_UUID   = UUID.fromString("13d63400-2c97-0004-0000-4c6564676572");
    public static final UUID NOTIFY_UUID    = UUID.fromString("13d63400-2c97-0004-0001-4c6564676572");
    public static final UUID WRITE_UUID     = UUID.fromString("13d63400-2c97-0004-0002-4c6564676572");
    public static final UUID WRITE_CMD_UUID = UUID.fromString("13d63400-2c97-0004-0003-4c6564676572");
    public static final UUID CCCD_UUID      = UUID.fromString("00002902-0000-1000-8000-00805f9b34fb");

    public static final byte TAG_MTU  = 0x08;
    public static final byte TAG_APDU = 0x05;
    public static final int  MTU_SIZE = 20;
    public static final String DEVICE_NAME = "IRON Vault";
}
