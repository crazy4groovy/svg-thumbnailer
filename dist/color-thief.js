"use strict";module.exports.getPalette=function({data:t},o,r=5){o=Math.min(256,Math.max(2,o)),r=Math.min(20,Math.max(1,r));const e=t.length,n=[];for(let o,s,u,i,c,h=0;h<e;h+=r)s=t[(o=4*h)+0],u=t[o+1],i=t[o+2],(c=t[o+3])>=125&&(s>250&&u>250&&i>250||n.push([s,u,i]));const s=MMCQ.quantize(n,o);return{palette:s?s.palette():null,pixelArray:n}};const pv={map(t,o){const r={};return o?t.map((t,e)=>(r.index=e,o.call(r,t))):t.slice()},naturalOrder:(t,o)=>t<o?-1:t>o?1:0,sum(t,o){const r={};return t.reduce(o?(t,e,n)=>(r.index=n,t+o.call(r,e)):(t,o)=>t+o,0)},max:(t,o)=>Math.max.apply(null,o?pv.map(t,o):t)},MMCQ=function(){const t=5,o=8-t,r=1e3,e=.75;function n(o,r,e){return(o<<2*t)+(r<<t)+e}function s(t){const o=[];let r=!1;function e(){o.sort(t),r=!0}return{push(t){o.push(t),r=!1},peek:t=>(r||e(),void 0===t&&(t=o.length-1),o[t]),pop:()=>(r||e(),o.pop()),size:()=>o.length,map:t=>o.map(t),debug:()=>(r||e(),o)}}function u(t,o,r,e,n,s,u){this.r1=t,this.r2=o,this.g1=r,this.g2=e,this.b1=n,this.b2=s,this.histo=u}function i(){this.vboxes=new s((t,o)=>pv.naturalOrder(t.vbox.count()*t.vbox.volume(),o.vbox.count()*o.vbox.volume()))}function c(t,o){if(!o.count())return;const r=o.r2-o.r1+1,e=o.g2-o.g1+1,s=o.b2-o.b1+1,u=pv.max([r,e,s]);if(1===o.count())return[o.copy()];let i=0;const c=[],h=[];let l,p,a,f,b;if(u===r)for(l=o.r1;l<=o.r2;l++){for(f=0,p=o.g1;p<=o.g2;p++)for(a=o.b1;a<=o.b2;a++)f+=t[b=n(l,p,a)]||0;i+=f,c[l]=i}else if(u===e)for(l=o.g1;l<=o.g2;l++){for(f=0,p=o.r1;p<=o.r2;p++)for(a=o.b1;a<=o.b2;a++)f+=t[b=n(p,l,a)]||0;i+=f,c[l]=i}else for(l=o.b1;l<=o.b2;l++){for(f=0,p=o.r1;p<=o.r2;p++)for(a=o.g1;a<=o.g2;a++)f+=t[b=n(p,a,l)]||0;i+=f,c[l]=i}function v(t){const r=t+"1",e=t+"2";let n,s,u,p,a,f=0;for(l=o[r];l<=o[e];l++)if(c[l]>i/2){for(u=o.copy(),p=o.copy(),a=(n=l-o[r])<=(s=o[e]-l)?Math.min(o[e]-1,~~(l+s/2)):Math.max(o[r],~~(l-1-n/2));!c[a];)a++;for(f=h[a];!f&&c[a-1];)f=h[--a];return u[e]=a,p[r]=u[e]+1,[u,p]}}return c.forEach((t,o)=>{h[o]=i-t}),v(u===r?"r":u===e?"g":"b")}return u.prototype={volume(t){const o=this;return o._volume&&!t||(o._volume=(o.r2-o.r1+1)*(o.g2-o.g1+1)*(o.b2-o.b1+1)),o._volume},count(t){const o=this,{histo:r}=o;if(!o._count_set||t){let t,e,s,u,i=0;for(e=o.r1;e<=o.r2;e++)for(s=o.g1;s<=o.g2;s++)for(u=o.b1;u<=o.b2;u++)i+=r[t=n(e,s,u)]||0;o._count=i,o._count_set=!0}return o._count},copy(){return new u(this.r1,this.r2,this.g1,this.g2,this.b1,this.b2,this.histo)},avg(o){const r=this,{histo:e}=r;if(!r._avg||o){let o=0;const s=1<<8-t;let u,i,c,h,l,p=0,a=0,f=0;for(i=r.r1;i<=r.r2;i++)for(c=r.g1;c<=r.g2;c++)for(h=r.b1;h<=r.b2;h++)o+=u=e[l=n(i,c,h)]||0,p+=u*(i+.5)*s,a+=u*(c+.5)*s,f+=u*(h+.5)*s;r._avg=o?[~~(p/o),~~(a/o),~~(f/o)]:[~~(s*(r.r1+r.r2+1)/2),~~(s*(r.g1+r.g2+1)/2),~~(s*(r.b1+r.b2+1)/2)]}return r._avg},contains(t){const r=t[0]>>o,e=t[1]>>o,n=t[2]>>o;return r>=this.r1&&r<=this.r2&&e>=this.g1&&e<=this.g2&&n>=this.b1&&n<=this.b2}},i.prototype={push(t){this.vboxes.push({vbox:t,color:t.avg()})},palette(){return this.vboxes.map(t=>t.color)},size(){return this.vboxes.size()},map(t){const{vboxes:o}=this;for(let r=0;r<o.size();r++)if(o.peek(r).vbox.contains(t))return o.peek(r).color;return this.nearest(t)},nearest(t){const{vboxes:o}=this;let r,e,n;for(let s=0;s<o.size();s++)((e=Math.sqrt(t[0]-o.peek(s).color[0]**2+t[1]-o.peek(s).color[1]**2+t[2]-o.peek(s).color[2]**2))<r||void 0===r)&&(r=e,n=o.peek(s).color);return n},forcebw(){const{vboxes:t}=this;t.sort((t,o)=>pv.naturalOrder(pv.sum(t.color),pv.sum(o.color)));const o=t[0].color;o[0]<5&&o[1]<5&&o[2]<5&&(t[0].color=[0,0,0]);const r=t.length-1,e=t[r].color;e[0]>251&&e[1]>251&&e[2]>251&&(t[r].color=[255,255,255])}},{quantize:function(h,l){if(0===h.length||l<2||l>256)return!1;const p=function(r){const e=new Array(1<<3*t);let s,u,i,c;return r.forEach(t=>{u=t[0]>>o,i=t[1]>>o,c=t[2]>>o,s=n(u,i,c),e[s]=(e[s]||0)+1}),e}(h);p.forEach(()=>{});const a=function(t,r){let e,n,s,i=1e6,c=0,h=1e6,l=0,p=1e6,a=0;return t.forEach(t=>{e=t[0]>>o,n=t[1]>>o,s=t[2]>>o,e<i?i=e:e>c&&(c=e),n<h?h=n:n>l&&(l=n),s<p?p=s:s>a&&(a=s)}),new u(i,c,h,l,p,a,r)}(h,p),f=new s((t,o)=>pv.naturalOrder(t.count(),o.count()));function b(t,o){let e,n=1,s=0;for(;s<r;){if(!(e=t.pop()).count()){t.push(e),s++;continue}const u=c(p,e),i=u[0],h=u[1];if(!i)return;if(t.push(i),h&&(t.push(h),n++),n>=o)return;if(s++>r)return}}f.push(a),b(f,e*l);const v=new s((t,o)=>pv.naturalOrder(t.count()*t.volume(),o.count()*o.volume()));for(;f.size();)v.push(f.pop());b(v,l-v.size());const g=new i;for(;v.size();)g.push(v.pop());return g}}}();
