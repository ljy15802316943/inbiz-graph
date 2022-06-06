import 'react-app-polyfill/ie11';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { InbizGraph } from '../.';
import '../src/index.less';

const App = () => {
  return (
    <div>
      <InbizGraph />
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));