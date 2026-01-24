package com.anonymous.siner

import com.facebook.react.*
import com.facebook.react.bridge.*
import com.facebook.react.uimanager.ViewManager

class UltrasonicPackage : ReactPackage {
  override fun createNativeModules(
    reactContext: ReactApplicationContext
  ) = listOf(UltrasonicModule(reactContext))

  override fun createViewManagers(
    reactContext: ReactApplicationContext
  ) = emptyList<ViewManager<*, *>>()
}
