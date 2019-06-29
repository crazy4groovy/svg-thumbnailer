#!/usr/bin/env node
"use strict";var validateArgs={colors:Number,writeFileWithTag:String};const fs=require("fs");var dir=new function(){this.scan=async function(t,r){if(""===t||"/"===t)return console.error("Error: directory to scan cannot be empty."),console.error('If you want to scan your script location, please use "dir2array.Scan(__dirname);"'),null;if("/"!==t.slice(-1)&&(t+="/"),!this.dirExists(t))return;const s=async t=>fs.readdirSync(t).sort().reduce(async(i,n)=>{await i;const e=t+n;return this.dirExists(e)?s(e+"/"):r(e)},Promise.resolve());return s(t)},this.dirExists=function(t){try{return fs.lstatSync(t).isDirectory()}catch(t){return!1}},this.fileExists=function(t){try{return fs.existsSync(t)}catch(t){return!1}}};const fs$1=require("fs"),toSvg=require(".");function formatOutput(t,r){let s=[];return r&&s.push("FILENAME="+r+":"),s.push(t),r&&s.push("[EOF]"),s=s.join("\n")}async function main(){const t=process.argv.slice(2),[r,...s]=t;r||console.log("run: svg-thumbnailer {image-path} {options?}");const i=s.reduce((t,r)=>{const[s,i]=r.replace(/^--?/,"").split("=");return validateArgs[s]&&(t[s]=validateArgs[s](i)),t},{}),{writeFileWithTag:n}=i,e=async(t,r)=>{if(!r&&!t.match(/\.(jpe?g|png)$/i))return;const{data:s}=await toSvg(t,i).catch(console.log),e=formatOutput(s,n?void 0:t);n?fs$1.writeFileSync(`${t}.${n}`,e,"utf-8"):console.log(e)};dir.dirExists(r)?await dir.scan(r,e):e(r,!0)}main();
