import { useState, useEffect } from "react"
import { config, NoPropsFCT, useAppDispatcher, history } from "store/index"
import useMainQuery from "hooks/use-main-query"
import useMyUpdates from "hooks/use-my-updates"
import Header from "components/header"
import {
  formatUsd,
  parsePaymentDestination,
  useMutation,
} from "@galoymoney/client"
import { Spinner } from "@galoymoney/react"

const SinpeScreen: NoPropsFCT = () => {
  const dispatch = useAppDispatcher()
  const { btcWalletBalance, pubKey, username, phoneNumber, language, btcWallet, refetch } = useMainQuery()
  const [ initialLoad, setInitialLoad ] = useState(true)
  const [ mySatBalance, setMySatBalance ] = useState(0)
  const { satsToUsd } = useMyUpdates()
  const [ createInvoice ] = useMutation.lnInvoiceCreate()
  const [ sendPayment ] = useMutation.lnInvoicePaymentSend({
    onCompleted: () => {
      refetch()
    }
  })

  const postMessageToIframe = (data: object) => {
    if(data !== null) {
      // @ts-ignore
      document.querySelector('iframe')?.contentWindow?.postMessage(JSON.stringify(data), '*')
    }
  }

  const newInvoice = async(satAmount: number, btcWalletId: string) => {
    try {

      const { data } = await createInvoice({
        variables: {
          input: { 
            walletId: btcWalletId,
            amount: satAmount, 
            memo: `SINPE to BTC (${satAmount} sats)`
          },
        },
      })

      const errs = data?.lnInvoiceCreate?.errors
      handleInvoiceReturn(data?.lnInvoiceCreate?.invoice?.paymentRequest, errs)
    } catch(err) {
      console.log('error', err)
      handleInvoiceError(err)
    }
  }

  // @ts-ignore
  const handleInvoiceReturn = (invoice: string | undefined, errors: Array | undefined) => {  

    if (!errors || !errors.length) {
      setTimeout(() => {
        postMessageToIframe({action: "invoiceCreated", bolt11: invoice})
      }, 250)

    } else {
      let errorMessage = ''
      if (errors && Array.isArray(errors)) {
        errorMessage = errors.map((error) => error.message).join(", ")
      } else {
        errorMessage = "An unexpected error has occurred."
      }

      alert("Error! " + errorMessage)
    }
  }

  const handleInvoiceError = (error: string) => {
   alert("An unexpected error has occurred.")
  }

  const payLightning = async (invoice: string, btcWalletId: string, pubKey: string, btcWalletBalance: number) => {
    try {
      const parsedInvoice = parsePaymentDestination({
        destination: invoice,
        network: config.network,
        pubKey,
      })

      if (parsedInvoice && parsedInvoice.amount && parsedInvoice.amount > btcWalletBalance) {
        // @ts-ignore
        alert(`Error! Total of ${formatUsd(satsToUsd(parsedInvoice.amount))} exceeds your balance of ${formatUsd(satsToUsd(btcWalletBalance))}`)
        return
      }

      const { data } = await sendPayment({
        variables: {
          input: {
            walletId: btcWalletId,
            paymentRequest: invoice,
            memo: "SINPE",
          },
        },
      })

      const status = data?.lnInvoicePaymentSend?.status
      const errs = data?.lnInvoicePaymentSend?.errors
      handlePaymentReturn(status, errs)
    } catch(e) {
      console.log('payLightning catch', e)
      handlePaymentError(e)
    }
  }

  const confirmLightning = async (amount: number) => {
    // @ts-ignore
    const conf = confirm(`You are about to send a payment of ${amount} sats worth ${formatUsd(satsToUsd(amount))}. Would you like to proceed?`)
    
    if(conf) {
      postMessageToIframe({action: "userConfirmed"})
    }
  }

  // @ts-ignore
  const handlePaymentReturn = (status: string | null | undefined, errors: Array | undefined) => {      
    if (status === "SUCCESS" || status === "PENDING" || status === "ALREADY_PAID") {
     
    } else {
      let errorMessage = ''
      if (errors && Array.isArray(errors)) {
        errorMessage = errors.map((error) => error.message).join(", ")
      } else {
        errorMessage = "An unexpected error has occurred."
      }

      alert("Error! " + errorMessage)
    }
  }

  const handlePaymentError = (error: string) => {
   console.log('handlePaymentError', error)
   // alert("An unexpected error has occurred.")
  }

  const handleMessage = async (e: any) => {
    const data = JSON.parse(e.data)
    switch(data.action) {
      case "confirm":
        await confirmLightning(data.amount)

        break;
      case "invoice":
        const invoice = data.bolt11
        await payLightning(invoice, btcWallet.id, pubKey, btcWalletBalance)

        break;

      case "createInvoice":
        newInvoice(data.satAmount, btcWallet.id)

        break;

      case "complete":
        alert(`${data.title}\n${data.subtext}`)
        history.push("/")

        break;

      case "sendSms":
        //nada
        break;

      case "clickLink":
        // @ts-ignore
        window.open(data.url, '_blank').focus()
        break;
    }
  }

  useEffect(() => {
    window.removeEventListener("message", handleMessage)
    window.addEventListener('message', handleMessage)

    return () => window.removeEventListener("message", handleMessage)
  }, [btcWallet, pubKey, btcWalletBalance])

  useEffect(() => {
    setTimeout(() => {
      setMySatBalance(btcWalletBalance)
      setInitialLoad(false)
      refetch()
    }, 2000)
  }, [])

  if(!username && !initialLoad) {
    return (
      <div className="sinpe">
        <Header page="sinpe" />

        <h3>Please configure a username before using SINPE.</h3>
      </div>
    )
  }

  return (
    <div className="sinpe">
      <Header page="sinpe" />
      {/*!initialLoad ?
        <iframe 
          style={{width: "100%", height: "80vh", border: "none"}} 
          // @ts-ignore
          src={`${config.ordersBaseUrl}?fromBJ=true&phone=${encodeURIComponent(phoneNumber)}&username=${encodeURIComponent(username)}&lang=${language}&satBalance=${mySatBalance}`}
        >    
        </iframe>
      : 
        <Spinner size="big" />
      */}
      <h3>Please use Bull Bitcoin in a separate window.</h3>
      <p>Sorry, we're experiencing a technical glitch right now. To be able to buy and sell Bitcoin, please navigate to cr.bullbitcoin.com in another window.</p>
      <a href="https://cr.bullbitcoin.com" target="_blank">
        Continue to Bull Bitcoin
      </a>
    </div>
  )
}

export default SinpeScreen
