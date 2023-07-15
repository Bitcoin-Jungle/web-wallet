import { truncatedDisplay, useQuery } from "@galoymoney/client"
import { Spinner } from "@galoymoney/react"

import { useState, useEffect, useRef } from "react"

import { Map, Marker, Annotation, ColorScheme, FeatureVisibility, AnnotationProps } from 'mapkit-react'

import { translate, history, useAuthContext, NoPropsFCT } from "store/index"
import { storage } from "store/local-storage"

import ErrorMessage from "components/error-message"
import Header from "components/header"
import Icon from "components/icon"

const colorThemeInStorage = storage.get("colorTheme")
let mapColorScheme = (typeof window !== "undefined" ? window.matchMedia("(prefers-color-scheme: dark)").matches ? ColorScheme.Dark : ColorScheme.Light : ColorScheme.Light)

interface Pin {
    acceptsLiquid?: boolean;
    acceptsLightning?: boolean;
    latLong?: {
      _latitude?: number;
      _longitude?: number;
    },
    name?: string;
    acceptsOnChain?: boolean;
    approved?: boolean;
    id?: string;
    titleVisibility?: FeatureVisibility;
    bitcoinJungleUsername?: string;
}

declare global {
  interface Window {  mapkit: any; }
}

if(colorThemeInStorage == "dark") {
  mapColorScheme = ColorScheme.Dark
} else if (colorThemeInStorage == "light") {
  mapColorScheme = ColorScheme.Light
}

const MapScreen: NoPropsFCT = () => {
  // @ts-ignore
  const mapRef = useRef<window.mapkit.Map>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState<Pin>({})
  const [problemDescription, setProblemDescription] = useState("")
  const [token, setToken] = useState("")
  const [pins, setPins] = useState<
    Array<Pin>
  >([])

  useEffect(() => {
    fetch('/api/token')
    .then((res) => res.text())
    .then((token) => setToken(token))
    .then(fetchPins)
    .then(() => setLoading(false))
  }, [])

  const fetchPins = async () => {
    try {
      const res = await fetch('https://us-central1-bitcoin-jungle-maps.cloudfunctions.net/location-list?includeMigrated=true')
      const data = await res.json()

      if(res.ok) {
        console.log(data)
        setPins(data)
      }
    } catch (err) {
      console.log(err)
    }

    return true
  }

  const onLoad = () => {
    const map = mapRef?.current

    if(!map) return

    map.addEventListener('zoom-end', () => {
      const curentCameraDistance = map.cameraDistance.toFixed(0)

      if(curentCameraDistance < 10000) {
        map.annotations = map.annotations.map((el: Pin) => {
          el.titleVisibility = window.mapkit.FeatureVisibility.Visible

          return el
        })

      } else {
        map.annotations = map.annotations.map((el: Pin) => {
          el.titleVisibility = window.mapkit.FeatureVisibility.Hidden

          return el
        })
      }
    })

    map.annotations.map((el: AnnotationProps) => {
      const calloutDelegate = {
        calloutContentForAnnotation: function() {
          const pin = pins.find((e) => e.id === el.subtitle)

          if(!pin) return null

          var element = document.createElement("div");
          element.className = "review-callout-content";
          var title = element.appendChild(document.createElement("h5"));
          title.textContent = pin.name || ""
          
          if(pin.acceptsOnChain) {
              var img = element.appendChild(document.createElement("img"));
              img.src = "https://storage.googleapis.com/bitcoin-jungle-maps-images/onchain.png"
              img.width = 20
              img.style.display = "inline"
          }

          if(pin.acceptsLightning) {
              var img = element.appendChild(document.createElement("img"));
              img.src = "https://storage.googleapis.com/bitcoin-jungle-maps-images/lightning.png"
              img.width = 20
              img.style.display = "inline"
          }

          if(pin.acceptsLiquid) {
              var img = element.appendChild(document.createElement("img"));
              img.src = "https://storage.googleapis.com/bitcoin-jungle-maps-images/liquid.png"
              img.width = 20
              img.style.display = "inline"
          }

          var problemContainer = element.appendChild(document.createElement("div"))

          problemContainer.className = "problem-container"

          var problemIcon = problemContainer.appendChild(document.createElement("a"))

          problemIcon.appendChild(document.createTextNode("Report"))
          problemIcon.href = "#"
          problemIcon.className = "report-problem"
          problemIcon.onclick = (e) => {
            e.preventDefault()
            setShowModal(pin)
          }

          return element;
        },
        calloutRightAccessoryForAnnotation: function() {
          const pin = pins.find((e) => e.id === el.subtitle)

          if(!pin) return null

          if(pin.bitcoinJungleUsername) {
              const accessoryViewRight = document.createElement("a");
              accessoryViewRight.className = "right-accessory-view";
              accessoryViewRight.href = "#";
              accessoryViewRight.onclick = () => {
                if(!pin.bitcoinJungleUsername) return false

                handleSendBitcoin(pin.bitcoinJungleUsername)
              }
              accessoryViewRight.appendChild(document.createTextNode("➡"));

              return accessoryViewRight;
          } else {
              const accessoryViewRight = document.createElement("a");
              accessoryViewRight.className = "right-accessory-view";
              accessoryViewRight.href = "#";

              return accessoryViewRight;
          }
        }
      }

      // @ts-ignore
      el.callout = calloutDelegate

      return el
    })
  }

  const handleSendBitcoin = (contactUsername: string) => {
    history.push(`/send?to=${contactUsername}`)
  }

  const sendProblemReport = async () => {
    try {
      if(!showModal) return false

      setLoading(true)

      const response = await fetch('https://maps.bitcoinjungle.app/api/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: showModal.id,
          description: problemDescription,
        }),
      })

      const responseData = await response.json();

      setLoading(false)

      if(!response.ok) {
          alert(`Error! ${responseData.error}`)
      } else {
          alert("Thank you for the report. We will investigate and take action soon.")

          setProblemDescription("")
          setShowModal({})
      }
    } catch(e) {
      alert(e)
      setLoading(false)
      return false
    }
  }

  return (
    <div className="map">
      <Header page="contacts" />

      {(loading || !token) && <Spinner size="big" />}

      {token && pins.length > 0 && 
        <Map 
          ref={mapRef}
          token={token}
          initialRegion={{
            centerLatitude: 9.1549238,
            centerLongitude: -83.7570566,
            latitudeDelta: 0.5,
            longitudeDelta: 0.5,
          }}
          colorScheme={mapColorScheme}
          onLoad={onLoad}
        >
          {pins.map((pin) => {
            return (
              <Marker 
                key={pin?.id}
                longitude={pin?.latLong?._longitude || 0}
                latitude={pin?.latLong?._latitude || 0}
                title={pin?.name}
                subtitle={pin?.id}
                titleVisibility={FeatureVisibility.Hidden}
                subtitleVisibility={FeatureVisibility.Hidden}
              />
            )
          })}
        </Map>
      }

      {Object.keys(showModal).length > 0 &&
        <div className="modal-background">
          <div className="modal-content">
            <div className="title">
              Problem at {showModal.name}
            </div>
            <div>
              <p>Please describe the problem you experienced at {showModal.name} so that we can investigate and take action.</p>
              <textarea onChange={(e) => {setProblemDescription(e.target.value)}} value={problemDescription} style={{width: "initial"}}></textarea>
            </div>
            <div className="modal-footer">
              <button style={{backgroundColor: "var(--color-highlight-bg)"}} onClick={() => setShowModal({})}>Cancel</button>
              <button style={{marginLeft: "10px"}} onClick={sendProblemReport} disabled={loading}>Send Report</button>
            </div>
          </div>
        </div>
      }
    </div>
  )
}

export default MapScreen
