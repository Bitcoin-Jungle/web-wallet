import { NoPropsFCT } from "store/index"

import Header from "components/header"

const MapScreen: NoPropsFCT = () => {

  return (
    <div className="map">
      <Header page="map" />
      <iframe 
        style={{width: "100%", height: "80vh", border: "none"}} 
        src={`https://maps.bitcoinjungle.app/?fromBJ=true`}
      >    
      </iframe>
    </div>
  )
}

export default MapScreen
