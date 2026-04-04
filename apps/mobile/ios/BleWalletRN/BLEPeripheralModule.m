#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(BLEPeripheralModule, RCTEventEmitter)

RCT_EXTERN_METHOD(startBLEPeripheral)
RCT_EXTERN_METHOD(stopBLEPeripheral)
RCT_EXTERN_METHOD(sendResponse:(NSString *)hexResponse)

@end
