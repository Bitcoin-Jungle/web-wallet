import { translate, useAuthContext } from "store/index"

import Icon from "components/icon"

type FCT = React.FC<{ guestView: boolean }>

const EmailSetting: FCT = ({ guestView }) => {
  const { authIdentity } = useAuthContext()

  return (
    <div className="setting">
      
    </div>
  )
}

export default EmailSetting
