const PUSH_TOKEN_SET = 'pushTokenSet'

import { useEffect, useState } from "react"

import { translate, useAuthContext, NoPropsFCT } from "store/index"

import Header from "components/header"
import TransactionList from "components/transactions/list"
import { gql } from "@apollo/client"

import { initializeApp } from "firebase/app"
import { getMessaging, getToken, onMessage } from "firebase/messaging"

import {
  useDeviceNotificationTokenCreateMutation,
} from "graphql/generated"

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

const firebaseConfig = {
  apiKey: "AIzaSyASYz37SmN5JGJZuMy5J8YCD6_YF70hVkQ",
  authDomain: "galoy-pura-vida.firebaseapp.com",
  projectId: "galoy-pura-vida",
  storageBucket: "galoy-pura-vida.appspot.com",
  messagingSenderId: "864118073014",
  appId: "1:864118073014:web:e2e118331b93a07f37e817",
  measurementId: "G-K06EMBK41L"
}

const app = initializeApp(firebaseConfig)
const messaging = getMessaging(app)

onMessage(messaging, function(payload) {
  console.log(
      "[firebase-messaging-sw.js] Received foreground message ",
      payload,
  );
})

gql`
  query btcPriceList($range: PriceGraphRange!) {
    btcPriceList(range: $range) {
      timestamp
      price {
        base
        offset
        currencyUnit
      }
    }
  }
`

const Home: NoPropsFCT = () => {
  const { isAuthenticated } = useAuthContext()
  const [ pushToken, setPushToken ] = useState("")

  const [deviceNotificationTokenCreate] = useDeviceNotificationTokenCreateMutation()

  const getPushToken = () => {
    getToken(
      messaging, 
      {
        vapidKey: "BJ8Il2h_dadKP74G6fkavY_HABuojg0mmDJdKszQYIvI2Da35NZRHX5esj3wRs5QYx0HLtjIhwB6_tjfno9GP5g",
      }
    )
    .then((currentToken) => {
      if (currentToken) {
        console.log('i have tokenz!', currentToken)
        // Send the token to your server and update the UI if necessary
        // ...
        setPushToken(currentToken)
      } else {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            console.log('Notification permission granted.');
            getPushToken()
            
          } else {
            console.log('Unable to get permission to notify.');
          }
        });
      }
    }).catch((err) => {
      console.log('An error occurred while retrieving token. ', err);
      // ...
    })
  }

  useEffect(() => {
    if(pushToken.length && isAuthenticated) {

      const isAlreadySet = localStorage.getItem(PUSH_TOKEN_SET)

      if(!isAlreadySet || isAlreadySet !== pushToken) {
        console.log('syncing push token to server')
        deviceNotificationTokenCreate({
          variables: {
            deviceToken: pushToken,
          }
        })

        localStorage.setItem(PUSH_TOKEN_SET, pushToken)
      }
    }
  }, [pushToken, isAuthenticated])

  useEffect(() => {
    getPushToken()
  }, [isAuthenticated])

  return (
    <>
      <div className="home">
        <Header page="home" />

        <div className="recent-transactions">
          {isAuthenticated && (
            <>
              <div className="header">{translate("Recent Transactions")}</div>
              <TransactionList />
            </>
          )}
        </div>
      </div>

      <div id="powered-by">
        <div className="content">
          {translate("Powered By")}{" "}
          <a href="https://galoy.io/" target="_blank" rel="noreferrer">
            Galoy
          </a>
        </div>
      </div>
    </>
  )
}

export default Home
