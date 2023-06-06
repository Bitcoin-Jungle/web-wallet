import { useContext, createContext } from "react"

import { initializeApp } from "firebase/app"
import { getMessaging } from "firebase/messaging"
import { gql } from "@apollo/client"

const firebaseConfig = {
  apiKey: "AIzaSyASYz37SmN5JGJZuMy5J8YCD6_YF70hVkQ",
  authDomain: "galoy-pura-vida.firebaseapp.com",
  projectId: "galoy-pura-vida",
  storageBucket: "galoy-pura-vida.appspot.com",
  messagingSenderId: "864118073014",
  appId: "1:864118073014:web:e2e118331b93a07f37e817",
  measurementId: "G-K06EMBK41L"
}


gql`
  mutation deviceNotificationTokenCreate($deviceToken: String!) {
    deviceNotificationTokenCreate(input: { deviceToken: $deviceToken }) {
      errors {
        message
      }
      success
    }
  }
`

const app = initializeApp(firebaseConfig)
const messaging = getMessaging(app)

export const FirebaseContext = createContext({
  app: app,
  messaging: messaging,
})

export const useFirebaseContext = () => {
  return useContext(FirebaseContext)
}
