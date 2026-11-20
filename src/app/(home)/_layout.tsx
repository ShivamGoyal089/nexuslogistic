
import { useAuth } from '@clerk/expo'
import { Redirect, Stack } from 'expo-router'

export default function HomeLayout() {
  const { isSignedIn, isLoaded } = useAuth()

  if (!isLoaded) {
    return null
  }

  // Not authenticated? Go to sign-in.
  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />
  }

  // Authenticated? Allow access.
  return <Stack />
}
