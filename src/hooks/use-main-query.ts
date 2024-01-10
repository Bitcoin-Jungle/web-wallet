import { gql } from "@apollo/client"
import { GaloyGQL } from "@galoymoney/client"

import { setLocale, useAppState, useAuthContext } from "store/index"
import { useMainQuery as useMainQueryGenerated } from "graphql/generated"

// TODO: move away from big gql queries in the future
gql`
  query main($isAuthenticated: Boolean!, $recentTransactions: Int, $range: PriceGraphRange!) {
    globals {
      nodesIds
      __typename
    }
    btcPriceList(range: $range) {
      timestamp
      price {
        base
        offset
        currencyUnit
        formattedAmount
      }
    }
    me @include(if: $isAuthenticated) {
      ...Me
      __typename
    }
  }
  fragment Me on User {
    id
    language
    username
    phone
    defaultAccount {
      id
      defaultWalletId
      wallets {
        id
        balance
        walletCurrency
        transactions(first: $recentTransactions) {
          ...TransactionList
          __typename
        }
        __typename
      }
      __typename
    }
    __typename
  }
  fragment TransactionList on TransactionConnection {
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
      __typename
    }
    edges {
      cursor
      node {
        __typename
        id
        status
        direction
        memo
        createdAt
        settlementAmount
        settlementFee
        settlementPrice {
          base
          offset
          currencyUnit
          formattedAmount
          __typename
        }
        initiationVia {
          __typename
          ... on InitiationViaIntraLedger {
            counterPartyWalletId
            counterPartyUsername
            __typename
          }
          ... on InitiationViaLn {
            paymentHash
            __typename
          }
          ... on InitiationViaOnChain {
            address
            __typename
          }
        }
        settlementVia {
          __typename
          ... on SettlementViaIntraLedger {
            counterPartyWalletId
            counterPartyUsername
            __typename
          }
          ... on SettlementViaLn {
            paymentSecret
            __typename
          }
          ... on SettlementViaOnChain {
            transactionHash
            __typename
          }
        }
      }
      __typename
    }
    __typename
  }
`

// FIX: should come from the client
type Language = "" | "en-US" | "es-SV"

const useMainQuery = () => {
  const { isAuthenticated, authIdentity } = useAuthContext()
  const { defaultLanguage } = useAppState()

  const { data, refetch } = useMainQueryGenerated({
    variables: { isAuthenticated, recentTransactions: 10, range: "ONE_DAY" },
    onCompleted: (completed) => {
      setLocale(completed?.me?.language ?? defaultLanguage)
    },
    context: {
      credentials: "omit",
    },
    errorPolicy: "all",
  })

  const pubKey = data?.globals?.nodesIds?.[0] ?? ""
  const lightningAddressDomain = "pay.bitcoinjungle.app"
  // @ts-ignore
  const btcPrice = data?.btcPriceList[data.btcPriceList.length - 1]?.price ?? undefined

  const me = data?.me

  // TODO: remove this when migration to graphql-codegen is done
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const wallets = (data?.me?.defaultAccount?.wallets ?? []) as Array<GaloyGQL.Wallet>
  const defaultWalletId = data?.me?.defaultAccount?.defaultWalletId
  const defaultWallet = wallets?.find((wallet) => wallet?.id === defaultWalletId)
  const btcWallet = me?.defaultAccount?.wallets[0] as GaloyGQL.BtcWallet
  const btcWalletId = btcWallet?.id
  const btcWalletBalance = isAuthenticated ? btcWallet?.balance ?? NaN : 0

  const transactions = me?.defaultAccount?.wallets[0]?.transactions

  const username = me?.username
  const phoneNumber = me?.phone
  const language = (me?.language ?? "DEFAULT") as Language

  return {
    lightningAddressDomain,
    btcPrice,
    pubKey,

    refetch,

    wallets,
    defaultWallet,
    defaultWalletId,

    btcWallet,
    btcWalletId,
    btcWalletBalance,

    usdWallet: undefined,
    usdWalletId: null,
    usdWalletBalance: 0,

    transactions,

    username,
    phoneNumber,
    language,
  }
}

export default useMainQuery
