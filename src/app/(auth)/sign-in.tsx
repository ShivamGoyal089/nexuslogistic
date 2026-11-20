
import { useSignIn } from '@clerk/expo'
import type { Href } from 'expo-router'
import { Link, useRouter } from 'expo-router'
import { useState } from 'react'

import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'

export default function SignInScreen() {
  const { signIn, fetchStatus } = useSignIn()
  const router = useRouter()

  const [emailAddress, setEmailAddress] = useState('')
  const [password, setPassword] = useState('')

  const handleSignIn = async () => {
    if (!emailAddress || !password) {
      Alert.alert('Error', 'Please enter email and password')
      return
    }

    try {
      const { error } = await signIn.password({
        emailAddress,
        password,
      })

      if (error) {
        Alert.alert('Sign in failed', error.message)
        return
      }

      if (signIn.status === 'complete') {
        await signIn.finalize({
          navigate: ({ session, decorateUrl }) => {
            if (session?.currentTask) return
            router.replace(decorateUrl('/') as Href)
          },
        })
      } else {
        Alert.alert(
          'Additional verification required',
          'Your account requires another verification step.'
        )
      }
    } catch (err: any) {
      Alert.alert(
        'Error',
        err?.message || 'Something went wrong'
      )
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>NEXUS</Text>
      <Text style={styles.subtitle}>LOGISTICS</Text>

      <Text style={styles.heading}>Welcome Back</Text>
      <Text style={styles.description}>
        Sign in to your Nexus Logistics account
      </Text>

      <Text style={styles.label}>Email Address</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        placeholderTextColor="#888"
        keyboardType="email-address"
        autoCapitalize="none"
        value={emailAddress}
        onChangeText={setEmailAddress}
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your password"
        placeholderTextColor="#888"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Pressable
        style={styles.button}
        onPress={handleSignIn}
        disabled={fetchStatus === 'fetching'}
      >
        {fetchStatus === 'fetching' ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign In</Text>
        )}
      </Pressable>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Don't have an account?{' '}
        </Text>
        <Link href="/(auth)/sign-up" style={styles.link}>
          Sign Up
        </Link>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    padding: 25,
  },
  logo: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    color: '#38BDF8',
    textAlign: 'center',
    letterSpacing: 5,
    marginBottom: 45,
  },
  heading: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    color: '#94A3B8',
    marginBottom: 30,
  },
  label: {
    color: '#FFFFFF',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#1E293B',
    color: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  button: {
    backgroundColor: '#0284C7',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25,
  },
  footerText: {
    color: '#94A3B8',
  },
  link: {
    color: '#38BDF8',
    fontWeight: 'bold',
  },
})
