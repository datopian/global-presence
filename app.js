import React from 'react';
import {useState, useMemo, useCallback} from 'react';

import {render} from 'react-dom';

import {GreatCircleLayer} from 'deck.gl';
import DeckGL from '@deck.gl/react';
import {
  COORDINATE_SYSTEM,
  _GlobeView as GlobeView,
  LightingEffect,
  AmbientLight
} from '@deck.gl/core';
import {GeoJsonLayer, IconLayer} from '@deck.gl/layers';
import {SimpleMeshLayer} from '@deck.gl/mesh-layers';

import {SphereGeometry} from '@luma.gl/core';
import {load} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv';

// Data source
const DATA_URL = 'https://raw.githubusercontent.com/datopian/global-presence/master/data/clients.csv';

const INITIAL_VIEW_STATE = {
  longitude: 0,
  latitude: 20,
  zoom: 0.5
};

const EARTH_RADIUS_METERS = 6.3e6;

const DATOPIAN_LOCATIONS = [
  {Name: 'Datopian', coordinates: [-75.500000, 39.000000], Country: 'USA'},
  {Name: 'Datopian', coordinates: [-0.118092, 51.509865], Country: 'United Kingdom'},
  {Name: 'Datopian', coordinates: [24.753574, 59.436962], Country: 'Estonia'}
];

const ambientLight = new AmbientLight({
  color: [255, 255, 255],
  intensity: 0.7
});
// create lighting effect with light sources
const lightingEffect = new LightingEffect({ambientLight});

/* eslint-disable react/no-deprecated */
export default function App({data}) {

  const backgroundLayers = useMemo(
    () => [
      new SimpleMeshLayer({
        id: 'earth-sphere',
        data: [0],
        mesh: new SphereGeometry({radius: EARTH_RADIUS_METERS, nlat: 18, nlong: 36}),
        coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
        getPosition: [0, 0, 0],
        getColor: [49,49,56]
      }),
      new GeoJsonLayer({
        id: 'earth-land',
        data: 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_land.geojson',
        // Styles
        stroked: false,
        filled: true,
        opacity: 0.8,
        getFillColor: [27,143,140]
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
    getSize: d => 1,
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
    getColor: d => [149,176,196]
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
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}
        effects={[lightingEffect]}
        layers={[backgroundLayers, clientsIconLayer, datopianIconLayer, arcLayer]}
        getTooltip={
          ({object}) => object && `${object.Name}\n${object.Country}\n${object.Sector || ''}`
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
