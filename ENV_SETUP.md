# Environment Variables Setup

This project uses environment variables for configuration. Follow these steps to set up your `.env` file:

## Setup Instructions

1. **Create `.env` file** in the root directory (same level as `package.json`)

2. **Copy the contents** from `.env.example` and fill in your values:

```env
# Stripe Configuration
STRIPE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
STRIPE_SECRET=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

# API Configuration
API_URL=https://carwashapp.shoppypie.in
API_BASE_URL=https://carwashapp.shoppypie.in/api/v1

# Apple Pay Merchant Identifier (iOS Bundle Identifier)
# This should match your app's bundle identifier in Xcode
MERCHANT_IDENTIFIER=org.reactjs.native.example.Cars
```

## Important Notes

1. **Never commit `.env` file** - It's already in `.gitignore`
2. **Merchant Identifier**: The `MERCHANT_IDENTIFIER` should match your iOS app's bundle identifier found in Xcode (`ios/Cars.xcodeproj`)
3. **Current Bundle ID**: `org.reactjs.native.example.Cars` (update if different)

## Using Environment Variables

The environment variables are automatically loaded from `.env` file through `src/config/env.ts`. All services import from this config file.

## Files Using Environment Config

- `src/services/paymentService.ts` - Stripe publishable key
- `src/services/stripeBackend.ts` - Stripe secret key and API URL
- `src/services/api.ts` - API base URL
- `src/services/authService.ts` - API base URL
- `App.tsx` - Stripe provider configuration

## Troubleshooting

If environment variables are not loading:
1. Make sure `.env` file exists in the root directory
2. Restart Metro bundler: `npm start -- --reset-cache`
3. Rebuild the app: `npm run ios` or `npm run android`

