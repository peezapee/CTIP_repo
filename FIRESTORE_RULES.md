rules_version = '2';

service cloud.firestore {

  match /databases/{database}/documents {

    // Incidents Collection
    match /incidents/{document=**} {
      allow read, write:
        if request.auth.uid != null;
    }

    // Users Collection
    match /users/{userId} {
      allow read, write:
        if request.auth.uid == userId
        || request.auth.uid != null;
    }

    // Training Modules
    match /trainingModules/{document=**} {

      allow read:
        if request.auth.uid != null;

      allow create, write, delete:
        if request.auth.token.role == 'admin';
    }

    // Enrollments
    match /enrollments/{document=**} {

      allow read:
        if request.auth.uid != null;

      allow create, write, delete:
        if request.auth.token.role == 'admin'
        || request.auth.uid == resource.data.guideId;
    }

    // Certificates
    match /certificates/{document=**} {

      allow read:
        if request.auth.uid != null;

      allow create, write, delete:
        if request.auth.token.role == 'admin';
    }

    // Logs
    match /logs/{document=**} {

      allow read, write:
        if request.auth.uid != null;
    }
  }
}