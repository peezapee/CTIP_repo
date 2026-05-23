rules_version = '2';

service cloud.firestore {

  match /databases/{database}/documents {

    match /incidents/{document=**} {
      allow read, write:
        if request.auth.uid != null;
    }

    match /users/{userId} {
      allow read, write:
        if request.auth.uid == userId
        || request.auth.uid != null;
    }

    match /trainingModules/{document=**} {
      allow read:
        if request.auth.uid != null;

      allow create, write, delete:
        if request.auth.token.role == 'admin';
    }

    match /enrollments/{document=**} {

      allow read:
        if request.auth.uid != null;

      allow create:
        if request.auth != null;

      allow update, delete:
        if request.auth.token.role == 'admin'
        || request.auth.uid == resource.data.guideId;
    }

    match /badges/{document=**} {

      allow read:
        if request.auth.uid != null;

      allow create, write, delete:
        if request.auth.token.role == 'admin';
    }

    match /logs/{document=**} {
      allow read, write:
        if request.auth.uid != null;
    }
    
    match /moduleRequests/{document=**} {
      allow read, write:
        if request.auth.uid != null;
    }
    
    // IoT sensor data from ESP32
    match /sensorData/{document=**} {
      allow read, write: if true;
    }
  }
}