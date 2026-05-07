// Firestore Security Rules Setup
// Add these rules to your Firebase Console -> Firestore Database -> Rules tab

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Allow authenticated users to read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId || request.auth.uid != null;
    }

    // Training Modules Collection - Admins can create/edit, everyone can read
    match /trainingModules/{document=**} {
      allow read: if request.auth.uid != null;
      allow create, write, delete: if request.auth.token.role == 'admin';
    }

    // Enrollments Collection - Track guide progress
    match /enrollments/{document=**} {
      allow read: if request.auth.uid != null;
      allow create, write, delete: if request.auth.token.role == 'admin' || request.auth.uid == resource.data.guideId;
    }

    // Certificates Collection - Issued certifications
    match /certificates/{document=**} {
      allow read: if request.auth.uid != null;
      allow create, write: if request.auth.token.role == 'admin';
      allow delete: if request.auth.token.role == 'admin';
    }

    // Logs Collection - Activity logs
    match /logs/{document=**} {
      allow read, write: if request.auth.uid != null;
    }
  }
}

// IMPORTANT: Custom Claims Setup
// You need to set custom claims on Firebase Admin SDK to make role='admin' work
// In your backend (server.js), add role to custom claims:
//
// const admin = require('firebase-admin');
// admin.auth().setCustomUserClaims(uid, {role: 'admin'})
//   .then(() => console.log('Custom claims set for', uid))
//   .catch(err => console.error('Error setting custom claims:', err));
