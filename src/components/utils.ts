// 判断对象是否为空
export const objType = (o:object) => o.constructor===Object?JSON.stringify(o)!=='{}':false;

const getKey = (nodes: any, num: number) => {
  var keyNum = null;
  nodes.map((item: { key: number }, index: number) => {
    if (item.key == num) {
      keyNum = index;
    }
  });
  return keyNum;
};

// 数据预加载，处理圆
export const getNodes = (nodes: any) => {
  // FIXME 不知道这个lables是什么
  delete nodes.labels;
  const keyArr = Object.keys(nodes);
  if (keyArr.length) {
    return keyArr.map(function (val) {
      return {
        key: val,
        name: nodes[val].title,
        type: nodes[val].type,
        id: nodes[val].conceptId,
        show: true,
        node: nodes[val],
      };
    });
  };
  return [];
};
// 数据预加载，处理线
export const getLinks = (nodes: any, edges: any) => {
  const keyArr = Object.keys(edges);

  if (keyArr.length) {
    return keyArr.map(function (val) {
      // FIXME 重复线条导致双向连接重叠，去除一条
      const sourceKey = getKey(nodes, edges[val].from);
      const targetKey: number = getKey(nodes, edges[val].to) || 0;
      return {
        key: val,
        source: sourceKey,
        target: targetKey,
        relation: edges[val].type,
        show: true,
        link: edges[val],
        type: nodes[targetKey].type,
      };
    });
  } 
  return [];
};

// // 双击后，节点位置会变化， 此方法把anchor节点间距固定。
// export const initAnchorX = (nodes:any, params:{height:number}) => {
//   let AnchorNum = 0;
//   console.log(params, 'params');
//   nodes.map((item:any) => {
//     if (item.node.anchor || item.node.anchorMore === 'true') {
//       AnchorNum++;
//       if (AnchorNum === 1) {
//         console.log(1);
//         // 在这里固定anchor的显示到中间
//         item.fy = 0;
//         // item.fx = 0 - params.height / 4 + 100;
//         item.fx = 0 - params.height / 4 - 100;
//       } else if (AnchorNum === 2) {
//         console.log(2);
//         item.fx = item.x + 300;
//       } else {
//         console.log(3);
//         item.fx = item.x - 300;
//       }
//     }
//   });
// }