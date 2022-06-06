import React, { useEffect } from 'react';
// import * as d3 from "d3";
// import style from './index.less';

// Delete me
export const InbizGraph = () => {

  useEffect(() => {
  }, []);

  return <div className={'graph'}>
    <div className='box'>内容</div>
    <svg width={600} height={600}>
      <g>
        <circle cx={60} cy={60} r="50" fill="green"></circle>
      </g>
    </svg>
  </div>;
};