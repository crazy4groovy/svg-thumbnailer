"use strict";const fs=require("fs"),PNGReader=require("png.js"),JPEGReader=require("jpeg-js"),ImageTracer=require("imagetracerjs"),SVGO=require("svgo"),{getPalette:getPalette}=require("./color-thief"),dataOptimize=require("./data-optimize"),svgo=new SVGO({plugins:require("./svgo-plugins")}),toSvg=ImageTracer.imagedataToSVG;async function getImgData(e){const t=fs.readFileSync(e);if(e.endsWith("png")){const e=new PNGReader(t),a=await new Promise((t,a)=>{e.parse((e,i)=>{e?a(e):t(i)})});return{height:a.height,width:a.width,data:a.pixels}}return JPEGReader.decode(t)}async function svgThumbnailer(e,{colors:t=4,scale:a=1,vibrant:i=!0,tolerance:r=0,combineLines:o=!1,smooth:s=0,smoothDecimalPlaces:n}={}){const c=await getImgData(e),m=Math.ceil(128/t**2)+1,g={scale:a,ltres:m,qtres:m,pathomit:Math.min(32,4+3*t),colorquantcycles:Math.min(6,t),numberofcolors:t,mincolorratio:i?1e-5:.03};if(i){const{palette:e}=getPalette(c,t);g.pal=e.map(([e,t,a])=>({r:e,g:t,b:a,a:255}))}const l=await svgo.optimize(toSvg(c,g));if(!(r||o||s))return l;const u={combineLines:o,smooth:s,smoothDecimalPlaces:n,tolerance:r};return svgo.optimize(dataOptimize(l,u))}module.exports=svgThumbnailer;
