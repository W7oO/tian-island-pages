import{CatmullRomCurve3}from'three';
// Route over the actual existing road curves, including the four branch paths.
export function routeOnRoads(scene,from,to){
 let graph=scene.userData.mobileRoadGraph;
 if(!graph){const nodes=[],edges=[];for(const curve of scene.userData.islandRoadCurves||[]){let previous=-1;for(let i=0;i<=64;i++){const index=nodes.length;nodes.push(curve.getPoint(i/64));edges.push([]);if(previous>=0){const d=nodes[index].distanceTo(nodes[previous]);edges[index].push([previous,d]);edges[previous].push([index,d]);}previous=index;}}
  for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){const d=nodes[i].distanceTo(nodes[j]);if(d<.65){edges[i].push([j,d]);edges[j].push([i,d]);}}
  graph={nodes,edges};scene.userData.mobileRoadGraph=graph;
 }
 const{nodes,edges}=graph;if(!nodes.length)return null;
 const nearest=p=>{let best=0;for(let i=1;i<nodes.length;i++)if(nodes[i].distanceToSquared(p)<nodes[best].distanceToSquared(p))best=i;return best;};
 const start=nearest(from),end=nearest(to),distance=nodes.map(()=>Infinity),previous=nodes.map(()=>-1),done=new Set();distance[start]=0;
 for(let count=0;count<nodes.length;count++){let at=-1;for(let i=0;i<nodes.length;i++)if(!done.has(i)&&(at<0||distance[i]<distance[at]))at=i;if(at<0||!Number.isFinite(distance[at]))break;if(at===end)break;done.add(at);for(const[next,cost]of edges[at])if(distance[at]+cost<distance[next]){distance[next]=distance[at]+cost;previous[next]=at;}}
 if(!Number.isFinite(distance[end]))return null;
 const indices=[];for(let at=end;at>=0;at=previous[at]){indices.push(at);if(at===start)break;}indices.reverse();const points=[from.clone()];for(const at of indices)if(points.at(-1).distanceTo(nodes[at])>.05)points.push(nodes[at].clone());if(points.at(-1).distanceTo(to)>.05)points.push(to.clone());if(points.length<2)return null;
 return new CatmullRomCurve3(points,false,'centripetal');
}
