import React, { useEffect, useState, useImperativeHandle } from 'react';
import { Select, Switch, message, InputNumber } from 'antd';
import * as d3 from 'd3';
import { objType, getNodes, getLinks, sort, getColor } from './components/utils';
import axios from './components/axios';
import 'antd/dist/antd.css';
import './index.less';

interface propsType {
  graphUrl?: any | '';//图谱请求url。
  params?: any;//图谱请求参数。
  totalNum?: number;//图谱命中数量

  showTotal?:any, 
  Files?:any, 
  modalData?:any, 
  setData ?: any,
};

const Index: React.FC<propsType> = (props) => {
  const {
    totalNum=0, showTotal=0, Files=[], modalData, setData = {},
  } = props;

  //鼠标移动到节点获取节点对象
  const [tooltipData, setTooltipData] = useState<any>({});
  //保存固定参数
  const [fixedData, setFixedData] = useState<any>({});
  //线的距离
  const [lineDistance, setLineDistance] = useState<number>(2);
  // 请求返回的图谱数据对象
  const [GraphData, setGraphData] = useState<any>({
    noce: true, //第一次加载页面不执行。
    forceData: {}, // 更新前重新设置节点线的距离，和节点排斥力。
    nodes: [], //圆的数据
    edges: [], //线的数据
  });
  //边属性
  const [checked, setChecked] = useState<boolean>(false);
  //元素平移放大时保留的对象
  const [transform, setTransform] = useState<any>(null);
  // 右下角显示隐藏操作
  const [showNodes, setShowNodes] = useState<any>([
    { name: '文档', type: 'file', color: '#deecff' },
    { name: '主题', type: 'topic', color: '#3d8c40' },
    { name: '实体', type: 'entity', color: '#f27530' },
  ]);
  //保存层级
  const [hierarchyValue, setHierarchyValue] = useState<number>(2);
  // 获取所有的主题色
  const [themeColor, setThemeColor] = useState<any>({});
  // 无数据
  const [noData, setNoData] = useState<boolean>(false);

  //d3力对象
  let forceSimulation: any = null;
  // 请求参数对象
  let tempData: any = {};
  const params: any = {
    file: 'file',
    width: 1200, // SVG组件宽高
    // height: document.body.clientHeight - 200,
    height: 600,
    level: 2, // 显示层级
    size: 1000, //其他层级数量
    offset: 0, // FIXME 控制分页pageNumber*pageSize
    // 以上为接口参数
    showOp: 0, // 是否展示右侧上下操作0/1
    showNodeOp: 1, //是否显示图谱显示维度
    showPage: 0, //是否显示分页，左上命中统计
    fontSize: 14, // 节点字体大小
    nodeSize: 28, // 节点半径
    nodeSizeTopic: 54, //主题圆半径
    searchNode: () => {}, //点击节点弹窗内的搜索按钮
    onSearch: () => {}, //点击节点弹窗内的搜索按钮
    ...(props.params || {}),
  };
  const self: any = {
    dragStatus: false,
    tooltipData: {}, //鼠标移动到节点获取节点对象
    semanticId: 1,
    nodeText: '',
    fileName: '',
    filePath: '',
    level: params.level,
    // 保存节点传参配置
    pageSize: 3,
    pageNumber: 1,
    colorObj: {
      FileGraphNodeColor: '#deecff', //文档节点颜色
      EntityGraphNodeColor: '#f27530', //实体节点颜色
      TopicGraphNodeColor: '#3d8c40', //主题节点颜色
      HitGraphNodeColor: '#f2ba3d', //命中节点颜色
    },
    // 右下角显示隐藏操作
    showNodes: [
      { name: '文档', type: 'file', color: getColor('file') },
      { name: '主题', type: 'topic', color: getColor('topic') },
      { name: '实体', type: 'entity', color: getColor('entity') },
    ],
    // 图谱显示层级
    hierarchy: [
      { name: '一级', id: 1 },
      { name: '二级', id: 2 },
      { name: '三级', id: 3 },
    ],
    nextSize: 0,
    noData: false,
    showPage: false,
    svgWidth: params.width,
    svgHeight: params.height,
  };
  //svg节点对象
  const svgObj: any = {
    svg: null,
    svgBox: null,
    gs: null,
    gLines: null,
  };

  useEffect(() => {
    if (!GraphData.noce) {
      const { nodes, edges, forceData } = GraphData;
      // 渲染svg
      renderD3(nodes, edges, forceData);
    }
  }, [GraphData]);

  //窗口变化时重新渲染
  useEffect(() => {
    if (!GraphData.noce && GraphData.nodes.length) {
      const { nodes, edges, forceData } = GraphData;
      // 渲染svg
      renderD3(nodes, edges, forceData);
    }
  }, [params.width]);

  // 事件列表
  const eventOpt = {
    // 点击维度
    dimension: (o: { hide: boolean; type: string }) => {
      o.hide = !o.hide;
      setShowNodes([...showNodes]);
      const { nodes = [], edges = [] } = GraphData;
      //隐藏节点
      nodes.forEach((v: any) => {
        if (v.type === o.type && !v.node.anchor) {
          v.show = !o.hide;
          let classr = v.node.attributes.class;
          if (v.type === 'entity' && classr) {
            if (themeColor[classr].checked) {
              v.show = false;
            }
          }
          // 隐藏线
          edges.forEach(function (k: any) {
            k.show = !k.target.show || !k.source.show ? false : true;
          });
        }
      });
      setGraphData({ ...GraphData, nodes, edges });
    },
    // 点击层级
    hierarchyClick: (step: number) => {
      setHierarchyValue(step);
      const fileIds = Files.map((v: { id: number }) => v.id);
      let data: any = { step };
      if (objType(modalData)) {
        data = { ...modalData, step };
      }
      if (objType(fixedData)) {
        data = { ...data, ...eventOpt.setData(fixedData) };
      }
    },
    // 点击边属性
    checkedClick: (e: boolean) => {
      setChecked(e);
      setGraphData({ ...GraphData });
    },
    // 点击加载更多
    loadMore: (d: any) => {
      const o = GraphData.nodes.find((v: any) => v.key === d.key);
      //连续点击增加条数
      if (d.node.anchor || d.node.anchorMore) {
        // 节点为主体，第二次请求条数为10。
        o.next = !o.next ? 10 : (o.next += 10);
      } else {
        o.next = !o.next && o.next !== 0 ? 0 : (o.next += 10);
      }
      tempData = {
        ...tempData,
        step: 2,
        anchor: o.name,
        type: o.type,
        next: o.next,
      };
      // 这个方法判定了不同的文件类型type传anchor值
      if (d.type === 'topic') {
        tempData.topic = d.node.attributes['_id'];
        tempData.anchor = tempData.topic;
        tempData.type = 'topic_id';
      } else if (d.type === 'file') {
        tempData.fileid = d.node.attributes['_id'];
        tempData.anchor = d.node.attributes['_id'];
      };
      getGraph2(tempData, o);
    },
    open: (value: number) => {
      const nodeTooltips = () => d3.select('#node-tooltips').style('display', 'none');
      switch (value) {
        case 1: //打开文件
          // TODO 添加文档链接
          window.open(
            // location.origin +
            setData.EDOC2_URL + 'preview.html?fileid=' + tooltipData.node.attributes['_id'],
          );
          break;
        case 2: //搜索文档
          nodeTooltips();
          const { node } = tooltipData;
          let data = {
            searchVal: node.type === 'topic' ? node.attributes._id : node.title,
            searchType: node.type,
          };
          break;
        case 3: //设为中心
          nodeTooltips();
          setFixedData({ ...tooltipData });
          let data1: any = {
            anchor: `'${tooltipData.name}'`,
            step: 2,
            type: tooltipData.type,
          };
          data1 = Object.assign(data1, eventOpt.setData(tooltipData));
          getGraph2(data1);
          break;
        case 4: //展开更多节点
          nodeTooltips();
          const { nodes } = GraphData;
          let o = nodes.find((item: any) => item.key === tooltipData.key);
          //连续点击增加条数
          if (o.node.anchor || o.node.anchorMore) {
            // 节点为主体，第二次请求条数为10。
            o.next = !o.next ? 10 : (o.next += 10);
          } else {
            o.next = !o.next && o.next !== 0 ? 0 : (o.next += 10);
          }
          nodes.map(function (item: any, index: number) {
            if (item.key === tooltipData.key) {
              // 更多节点写入偏移量
              nodes[index].node.offset =
                item.node.offset !== undefined
                  ? item.node.offset + self.nextSize
                  : item.node.anchor
                  ? self.nextSize
                  : 0;
            }
          });
          let data2: any = {
            anchor: tooltipData.name,
            level: params.level || 2,
            next: o.next,
          };
          data2 = Object.assign(data2, eventOpt.setData(tooltipData));
          getGraph2(data2, tooltipData);
          break;
        default:
          break;
      }
    },
    setData: (o: any = {}) => {
      let data: any = {
        type: o.type,
        anchor: o.name,
      };
      let _id = o.node.attributes['_id'];
      if (data.type === 'topic') data.topic = _id;
      if (data.type === 'file') data.fileid = _id;
      // 此为单独文件图谱
      if (data.fileid || data.fileid === 0) data.anchor = data.fileid;
      // 文件下的主题图谱，传topic，更改类型topic_id，anchor改为topic;
      if (data.topic) {
        data.anchor = data.topic;
        data.type = 'topic_id';
      }
      return data;
    },
  };

  useEffect(() => {
    getGraph2(props.params);
  }, []);

  //获取图谱数据
  const getGraph2 = (
    o?:any,//请求参数
    more?:any,//多次请求
    ) => {
    const params = {
      anchor: '',
      step: 2,
      type: 'entity',
      offset: 0,
      ...(o||{}),
    };
    axios.get(props.graphUrl, params)
      .then(function (res: any) {
        if (res.isSuccess) {
          let { nodes, edges } = res.data || {};
          //第一次请求
          if (!more && !objType(nodes)) {
            setNoData(true);
            return;
          }
          //多次请求
          if (more && !objType(nodes) && !(GraphData.nodes || [])) {
            setNoData(true);
            return;
          };
          setNoData(false);
          let ns: any = getNodes(nodes);
          let es: any = getLinks(ns, edges);
          if (more) {
            GraphData.nodes.map((v: { key: string; node: any }) => nodes[v.key] && delete nodes[v.key]);
            GraphData.edges.map((v: { key: string }) => edges[v.key] && delete edges[v.key]);
            if (getNodes(nodes) && (getNodes(nodes) || []).length) {
              ns = GraphData.nodes.concat(getNodes(nodes));
              es = GraphData.edges.concat(getLinks(ns, edges));
              // 将anchor节点固定
              const item = ns.find((v: any) => v.key === more.key);
              item.node.anchorMore = 'true';
              //保存返回的数据，以后更新svg就是操作数据。
              setGraphData({
                nodes: ns,
                edges: es,
                forceData: { ...GraphData.forceData, strength: -400, alpha: 1 },
              });
            } else {
              // 元素被删除完了，说明没有子节点了。
              message.success('已加载全部子节点');
            }
          } else {
            //保存返回的数据，以后更新svg就是操作数据。
            setGraphData({
              nodes: ns,
              edges: es || [],
              forceData: o.forceData ? {} : GraphData.forceData,
            });
          }
          return;
        }
        message.error(res.context || '接口异常');
      })
  };

  // SECTION 画图
  const initSvg = (nodes: any = [], edges: any = []) => {
    svgObj.svg = d3
      .select('#mainsvg')
      .attr('width', params.width)
      .attr('height', params.height)
      .attr('viewBox', [-params.width / 2, -params.height / 2, params.width, params.height]);
    svgObj.svgBox = d3.select('#svgBox');
    let gsNodes = svgObj.svgBox.select('.gs-nodes');

    const hide = (list: any, obj?: any) => {
      try {
        list.forEach((k: string) => {
          let o = obj ? { type: k, ...obj[k] } : k;
          o.hide = o.hide || o.checked;
          if (o.hide) {
            //隐藏节点
            nodes.forEach((n: any) => n.type === o.type && !n.node.anchor && (n.show = false));
            // 隐藏线
            edges.forEach((k: any) => {
              let source = typeof k.source === 'object' ? k.source : nodes[k.source];
              let target = typeof k.target === 'object' ? k.target : nodes[k.target];
              k.show = !source.show || !target.show ? false : true;
            });
          }
        });
      } catch (error) {
        message.error('图谱传入数据错误!');
      }
    };
    //获取数据时，检查图谱显示维度是否点击过。
    hide(showNodes);
    //获取数据时，检查主题色是否点击过。
    hide(Object.keys(themeColor), themeColor);

    // 更新前停止动画
    forceSimulation && forceSimulation.stop();
    // 更新前删除节点
    svgObj.svgBox.select('.gs-nodes').selectAll('g').remove();
    svgObj.svgBox.select('.g-line').selectAll('line').remove();
    svgObj.svgBox.select('.g-text').selectAll('text').remove();

    svgObj.gs = gsNodes
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .style('display', (d: any) => (d.show ? 'block' : 'none'))
      .attr('class', 'circleBox');

    // 画线
    svgObj.gLines = svgObj.svgBox
      .select('.g-line')
      .selectAll('line')
      .data(edges)
      .enter()
      .append('line')
      // .attr('stroke', '#cccccc')
      .attr(
        'stroke',
        (d: { relation: string; link: { attributes: { rank: number; weight: number } } }) => {
          let color = '#cccccc';
          if (d.relation === '相似') {
            let rank = d.link.attributes.rank || 1;
            let colorData:any = {
              1: '#000000',
              2: '#383838',
              3: '#666666',
              4: '#7A7A7A',
              5: '#8C8C8C',
              6: '#999999',
              7: '#B2B2B2',
              8: '#BCBCBC',
              9: '#CCCCCC',
              10: '#E5E5E5',
            };
            color = colorData[rank];
          }
          if (d.relation === '相关') {
            let n = sort(d.link.attributes.weight || 0.1);
            let colorData: any = {
              1: '#ea3c36',
              2: '#fb6c06',
              3: '#f6be2b',
              4: '#ffde4d',
              5: '#a2e100',
              6: '#5bd057',
              7: '#4cb5a2',
              8: '#71bbf6',
              9: '#4f7eff',
              10: '#4106b1',
            };
            color = colorData[n];
          }
          return color;
        },
      )
      .attr('id', (d: any, i: number) => 'link' + i)
      .style('display', (d: any) => (d.show ? 'block' : 'none'));

    // 画线的文字
    svgObj.gLinesText = svgObj.svgBox
      .select('.g-text')
      .selectAll('text')
      .data(edges)
      .enter()
      .append('text')
      .text((d: any) => d.relation)
      .attr('fill', '#666666')
      .style('display', (d: any) => (d.show && checked ? 'block' : 'none'))
      .attr('sourcetarget', (d: any) => d.source.key + d.target.key);

    // 画圆
    svgObj.circles = svgObj.gs
      .append('circle')
      .attr('r', (d: any) => (d.type === 'topic' ? params.nodeSizeTopic : params.nodeSize))
      .attr('fill', (d: any) => {
        let cor = () => {
          if (d.node.anchor) return getColor('anchor');
          if (themeColor[d.type]) return themeColor[d.type].color || '#ededed';
          return getColor(d.type + (d.more || ''));
        };
        if (d.node.attributes.class) {
          let color = '';
          Object.keys(themeColor).forEach(
            (key) => d.node.attributes.class == key && (color = themeColor[key].color),
          );
          d.color = color;
          return color || cor();
        } else {
          return cor();
        }
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .attr('class', 'circleNode');

    // 画圆的文字
    svgObj.gs
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('fill', (d: any) => (d.type !== 'file' ? '#ffffff' : '#333333'))
      .attr('tspan', function (this: any, d: any)  {
        // 文字显示切分，主题分词
        if (d.type === 'topic') {
          let copyName: any = d.name || '';
          let forNum: any = Math.ceil(copyName.length / 5);
          for (let index = 0; index < forNum; index++) {
            if (index <= 4) {
              d3.select(this)
                .append('tspan')
                .attr('x', 0)
                .attr('y', function (d: any) {
                  let imgMargin = -15;
                  if (copyName.length > 6) {
                    return params.fontSize * (index - 1) + imgMargin + index * 3;
                  } else if (copyName.length >= 4 && copyName.length <= 6) {
                    return params.fontSize * index + imgMargin + index * 3;
                  } else {
                    return 0 + imgMargin;
                  }
                })
                .attr('font-size', (d) => `${params.fontSize || 14}px`)
                .text(() => {
                  let nameArr = copyName.split(' ');
                  return nameArr[index];
                });
            }
          }
        } else if (d.type === 'file') {
          let copyName = d.name || '';
          let forNum = Math.ceil(copyName.length / 10);
          for (let index = 0; index < forNum; index++) {
            if (index <= 3) {
              d3.select(this)
                .append('tspan')
                .attr('x', 0)
                .attr('y', function (d) {
                  // 文件有图标
                  let imgMargin = 60;
                  if (copyName.length > 6) {
                    return params.fontSize * (index - 1) + imgMargin + index * 2;
                  } else if (copyName.length >= 4 && copyName.length <= 6) {
                    return params.fontSize * index + imgMargin + index * 2;
                  } else {
                    return 0 + imgMargin;
                  }
                })
                .attr('font-size', (d) => `${params.fontSize || 14}px`)
                .text(() => {
                  if (index === 3) return '...';
                  // 如果文字大于4个
                  if (copyName.length > 10) return copyName.slice(10 * index, 10 * (index + 1));
                  return copyName;
                });
            }
          }
        } else {
          let copyName = d.name || '';
          let forNum = Math.ceil(copyName.length / 4);
          for (let index = 0; index < forNum; index++) {
            if (index <= 3) {
              d3.select(this)
                .append('tspan')
                .attr('x', 0)
                .attr('y', function (d) {
                  let imgMargin = 6;
                  if (copyName.length > 8) {
                    return params.fontSize * index - imgMargin;
                  } else if (copyName.length > 4) {
                    return params.fontSize * index;
                  } else {
                    return imgMargin;
                  }
                })
                .attr('font-size', (d) => `${params.fontSize || 14}px`)
                .text(() => {
                  if (index === 3) return '...';
                  if (copyName.length > 4) return copyName.slice(4 * index, 4 * (index + 1));
                  return copyName;
                });
            }
          }
        }
      });

    // 画圆的图片，只有文档类型才显示。
    const doc_icon = svgObj.gs
      .append('image')
      .attr('width', 28)
      .attr('height', 28)
      .attr('x', -13)
      .attr('y', -15)
      .attr('class', 'doc-icon')
      .style('display', (d: any) => (d.type === 'file' ? 'block' : 'none'))
      .attr('xlink:href', (d: any) => {
        // 截取文件后缀名
        function extname(filename: string) {
          if (!filename || typeof filename != 'string') return false;
          let a = filename.split('').reverse().join('');
          let b = a.substring(0, a.search(/\./)).split('').reverse().join('');
          return b;
        }
        // 区分不同文件类型显示图标
        if (d.type === 'file') {
          const fileType = extname(d.name);
          let fileImg;
          try {
            fileImg = require(`../src/img/iconFile/${fileType}.png`);
          } catch (error) {
            fileImg = require('../src/img/iconFile/unknown.png');
          }
          return fileImg;
        }
        return '';
      });

    //点击加载更多
    svgObj.gs.on('dblclick', eventOpt.loadMore);

    // 设置元素可缩放和平移
    let transforms: any = null;
    svgObj.svg
      .call(
        d3
          .zoom()
          .scaleExtent([0.5, 2]) //缩放比例
          .on('zoom', function () {
            const { event }: any = d3;
            transforms = event.transform;
            setTransform(event.transform);
            svgObj.svgBox.attr('transform', event.transform);
          }),
      )
      .on('dblclick.zoom', null); // 双击移除事件

    // 监听鼠标事件，也是hover。
    let nodeOutActive: any = null;
    let nodeActive: any = null;
    let hideTooltips: any = null;
    svgObj.gs
      .on('click', function (this:any, d: any) {
        forceSimulation.stop();
        const circleBox = d3.select(this);
        if (circleBox.attr('class') === 'circleBox') {
          d3.selectAll('.active-link').attr('class', '');
          d3.selectAll('.active-node').attr('class', 'circleBox');
          clearActive(d);

          if (GraphData.edges) {
            svgObj.gLines.attr('stroke-width', (edge: any, i: number) => {
              if (edge.source.key === d.key || edge.target.key === d.key) {
                d3.select(`#link${i}`).attr('class', 'active-link');
                return 2;
              } else {
                return 1;
              }
            });
          }
          if (d.type === 'topic') {
            circleBox.attr('class', 'circleBox active-node active-node-topic');
          } else {
            circleBox.attr('class', 'circleBox active-node');
          }
        } else {
          // 再次点击加粗节点取消加粗
          d3.selectAll('.active-link').attr('class', '');
          d3.selectAll('.active-node').attr('class', 'circleBox');
        }
      })
      .on('mouseover', function (this:any, d: any) {
        clearTimeout(nodeOutActive);
        if (self.dragStatus) return;
        // 如果已经选中节点 固定弹窗显示
        let activeNode = document.getElementsByClassName('active-node');
        self.tooltipData = d;

        showToolTip(d, this);

        if (activeNode.length) {
          return;
        }

        // 停顿300ms之后再区分样式
        clearTimeout(nodeActive);
        let circle = d3.select(this).select('circle');
        let nodeR = Number(circle.attr('r')) >= 54 ? 54 : 28;
        circle.attr('r', function (edge: any) {
          if (edge.key === d.key) {
            return Number(nodeR) + 5;
          }
          return edge.type === 'topic' ? params.nodeSizeTopic : params.nodeSize;
        });
        nodeActive = setTimeout(() => {
          // hover 节点样式
          let showKey: any = [];
          if (edges) {
            // 线透明度
            svgObj.gLines.style('opacity', function (edge: any) {
              if (edge.source.key === d.key || edge.target.key === d.key) {
                showKey.push(edge.source.key);
                showKey.push(edge.target.key);
                return 1;
              } else {
                return 0.2;
              }
            });
            // 线宽度
            svgObj.gLines.attr('stroke-width', function (edge: any) {
              if (edge.source.key === d.key || edge.target.key === d.key) {
                if (edge.relation.includes('主题')) return 3;
                return 2;
              } else {
                if (edge.relation.includes('主题')) return 2;
                return 1;
              }
            });
            // 线文字透明度
            svgObj.gLinesText.attr('opacity', (edge: any) =>
              edge.source.key === d.key || edge.target.key === d.key ? 1 : 0.2,
            );
            // 节点透明度
            svgObj.gs.style('opacity', function (edge2: any) {
              if (showKey.indexOf(edge2.key) !== -1) return 1;
              return self.level === 1 ? 1 : 0.2;
            });
          }
        }, 300);
      })
      .on('mouseout', function (d: any, i: number) {
        const { event }: any = d3;
        event.stopPropagation();
        // hover 文字切换时的闪烁
        nodeOutActive = setTimeout(function (d) {
          clearActive(d);
        }, 0);
        // 一定时间后隐藏方框
        const nodeTooltips: any = document.getElementById('node-tooltips');
        hideTooltips = setTimeout(function () {
          nodeTooltips.style.display = 'none';
        }, 500);
        let tipsFun = (e: any) => {
          e.stopPropagation();
          clearTimeout(nodeActive);
          clearTimeout(hideTooltips);
        };
        let tipsMouseleave = (e: any) => {
          e.stopPropagation();
          nodeTooltips.style.display = 'none';
        };
        nodeTooltips.removeEventListener('mousemove', tipsFun);
        nodeTooltips.addEventListener('mouseover', tipsFun);
        nodeTooltips.removeEventListener('mouseleave', tipsMouseleave);
        nodeTooltips.addEventListener('mouseleave', tipsMouseleave);
      });

    //鼠标离开还原节点样式
    function clearActive(d: any) {
      clearTimeout(nodeActive);
      // 显示连线上的文字
      if (edges) {
        svgObj.gLines.style('opacity', 1);
        svgObj.gLines.attr('stroke-width', (d: any) => {
          return d.relation.includes('主题') ? 2 : 1;
        });
        svgObj.gLinesText.attr('opacity', 1);
      }
      svgObj.gs.style('opacity', 1);
      svgObj.circles.attr('r', (d: any) =>
        d.type === 'topic' ? params.nodeSizeTopic : params.nodeSize,
      );
    }

    // 显示提示框
    function showToolTip(d: any, _this?: any) {
      let nodeText = '';
      if (d.type === 'topic') {
        self.semanticId = 'Topic：' + d.node.attributes['_id'];
        nodeText += 'title: ' + d.name;
      } else {
        self.semanticId = d.node.attributes['_id'];
        if (d.node.attributes['描述']) {
          nodeText = d.node.attributes['描述'] + '\n';
        }
      }

      // 防止触碰到内元素
      clearTimeout(hideTooltips);

      self.nodeText = nodeText;
      // 文档信息
      self.fileName = d.name;
      self.filePath = d.path || d.name;
      setTooltipData({
        ...tooltipData,
        ...d,
        fileName: self.fileName,
        filePath: self.filePath,
        nodeText: self.nodeText,
        semanticId: self.semanticId,
        type: d.type,
      });

      // 定位弹窗
      const nodeTooltips: any = document.getElementById('node-tooltips');
      const data: any = { display: 'block' };
      let tr = transforms || transform;
      if (tr) {
        data.top = `${self.tooltipData.y * tr.k + tr.y + params.height / 2 + 10}px`;
        data.left = `${self.tooltipData.x * tr.k + tr.x + params.width / 2 + 10}px`;
      } else {
        data.top = `${self.tooltipData.y + 0 + params.height / 2 + 10}px`;
        data.left = `${self.tooltipData.x + 0 + params.width / 2 + 10}px`;
      }

      Object.keys(data).forEach((d) => (nodeTooltips.style[d] = data[d]));
    }

    return svgObj;
  };

  // 开始渲染
  const renderD3 = (
    nodes: any,
    edges: any,
    forceData = {
      strength: -800, //排斥距离
      alpha: 0.7, //动画速度
      distance: 100, //线的长度
    },
  ) => {
    const svgO: any = initSvg(nodes, edges);
    forceSimulation = d3
      .forceSimulation(nodes)
      .force(
        'link',
        d3
          .forceLink(edges)
          .strength(1) //防止碰撞混乱
          .distance(forceData.distance || 100), //线的长度
      )
      // 间距，碰撞强度
      .force(
        'collision',
        d3
          .forceCollide()
          .radius((d: any) => (d.type === 'topic' ? 108 : 56)) //// 单独区分排斥margin边距
          .strength(0.1), //重力指数
      )
      .force('charge', d3.forceManyBody().strength(forceData.strength || -200)) //排斥
      .velocityDecay(0.5) //摩擦力，震动
      .alpha(forceData.alpha || 0.7); //初始动画速度

    forceSimulation.on('tick', function () {
      // 开始运行，数据更新后，ticked会把数据和图形绑定在力的上面
      // 力函数创建好后，会自动把nodes和edges数据改变，并加上关联关系，然后更新视图。
      if (edges && edges.length) {
        // 设置线的位置
        svgO.gLines
          .attr('x1', (d: any) => d.source.x)
          .attr('y1', (d: any) => d.source.y)
          .attr('x2', (d: any) => d.target.x)
          .attr('y2', (d: any) => d.target.y);

        // 设置线上面文字的位置
        svgObj.gLinesText
          .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
          .attr('y', (d: any) => (d.source.y + d.target.y) / 2);
      }

      // 设置圆的位置
      svgO.gs.attr('transform', function (d: any) {
        // 将anchor节点固定
        if (d.node.anchor || d.node.anchorMore === 'true') {
          d.fx = d.x;
          d.fy = d.y;
        }
        return `translate(${d.x},${d.y})`;
      });
    });

    // 设置元素可拖动
    svgO.gs.call(
      d3
        .drag() //相当于移动端的拖拽手势  分以下三个阶段
        .on('start', function (d) {
          const { event }: any = d3;
          event.sourceEvent.stopPropagation();
          if (!event.active) forceSimulation.alphaTarget(0.2).restart(); //设置衰减系数，对节点位置移动过程的模拟，数值越高移动越快，数值范围[0，1]
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', function (d) {
          self.dragStatus = true;
          const { event }: any = d3;
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', function (d) {
          self.dragStatus = false;
          const { event }: any = d3;
          event.sourceEvent.stopPropagation();
          if (!event.active) forceSimulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }),
    );
  };
  
  const renderSvg = () => (
    <>
      <svg
        id="mainsvg"
        // width={params.width} height={params.height}
      >
        <g id="svgBox">
          <g className="g-line" />
          <g className="g-text" />
          <g className="gs-nodes" />
        </g>
      </svg>
      <div className="node-tooltips" id="node-tooltips">
        <div className="tips-op-container">
          {tooltipData.type === 'file' ? (
            <div className="tips-op-item" title="打开文件" onClick={() => eventOpt.open(1)}>
              <img
                src={require('../src/img/icons/openFile.png')}
                alt="打开文件"
                title="打开文件"
                className="openFile-icon"
              />
            </div>
          ) : (
            <div className="tips-op-item" title="搜索文档" onClick={() => eventOpt.open(2)}>
              <img
                src={require('../src/img/icons/search.png')}
                alt="搜索"
                title="搜索文档"
                className="search-icon"
              />
            </div>
          )}
          <div className="tips-op-item" title="设为中心" onClick={() => eventOpt.open(3)}>
            <img
              src={require('../src/img/icons/position.png')}
              alt="定位"
              title="设为中心"
              className="position-icon"
            />
          </div>
          <div className="tips-op-item" title="展开更多节点" onClick={() => eventOpt.open(4)}>
            <img
              src={require('../src/img/icons/extend.png')}
              alt="更多"
              title="展开更多节点"
              className="extend-icon"
            />
          </div>
        </div>
        {tooltipData.type !== 'file' ? (
          <div className="search-op">
            <span className="info-title" data-bind="text:semanticId">
              {tooltipData.semanticId}
            </span>
            <p className="tips-text" data-bind="text:nodeText">
              {tooltipData.nodeText}
            </p>
          </div>
        ) : (
          <div className="file-info">
            <span className="info-title">文件名：</span>
            <p className="info-text" data-bind="text:fileName">
              {tooltipData.fileName}
            </p>
          </div>
        )}
      </div>
      {showTotal ? (
        <div className="totalNum" id="totalNum">
          <img src={require('../src/img/icons/hit.png')} alt="命中" />
          <span className="hit-text">
            共命中：<span className="totalNum-num">{totalNum}</span>个
          </span>
        </div>
      ) : null}
      <ul className="themes">
        {objType(themeColor) &&
          Object.keys(themeColor).map((value, i) => (
            <li
              key={i}
              onClick={() => {
                themeColor[value].checked = !themeColor[value].checked;
                const { nodes = [], edges = [] } = GraphData;
                //隐藏节点
                nodes.forEach((v: any) => {
                  if (v.type === value && !v.node.anchor) {
                    v.show = !themeColor[value].checked;
                    // 隐藏线
                    edges.forEach(function (k: any) {
                      k.show = !k.target.show || !k.source.show ? false : true;
                    });
                  }
                  if (themeColor[value].color === v.color) {
                    v.show = !themeColor[value].checked;
                    const item = showNodes.find((sv: { type: string }) => sv.type === v.type) || {};
                    if (item.hide) v.show = false;
                    // 隐藏线
                    edges.forEach(function (k: any) {
                      k.show = !k.target.show || !k.source.show ? false : true;
                    });
                  }
                });
                setThemeColor({ ...themeColor });
                setGraphData({ ...GraphData, nodes, edges });
              }}
              style={{ opacity: themeColor[value].checked ? 0.3 : 1 }}
            >
              <div className="color" style={{ background: themeColor[value].color }} />
              <span>{value}</span>
            </li>
          ))}
      </ul>
      <div className="rightMenu">
        <div className="displayDimension">
          <p>图谱显示维度：</p>
          <ul>
            {showNodes.map((v: any, i: number) => (
              <li
                key={v.name}
                className={`${v.hide ? 'itemDisabled' : ''}`}
                onClick={() => eventOpt.dimension(v)}
              >
                <div style={{ backgroundColor: v.color }}></div>
                <span>{v.name}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="displayHierarchy">
          <p>图谱显示层级：</p>
          <Select value={hierarchyValue} style={{ width: 100 }} onChange={eventOpt.hierarchyClick}>
            {self.hierarchy.map((v: { name: string; id: number }) => (
              <Select.Option key={v.id} value={v.id}>
                {v.name}
              </Select.Option>
            ))}
          </Select>
        </div>
        <div className="nodeDistance">
          <p>节点排斥距离：</p>
          <div className="nodeCircle">
            <ul>
              {[1, 2, 3, 4, 5].map((v) => (
                <li
                  key={v}
                  className={lineDistance === v ? 'liActive' : ''}
                  onClick={() => {
                    if (lineDistance === v) return;
                    setLineDistance(v);
                    setGraphData({
                      ...GraphData,
                      forceData: { ...GraphData.forceData, distance: v * 50 },
                    });
                  }}
                ></li>
              ))}
            </ul>
            <div className="line"></div>
          </div>
          <div className="nodeInput">
            <InputNumber
              min={1}
              max={5}
              precision={0}
              value={lineDistance}
              onChange={(e: any) => {
                setLineDistance(e);
                setGraphData({
                  ...GraphData,
                  forceData: { ...GraphData.forceData, distance: e * 50 },
                });
              }}
            />
          </div>
        </div>
        <div className="displayEdge">
          <p>边属性显示：</p>
          <Switch onChange={eventOpt.checkedClick} checked={checked} />
        </div>
      </div>
    </>
  );

  const noDataRender = () => (
    <div className="noData">
      <img src={require('../src/img/icons/noData.png')} alt="暂无数据" />
      <p className="noData-text">暂无数据</p>
    </div>
  );

  return (
    <div className="atlas" style={{ width: params.width, height: params.height }}>
      {noData ? noDataRender() : renderSvg()}
    </div>
  );
};

export const InbizGraph: React.FC<any> = (props) => {
  return (
    <Index 
      graphUrl="http://172.16.2.113:1530/inwise/graph2.jsp"
      params={{
        anchor: '主题',
        step: 2,
        type: 'entity',
        offset: 0,
      }}
    />
  )
};
