import React from 'react';

import Header from './Header';
import Controls from '../containers/Controls';
import Grid from '../containers/Grid';
import About from './About';
import { Workspace, WorkspaceHeader } from '../styles';

const App = ({ location, history }) => {
  const showingAbout = location.pathname === '/about';
  return (
    <Workspace>
      <div aria-hidden={showingAbout ? 'true' : undefined} ref={element => { if (element) element.inert = showingAbout; }}>
        <Grid />
        <WorkspaceHeader>
          <Header url="/about" />
          <Controls suspended={showingAbout} />
        </WorkspaceHeader>
      </div>
      {showingAbout ? <About onClose={() => history.push('/')} /> : null}
    </Workspace>
  );
};

export default App;
