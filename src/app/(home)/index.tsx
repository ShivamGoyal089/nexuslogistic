import { useAuth, useClerk, useUser } from '@clerk/expo'
import { Redirect } from 'expo-router'
import { useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'

type Tab = 'home' | 'shipments' | 'track' | 'account'
type ShipmentStatus = 'Pending' | 'In transit' | 'Delivered'

type Shipment = {
  trackingId: string
  from: string
  to: string
  service: string
  packageDescription: string
  weightKg: number
  scheduledWindow?: string
  status: ShipmentStatus
  updated: string
}

const initialShipments: Shipment[] = [
  {
    trackingId: 'NX-481029',
    from: 'Lagos, Nigeria',
    to: 'Abuja, Nigeria',
    service: 'Express',
    packageDescription: 'Documents',
    weightKg: 0.8,
    status: 'In transit',
    updated: 'Last update 12 min ago',
  },
  {
    trackingId: 'NX-481027',
    from: 'Ikeja, Lagos',
    to: 'Lekki, Lagos',
    service: 'Same-day',
    packageDescription: 'Clothing',
    weightKg: 1.4,
    status: 'Delivered',
    updated: 'Delivered yesterday',
  },
  {
    trackingId: 'NX-481024',
    from: 'Victoria Island, Lagos',
    to: 'Port Harcourt, Nigeria',
    service: 'Standard',
    packageDescription: 'Home goods',
    weightKg: 3.2,
    status: 'Pending',
    updated: 'Awaiting pickup',
  },
]

const tabs: { id: Tab; label: string; glyph: string }[] = [
  { id: 'home', label: 'Home', glyph: 'H' },
  { id: 'shipments', label: 'Shipments', glyph: 'S' },
  { id: 'track', label: 'Track', glyph: 'T' },
  { id: 'account', label: 'Account', glyph: 'A' },
]

function StatusBadge({ status }: { status: ShipmentStatus }) {
  const tone =
    status === 'Delivered'
      ? styles.badgeDelivered
      : status === 'Pending'
        ? styles.badgePending
        : styles.badgeTransit

  return (
    <View style={[styles.statusBadge, tone]}>
      <Text style={styles.statusBadgeText}>{status}</Text>
    </View>
  )
}

function ShipmentCard({
  shipment,
  onTrack,
}: {
  shipment: Shipment
  onTrack: (trackingId: string) => void
}) {
  return (
    <View style={styles.shipmentCard}>
      <View style={styles.shipmentCardTop}>
        <View>
          <Text style={styles.trackingId}>{shipment.trackingId}</Text>
          <Text style={styles.mutedSmall}>{shipment.service} delivery</Text>
        </View>
        <StatusBadge status={shipment.status} />
      </View>

      <View style={styles.route}>
        <View style={styles.routeMarks}>
          <View style={styles.routeDot} />
          <View style={styles.routeLine} />
          <View style={[styles.routeDot, styles.routeDotDestination]} />
        </View>
        <View style={styles.routeLabels}>
          <Text style={styles.routePlace} numberOfLines={1}>
            {shipment.from}
          </Text>
          <Text style={styles.routePlace} numberOfLines={1}>
            {shipment.to}
          </Text>
        </View>
      </View>

      <Text style={styles.packageDetails} numberOfLines={1}>
        {shipment.packageDescription}  ·  {shipment.weightKg} kg
        {shipment.scheduledWindow ? `  ·  ${shipment.scheduledWindow}` : ''}
      </Text>

      <View style={styles.shipmentCardBottom}>
        <Text style={styles.mutedSmall}>{shipment.updated}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => onTrack(shipment.trackingId)}
          hitSlop={8}
        >
          <Text style={styles.textAction}>Track</Text>
        </Pressable>
      </View>
    </View>
  )
}

export default function HomeScreen() {
  const { isLoaded, isSignedIn } = useAuth()
  const { user } = useUser()
  const { signOut } = useClerk()
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [isCreating, setIsCreating] = useState(false)
  const [shipments, setShipments] = useState(initialShipments)
  const [trackingNumber, setTrackingNumber] = useState('')
  const [trackingSearched, setTrackingSearched] = useState(false)
  const [fromAddress, setFromAddress] = useState('')
  const [toAddress, setToAddress] = useState('')
  const [packageDescription, setPackageDescription] = useState('')
  const [weight, setWeight] = useState('')
  const [scheduledWindow, setScheduledWindow] = useState('')
  const [service, setService] = useState('Express')
  const [formError, setFormError] = useState('')
  const shipmentSequence = useRef(0)

  const firstName = user?.firstName || 'there'
  const email = user?.primaryEmailAddress?.emailAddress || ''
  const initials = firstName.slice(0, 1).toUpperCase()
  const trackedShipment = useMemo(
    () =>
      shipments.find(
        (shipment) =>
          shipment.trackingId.toLowerCase() ===
          trackingNumber.trim().toLowerCase()
      ),
    [shipments, trackingNumber]
  )

  if (!isLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#3157D5" />
      </View>
    )
  }

  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />
  }

  const openTracking = (trackingId = '') => {
    setTrackingNumber(trackingId)
    setTrackingSearched(Boolean(trackingId))
    setIsCreating(false)
    setActiveTab('track')
  }

  const openTab = (tab: Tab) => {
    setIsCreating(false)
    setActiveTab(tab)
  }

  const createShipment = () => {
    const weightKg = Number(weight)
    if (
      !fromAddress.trim() ||
      !toAddress.trim() ||
      !packageDescription.trim() ||
      !Number.isFinite(weightKg) ||
      weightKg <= 0 ||
      (service === 'Scheduled' && !scheduledWindow.trim())
    ) {
      setFormError(
        'Add pickup, delivery, package details, and a valid weight. Scheduled shipments also need a delivery window.'
      )
      return
    }

    shipmentSequence.current += 1
    const newShipment: Shipment = {
      trackingId: `NX${Date.now().toString(36).toUpperCase()}-${shipmentSequence.current.toString().padStart(2, '0')}`,
      from: fromAddress.trim(),
      to: toAddress.trim(),
      service,
      packageDescription: packageDescription.trim(),
      weightKg,
      ...(service === 'Scheduled'
        ? { scheduledWindow: scheduledWindow.trim() }
        : {}),
      status: 'Pending',
      updated: 'Shipment created just now',
    }

    setShipments((current) => [newShipment, ...current])
    setTrackingNumber(newShipment.trackingId)
    setTrackingSearched(true)
    setFromAddress('')
    setToAddress('')
    setPackageDescription('')
    setWeight('')
    setScheduledWindow('')
    setFormError('')
    setIsCreating(false)
    setActiveTab('track')
  }

  const renderHeader = (eyebrow: string, title: string) => (
    <View style={styles.pageHeader}>
      <View style={styles.brandLockup}>
        <View style={styles.brandMark}>
          <Text style={styles.brandMarkText}>N</Text>
        </View>
        <Text style={styles.brandName}>NEXUS</Text>
      </View>
      <View style={styles.pageHeadingRow}>
        <View style={styles.pageHeadingCopy}>
          <Text style={styles.eyebrow}>{eyebrow}</Text>
          <Text style={styles.pageTitle}>{title}</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      </View>
    </View>
  )

  const renderHome = () => (
    <>
      {renderHeader('CUSTOMER SPACE', `Good day, ${firstName}`)}

      <View style={styles.heroCard}>
        <View style={styles.heroOrb} />
        <Text style={styles.heroEyebrow}>YOUR LOGISTICS, IN MOTION</Text>
        <Text style={styles.heroTitle}>Every delivery,{"\n"}one step closer.</Text>
        <Text style={styles.heroDescription}>
          Create a shipment or follow your delivery from pickup to arrival.
        </Text>
        <Pressable
          accessibilityRole="button"
          style={styles.heroButton}
          onPress={() => setIsCreating(true)}
        >
          <Text style={styles.heroButtonText}>Create a shipment</Text>
          <Text style={styles.heroButtonArrow}>+</Text>
        </Pressable>
        <Text style={styles.heroFootnote}>Simple shipping. Clear updates.</Text>
      </View>

      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>Your activity</Text>
        <Text style={styles.sectionHint}>ALL SHIPMENTS</Text>
      </View>
      <View style={styles.statGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{shipments.length}</Text>
          <Text style={styles.statLabel}>Total shipments</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, styles.statValueBlue]}>
            {shipments.filter((item) => item.status === 'In transit').length}
          </Text>
          <Text style={styles.statLabel}>On the way</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, styles.statValueGreen]}>
            {shipments.filter((item) => item.status === 'Delivered').length}
          </Text>
          <Text style={styles.statLabel}>Delivered</Text>
        </View>
      </View>

      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>On the move</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => openTab('shipments')}
          hitSlop={8}
        >
          <Text style={styles.textAction}>View all</Text>
        </Pressable>
      </View>
      {shipments
        .filter((shipment) => shipment.status === 'In transit')
        .slice(0, 1)
        .map((shipment) => (
          <ShipmentCard
            key={shipment.trackingId}
            shipment={shipment}
            onTrack={openTracking}
          />
        ))}
      {shipments.every((shipment) => shipment.status !== 'In transit') && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Nothing in transit yet</Text>
          <Text style={styles.mutedText}>
            Your active deliveries will show up here.
          </Text>
        </View>
      )}

      <Pressable
        accessibilityRole="button"
        style={styles.trackShortcut}
        onPress={() => openTab('track')}
      >
        <View style={styles.shortcutIcon}>
          <Text style={styles.shortcutIconText}>T</Text>
        </View>
        <View style={styles.shortcutCopy}>
          <Text style={styles.shortcutTitle}>Have a tracking number?</Text>
          <Text style={styles.mutedSmall}>Look up a shipment update</Text>
        </View>
        <Text style={styles.shortcutArrow}>›</Text>
      </Pressable>
    </>
  )

  const renderShipments = () => (
    <>
      {renderHeader('YOUR DELIVERIES', 'Shipments')}
      <Text style={styles.pageDescription}>
        A clear view of every package you have sent.
      </Text>
      <Pressable
        accessibilityRole="button"
        style={styles.primaryButton}
        onPress={() => setIsCreating(true)}
      >
        <Text style={styles.primaryButtonText}>+  Create shipment</Text>
      </Pressable>
      <View style={styles.listSummary}>
        <Text style={styles.listCount}>{shipments.length} shipments</Text>
        <Text style={styles.listScope}>RECENT</Text>
      </View>
      {shipments.map((shipment) => (
        <ShipmentCard
          key={shipment.trackingId}
          shipment={shipment}
          onTrack={openTracking}
        />
      ))}
    </>
  )

  const renderTracking = () => (
    <>
      {renderHeader('SHIPMENT UPDATES', 'Track a package')}
      <Text style={styles.pageDescription}>
        Enter a Nexus tracking number to view its latest status.
      </Text>
      <View style={styles.searchCard}>
        <Text style={styles.fieldLabel}>TRACKING NUMBER</Text>
        <View style={styles.searchRow}>
          <TextInput
            accessibilityLabel="Tracking number"
            autoCapitalize="characters"
            autoCorrect={false}
            onChangeText={(value) => {
              setTrackingNumber(value)
              setTrackingSearched(false)
            }}
            onSubmitEditing={() => setTrackingSearched(true)}
            placeholder="e.g. NX-481029"
            placeholderTextColor="#8B93A6"
            returnKeyType="search"
            style={styles.searchInput}
            value={trackingNumber}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => setTrackingSearched(true)}
            style={styles.searchButton}
          >
            <Text style={styles.searchButtonText}>Track</Text>
          </Pressable>
        </View>
      </View>

      {trackingSearched && trackedShipment ? (
        <View style={styles.trackingResult}>
          <View style={styles.resultTop}>
            <View>
              <Text style={styles.fieldLabel}>TRACKING ID</Text>
              <Text style={styles.resultTrackingId}>
                {trackedShipment.trackingId}
              </Text>
            </View>
            <StatusBadge status={trackedShipment.status} />
          </View>
          <View style={styles.resultRoute}>
            <Text style={styles.resultRouteLabel}>PICKUP</Text>
            <Text style={styles.resultRoutePlace}>{trackedShipment.from}</Text>
            <View style={styles.resultDivider} />
            <Text style={styles.resultRouteLabel}>DELIVERY</Text>
            <Text style={styles.resultRoutePlace}>{trackedShipment.to}</Text>
          </View>
            <Text style={styles.packageDetails}>
              {trackedShipment.packageDescription}  ·  {trackedShipment.weightKg}{' '}
              kg
              {trackedShipment.scheduledWindow
                ? `  ·  ${trackedShipment.scheduledWindow}`
                : ''}
            </Text>
          <Text style={styles.timelineHeading}>Shipment progress</Text>
          {[
            { label: 'Shipment created', complete: true },
            {
              label: 'Picked up',
              complete: trackedShipment.status !== 'Pending',
            },
            {
              label: 'In transit',
              complete:
                trackedShipment.status === 'In transit' ||
                trackedShipment.status === 'Delivered',
            },
            {
              label: 'Delivered',
              complete: trackedShipment.status === 'Delivered',
            },
          ].map((step, index) => (
            <View key={step.label} style={styles.timelineRow}>
              <View style={styles.timelineMarks}>
                <View
                  style={[
                    styles.timelineDot,
                    step.complete && styles.timelineDotComplete,
                  ]}
                />
                {index < 3 && <View style={styles.timelineLine} />}
              </View>
              <Text
                style={[
                  styles.timelineLabel,
                  step.complete && styles.timelineLabelComplete,
                ]}
              >
                {step.label}
              </Text>
            </View>
          ))}
          <Text style={styles.resultUpdated}>{trackedShipment.updated}</Text>
        </View>
      ) : trackingSearched ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No matching shipment</Text>
          <Text style={styles.mutedText}>
            Check the number and try again. This demo only looks up shipments
            created in this app session.
          </Text>
        </View>
      ) : (
        <View style={styles.trackingTip}>
          <Text style={styles.tipTitle}>Your tracking number</Text>
          <Text style={styles.mutedText}>
            Find it in your shipment confirmation. Try NX-481029 to see a sample
            tracking update.
          </Text>
        </View>
      )}
      <Text style={styles.disclaimer}>
        Demo tracking data only. Live GPS and carrier updates are not connected.
      </Text>
    </>
  )

  const renderCreateShipment = () => (
    <>
      <View style={styles.formTop}>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setIsCreating(false)
            setFormError('')
          }}
          hitSlop={10}
        >
          <Text style={styles.backAction}>‹  Back</Text>
        </Pressable>
        <Text style={styles.formEyebrow}>NEW DELIVERY</Text>
      </View>
      <Text style={styles.pageTitle}>Create a shipment</Text>
      <Text style={styles.pageDescription}>
        Share the package details to get your delivery started.
      </Text>

      <View style={styles.formCard}>
        <Text style={styles.formSectionTitle}>Route</Text>
        <Text style={styles.fieldLabel}>PICKUP ADDRESS</Text>
        <TextInput
          accessibilityLabel="Pickup address"
          autoCapitalize="words"
          onChangeText={setFromAddress}
          placeholder="Street, area, city"
          placeholderTextColor="#8B93A6"
          style={styles.formInput}
          value={fromAddress}
        />
        <Text style={styles.fieldLabel}>DELIVERY ADDRESS</Text>
        <TextInput
          accessibilityLabel="Delivery address"
          autoCapitalize="words"
          onChangeText={setToAddress}
          placeholder="Street, area, city"
          placeholderTextColor="#8B93A6"
          style={styles.formInput}
          value={toAddress}
        />
      </View>

      <View style={styles.formCard}>
        <Text style={styles.formSectionTitle}>Package</Text>
        <Text style={styles.fieldLabel}>WHAT ARE YOU SENDING?</Text>
        <TextInput
          accessibilityLabel="Package details"
          onChangeText={setPackageDescription}
          placeholder="e.g. Documents, clothing"
          placeholderTextColor="#8B93A6"
          style={styles.formInput}
          value={packageDescription}
        />
        <Text style={styles.fieldLabel}>WEIGHT (KG)</Text>
        <TextInput
          accessibilityLabel="Package weight in kilograms"
          keyboardType="decimal-pad"
          onChangeText={setWeight}
          placeholder="e.g. 2.5"
          placeholderTextColor="#8B93A6"
          style={styles.formInput}
          value={weight}
        />
        <Text style={styles.fieldLabel}>DELIVERY SPEED</Text>
        <View style={styles.serviceOptions}>
          {['Same-day', 'Express', 'Standard', 'Scheduled'].map((option) => (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: service === option }}
              key={option}
              onPress={() => setService(option)}
              style={[
                styles.serviceOption,
                service === option && styles.serviceOptionSelected,
              ]}
            >
              <Text
                style={[
                  styles.serviceOptionText,
                  service === option && styles.serviceOptionTextSelected,
                ]}
              >
                {option}
              </Text>
            </Pressable>
          ))}
        </View>
        {service === 'Scheduled' && (
          <>
            <Text style={[styles.fieldLabel, styles.scheduleLabel]}>
              PREFERRED DELIVERY WINDOW
            </Text>
            <TextInput
              accessibilityLabel="Preferred delivery window"
              onChangeText={setScheduledWindow}
              placeholder="e.g. 24 Nov, 9 AM - 12 PM"
              placeholderTextColor="#8B93A6"
              style={[styles.formInput, styles.scheduleInput]}
              value={scheduledWindow}
            />
          </>
        )}
      </View>

      {formError ? <Text style={styles.formError}>{formError}</Text> : null}
      <Text style={styles.disclaimer}>
        This demo creates a local shipment only. Dispatch, payment, and final
        pricing are not connected.
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={createShipment}
        style={styles.primaryButton}
      >
        <Text style={styles.primaryButtonText}>Create shipment</Text>
      </Pressable>
    </>
  )

  const renderAccount = () => (
    <>
      {renderHeader('YOUR PROFILE', 'Account')}
      <View style={styles.profileCard}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileAvatarText}>{initials}</Text>
        </View>
        <Text style={styles.profileName}>
          {user?.fullName || firstName}
        </Text>
        <Text style={styles.profileEmail}>{email || 'Email not provided'}</Text>
        <View style={styles.accountTag}>
          <Text style={styles.accountTagText}>CUSTOMER ACCOUNT</Text>
        </View>
      </View>
      <View style={styles.accountInfo}>
        <Text style={styles.formSectionTitle}>Your account</Text>
        <Text style={styles.mutedText}>
          Your profile is managed by your secure sign-in provider.
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => signOut()}
        style={styles.signOutButton}
      >
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </>
  )

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.pageContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWidth}>
          {isCreating
            ? renderCreateShipment()
            : activeTab === 'home'
              ? renderHome()
              : activeTab === 'shipments'
                ? renderShipments()
                : activeTab === 'track'
                  ? renderTracking()
                  : renderAccount()}
        </View>
      </ScrollView>

      {!isCreating && (
        <View style={styles.tabBar}>
          {tabs.map((tab) => {
            const selected = activeTab === tab.id
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                key={tab.id}
                onPress={() => openTab(tab.id)}
                style={styles.tabItem}
              >
                <View
                  style={[
                    styles.tabGlyph,
                    selected && styles.tabGlyphSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.tabGlyphText,
                      selected && styles.tabGlyphTextSelected,
                    ]}
                  >
                    {tab.glyph}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.tabLabel,
                    selected && styles.tabLabelSelected,
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            )
          })}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F6F7FB',
  },
  loading: {
    flex: 1,
    backgroundColor: '#F6F7FB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageContent: {
    flexGrow: 1,
    paddingTop: 28,
    paddingBottom: 24,
  },
  contentWidth: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    paddingHorizontal: 20,
  },
  pageHeader: {
    marginBottom: 22,
  },
  brandLockup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  brandMark: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3157D5',
    marginRight: 9,
  },
  brandMarkText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  brandName: {
    color: '#17213B',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2.2,
  },
  pageHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pageHeadingCopy: {
    flex: 1,
    paddingRight: 12,
  },
  eyebrow: {
    color: '#7D879E',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 7,
  },
  pageTitle: {
    color: '#17213B',
    fontSize: 27,
    fontWeight: '800',
    letterSpacing: -0.7,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E4EAFE',
  },
  avatarText: {
    color: '#3157D5',
    fontSize: 16,
    fontWeight: '700',
  },
  heroCard: {
    overflow: 'hidden',
    backgroundColor: '#17213B',
    borderRadius: 24,
    padding: 23,
    marginBottom: 27,
    position: 'relative',
  },
  heroOrb: {
    position: 'absolute',
    top: -54,
    right: -44,
    width: 178,
    height: 178,
    borderRadius: 89,
    backgroundColor: '#253660',
  },
  heroEyebrow: {
    color: '#AABAF7',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: 13,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 29,
    lineHeight: 34,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  heroDescription: {
    maxWidth: 275,
    color: '#C4CAD9',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 12,
  },
  heroButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginTop: 20,
  },
  heroButtonText: {
    color: '#17213B',
    fontSize: 13,
    fontWeight: '700',
  },
  heroButtonArrow: {
    color: '#3157D5',
    fontSize: 19,
    lineHeight: 20,
    fontWeight: '600',
    marginLeft: 13,
  },
  heroFootnote: {
    color: '#AEB7CC',
    fontSize: 11,
    marginTop: 16,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 13,
  },
  sectionTitle: {
    color: '#17213B',
    fontSize: 17,
    fontWeight: '700',
  },
  sectionHint: {
    color: '#8790A5',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  statGrid: {
    flexDirection: 'row',
    marginHorizontal: -5,
    marginBottom: 27,
  },
  statCard: {
    flex: 1,
    minHeight: 91,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECEEF4',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginHorizontal: 5,
  },
  statValue: {
    color: '#17213B',
    fontSize: 23,
    fontWeight: '800',
  },
  statValueBlue: {
    color: '#3157D5',
  },
  statValueGreen: {
    color: '#24865B',
  },
  statLabel: {
    color: '#778199',
    fontSize: 10,
    lineHeight: 14,
    marginTop: 7,
  },
  shipmentCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECEEF4',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  shipmentCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 17,
  },
  trackingId: {
    color: '#17213B',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  mutedSmall: {
    color: '#8790A5',
    fontSize: 11,
  },
  statusBadge: {
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 9,
  },
  badgeTransit: {
    backgroundColor: '#EAF0FF',
  },
  badgeDelivered: {
    backgroundColor: '#E7F5EE',
  },
  badgePending: {
    backgroundColor: '#FFF3DC',
  },
  statusBadgeText: {
    color: '#3157D5',
    fontSize: 10,
    fontWeight: '700',
  },
  route: {
    flexDirection: 'row',
    minHeight: 54,
    marginBottom: 13,
  },
  routeMarks: {
    alignItems: 'center',
    width: 14,
    marginRight: 10,
    paddingTop: 3,
    paddingBottom: 3,
  },
  routeDot: {
    width: 8,
    height: 8,
    borderWidth: 2,
    borderColor: '#3157D5',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  routeDotDestination: {
    borderColor: '#91A0C8',
  },
  routeLine: {
    flex: 1,
    width: 1,
    backgroundColor: '#DDE2EE',
    marginVertical: 3,
  },
  routeLabels: {
    flex: 1,
    justifyContent: 'space-between',
  },
  routePlace: {
    color: '#313B54',
    fontSize: 12,
    fontWeight: '600',
  },
  shipmentCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F1F6',
    paddingTop: 12,
  },
  packageDetails: {
    color: '#778199',
    fontSize: 11,
    marginBottom: 12,
  },
  textAction: {
    color: '#3157D5',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECEEF4',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
  },
  emptyTitle: {
    color: '#17213B',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  mutedText: {
    color: '#778199',
    fontSize: 12,
    lineHeight: 18,
  },
  trackShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF1FC',
    borderRadius: 16,
    padding: 15,
    marginTop: 4,
  },
  shortcutIcon: {
    width: 37,
    height: 37,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginRight: 12,
  },
  shortcutIconText: {
    color: '#3157D5',
    fontSize: 13,
    fontWeight: '800',
  },
  shortcutCopy: {
    flex: 1,
  },
  shortcutTitle: {
    color: '#202B46',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  shortcutArrow: {
    color: '#3157D5',
    fontSize: 25,
    marginLeft: 8,
  },
  pageDescription: {
    color: '#778199',
    fontSize: 13,
    lineHeight: 20,
    marginTop: -10,
    marginBottom: 20,
  },
  primaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3157D5',
    borderRadius: 13,
    paddingVertical: 15,
    paddingHorizontal: 16,
    marginBottom: 22,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  listSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  listCount: {
    color: '#313B54',
    fontSize: 13,
    fontWeight: '700',
  },
  listScope: {
    color: '#8790A5',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  searchCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECEEF4',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  fieldLabel: {
    color: '#8790A5',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: 46,
    color: '#17213B',
    backgroundColor: '#F6F7FB',
    borderRadius: 11,
    paddingHorizontal: 13,
    fontSize: 13,
    marginRight: 9,
  },
  searchButton: {
    height: 46,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3157D5',
    borderRadius: 11,
    paddingHorizontal: 14,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  trackingResult: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECEEF4',
    borderRadius: 18,
    padding: 17,
    marginBottom: 14,
  },
  resultTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F1F6',
  },
  resultTrackingId: {
    color: '#17213B',
    fontSize: 16,
    fontWeight: '800',
  },
  resultRoute: {
    paddingTop: 16,
    paddingBottom: 14,
  },
  resultRouteLabel: {
    color: '#8790A5',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 5,
  },
  resultRoutePlace: {
    color: '#313B54',
    fontSize: 13,
    fontWeight: '600',
  },
  resultDivider: {
    height: 1,
    backgroundColor: '#F0F1F6',
    marginVertical: 12,
  },
  timelineHeading: {
    color: '#17213B',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 13,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 31,
  },
  timelineMarks: {
    alignItems: 'center',
    width: 14,
    marginRight: 10,
  },
  timelineDot: {
    width: 9,
    height: 9,
    backgroundColor: '#E2E5EE',
    borderRadius: 5,
  },
  timelineDotComplete: {
    backgroundColor: '#3157D5',
  },
  timelineLine: {
    width: 1,
    height: 22,
    backgroundColor: '#E2E5EE',
  },
  timelineLabel: {
    color: '#9AA2B3',
    fontSize: 12,
  },
  timelineLabelComplete: {
    color: '#313B54',
    fontWeight: '600',
  },
  resultUpdated: {
    color: '#8790A5',
    fontSize: 11,
    marginTop: 5,
  },
  trackingTip: {
    backgroundColor: '#EEF1FC',
    borderRadius: 16,
    padding: 17,
    marginTop: 2,
  },
  tipTitle: {
    color: '#202B46',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  disclaimer: {
    color: '#8B93A6',
    fontSize: 10,
    lineHeight: 15,
    marginBottom: 16,
  },
  formTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 3,
    marginBottom: 18,
  },
  backAction: {
    color: '#3157D5',
    fontSize: 13,
    fontWeight: '700',
  },
  formEyebrow: {
    color: '#8790A5',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECEEF4',
    borderRadius: 18,
    padding: 16,
    marginBottom: 13,
  },
  formSectionTitle: {
    color: '#17213B',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 16,
  },
  formInput: {
    height: 46,
    color: '#17213B',
    backgroundColor: '#F6F7FB',
    borderWidth: 1,
    borderColor: '#F0F1F6',
    borderRadius: 11,
    paddingHorizontal: 13,
    fontSize: 13,
    marginBottom: 15,
  },
  serviceOptions: {
    flexDirection: 'row',
    marginHorizontal: -4,
  },
  serviceOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    backgroundColor: '#F6F7FB',
    borderWidth: 1,
    borderColor: '#ECEEF4',
    borderRadius: 10,
    paddingHorizontal: 5,
    marginHorizontal: 4,
  },
  serviceOptionSelected: {
    backgroundColor: '#EEF1FC',
    borderColor: '#3157D5',
  },
  serviceOptionText: {
    color: '#778199',
    fontSize: 10,
    fontWeight: '600',
  },
  serviceOptionTextSelected: {
    color: '#3157D5',
    fontWeight: '700',
  },
  scheduleLabel: {
    marginTop: 16,
  },
  scheduleInput: {
    marginBottom: 0,
  },
  formError: {
    color: '#B42318',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECEEF4',
    borderRadius: 20,
    padding: 23,
    marginBottom: 14,
  },
  profileAvatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E4EAFE',
    marginBottom: 12,
  },
  profileAvatarText: {
    color: '#3157D5',
    fontSize: 24,
    fontWeight: '700',
  },
  profileName: {
    color: '#17213B',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  profileEmail: {
    color: '#778199',
    fontSize: 12,
  },
  accountTag: {
    backgroundColor: '#EEF1FC',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 14,
  },
  accountTagText: {
    color: '#3157D5',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  accountInfo: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECEEF4',
    borderRadius: 16,
    padding: 17,
    marginBottom: 14,
  },
  signOutButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E8F0',
    borderRadius: 13,
    paddingVertical: 14,
  },
  signOutText: {
    color: '#B42318',
    fontSize: 13,
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#ECEEF4',
    paddingTop: 9,
    paddingBottom: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  tabGlyph: {
    width: 25,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginBottom: 3,
  },
  tabGlyphSelected: {
    backgroundColor: '#EEF1FC',
  },
  tabGlyphText: {
    color: '#9299A9',
    fontSize: 11,
    fontWeight: '700',
  },
  tabGlyphTextSelected: {
    color: '#3157D5',
  },
  tabLabel: {
    color: '#9299A9',
    fontSize: 9,
    fontWeight: '600',
  },
  tabLabelSelected: {
    color: '#3157D5',
    fontWeight: '700',
  },
})
