package com.anonymous.siner

import android.media.*
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import kotlin.concurrent.thread
import org.jtransforms.fft.DoubleFFT_1D

class UltrasonicModule(
  private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

  companion object {
    const val FFT_SIZE = 2048
    const val MIN_FREQ = 15000.0
    const val MAX_FREQ = 22000.0
  }

  private val fft = DoubleFFT_1D(FFT_SIZE.toLong())
  private val fftBuffer = DoubleArray(FFT_SIZE * 2)
  private val window = DoubleArray(FFT_SIZE) {
    0.5 * (1 - Math.cos(2.0 * Math.PI * it / (FFT_SIZE - 1)))
  }

  private var audioRecord: AudioRecord? = null
  private var recordingThread: Thread? = null
  private var running = false

  private var sampleRate: Int = 48000
  private var carrierFreq: Double = 18800.0

  override fun getName() = "Ultrasonic"

  @ReactMethod
  fun start(sampleRate: Int, carrierFreq: Double) {
    if (running) return

    this.sampleRate = sampleRate
    this.carrierFreq = carrierFreq

    val minBuf = AudioRecord.getMinBufferSize(
      sampleRate,
      AudioFormat.CHANNEL_IN_MONO,
      AudioFormat.ENCODING_PCM_16BIT
    )

    audioRecord = AudioRecord(
      MediaRecorder.AudioSource.UNPROCESSED,
      sampleRate,
      AudioFormat.CHANNEL_IN_MONO,
      AudioFormat.ENCODING_PCM_16BIT,
      minBuf * 2
    )

    audioRecord!!.startRecording()
    running = true

    recordingThread = thread {
      val buffer = ShortArray(minBuf)

      while (running) {
        val read = audioRecord!!.read(buffer, 0, buffer.size)
        if (read >= FFT_SIZE) {
          process(buffer)
        }
      }
    }
  }

  @ReactMethod
  fun stop() {
    running = false
    recordingThread?.join()
    audioRecord?.stop()
    audioRecord?.release()
    audioRecord = null
  }

  private fun process(data: ShortArray) {
    for (i in 0 until FFT_SIZE) {
      fftBuffer[2*i] = (data[i] / 32768.0) * window[i]
      fftBuffer[2*i + 1] = 0.0
    }

    fft.complexForward(fftBuffer)

    var b1 = -1
    var b2 = -1
    var m1 = 0.0
    var m2 = 0.0

    for (i in 1 until FFT_SIZE / 2) {
      val freq = i * sampleRate.toDouble() / FFT_SIZE
      if (freq < MIN_FREQ || freq > MAX_FREQ) continue

      val re = fftBuffer[2*i]
      val im = fftBuffer[2*i + 1]
      val mag = re*re + im*im

      if (mag > m1) {
        if (b1 != -1 &&
          Math.abs(freq - binToFreq(b1)) > 200) {
          b2 = b1
          m2 = m1
        }
        b1 = i
        m1 = mag
      } else if (
        mag > m2 &&
        Math.abs(freq - binToFreq(b1)) > 200
      ) {
        b2 = i
        m2 = mag
      }
    }

    if (b1 > 0 && b2 > 0) {
      val f1 = binToFreq(b1)
      val f2 = binToFreq(b2)
      val lf = minOf(f1, f2)
      val nf = maxOf(f1, f2)
      val corrected = nf / (lf / carrierFreq)
      emit(corrected)
    }
  }

  private fun binToFreq(b: Int) =
    b * sampleRate.toDouble() / FFT_SIZE

  private fun emit(f: Double) {
    reactContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit("ultrasonicFrequency", f)
  }
}
