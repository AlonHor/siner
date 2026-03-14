import { sendSocket } from "@/utils/socket";
import { setStorage } from "@/utils/storage";
import React, { useEffect, useState } from "react";
import {
  Keyboard,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedKeyboard,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

export default function Login({
  setLoggedInState,
}: {
  setLoggedInState: React.Dispatch<
    React.SetStateAction<"load" | "yes" | "no" | "guest">
  >;
}) {
  const [isLogin, setIsLogin] = useState(true);
  // pendingIsLogin holds the value that should show AFTER the fade-out completes
  const [displayIsLogin, setDisplayIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { height: screenHeight } = useWindowDimensions();

  // Mount
  const mountY = useSharedValue(40);
  const mountOpacity = useSharedValue(0);

  // Logo
  const logoScale = useSharedValue(1);
  const logoGlow = useSharedValue(0);

  // Toggle - single value drives the whole card fade+slide
  const toggleOpacity = useSharedValue(1);
  const toggleY = useSharedValue(0);

  // Button
  const buttonScale = useSharedValue(1);

  // Error shake
  const shakeX = useSharedValue(0);

  // Input focus
  const emailFocus = useSharedValue(0);
  const passwordFocus = useSharedValue(0);

  // Success animation
  const successProgress = useSharedValue(0);

  // Keyboard lift - animates the whole container up when keyboard appears
  const keyboard = useAnimatedKeyboard();

  useEffect(() => {
    mountOpacity.value = withTiming(1, {
      duration: 650,
      easing: Easing.out(Easing.cubic),
    });
    mountY.value = withSpring(0, { damping: 18, stiffness: 120 });

    logoScale.value = withDelay(
      300,
      withSpring(1.12, { damping: 5 }, () => {
        logoScale.value = withSpring(1, { damping: 10 });
      }),
    );

    logoGlow.value = withDelay(
      800,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const triggerSuccess = (onDone: () => void) => {
    // Dismiss keyboard before the animation plays
    Keyboard.dismiss();

    // Stop the glow pulse and fade form out simultaneously
    logoGlow.value = withTiming(0, { duration: 200 });
    toggleOpacity.value = withTiming(0, {
      duration: 250,
      easing: Easing.in(Easing.quad),
    });
    toggleY.value = withTiming(8, {
      duration: 250,
      easing: Easing.in(Easing.quad),
    });

    // Animate successProgress: drives logo color + scale
    successProgress.value = withDelay(
      150,
      withTiming(1, { duration: 350, easing: Easing.out(Easing.cubic) }, () => {
        // Big bounce pop
        logoScale.value = withSpring(
          1.35,
          { damping: 4, stiffness: 200 },
          () => {
            logoScale.value = withSpring(1, { damping: 10 }, () => {
              // Hold briefly then fade the whole screen out
              mountOpacity.value = withDelay(
                320,
                withTiming(
                  0,
                  { duration: 350, easing: Easing.in(Easing.cubic) },
                  () => {
                    "worklet";
                    // Can't call setState from worklet - use a short timeout on JS side
                  },
                ),
              );
            });
          },
        );
      }),
    );

    // Call onDone after the full sequence (~320 delay + 350 fade = ~1000ms total)
    setTimeout(onDone, 1050);
  };

  const triggerShake = () => {
    shakeX.value = withSequence(
      withTiming(-10, { duration: 55 }),
      withTiming(10, { duration: 55 }),
      withTiming(-8, { duration: 55 }),
      withTiming(8, { duration: 55 }),
      withTiming(-4, { duration: 55 }),
      withTiming(0, { duration: 55 }),
    );
  };

  const handleToggleMode = () => {
    setError("");
    const FADE_OUT = 160;
    const FADE_IN = 220;

    // Fade + slide out
    toggleOpacity.value = withTiming(0, {
      duration: FADE_OUT,
      easing: Easing.in(Easing.quad),
    });
    toggleY.value = withTiming(-12, {
      duration: FADE_OUT,
      easing: Easing.in(Easing.quad),
    });

    // Swap content exactly at the midpoint (fully invisible)
    setTimeout(() => {
      setIsLogin((p) => !p);
      setDisplayIsLogin((p) => !p);
      // Reset Y to below, then spring back up
      toggleY.value = 12;
      toggleOpacity.value = withTiming(1, {
        duration: FADE_IN,
        easing: Easing.out(Easing.quad),
      });
      toggleY.value = withTiming(0, {
        duration: FADE_IN,
        easing: Easing.out(Easing.quad),
      });
    }, FADE_OUT);
  };

  const handleSubmit = async () => {
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      triggerShake();
      return;
    }
    buttonScale.value = withSequence(
      withTiming(0.95, { duration: 80 }),
      withSpring(1, { damping: 8 }),
    );
    setLoading(true);
    try {
      const res = await sendSocket(isLogin ? "login" : "register", "POST", {
        email: email.trim(),
        password,
      });
      if (res && !res.ok) {
        const body = await res.text().catch(() => null);
        setError(body?.trim() || "Something went wrong. Please try again.");
        triggerShake();
      } else if (res && res.ok) {
        const jwt = await res.text().catch(() => null);
        if (jwt != null) {
          setStorage("token", jwt);
          triggerSuccess(() => setLoggedInState("yes"));
        }
      }
    } catch {
      setError("Connection failed. Please try again.");
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  // Animated styles
  const mountStyle = useAnimatedStyle(() => ({
    opacity: mountOpacity.value,
    transform: [{ translateY: mountY.value }],
  }));

  const keyboardLiftStyle = useAnimatedStyle(() => {
    // Lift the container by half the keyboard height so inputs stay visible
    const lift = interpolate(
      keyboard.height.value,
      [0, screenHeight * 0.4],
      [0, -(screenHeight * 0.18)],
      "clamp",
    );
    return { transform: [{ translateY: lift }] };
  });

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    shadowOpacity: interpolate(logoGlow.value, [0, 1], [0.3, 0.75]),
    shadowRadius: interpolate(logoGlow.value, [0, 1], [8, 22]),
    backgroundColor:
      successProgress.value === 0
        ? "#6366f1"
        : `rgb(${Math.round(interpolate(successProgress.value, [0, 1], [99, 34]))}, ${Math.round(interpolate(successProgress.value, [0, 1], [102, 197]))}, ${Math.round(interpolate(successProgress.value, [0, 1], [241, 94]))})`,
    shadowColor: successProgress.value === 0 ? "#6366f1" : "#22c55e",
  }));

  const checkStyle = useAnimatedStyle(() => ({
    opacity: successProgress.value,
    transform: [
      { scale: interpolate(successProgress.value, [0, 1], [0.5, 1]) },
    ],
  }));

  const logoSquareStyle = useAnimatedStyle(() => ({
    opacity: interpolate(successProgress.value, [0, 0.5], [1, 0]),
  }));

  const toggleStyle = useAnimatedStyle(() => ({
    opacity: toggleOpacity.value,
    transform: [{ translateY: toggleY.value }],
  }));

  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const emailBorderStyle = useAnimatedStyle(() => ({
    borderColor: `rgba(99,102,241,${interpolate(emailFocus.value, [0, 1], [0.15, 0.8])})`,
    shadowOpacity: interpolate(emailFocus.value, [0, 1], [0, 0.22]),
    shadowRadius: interpolate(emailFocus.value, [0, 1], [0, 10]),
  }));

  const passwordBorderStyle = useAnimatedStyle(() => ({
    borderColor: `rgba(99,102,241,${interpolate(passwordFocus.value, [0, 1], [0.15, 0.8])})`,
    shadowOpacity: interpolate(passwordFocus.value, [0, 1], [0, 0.22]),
    shadowRadius: interpolate(passwordFocus.value, [0, 1], [0, 10]),
  }));

  return (
    <View className="flex-1 bg-[#08080f] justify-center px-7">
      {/* Mount fade-in */}
      <Animated.View style={mountStyle}>
        {/* Keyboard lift wrapper */}
        <Animated.View style={keyboardLiftStyle}>
          {/* Logo - outside toggle so it doesn't flicker */}
          <View className="items-center mb-6">
            <Animated.View
              style={[
                logoStyle,
                {
                  shadowOffset: { width: 0, height: 0 },
                  elevation: 12,
                },
              ]}
              className="w-14 h-14 rounded-2xl items-center justify-center"
            >
              <Animated.View
                style={logoSquareStyle}
                className="w-5 h-5 rounded-md bg-white/90 absolute"
              />
              <Animated.Text
                style={checkStyle}
                className="text-white text-2xl font-bold"
              >
                ✓
              </Animated.Text>
            </Animated.View>
          </View>

          {/* Animated content that fades on toggle */}
          <Animated.View style={toggleStyle}>
            {/* Header text */}
            <View className="items-center mb-10">
              <Text className="text-white text-[28px] font-bold tracking-tight mb-1.5">
                {displayIsLogin ? "Welcome back" : "Get started"}
              </Text>
              <Text className="text-zinc-500 text-sm">
                {displayIsLogin ? "Sign in to continue" : "Create your account"}
              </Text>
            </View>

            {/* Fields */}
            <View className="gap-4 mb-6">
              {/* Email */}
              <View className="gap-1.5">
                <Text className="text-zinc-400 text-[11px] font-semibold uppercase tracking-[0.12em]">
                  Email
                </Text>
                <Animated.View
                  style={[
                    emailBorderStyle,
                    {
                      shadowColor: "#6366f1",
                      shadowOffset: { width: 0, height: 0 },
                    },
                  ]}
                  className="bg-zinc-900/80 border rounded-xl overflow-hidden"
                >
                  <TextInput
                    className="px-4 py-3.5 text-white text-base"
                    placeholder="you@example.com"
                    placeholderTextColor="#3f3f46"
                    value={email}
                    onChangeText={(t) => {
                      setEmail(t);
                      setError("");
                    }}
                    onFocus={() => {
                      emailFocus.value = withTiming(1, { duration: 200 });
                    }}
                    onBlur={() => {
                      emailFocus.value = withTiming(0, { duration: 200 });
                    }}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                  />
                </Animated.View>
              </View>

              {/* Password */}
              <View className="gap-1.5">
                <Text className="text-zinc-400 text-[11px] font-semibold uppercase tracking-[0.12em]">
                  Password
                </Text>
                <Animated.View
                  style={[
                    passwordBorderStyle,
                    {
                      shadowColor: "#6366f1",
                      shadowOffset: { width: 0, height: 0 },
                    },
                  ]}
                  className="bg-zinc-900/80 border rounded-xl overflow-hidden"
                >
                  <TextInput
                    className="px-4 py-3.5 text-white text-base"
                    placeholder="••••••••"
                    placeholderTextColor="#3f3f46"
                    value={password}
                    onChangeText={(t) => {
                      setPassword(t);
                      setError("");
                    }}
                    onFocus={() => {
                      passwordFocus.value = withTiming(1, { duration: 200 });
                    }}
                    onBlur={() => {
                      passwordFocus.value = withTiming(0, { duration: 200 });
                    }}
                    secureTextEntry
                    autoComplete={isLogin ? "current-password" : "new-password"}
                  />
                </Animated.View>
              </View>

              {/* Error */}
              {!!error && (
                <Animated.View
                  style={shakeStyle}
                  className="bg-red-950/80 border border-red-800/50 rounded-xl px-4 py-3"
                >
                  <Text className="text-red-400 text-sm">{error}</Text>
                </Animated.View>
              )}

              {/* Submit */}
              <Animated.View style={buttonAnimStyle}>
                <Pressable
                  onPress={handleSubmit}
                  disabled={loading}
                  className={`rounded-xl py-[15px] items-center ${loading ? "bg-indigo-800/70" : "bg-indigo-500"}`}
                  style={{
                    shadowColor: "#6366f1",
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: loading ? 0.1 : 0.5,
                    shadowRadius: 16,
                    elevation: loading ? 0 : 10,
                  }}
                >
                  <Text className="text-white text-[15px] font-bold tracking-wide">
                    {loading
                      ? "Please wait…"
                      : displayIsLogin
                        ? "Sign In"
                        : "Create Account"}
                  </Text>
                </Pressable>
              </Animated.View>

              {/* Guest */}
              <TouchableOpacity
                onPress={() => triggerSuccess(() => setLoggedInState("guest"))}
                activeOpacity={0.7}
                className="rounded-xl py-[13px] items-center bg-zinc-900 border border-zinc-700/60"
              >
                <Text className="text-zinc-400 text-[15px] font-semibold">
                  Continue as guest
                </Text>
              </TouchableOpacity>
            </View>

            {/* Toggle */}
            <View className="flex-row justify-center items-center">
              <Text className="text-zinc-500 text-sm">
                {displayIsLogin ? "No account yet?" : "Already have one?"}
              </Text>
              <TouchableOpacity onPress={handleToggleMode} activeOpacity={0.7}>
                <Text className="text-indigo-400 text-sm font-semibold ml-1">
                  {displayIsLogin ? "Sign up" : "Sign in"}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}
