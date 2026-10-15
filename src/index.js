import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import { createLogger } from 'redux-logger';
import { HashRouter, Route } from 'react-router-dom';

import { AppContainer } from './styles';
import App from './components/App';
import reducer from './reducers';
import { loadCompositionFromSearch } from './composition/url';

const initialState = loadCompositionFromSearch(reducer(undefined, {}), window.location.search);

let store;
if (process.env.NODE_ENV === 'production') {
  store = createStore(reducer, initialState);
} else {
  const middleware = applyMiddleware(createLogger({
    collapsed: true,
    stateTransformer: state => ({
      dimensions: state.dimensions,
      currentColumn: state.currentColumn,
      playing: Boolean(state.interval),
      historyLayers: state.history.length,
      musicBox: state.musicBox,
    }),
  }));
  store = createStore(reducer, initialState, middleware);
}

ReactDOM.render(
  <Provider store={store} >
    <HashRouter>
      <AppContainer>
        <Route path="/" component={App} />
      </AppContainer>
    </HashRouter>
  </Provider>,
  document.getElementById('root'),
);

