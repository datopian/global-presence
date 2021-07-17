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
const DATA_URL = 'https://raw.githubusercontent.com/datopian/global-presence/master/data/team.csv';

const INITIAL_VIEW_STATE = {
  longitude: 0,
  latitude: 20,
  zoom: 0.5
};

const EARTH_RADIUS_METERS = 6.3e6;

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

  const iconLayer = new IconLayer({
    id: 'icon-layer',
    data,
    // iconAtlas and iconMapping should not be provided
    // getIcon return an object which contains url to fetch icon of each data point
    getIcon: d => ({
      url: d.avatar,
      width: 128,
      height: 128,
      anchorY: 128
    }),
    getSize: 2,
    pickable: true,
    sizeScale: 15,
    getPosition: d => [d.lng, d.lat]
  });

  const arcsData = data.flatMap(
    (v, i) => data.slice(i+1).map(w => {
      return {
        from: [v.lng, v.lat],
        to: [w.lng, w.lat]
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
        views={new GlobeView()}
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}
        effects={[lightingEffect]}
        layers={[backgroundLayers, iconLayer, arcLayer]}
        getTooltip={
          ({object}) => object && `${object.fullname}\n${object.position}\nhttps://www.github.com/${object.username}\n${object.country}`
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
