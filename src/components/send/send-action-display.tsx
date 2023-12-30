import { MouseEvent } from "react"

import { formatUsd, GaloyGQL } from "@galoymoney/client"
import { SatFormat, Spinner, SuccessCheckmark } from "@galoymoney/react"

import { translate } from "store/index"

import useMyUpdates from "hooks/use-my-updates"

type FeeAmount = {
  amount: number | undefined
  currency: "CENTS" | "SATS"
}

type FeeDisplayFCT = React.FC<{ 
  amount: FeeAmount | undefined 
  targetConfirmations: number | undefined
  setTargetConfirmations: any | undefined

}>

const FeeDisplay: FeeDisplayFCT = ({ amount, targetConfirmations, setTargetConfirmations }) => {
  const { satsToUsd } = useMyUpdates()

  const getEstimatedWaitTime = () => {
    if(!targetConfirmations) {
      return ''
    }

    if(targetConfirmations === 1) {
      return `~10 minutes`
    }

    const numHours = Math.floor(targetConfirmations / 6)

    return `~${numHours} hours`
  }

  if (amount?.amount === undefined) {
    return null
  }
  return (
    <div className="fee-amount">
      <div className="label">Fee</div>
      <div className="content">
        <div>
          {amount.currency === "SATS" ? (
            <>
              <SatFormat amount={amount.amount} />
              {satsToUsd && amount.amount > 0 && (
                <div className=" small">
                  &#8776; {formatUsd(satsToUsd(amount.amount))}
                </div>
              )}
            </>
          ) : (
            <div>{formatUsd(amount.amount / 100)}</div>
          )}
          {targetConfirmations &&
            <div>
              <input type="range" min="1" max="40" step="5" value={targetConfirmations} onChange={setTargetConfirmations} />
              <br />
              <span>Estimated Wait Time: {getEstimatedWaitTime()}</span>
            </div>
          }
        </div>
      </div>
    </div>
  )
}

type StatusDisplayFCT = React.FC<{ status: GaloyGQL.PaymentSendResult }>

const StatusDisplay: StatusDisplayFCT = ({ status }) => {
  switch (status) {
    case "ALREADY_PAID":
      return <div className="error">{translate("Invoice is already paid")}</div>
    case "SUCCESS":
      return <SuccessCheckmark />
    default:
      return <div className="error">{translate("Payment failed")}</div>
  }
}

type SendActionDisplayFCT = React.FC<{
  loading: boolean
  error: string | undefined
  data: GaloyGQL.PaymentSendPayload | undefined
  feeAmount: FeeAmount | undefined
  reset: () => void
  handleSend: (event: MouseEvent<HTMLButtonElement>) => void
  targetConfirmations?: number | undefined
  setTargetConfirmations?: any | undefined
}>

const SendActionDisplay: SendActionDisplayFCT = ({
  loading,
  error,
  data,
  feeAmount,
  reset,
  handleSend,
  targetConfirmations,
  setTargetConfirmations,
}) => {

  const handleChange = (e: any) => {
    setTargetConfirmations(parseInt(e.target.value))

  }

  if (error) {
    return <div className="error">{error}</div>
  }

  if (data?.status) {
    return (
      <div className="invoice-status">
        <StatusDisplay status={data.status} />
        <button onClick={reset}>{translate("Send another payment")}</button>
      </div>
    )
  }

  return (
    <>
      {feeAmount !== undefined && <FeeDisplay amount={feeAmount} targetConfirmations={targetConfirmations} setTargetConfirmations={handleChange} />}
      <button onClick={handleSend} disabled={loading}>
        {translate("Send Payment")} {loading && <Spinner size="small" />}
      </button>
    </>
  )
}

export default SendActionDisplay
