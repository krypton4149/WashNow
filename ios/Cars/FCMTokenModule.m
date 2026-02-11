#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(FCMTokenModule, RCTEventEmitter)

RCT_EXTERN_METHOD(sendTokenToJS:(NSString *)token)

@end
