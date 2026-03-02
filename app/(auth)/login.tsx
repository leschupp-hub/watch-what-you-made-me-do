import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/auth';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';

function getFirebaseErrorMessage(code: string): string {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
      return 'No account found with these credentials.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (e: any) {
      const code = e?.code ?? '';
      setError(getFirebaseErrorMessage(code));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo / Title */}
          <View style={styles.logoArea}>
            <View style={styles.iconContainer}>
              <Text style={styles.iconEmoji}>🎬</Text>
            </View>
            <Text style={styles.appTitle}>Watch What You{'\n'}Made Me Do</Text>
            <Text style={styles.appSubtitle}>Your personal entertainment guide</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, emailFocused && styles.inputFocused]}
              placeholder="you@example.com"
              placeholderTextColor={Colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
            />

            <Text style={[styles.label, { marginTop: Spacing.md }]}>Password</Text>
            <View style={styles.passwordWrapper}>
              <TextInput
                style={[styles.input, styles.passwordInput, passwordFocused && styles.inputFocused]}
                placeholder="Your password"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword((v) => !v)}
              >
                <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠ {error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.background} />
              ) : (
                <Text style={styles.primaryButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
              <Text style={styles.footerLink}> Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  logoArea: {
    alignItems: 'center',
    marginTop: 64,
    marginBottom: 48,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.goldSubtle,
    borderWidth: 1,
    borderColor: Colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconEmoji: {
    fontSize: 36,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.gold,
    textAlign: 'center',
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  form: {
    gap: 0,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 15,
    fontSize: 16,
    color: Colors.text,
  },
  inputFocused: {
    borderColor: Colors.gold,
  },
  passwordWrapper: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 52,
  },
  eyeButton: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  eyeText: {
    fontSize: 18,
  },
  errorBox: {
    backgroundColor: Colors.errorSubtle,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  errorText: {
    color: Colors.error,
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: Colors.gold,
    borderRadius: BorderRadius.md,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xl,
  },
  footerText: {
    color: Colors.textSecondary,
    fontSize: 15,
  },
  footerLink: {
    color: Colors.gold,
    fontSize: 15,
    fontWeight: '600',
  },
});
