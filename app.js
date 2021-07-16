import React from 'react';
import {useState, useMemo, useCallback} from 'react';

import {render} from 'react-dom';

import { Octokit } from '@octokit/rest';
const octokit = new Octokit();
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
const DATA_URL = 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/globe';

const INITIAL_VIEW_STATE = {
  longitude: 0,
  latitude: 20,
  zoom: 0
};

const EARTH_RADIUS_METERS = 6.3e6;

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
        getColor: [255, 255, 255]
      }),
      new GeoJsonLayer({
        id: 'earth-land',
        data: 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_land.geojson',
        // Styles
        stroked: false,
        filled: true,
        opacity: 0.1,
        getFillColor: [30, 80, 120]
      })
    ],
    []
  );

  const layer = new IconLayer({
    id: 'icon-layer',
    data: octokit.orgs.listMembers({
      org: 'datopian',
    }).then(result => result.data),
    // iconAtlas and iconMapping should not be provided
    // getIcon return an object which contains url to fetch icon of each data point
    getIcon: d => ({
      url: d.avatar_url,
      width: 128,
      height: 128,
      anchorY: 128
    }),
    // icon size is based on data point's contributions, between 2 - 25
    getSize: 2,
    pickable: true,
    sizeScale: 15,
    getPosition: d => d.coordinates
  });

  return (
    <>
      <DeckGL
        views={new GlobeView()}
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}
        layers={[backgroundLayers, layer]}
      />
    </>
  );
}

export function renderToDOM(container) {
  render(<App />, container);

  async function loadData(dates) {
    const data = [];
    for (const date of dates) {
      const url = `${DATA_URL}/${date}.csv`;
      const flights = await load(url, CSVLoader, {csv: {skipEmptyLines: true}});
      data.push({flights, date});
      render(<App data={data} />, container);
    }
  }
}
