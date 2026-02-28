import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getAnalytics, isSupported } from 'firebase/analytics'

const firebaseConfig = {
  apiKey:            'AIzaSyBIEd54VWcaAtYYla6NwxxJzSHxAW42_Ik',
  authDomain:        'dragscape.firebaseapp.com',
  projectId:         'dragscape',
  storageBucket:     'dragscape.firebasestorage.app',
  messagingSenderId: '212367442960',
  appId:             '1:212367442960:web:15d06339faa61a745c3695',
  measurementId:     'G-HEZL7LFNCX',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db   = getFirestore(app)

// Analytics only in browser environments that support it
isSupported().then(yes => { if (yes) getAnalytics(app) })

export default app
