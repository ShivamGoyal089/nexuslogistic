
import { useAuth, useClerk, useUser } from '@clerk/expo'
import { Redirect } from 'expo-router'

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'

export default function HomeScreen() {
  const { isLoaded, isSignedIn } = useAuth()
  const { user } = useUser()
  const { signOut } = useClerk()

  if (!isLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#0284C7" />
      </View>
    )
  }

  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />
  }



  const firstName = user?.firstName || 'User'
  const email = user?.primaryEmailAddress?.emailAddress || ''

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>NEXUS</Text>
          <Text style={styles.subtitle}>LOGISTICS</Text>
        </View>

        <View style={styles.profile}>
          <Text style={styles.profileText}>
            {firstName.charAt(0).toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Welcome */}
      <View style={styles.welcome}>
        <Text style={styles.welcomeText}>
          Welcome back, {firstName}!
        </Text>
        <Text style={styles.email}>{email}</Text>
        <Text style={styles.description}>
          Here's what's happening with your logistics today.
        </Text>
      </View>

      {/* Statistics */}
      <Text style={styles.sectionTitle}>
        Overview
      </Text>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>24</Text>
          <Text style={styles.statLabel}>Total Shipments</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>12</Text>
          <Text style={styles.statLabel}>In Transit</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>8</Text>
          <Text style={styles.statLabel}>Delivered</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>4</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      {/* Recent Activity */}
      <Text style={styles.sectionTitle}>
        Recent Activity
      </Text>

      <View style={styles.activityCard}>
        <Text style={styles.activityTitle}>
          Shipment #NX1024
        </Text>
        <Text style={styles.activityDescription}>
          Your shipment is currently in transit.
        </Text>
        <Text style={styles.status}>IN TRANSIT</Text>
      </View>

      <View style={styles.activityCard}>
        <Text style={styles.activityTitle}>
          Shipment #NX1023
        </Text>
        <Text style={styles.activityDescription}>
          Shipment successfully delivered.
        </Text>
        <Text style={styles.delivered}>DELIVERED</Text>
      </View>

      {/* Sign Out */}
      <Pressable
        style={styles.signOutButton}
        onPress={() => signOut()}
      >
        <Text style={styles.signOutText}>
          Sign Out
        </Text>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: 20,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 45,
  },
  logo: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#38BDF8',
    letterSpacing: 4,
    fontSize: 10,
  },
  profile: {
    backgroundColor: '#0284C7',
    height: 45,
    width: 45,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  welcome: {
    marginTop: 40,
    marginBottom: 30,
  },
  welcomeText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: 'bold',
  },
  email: {
    color: '#38BDF8',
    marginTop: 8,
  },
  description: {
    color: '#94A3B8',
    marginTop: 12,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    marginTop: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#1E293B',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
  statNumber: {
    color: '#38BDF8',
    fontSize: 28,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#CBD5E1',
    marginTop: 8,
  },
  activityCard: {
    backgroundColor: '#1E293B',
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
  },
  activityTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  activityDescription: {
    color: '#94A3B8',
    marginTop: 8,
  },
  status: {
    color: '#FBBF24',
    marginTop: 12,
    fontWeight: 'bold',
  },
  delivered: {
    color: '#4ADE80',
    marginTop: 12,
    fontWeight: 'bold',
  },
  signOutButton: {
    backgroundColor: '#DC2626',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 25,
    marginBottom: 40,
  },
  signOutText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
})
