
import { useAuth, useSignUp } from '@clerk/expo'
import { useRouter } from 'expo-router'
import { useState } from 'react'

import {
  ActivityIndicator,
  Alert,
  Button,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'


export default function MainScreen() {
  const { isLoaded, isSignedIn } = useAuth()
  const { signUp, fetchStatus } = useSignUp()
  const router = useRouter()

  const [emailAddress, setEmailAddress] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)

  const handleSignUp = async () => {
    console.log('Sign up button clicked')

    if (!emailAddress || !password) {
      Alert.alert('Missing details', 'Enter your email and password.')
      return
    }

    try {
      const { error } = await signUp.password({
        emailAddress: emailAddress.trim(),
        password,
      })

      if (error) {
        console.log('SIGN UP ERROR:', error)
        Alert.alert('Sign up failed', error.message)
        return
      }

      // Handle accounts that don't require verification
      if (signUp.status === 'complete') {
        const { error: finalizeError } = await signUp.finalize()

        if (finalizeError) {
          Alert.alert('Error', finalizeError.message)
          return
        }

        router.replace('/')
        return
      }

      // Send verification code
      const { error: sendError } =
        await signUp.verifications.sendEmailCode()

      if (sendError) {
        console.log('EMAIL ERROR:', sendError)
        Alert.alert('Verification error', sendError.message)
        return
      }

      setIsVerifying(true)

      Alert.alert(
        'Verification code sent',
        'Check your email for the verification code.'
      )

    } catch (err: any) {
      console.log('SIGN UP EXCEPTION:', err)
      Alert.alert('Error', err?.message || 'Something went wrong')
    }
  }

  const handleVerify = async () => {
    if (!code.trim()) {
      Alert.alert('Missing code', 'Enter your verification code.')
      return
    }

    try {
      const { error } =
        await signUp.verifications.verifyEmailCode({
          code: code.trim(),
        })

      if (error) {
        Alert.alert('Verification failed', error.message)
        return
      }

      if (signUp.status === 'complete') {
        const { error: finalizeError } =
          await signUp.finalize()

        if (finalizeError) {
          Alert.alert('Error', finalizeError.message)
          return
        }

        router.replace('/')
      } else {
        Alert.alert(
          'Additional verification required',
          'Your registration is not complete yet.'
        )
      }

    } catch (err: any) {
      console.log('VERIFICATION ERROR:', err)
      Alert.alert('Error', err?.message || 'Verification failed')
    }
  }

  if (!isLoaded) {
    return null
  }

  if (isSignedIn) {
    return <View style={styles.container}>
      <Text>You're signed in!</Text>
    </View>
  }

  return (
  <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  >
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      {!isVerifying ? (
        <>
          <Text style={styles.heading}>Create Account</Text>

          <TextInput
            style={styles.input}
            autoCapitalize="none"
            value={emailAddress}
            placeholder="Enter email"
            onChangeText={setEmailAddress}
            keyboardType="email-address"
            returnKeyType="next"
          />

          <TextInput
            style={styles.input}
            value={password}
            placeholder="Enter password"
            secureTextEntry
            onChangeText={setPassword}
            returnKeyType="done"
          />

          <Button
            title={
              fetchStatus === 'fetching'
                ? 'Creating account...'
                : 'Sign Up'
            }
            onPress={handleSignUp}
            disabled={fetchStatus === 'fetching'}
          />
        </>
      ) : (
        <>
          <Text style={styles.heading}>Verify Email</Text>

          <Text style={styles.description}>
            Enter the verification code sent to {emailAddress}
          </Text>

          <TextInput
            style={styles.input}
            value={code}
            placeholder="Enter verification code"
            onChangeText={setCode}
            keyboardType="number-pad"
          />

          <Button
            title="Verify & Continue"
            onPress={handleVerify}
            disabled={fetchStatus === 'fetching'}
          />
        </>
      )}
    </ScrollView>
  </KeyboardAvoidingView>
)
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    gap: 12,
    justifyContent: 'center',
  },
  heading: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#64748B',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
})
