import { useMutation } from "@galoymoney/client"
import { Spinner } from "@galoymoney/react"

import { translate } from "store/index"
import useMainQuery from "hooks/use-main-query"

import Icon from "components/icon"

const UsernameInput: React.FC<{ lightningAddressDomain: string, refetch: any }> = ({
  lightningAddressDomain,
  refetch,
}) => {

  const [userUpdateUsername, { loading, errorsMessage }] =
    useMutation.userUpdateUsername({
      onCompleted: () => {
        refetch()
      }
    })

  const submitUsername: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()

    const usernameInput = event.currentTarget.username
    userUpdateUsername({
      variables: {
        input: { username: usernameInput.value },
      },
    })
  }

  return (
    <div className="setting">
      <div className="icon">
        <Icon name="person" />
      </div>
      <div className="name">
        {translate("Set Lightning Address")}
        <div className="sub">{translate("You can do this operation ONLY one time")}</div>
      </div>
      <div className="action">
        <form onSubmit={submitUsername}>
          <div className="grouped-input-button">
            <div className="input-label-right">
              <input type="text" name="username" placeholder={translate("Username")} />
              <span>@{lightningAddressDomain}</span>
            </div>
            <button type="submit" disabled={loading}>
              {loading ? <Spinner size="small" /> : <Icon name="submit" />}
            </button>
          </div>
          {errorsMessage && <div className="error-hint">{errorsMessage}</div>}
        </form>
      </div>
    </div>
  )
}

const UsernameSetting: React.FC<{ guestView: boolean }> = ({ guestView }) => {
  const { username, lightningAddressDomain, refetch } = useMainQuery()

  if (!lightningAddressDomain) {
    throw new Error("No lightningAddressDomain value")
  }

  if (guestView || username) {
    return (
      <div className="setting">
        <div className="icon">
          <Icon name="person" />
        </div>
        <div className="name">
          {translate("Lightning Address")}
          <div className="sub">
            {guestView ? "(not logged in)" : `${username}@${lightningAddressDomain}`}
          </div>
        </div>
        <div className="action">
          <Icon name="lock" />
        </div>
      </div>
    )
  }

  return <UsernameInput lightningAddressDomain={lightningAddressDomain} refetch={refetch} />
}

export default UsernameSetting
