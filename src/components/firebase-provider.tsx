const PUSH_TOKEN_SET = 'pushTokenSet'

import { useState, useEffect, useCallback, ReactNode } from "react"
import { useErrorHandler } from "react-error-boundary"

import useMainQuery from "hooks/use-main-query"
import { useDelayedQuery } from "@galoymoney/client"

import { onMessage, getToken } from "firebase/messaging"


import {
  storage,
  useFirebaseContext,
  useAuthContext,
  FirebaseContext,
} from "store/index"

import {
  useDeviceNotificationTokenCreateMutation,
} from "graphql/generated"

type FCT = React.FC<{
  children: ReactNode
}>

export const FirebaseProvider: FCT = ({ children }) => {
  const { isAuthenticated } = useAuthContext()
  const { app, messaging } = useFirebaseContext()
  const [ pushToken, setPushToken ] = useState("")
  const { refetch } = useMainQuery()
  // const { refetch } = useDelayedQuery.transactionList()

  const [deviceNotificationTokenCreate] = useDeviceNotificationTokenCreateMutation()

  try {

    onMessage(messaging, function(payload) {
      console.log(
          "[home.tsx] Received foreground message ",
          payload,
      );

      setTimeout(refetch, 1000)
    })
  
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

        const isAlreadySet = storage.get(PUSH_TOKEN_SET)

        if(!isAlreadySet || isAlreadySet !== pushToken) {
          console.log('syncing push token to server')
          deviceNotificationTokenCreate({
            variables: {
              deviceToken: pushToken,
            }
          })

          storage.set(PUSH_TOKEN_SET, pushToken)
        }
      }
    }, [pushToken, isAuthenticated])

    useEffect(() => {
      getPushToken()
    }, [isAuthenticated])
  } catch(e) {
    console.log(e)
  }

  // const client = useMemo(() => {
   
  // }, [galoyClient, handleError, authSession])

  return (
    <FirebaseContext.Provider
      value={{
        app: app,
        messaging: messaging,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  )
}

export default FirebaseProvider
