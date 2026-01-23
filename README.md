# BigCommerce Custom Signup Application

A powerful Next.js application that enables BigCommerce store owners to create, customize, and manage custom signup forms with advanced features including form building, email templates, request management, and automated workflows.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
- [BigCommerce Integration](#bigcommerce-integration)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Technologies](#technologies)
- [Development](#development)

## 🎯 Overview

This application provides a comprehensive solution for BigCommerce merchants who want to replace the default customer signup form with a fully customizable, branded experience. The app integrates seamlessly with BigCommerce stores through OAuth authentication and provides:

- **Visual Form Builder**: Drag-and-drop interface to create custom signup forms
- **Request Management**: Review, approve, or reject customer signup requests
- **Email Automation**: Customizable email templates for notifications
- **Theme Customization**: Full control over form appearance and branding
- **File Upload Support**: Handle document submissions from customers
- **Cooldown Management**: Prevent duplicate submissions with configurable cooldown periods

## ✨ Features

### Form Builder
- **Visual Editor**: Intuitive drag-and-drop form builder with live preview
- **Field Types**: Support for text, email, phone, number, textarea, select, radio, checkbox, date, file upload, and URL fields
- **Custom Styling**: Customize colors, fonts, borders, padding, and more for each field
- **Layout Options**: Center or split-screen layouts with custom images
- **Field Grouping**: Organize fields into rows for better form layout
- **Country/State Selectors**: Built-in support for country and state/province dropdowns
- **Form Versions**: Save and manage multiple form configurations
- **Real-time Preview**: See changes instantly as you build

### Request Management
- **Dashboard**: Overview of all signup requests with statistics
- **Status Tracking**: Track pending, approved, and rejected requests
- **Bulk Actions**: Approve or reject multiple requests at once
- **Request Details**: View complete submission data including uploaded files
- **Search & Filter**: Quickly find specific requests by status or search term
- **Resubmission Requests**: Request additional information from customers
- **Cooldown Management**: Configure and reset submission cooldown periods

### Email Templates
- **Multiple Templates**: Configure templates for signup confirmation, approval, rejection, and more
- **HTML Editor**: Rich HTML email editor with design customization
- **Dynamic Content**: Use placeholders for customer data in emails
- **Design System**: Customize logos, colors, banners, and CTAs
- **Test Emails**: Send test emails to verify templates before going live
- **Footer Customization**: Add social links, footer notes, and custom links

### Additional Features
- **Notification Configuration**: Set up email notifications for new requests
- **Customer Group Assignment**: Automatically assign approved customers to specific groups
- **File Storage**: Secure file upload and storage for customer documents
- **Analytics**: Track submission trends and statistics
- **Responsive Design**: Forms work seamlessly on desktop and mobile devices

## 🚀 Installation

### Prerequisites

- Node.js 18+ and npm/yarn
- BigCommerce Developer Account
- Firebase account (for database)
- SMTP email service (e.g., Brevo/SendGrid)

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd csf3
```

### Step 2: Install Dependencies

```bash
npm install
# or
yarn install
```

### Step 3: Set Up Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# BigCommerce OAuth Credentials
CLIENT_ID=your_bigcommerce_client_id
CLIENT_SECRET=your_bigcommerce_client_secret
AUTH_CALLBACK=https://your-domain.com/api/auth
BASE_URL=https://your-domain.com
API_URL=api.bigcommerce.com

# JWT Configuration
JWT_KEY=your_32_character_jwt_secret_key
ALLOWED_ORIGINS=*

# Database (Firebase)
DB_TYPE=firebase
FIRE_API_KEY=your_firebase_api_key
FIRE_DOMAIN=your_firebase_domain
FIRE_PROJECT_ID=your_firebase_project_id
FIRE_STORAGE_BUCKET=your_firebase_storage_bucket
FIRE_MESSAGING_SENDER_ID=your_messaging_sender_id
FIRE_APP_ID=your_firebase_app_id
FIRE_MEASUREMENT_ID=your_measurement_id

# Email Configuration (Brevo/SMTP)
EMAIL_FROM=your-email@example.com
EMAIL_FROM_NAME=Custom Signup Forms
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USER=your_smtp_username
BREVO_SMTP_KEY=your_smtp_api_key
PLATFORM_NAME=Custom Signup Forms

# Contact Email
NEXT_PUBLIC_EMAIL_FROM=your-email@example.com
```

### Step 4: Set Up Firebase

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore Database
3. Enable Firebase Storage
4. Copy your Firebase configuration values to `.env`
5. Set up Firestore security rules and indexes (see `firestore.indexes.json`)

### Step 5: Set Up BigCommerce App

1. Go to [BigCommerce Developer Portal](https://devtools.bigcommerce.com/)
2. Create a new app
3. Set the OAuth callback URL to: `https://your-domain.com/api/auth`
4. Copy your Client ID and Client Secret to `.env`
5. Note your app's scopes (you'll need customer management permissions)

### Step 6: Run Database Setup

```bash
npm run db:setup
```

### Step 7: Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## ⚙️ Configuration

### BigCommerce Integration

1. **Install the App**: Navigate to your BigCommerce store's Apps section
2. **Authorize**: Click "Install" and authorize the app with required permissions
3. **Generate Script**: Use the Form Builder to create your custom signup form
4. **Install Script**: The app will generate a script tag that you can install in your BigCommerce store

### Script Installation

After creating your form, the app generates a JavaScript file (`custom-signup.min.js`) that:

- Automatically detects the BigCommerce signup page (`/login.php?action=create_account`)
- Replaces the default form with your custom form
- Handles form submissions and validation
- Manages file uploads
- Displays custom thank-you pages

Install the script in your BigCommerce store's theme:

1. Go to **Storefront** → **Script Manager** in BigCommerce admin
2. Add a new script with:
   - **Location**: Footer
   - **Script Type**: Script
   - **Script Source**: External URL or Inline (paste the generated script)
   - **Pages**: Specific Pages → Login Page

### Email Configuration

Configure your SMTP settings in `.env` to enable email notifications. The app supports:

- Brevo (formerly Sendinblue)
- Any SMTP-compatible email service
- Custom email templates with HTML support

## 🔗 BigCommerce Integration

This application integrates with BigCommerce through:

1. **OAuth 2.0 Authentication**: Secure authentication using BigCommerce's OAuth flow
2. **BigCommerce API**: Uses the BigCommerce Node.js SDK to interact with store data
3. **Script Injection**: Injects custom JavaScript into storefront pages
4. **Customer Management**: Creates customer accounts via BigCommerce API
5. **Customer Groups**: Assigns approved customers to configured customer groups

### Required BigCommerce Permissions

- `store_v2_customers` - Create and manage customers
- `store_v2_customer_groups` - Assign customers to groups
- `store_content_scripts` - Install scripts in storefront

## 📖 Usage

### Creating a Custom Form

1. Navigate to **Form Builder** in the app dashboard
2. Click **Add Field** to add form fields
3. Customize each field's appearance and validation
4. Configure the form theme (colors, layout, images)
5. Use **Live Preview** to see how the form will look
6. **Save** your form configuration

### Managing Signup Requests

1. Go to **Requests** page to view all submissions
2. Use filters to find specific requests
3. Click on a request to view full details
4. **Approve** to create a customer account in BigCommerce
5. **Reject** to decline a request
6. **Request Info** to ask for additional information

### Configuring Email Templates

1. Navigate to **Emails** section
2. Select a template type (Signup, Approval, Rejection, etc.)
3. Customize the subject and body
4. Use the visual editor to design HTML emails
5. Add placeholders like `{{customerName}}` for dynamic content
6. **Test** your template before saving

### Settings

- **Cooldown Configuration**: Set time limits between submissions
- **Notification Settings**: Configure when to receive email notifications
- **Customer Groups**: Set default customer group for approved accounts

## 📁 Project Structure

```
csf3/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── auth/          # BigCommerce OAuth
│   │   ├── generate-signup-script/  # Script generation
│   │   ├── signup-requests/  # Request management
│   │   └── ...
│   ├── builder/           # Form builder page
│   ├── dashboard/        # Dashboard page
│   ├── emails/            # Email templates page
│   └── requests/          # Requests management page
├── components/            # React components
│   ├── FormBuilder/      # Form builder components
│   ├── requests/          # Request management components
│   └── common/            # Shared components
├── lib/                   # Utility libraries
│   ├── auth.ts           # BigCommerce authentication
│   ├── db.ts             # Database operations
│   ├── email.ts          # Email sending
│   └── ...
├── types/                 # TypeScript type definitions
├── public/                # Static assets
│   └── custom-signup.min.js  # Generated signup script
└── context/               # React context providers
```

## 🛠 Technologies

- **Framework**: Next.js 15.5.9 (App Router)
- **Language**: TypeScript
- **UI Library**: React 19.1.0
- **Styling**: Tailwind CSS 4
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **Authentication**: BigCommerce OAuth 2.0
- **Email**: Nodemailer with SMTP
- **Icons**: Lucide React
- **State Management**: React Hooks, SWR
- **Validation**: Zod

## 💻 Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Set up database
npm run db:setup
```

### Development Workflow

1. Make changes to the codebase
2. Test locally with `npm run dev`
3. Use ngrok or similar for local BigCommerce OAuth testing
4. Build and deploy to your hosting platform (Vercel recommended)

### Environment Setup for Development

For local development with BigCommerce OAuth, you'll need:

1. A tunneling service (ngrok, Cloudflare Tunnel, etc.)
2. Update `AUTH_CALLBACK` and `BASE_URL` in `.env` with your tunnel URL
3. Update your BigCommerce app's callback URL to match

## 📝 Notes

- The generated `custom-signup.min.js` script is self-contained and can be installed directly in BigCommerce
- Forms are stored in Firebase and fetched dynamically by the script
- File uploads are stored in Firebase Storage
- All customer data is stored securely in Firestore
- The app uses JWT tokens for secure session management

## 🔒 Security

- OAuth 2.0 authentication with BigCommerce
- JWT-based session management
- Secure file upload validation
- CORS protection
- Environment variable protection
- Input validation and sanitization

## 📄 License

[Add your license information here]

## 🤝 Contributing

[Add contribution guidelines if applicable]

---

**Built for BigCommerce** | Customize your customer signup experience with powerful form building and management tools.
