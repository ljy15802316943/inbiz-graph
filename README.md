# 组件使用tsdx框架开发的npm包。

![image](https://raw.githubusercontent.com/ljy15802316943/inbiz-graph/main/src/img/r.png)

## 安装依赖

```bash
npm install inbiz-graph --save
```

## 页面引入
```bash
import { InbizGraph } from 'inbiz-graph';
```

```bash
// 示例1 使用inwise的服务。
<InbizGraph 
  width={1200}
  height={600}
  graphUrl="http://xxx/xxx/graph2.jsp"
  params={{
    anchor: '主题',
    step: 2,
    type: 'entity',
    offset: 0,
  }}
  optEvent={{
    loadMore:(data:any) => {//双击节点回调
      console.log(data, 'data');
    }
  }}
/>
```

```
```bash
// 示例2 使用自定义逻辑。
<InbizGraph 
  width={1200}
  height={600}
  GraphData={{
    "nodes": {
      "7766065713332071222": {
        "conceptId": -1298275357,
        "attributes": {
          "_id": "背景",
          "type": "baidu",
          "ref_count": 41
        },
        "title": "背景",
        "type": "entity"
      },
      "1328350470430427987": {
        "anchor": true,
        "conceptId": -1298275357,
        "attributes": {
          "_id": "蓝色背景",
          "type": "baidu",
          "ref_count": 4
        },
        "title": "蓝色背景",
        "type": "entity"
      }
    },
    "edges": {
      "3364276357013955879": {
        "from": "7766065713332071222",
        "attributes": {
          "rank": 6,
          "weight": 0.609552
        },
        "to": "1328350470430427987",
        "type": "相关"
      }
    },
  }}
  optEvent={{
    loadMore:(data:any) => {//双击节点回调
      console.log(data, 'data');
    }
  }}
/>
```

## 参数描述

```bash
interface propsType {
  width:number;//图谱宽度
  height:number;//图谱高度
  loading?:boolean;//加载效果
  svgBoxId?: string;//自定义svg
  //自定义数据。如果传入自定是数据则无需传入inwise接口和请求参数，下面有使用示例。
  GraphData?: {
    nodes: any; //圆的数据
    edges: any; //线的数据
  },
  graphUrl?: string;//图谱请求url。
  params?: {//图谱接口请求参数。
    step:number;//层级
    offset:number,//默认传0
    anchor: string | number;//关键字 | 文件id。
    type: string,//查询类型
    /**
     * type不同，anchor传值也不同。
     * type: 'file',//查询文档，anchor=文件id。
     * type: 'topic',//查询主题，anchor=节点名字
     * type: 'entity',//实体 anchor=节点名字
    */
  };
  showRightMenu?:boolean;//显示右侧菜单
  EDOC2_URL?:string;//跳转ecm预览文件地址。

  className?:string;//控制图谱样式
  children?:any;//传入自定义元素。
  //事件回调函数, 以前的函数将被替换，会执行新传入的函数逻辑, 并返回元素对象。
  optEvent?: {
    loadMore?:Function;//双击元素加载更多

    dimension?:Function;//菜单点击维度
    hierarchyClick?:Function;//菜单点击层级
    checkedClick?:any;//菜单点击边属性
    
    openFile?: Function;//弹窗打开文件
    searchDoc?: Function;//弹窗搜索文档
    setCore?: Function;//弹窗设为中心
    openMoreNode?: Function;//弹窗展开更多节点
  }
};

```
