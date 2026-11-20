
# Nexus Logistics

Nexus Logistics is an Expo and React Native customer app for managing shipments. It currently provides a mobile-first demo experience with Clerk authentication and session-local shipment data.

## Features

- Sign up, sign in, and email verification through Clerk
- Customer dashboard with shipment activity
- Shipment creation with pickup and delivery addresses, package description, weight, and delivery speed
- Shipment list with pending, in-transit, and delivered statuses
- Tracking lookup with a sample shipment timeline
- Customer account details and sign out

New shipments and the sample tracking records are stored only in app memory. They are lost when the app reloads. Live GPS tracking, server persistence, pricing, payments, dispatching, notifications, and operational/admin workflows are not connected.

## Requirements

- Node.js and npm
- A Clerk application with email/password sign-in enabled

## Setup

1. Install dependencies:

   ```sh
   npm install
   ```

2. Create a `.env` file in the project root and set your Clerk publishable key:

   ```env
   EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
   ```

   Use a Clerk **publishable key** here. Values prefixed with `EXPO_PUBLIC_` are included in the client app; never put database credentials, secret API keys, or other server-only secrets in them.

3. Start the development server:

   ```sh
   npm run start
   ```

   You can also start a platform-specific target:

   ```sh
   npm run android
   npm run ios
   npm run web
   ```

## Type checking

```sh
npx tsc --noEmit
```

## Project structure

- `src/app/(auth)/` — Clerk sign-in and sign-up screens
- `src/app/(home)/` — authenticated customer dashboard and shipment flows
- `src/app/_layout.tsx` — Clerk provider and root navigation
