import React from 'react';
import {useState, useEffect, useMemo} from 'react';

import {render} from 'react-dom';

import {GreatCircleLayer} from 'deck.gl';
import DeckGL from '@deck.gl/react';
import {
  COORDINATE_SYSTEM,
  _GlobeView as GlobeView
} from '@deck.gl/core';
import {GeoJsonLayer, IconLayer} from '@deck.gl/layers';
import {SimpleMeshLayer} from '@deck.gl/mesh-layers';

import {SphereGeometry} from '@luma.gl/core';
import {load} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv';

// Data source
const DATA_URL = 'https://raw.githubusercontent.com/datopian/global-presence/master/data/clients.csv';

const INITIAL_VIEW_STATE = {
  longitude: -10,
  latitude: 40,
  zoom: 0.5
};

const EARTH_RADIUS_METERS = 6.3e6;

const DATOPIAN_LOCATIONS = [
  {Name: 'Datopian', coordinates: [-122.25846741601838, 37.52372710642201], Country: 'USA'},
  {Name: 'Datopian', coordinates: [-0.118092, 51.509865], Country: 'United Kingdom'}
];

/* eslint-disable react/no-deprecated */
export default function App({data}) {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [intervalID, setIntervalID] = useState(null);

  useEffect(() => {
    const newViewState = {
      longitude: viewState.longitude - 0.2,
      latitude: 40,
      zoom: 0.5
    }
    setIntervalID(setInterval(() => {
      setViewState(newViewState);
    }, 50));
    return () => {
      clearInterval(intervalID);
    };
  }, [viewState]);

  const backgroundLayers = useMemo(
    () => [
      new SimpleMeshLayer({
        id: 'earth-sphere',
        data: [0],
        mesh: new SphereGeometry({radius: EARTH_RADIUS_METERS, nlat: 18, nlong: 36}),
        coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
        getPosition: [0, 0, 0],
        getColor: [149,176,196]
      }),
      new GeoJsonLayer({
        id: 'earth-land',
        data: 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_land.geojson',
        // Styles
        stroked: false,
        filled: true,
        opacity: 0.8,
        getFillColor: [250,250,250]
      })
    ],
    []
  );

  const clientsIconLayer = new IconLayer({
    id: 'clients-icon-layer',
    data,
    iconAtlas: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/icon-atlas.png',
    iconMapping: {
      marker: {x: 0, y: 0, width: 128, height: 128, mask: true}
    },
    getIcon: d => 'marker',
    pickable: true,
    sizeScale: 15,
    getPosition: d => [d.Longitude, d.Latitude],
    getSize: d => 1.5,
    getColor: d => [255,158,86]
  });

  const datopianIconLayer = new IconLayer({
    id: 'datopian-icon-layer',
    data: DATOPIAN_LOCATIONS,
    iconAtlas: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/icon-atlas.png',
    iconMapping: {
      marker: {x: 0, y: 0, width: 128, height: 128, mask: true}
    },
    getIcon: d => 'marker',
    pickable: true,
    sizeScale: 15,
    getPosition: d => d.coordinates,
    getSize: d => 2,
    getColor: d => [27,143,140]
  });

  const arcsData = data.flatMap(
    (v) => DATOPIAN_LOCATIONS.map(w => {
      return {
        from: [v.Longitude, v.Latitude],
        to: w.coordinates
      }
    })
  );

  const arcLayer = new GreatCircleLayer({
    id: 'arc-layer',
    data: arcsData,
    pickable: false,
    getWidth: 0.5,
    getSourcePosition: d => d.from,
    getTargetPosition: d => d.to,
    getSourceColor: [239,158,86],
    getTargetColor: [239,158,86]
  });

  return (
    <>
      <DeckGL
        views={new GlobeView({keyboard: true, inertia: true})}
        viewState={viewState}
        controller={true}
        onClick={() => {
          if (intervalID) {
            clearInterval(intervalID);
            setIntervalID(null);
          } else {
            const newViewState = {
              longitude: viewState.longitude - 0.2,
              latitude: 40,
              zoom: 0.5
            };
            setViewState(newViewState);
          }
        }}
        layers={[backgroundLayers, clientsIconLayer, datopianIconLayer, arcLayer]}
        getTooltip={
          ({object}) => object && {
            html: `<h3>${object.Name}</h3>${object.Country}<br />${object.Sector}`,
            style: {
              backgroundColor: '#fff',
              fontSize: '0.8em'
            }
          }
        }
      />;
    </>
  );
}

export function renderToDOM(container) {
  load(DATA_URL, CSVLoader, {csv: {skipEmptyLines: true}})
    .then((team) => {
      render(<App data={team} />, container);
    });
}
