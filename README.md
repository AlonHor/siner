# Siner 🎵

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform](https://img.shields.io/badge/platform-Android-lightgrey.svg)](https://github.com/AlonHor/siner)

> Multiplayer gaming without internet, powered by ultrasonic data transmission

Siner enables you to play simple multiplayer games with nearby friends and strangers in environments without internet connectivity - on planes, in shelters, remote locations, or anywhere else. Using high-frequency sound waves inaudible to humans, Siner turns your phone into a wireless gaming device that works completely offline.

## 🌟 Features

- **🎮 Offline Multiplayer Gaming** - Play tic-tac-toe and other simple games without WiFi or cellular data
- **🔊 Ultrasonic Communication** - Data transmission via high-frequency sound waves (18-22 kHz)
- **📡 Multi-Channel Support** - Multiple simultaneous games in the same area without interference
- **🌐 Cloud Sync** - Automatically syncs game history and profiles when internet is available
- **👥 Nearby Discovery** - Find and connect with other players in proximity
- **🔒 Doppler Compensation** - Maintains connection stability even with device movement

## 🎯 Use Cases

- ✈️ **In-flight entertainment** - Play games with fellow passengers
- 🏕️ **Remote locations** - Gaming in areas without cellular coverage
- 🏢 **Emergency shelters** - Entertainment during power outages
- 🎓 **Classrooms** - Educational games without network infrastructure
- 🚇 **Underground transit** - Pass time during commutes

## 🔬 How It Works

Siner uses **frequency modulation (FM)** to encode game data into ultrasonic sound waves that are inaudible to humans but can be captured by standard smartphone microphones and emitted through speakers.

### Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Siner App                            │
├─────────────────────────────────────────────────────────────┤
│  Game Layer                                                 │
│  ├─ Tic-Tac-Toe                                             │
│  ├─ Connect Four                                            │
│  └─ [Future Games]                                          │
├─────────────────────────────────────────────────────────────┤
│  Network Layer                                              │
│  ├─ Session Management                                      │
│  ├─ Player Discovery                                        │
│  └─ Game State Synchronization                              │
├─────────────────────────────────────────────────────────────┤
│  Acoustic Modem Layer                                       │
│  ├─ Frequency Modulation Encoder/Decoder                    │
│  ├─ Channel Allocation (18-22 kHz range)                    │
│  ├─ Carrier Wave Generator (Doppler Compensation)           │
│  └─ Error Correction (Hamming 15-11)                        │
├─────────────────────────────────────────────────────────────┤
│  Audio I/O Layer                                            │
│  ├─ Microphone Input (44.1 kHz sampling)                    │
│  └─ Speaker Output (Ultrasonic range)                       │
├─────────────────────────────────────────────────────────────┤
│  Cloud Sync Layer (when online)                             │
│  └─ Profile & Game History Synchronization                  │
└─────────────────────────────────────────────────────────────┘
```

### Frequency Modulation Diagram

Siner encodes binary data by modulating the frequency of ultrasonic carrier waves:

```
Frequency (kHz)
    22 │     ┌─┐   ┌─┐       ┌─┐
       │     │ │   │ │       │ │     Binary: 1 0 1 1 0
    20 │   ┌─┘ └─┐ │ └─┐   ┌─┘ └─┐
       │   │     │ │   │   │     │
    18 │───┘     └─┘   └───┘     └───
       └─────────────────────────────> Time

       Carrier Frequency: 20 kHz (reference)
       Bit '1': 21-22 kHz
       Bit '0': 18-19 kHz
```

### Multi-Channel System

To prevent interference when multiple games occur simultaneously, Siner divides the ultrasonic spectrum into discrete channels:

```
Frequency Range: 18-22 kHz (4 kHz bandwidth)

Channel Layout:
┌──────────────────────────────────────────────────────┐
│ Ch 1: 18.0-18.8 kHz  │ Game Session A              │
│ Ch 2: 18.9-19.7 kHz  │ Game Session B              │
│ Ch 3: 19.8-20.6 kHz  │ Game Session C              │
│ Ch 4: 20.7-21.5 kHz  │ Game Session D              │
│ Ch 5: 21.6-22.0 kHz  │ Discovery/Handshake         │
└──────────────────────────────────────────────────────┘

Each channel provides ~800 Hz bandwidth
Data rate: 5 bits/second per channel
```

### Doppler Effect Compensation

To maintain stable communication even when devices are moving (e.g., someone walking), Siner transmits a constant carrier wave as a frequency reference:

```
Transmitted Signal:
┌────────────────────────────────────┐
│ Carrier Wave (Reference): 20.0 kHz │ ← Constant tone
│ Data Signal: 18-22 kHz (FM)        │ ← Modulated data
└────────────────────────────────────┘

Receiver Process:
1. Detect carrier wave frequency (actual received: 20.03 kHz)
2. Calculate doppler shift: +0.03 kHz
3. Adjust all received frequencies by that factor, relative to the other received frequency
4. Decode data using corrected frequencies
```

## 🚀 Getting Started

### Prerequisites

- Android
- Device with microphone and speaker
- Microphone permissions

### Installation

```bash
git clone https://github.com/AlonHor/siner.git
cd siner/android
./gradlew assembleDebug
```

### Quick Start

1. **Launch the app** on two or more devices
2. **Grant microphone permissions** when prompted
3. **Start a game** or browse for nearby games
4. **Play!** Game moves are transmitted via sound

## 📊 Performance Characteristics

| Metric                 | Value               |
| ---------------------- | ------------------- |
| Frequency Range        | 18-22 kHz           |
| Data Rate              | 5 bps per channel   |
| Effective Range        | 0-8 meters          |
| Max Simultaneous Games | 4-5 (in the future) |
| Battery Impact         | ~5-8% per hour      |

## 🔒 Privacy & Security

- **No internet required** - All gameplay data stays local
- **No data collection** - Game data is not stored
- **Cloud sync** - Profile data is synced when online
- **Proximity-based** - Only devices within acoustic range can communicate

### Development Setup

```bash
# Clone the repository
git clone https://github.com/AlonHor/siner.git

# Install dependencies
cd siner
npm i

# Run on android (connect to adb first!)
npm run android
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📮 Contact

- **Issues**: [GitHub Issues](https://github.com/AlonHor/siner/issues)
- **Discussions**: [GitHub Discussions](https://github.com/AlonHor/siner/discussions)

---

**Note**: This project is under active development. Star ⭐ the repo to follow updates!

Made with 🔊 by AlonHor
