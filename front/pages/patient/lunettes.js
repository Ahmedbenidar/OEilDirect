import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { getUser, logout } from "../../lib/useAuth";
import ChatPanel from "../../components/ChatPanel";
import NotificationBell from "../../components/NotificationBell";
import SameRouteScrollLink from "../../components/SameRouteScrollLink";

const GLASSES_IMAGES = {
  aviateur:      "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=480&h=280&fit=crop&auto=format",
  wayfarer:      "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=480&h=280&fit=crop&auto=format",
  rectangulaire: "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=480&h=280&fit=crop&auto=format",
  catEye:        "https://images.unsplash.com/photo-1577803645773-f96470509666?w=480&h=280&fit=crop&auto=format",
  rond:          "https://images.unsplash.com/photo-1508296695146-257a814070b4?w=480&h=280&fit=crop&auto=format",
  carre:         "https://images.unsplash.com/photo-1574200109613-57dbf53e0db7?w=480&h=280&fit=crop&auto=format",
  geometrique:   "https://images.unsplash.com/photo-1521369909029-2afed882baee?w=480&h=280&fit=crop&auto=format",
  papillon:      "https://images.unsplash.com/photo-1565799999516-a6f397867780?w=480&h=280&fit=crop&auto=format",
};

const FACES = {
  oval:   { label:"Ovale",  emoji:"🟡", desc:"Visage harmonieux — presque tous les styles vous conviennent. Vous avez de la chance !", frames:[{name:"Aviateur",desc:"Classique et intemporel, parfait pour votre visage",img:GLASSES_IMAGES.aviateur},{name:"Wayfarer",desc:"Moderne et tendance, style affirme",img:GLASSES_IMAGES.wayfarer},{name:"Cat-eye",desc:"Elegant et feminin, met en valeur vos yeux",img:GLASSES_IMAGES.catEye}] },
  round:  { label:"Rond",   emoji:"⭕", desc:"Privilegiez des montures angulaires pour structurer et allonger votre visage.", frames:[{name:"Rectangulaire",desc:"Allonge le visage et donne de la structure",img:GLASSES_IMAGES.rectangulaire},{name:"Carre",desc:"Donne de la definition",img:GLASSES_IMAGES.carre},{name:"Geometrique",desc:"Moderne et original",img:GLASSES_IMAGES.geometrique}] },
  square: { label:"Carre",  emoji:"⬛", desc:"Les montures rondes et ovales adoucissent vos traits marques.", frames:[{name:"Ovale",desc:"Adoucit les angles",img:GLASSES_IMAGES.rond},{name:"Rond",desc:"Look doux et naturel",img:GLASSES_IMAGES.rond},{name:"Aviateur",desc:"Style classique equilibre",img:GLASSES_IMAGES.aviateur}] },
  oblong: { label:"Oblong", emoji:"🔷", desc:"Optez pour des montures larges et decoratives pour elargir votre visage.", frames:[{name:"Papillon",desc:"Elargit visuellement",img:GLASSES_IMAGES.papillon},{name:"Grand carre",desc:"Volumine le regard",img:GLASSES_IMAGES.carre},{name:"Cat-eye",desc:"Attire le regard horizontalement",img:GLASSES_IMAGES.catEye}] },
  heart:  { label:"Coeur",  emoji:"❤️", desc:"Les montures legeres en bas et les aviateur equilibrent parfaitement votre visage.", frames:[{name:"Aviateur",desc:"Elargit le bas du visage",img:GLASSES_IMAGES.aviateur},{name:"Ovale",desc:"Harmonise les proportions",img:GLASSES_IMAGES.rond},{name:"Cat-eye leger",desc:"Elegant et tres flatteur",img:GLASSES_IMAGES.catEye}] },
};

const OPTICIENS = [
  {name:"Optique Marrakech Centre",lat:31.6254,lng:-7.9887,address:"Derb Sidi Bouloukat, Medina",tel:"0524 44 23 10"},
  {name:"Optique Gueliz Vision",lat:31.6378,lng:-8.0057,address:"Avenue Mohammed V, Gueliz",tel:"0524 43 67 85"},
  {name:"Atlas Optique",lat:31.6295,lng:-7.9813,address:"Rue Bab Agnaou, Medina",tel:"0524 38 91 22"},
  {name:"Optique Al Amal",lat:31.6321,lng:-7.9956,address:"Place Djemaa el-Fna",tel:"0524 42 15 73"},
  {name:"Vision Plus Marrakech",lat:31.6517,lng:-8.0165,address:"Boulevard de la Menara",tel:"0524 31 78 44"},
  {name:"Optique Menara",lat:31.6198,lng:-8.0073,address:"Quartier Hivernage",tel:"0524 44 56 90"},
  {name:"Optique Kasbah",lat:31.6178,lng:-7.9899,address:"Kasbah, Medina",tel:"0524 38 62 17"},
];

function isSkinColor(r,g,b){return r>95&&g>40&&b>20&&Math.max(r,g,b)-Math.min(r,g,b)>15&&Math.abs(r-g)>15&&r>g&&r>b&&r>130;}

function analyzeFaceShape(canvas){
  try{
    const ctx=canvas.getContext("2d"),{width,height}=canvas,{data}=ctx.getImageData(0,0,width,height);
    const cols=new Array(width).fill(0),rows=new Array(height).fill(0);let total=0;
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){const i=(y*width+x)*4;if(isSkinColor(data[i],data[i+1],data[i+2])){cols[x]++;rows[y]++;total++;}}
    if(total<1500)return"oval";
    const thC=total/width*0.08,thR=total/height*0.08;
    let minX=width,maxX=0,minY=height,maxY=0;
    for(let x=0;x<width;x++)if(cols[x]>thC){minX=Math.min(minX,x);maxX=Math.max(maxX,x);}
    for(let y=0;y<height;y++)if(rows[y]>thR){minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
    const fw=maxX-minX,fh=maxY-minY;if(fw<=0||fh<=0)return"oval";
    const sl=Math.floor(fh*0.25);
    const ua=rows.slice(minY,minY+sl).reduce((a,b)=>a+b,0)/(sl||1);
    const la=rows.slice(maxY-sl,maxY).reduce((a,b)=>a+b,0)/(sl||1);
    if(ua>la*1.35)return"heart";
    const ratio=fw/fh;
    if(ratio<0.70)return"oblong";if(ratio<0.82)return"oval";if(ratio<0.93)return"round";return"square";
  }catch{return"oval";}
}

export default function LunettesPage(){
  const router=useRouter();
  const [user,setUser]=useState(null);
  const videoRef=useRef(null);
  const canvasRef=useRef(null);
  const streamRef=useRef(null);
  const [step,setStep]=useState("intro");
  const [faceShape,setFaceShape]=useState(null);
  const [mapLoaded,setMapLoaded]=useState(false);
  const [cameraError,setCameraError]=useState(false);
  const [progress,setProgress]=useState(0);
  const [camReady,setCamReady]=useState(false);

  useEffect(()=>{
    const u=getUser();
    if(!u||u.role!=="PATIENT"){router.push("/connexion");return;}
    setUser(u);
  },[]);

  useEffect(()=>()=>{ streamRef.current?.getTracks().forEach(t=>t.stop()); },[]);

  useEffect(()=>{
    if(step!=="scanning")return;
    const t=setTimeout(()=>{
      const vid=videoRef.current;
      if(!vid||!streamRef.current)return;
      vid.srcObject=streamRef.current;
      vid.play().catch(e=>console.warn(e));
      setCamReady(true);
    },100);
    return()=>clearTimeout(t);
  },[step]);

  useEffect(()=>{ if(step==="result"&&!mapLoaded)setTimeout(initMap,500); },[step]);

  const startCamera=async()=>{
    setCameraError(false);setCamReady(false);
    try{
      const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"user",width:{ideal:1280},height:{ideal:720}}});
      streamRef.current=stream;setStep("scanning");
    }catch{ setCameraError(true);setStep("manual"); }
  };

  const analyzeFace=()=>{
    setStep("analyzing");setProgress(0);
    const video=videoRef.current,canvas=canvasRef.current;
    if(video&&canvas){canvas.width=video.videoWidth||640;canvas.height=video.videoHeight||480;canvas.getContext("2d").drawImage(video,0,0);}
    streamRef.current?.getTracks().forEach(t=>t.stop());
    const iv=setInterval(()=>setProgress(p=>{if(p>=100){clearInterval(iv);return 100;}return p+3;}),70);
    setTimeout(()=>{const shape=canvas?analyzeFaceShape(canvas):"oval";setFaceShape(shape);setStep("result");},2600);
  };

  const reset=()=>{
    setStep("intro");setFaceShape(null);setMapLoaded(false);setProgress(0);setCameraError(false);setCamReady(false);
    streamRef.current?.getTracks().forEach(t=>t.stop());
    const el=document.getElementById("map-opticiens");if(el)el._leaflet_id=undefined;
  };

  const initMap=()=>{
    if(mapLoaded||typeof window==="undefined")return;
    const el=document.getElementById("map-opticiens");if(!el)return;
    if(!document.querySelector("#leaflet-css")){const l=document.createElement("link");l.id="leaflet-css";l.rel="stylesheet";l.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";document.head.appendChild(l);}
    const run=()=>{
      if(el._leaflet_id)return;
      const L=window.L,map=L.map("map-opticiens").setView([31.6295,-7.9886],13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:"© OpenStreetMap"}).addTo(map);
      const icon=L.divIcon({html:'<div style="background:#0071c2;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-size:16px">👓</div>',iconSize:[32,32],iconAnchor:[16,16],className:""});
      OPTICIENS.forEach(o=>L.marker([o.lat,o.lng],{icon}).addTo(map).bindPopup(`<div style="font-family:sans-serif;min-width:190px"><b style="color:#0071c2;font-size:14px">${o.name}</b><br><span style="font-size:12px;color:#555">📍 ${o.address}</span><br><span style="font-size:12px;color:#0071c2;font-weight:600">📞 ${o.tel}</span></div>`,{maxWidth:240}));
      setMapLoaded(true);
    };
    if(window.L){run();}else{const s=document.createElement("script");s.src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";s.onload=run;document.head.appendChild(s);}
  };

  const face=FACES[faceShape]||FACES.oval;

  return(
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased" style={{fontFamily:'Inter, sans-serif'}}>
      <Head><title>Trouver vos lunettes | OeilDirect</title></Head>
      <style>{`
        @keyframes fadeSlide{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes camPulse{0%,100%{box-shadow:0 0 0 0 rgba(0,113,194,.4)}70%{box-shadow:0 0 0 10px rgba(0,113,194,0)}}
        .fadeSlide{animation:fadeSlide .5s ease both}
        .editorial-shadow{box-shadow:0 10px 15px -3px rgba(0,113,194,.1),0 4px 6px -2px rgba(0,113,194,.05)}
        .cam-ring{animation:camPulse 2s ease-in-out infinite}
      `}</style>

      {/* HEADER */}
      <header className="bg-white/50 backdrop-blur-md shadow-sm sticky top-0 z-50 flex items-center justify-between px-8 h-16 w-full">
        <img src="/logos/logo_cabinet.png" alt="OeilDirect" className="h-14 w-auto object-contain scale-[3.5] origin-left" style={{mixBlendMode:'multiply'}}/>
        <div className="hidden md:flex items-center gap-8">
          <nav className="flex gap-6">
            <SameRouteScrollLink href="/patient" className="text-slate-500 font-medium hover:text-sky-600 text-sm">Tableau de bord</SameRouteScrollLink>
            <Link href="/patient/medecins" className="text-slate-500 font-medium hover:text-sky-600 text-sm">Trouver un medecin</Link>
            <Link href="/patient/documents" className="text-slate-500 font-medium hover:text-sky-600 text-sm">Documents</Link>
          </nav>
          <div className="flex items-center gap-4 border-l border-slate-200 pl-6">
            <NotificationBell user={user}/>
            <Link href="/patient/profil" className="block">
              {user?.photoProfil ? (
                <img src={user.photoProfil} alt="Profil" className="w-9 h-9 rounded-full object-cover border-2 border-blue-200 shadow-sm"/>
              ) : (
                <div className="w-9 h-9 rounded-full bg-blue-100 border-2 border-blue-200 flex items-center justify-center text-blue-700 font-bold text-sm">
                  {user?.nom?.charAt(0)?.toUpperCase()||"P"}
                </div>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* SIDEBAR */}
      <aside className="hidden md:flex h-[calc(100vh-4rem)] w-64 fixed left-0 top-16 flex-col gap-2 p-4 bg-slate-100/80 border-r border-slate-200 z-40 pointer-events-auto">
        <nav className="space-y-1">
          <SameRouteScrollLink href="/patient" className="flex items-center gap-3 py-3 px-4 text-slate-600 hover:bg-slate-200/50 mx-2 rounded-lg transition-all text-sm font-medium">
            <span className="material-symbols-outlined text-xl">dashboard</span>Tableau de bord
          </SameRouteScrollLink>
          <Link href="/patient/medecins" className="flex items-center gap-3 py-3 px-4 text-slate-600 hover:bg-slate-200/50 mx-2 rounded-lg text-sm font-medium" style={{animation:'none',transition:'background-color 0.15s'}}>
            <span className="material-symbols-outlined text-xl">local_hospital</span>Trouver un medecin
          </Link>
          <Link href="/patient/documents" className="flex items-center gap-3 py-3 px-4 text-slate-600 hover:bg-slate-200/50 mx-2 rounded-lg transition-all text-sm font-medium">
            <span className="material-symbols-outlined text-xl">folder_open</span>Documents
          </Link>
          <button onClick={()=>document.getElementById("chat-toggle-btn")?.click()} className="w-full flex items-center gap-3 py-3 px-4 text-slate-600 hover:bg-slate-200/50 mx-2 rounded-lg transition-all text-sm font-medium">
            <span className="material-symbols-outlined text-xl">chat</span>
            <span className="flex-1 text-left">Chat</span>
            <span className="chat-sidebar-badge badge-blink w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black items-center justify-center border border-white shadow" style={{display:"none"}}></span>
          </button>
          <span className="flex items-center gap-3 py-3 px-4 bg-white text-sky-700 shadow-sm rounded-lg mx-2 text-sm font-medium">
            <span className="material-symbols-outlined text-xl">visibility</span>Trouver vos lunettes
          </span>
        </nav>
        <div className="mt-8 px-2">
          <Link href="/patient/medecins">
            <button className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg shadow-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm">
              <span className="material-symbols-outlined text-sm">add</span>Prendre RDV
            </button>
          </Link>
        </div>
        <div className="mt-auto pb-4">
          <button onClick={()=>{logout();router.push("/connexion");}} className="w-full flex items-center gap-3 py-3 px-4 text-red-500 hover:bg-red-50 mx-2 rounded-lg transition-all text-sm font-medium">
            <span className="material-symbols-outlined text-xl">logout</span>Deconnexion
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="md:ml-64 min-h-screen">
        <canvas ref={canvasRef} className="hidden"/>

        {/* INTRO */}
        {step==="intro"&&(
          <div className="max-w-7xl mx-auto p-8 lg:p-12 fadeSlide">
            <div className="flex flex-col lg:flex-row gap-12 items-center mb-16">
              <div className="flex-1 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full">
                  <span className="material-symbols-outlined text-[#0071c2] text-sm" style={{fontVariationSettings:"'FILL' 1"}}>verified</span>
                  <span className="text-[10px] font-bold text-[#0071c2] uppercase tracking-[0.2em]">Diagnostic de precision</span>
                </div>
                <h1 className="text-5xl lg:text-6xl font-black text-slate-900 leading-tight tracking-tighter">
                  Trouvez vos <br/><span className="text-[#0071c2]">lunettes ideales</span>
                </h1>
                <p className="text-lg text-slate-500 leading-relaxed max-w-xl">
                  Notre IA analyse la forme de votre visage pour vous recommander les montures qui vous mettront le mieux en valeur. Une approche clinique de l'esthetique optique.
                </p>
                <div className="flex flex-wrap gap-4 pt-4">
                  <button onClick={startCamera} className="px-8 h-14 bg-[#0071c2] text-white rounded-lg font-bold editorial-shadow hover:bg-[#005fa3] transition-colors flex items-center gap-3">
                    <span className="material-symbols-outlined">photo_camera</span>Scanner mon visage
                  </button>
                  <button onClick={()=>setStep("manual")} className="px-8 h-14 border-2 border-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-50 transition-colors">
                    Selectionner manuellement
                  </button>
                </div>
              </div>
              <div className="flex-1 relative">
                <div className="absolute -inset-4 bg-gradient-to-tr from-blue-100 to-transparent rounded-[2rem] blur-2xl"/>
                <div className="relative bg-white p-8 rounded-[2rem] editorial-shadow border border-white">
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDDs2b3zm6LA2NIPBdTHU2jXo3MK9W--w_RPhsSqvH9KdFLmTENAAIJng3AH2NGM7Rk87Obc4oFIJWBEnwJPPiodNeKJdXBZ039l3RaT4Wb430QdVEgmDaR-dHil31_Eg7wKDrbofR98HjL5FlJOlq0dd8afZtywMifkj6CpDKTqgLfy8cNphM53t-nBp0ljMLnkqSPS2jzWh_BkvbZypAyAD_ZAtrc0Dz-UnToN2aUTpjJzmA_Ht9IXHyDLnKdXul6l50P8J-7C2g"
                    alt="Modern glasses"
                    className="w-full h-auto rounded-xl object-cover"
                    style={{filter:"grayscale(0.1) contrast(1.05)"}}
                    onError={e=>{e.target.src="https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&h=400&fit=crop";}}
                  />
                  <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl flex items-center gap-3 max-w-[200px] editorial-shadow">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#0071c2]">
                      <span className="material-symbols-outlined">eyeglasses</span>
                    </div>
                    <div className="leading-tight">
                      <p className="text-xs font-bold text-slate-900">IA Optique</p>
                      <p className="text-[10px] text-slate-400">99.8% Precision</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bento cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {icon:"camera_front",title:"Scan visage",desc:"Votre camera analyse votre visage en temps reel pour capturer les dimensions biometriques exactes.",step:"01"},
                {icon:"smart_toy",title:"Analyse IA",desc:"Detection de votre forme de visage (ovale, carre, coeur) pour une recommandation stylistique personnalisee.",step:"02"},
                {icon:"map",title:"Carte opticiens",desc:"Trouvez ou acheter a Marrakech. Geo-localisation des partenaires certifies les plus proches.",step:"03",extra:true},
              ].map(c=>(
                <div key={c.step} className="group bg-white p-8 rounded-2xl editorial-shadow hover:scale-[1.02] transition-all duration-300 hover:shadow-2xl">
                  <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center text-[#0071c2] mb-6 group-hover:bg-[#0071c2] group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-3xl">{c.icon}</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{c.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{c.desc}</p>
                  <div className={`mt-6 pt-6 border-t border-slate-50 ${c.extra?"flex items-center justify-between":""}`}>
                    <span className="text-[10px] font-bold text-[#0071c2] uppercase tracking-[0.15em]">Etape {c.step}</span>
                    {c.extra&&<div className="flex items-center gap-1 text-[10px] font-bold text-slate-400"><span className="material-symbols-outlined text-xs">location_on</span>MARRAKECH</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SCANNING */}
        {step==="scanning"&&(
          <div className="flex flex-col items-center p-8 fadeSlide">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full mb-4">
              <span className="material-symbols-outlined text-[#0071c2] text-sm" style={{fontVariationSettings:"'FILL' 1"}}>verified</span>
              <span className="text-[10px] font-bold text-[#0071c2] uppercase tracking-[0.2em]">Analyse en direct</span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-1">Positionnez votre visage</h2>
            <p className="text-slate-500 mb-8 text-sm">Centrez votre visage dans le cadre ovale puis cliquez sur Analyser</p>
            <div className="relative rounded-3xl overflow-hidden editorial-shadow cam-ring bg-black"
              style={{width:"min(560px,94vw)",aspectRatio:"4/3",border:"3px solid #0071c2"}}>
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{transform:"scaleX(-1)"}}/>
              <div className="absolute inset-0 pointer-events-none" style={{background:"rgba(0,0,0,0.38)",WebkitMaskImage:"radial-gradient(ellipse 52% 68% at 50% 50%, transparent 98%, black 100%)",maskImage:"radial-gradient(ellipse 52% 68% at 50% 50%, transparent 98%, black 100%)"}}/>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div style={{width:"52%",height:"68%",border:"2.5px dashed rgba(0,113,194,0.9)",borderRadius:"50%"}}/>
              </div>
              <div className="absolute top-3 left-0 right-0 flex justify-center pointer-events-none">
                <span className="bg-[#0071c2]/90 text-white text-xs px-4 py-1.5 rounded-full font-medium backdrop-blur">
                  {camReady?"Camera active — alignez votre visage":"Activation de la camera..."}
                </span>
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button onClick={analyzeFace} className="px-8 h-14 bg-[#0071c2] text-white rounded-lg font-bold editorial-shadow hover:bg-[#005fa3] flex items-center gap-3 transition-colors">
                <span className="material-symbols-outlined">analytics</span>Analyser mon visage
              </button>
              <button onClick={reset} className="px-8 h-14 border-2 border-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-50 transition-colors">Annuler</button>
            </div>
          </div>
        )}

        {/* ANALYZING */}
        {step==="analyzing"&&(
          <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 fadeSlide">
            <div className="text-6xl mb-6" style={{animation:"spin 1.2s linear infinite",display:"inline-block"}}>🔍</div>
            <h2 className="text-3xl font-black text-slate-900 mb-2">Analyse en cours...</h2>
            <p className="text-slate-500 mb-8">Detection des contours et proportions du visage</p>
            <div className="w-80 bg-slate-200 rounded-full h-2 overflow-hidden mb-3">
              <div className="bg-[#0071c2] h-full rounded-full transition-all duration-75" style={{width:`${progress}%`}}/>
            </div>
            <div className="text-[#0071c2] font-bold text-xl">{progress}%</div>
            <div className="mt-10 grid grid-cols-2 gap-3 max-w-sm">
              {["Detection contours","Analyse proportions","Identification forme...","Selection montures..."].map((t,i)=>(
                <div key={i} className={`text-xs px-4 py-3 rounded-xl text-center font-medium transition-all ${progress>(i*25+5)?"bg-blue-50 text-[#0071c2]":"bg-slate-100 text-slate-400"}`}>{t}{progress>(i*25+5)?" ✓":""}</div>
              ))}
            </div>
          </div>
        )}

        {/* MANUAL */}
        {step==="manual"&&(
          <div className="max-w-3xl mx-auto p-8 fadeSlide">
            {cameraError&&<div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-5 py-3 mb-6 text-sm flex items-center gap-2"><span className="material-symbols-outlined text-lg">warning</span>Camera non disponible — selectionnez manuellement.</div>}
            <h2 className="text-3xl font-black text-slate-900 mb-2">Votre forme de visage</h2>
            <p className="text-slate-500 mb-8">Choisissez la forme qui ressemble le plus a la votre</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(FACES).map(([key,f])=>(
                <button key={key} onClick={()=>{setFaceShape(key);setStep("result");}}
                  className="bg-white border-2 border-slate-100 hover:border-[#0071c2] rounded-2xl p-5 flex flex-col items-center gap-2 transition-all hover:shadow-xl hover:-translate-y-1 group editorial-shadow">
                  <div className="text-4xl group-hover:scale-110 transition-transform">{f.emoji}</div>
                  <div className="font-bold text-slate-700 text-sm">{f.label}</div>
                </button>
              ))}
            </div>
            <button onClick={()=>setStep("intro")} className="mt-8 text-slate-400 hover:text-[#0071c2] text-sm underline">← Retour</button>
          </div>
        )}

        {/* RESULT */}
        {step==="result"&&faceShape&&(
          <div className="max-w-6xl mx-auto p-8 fadeSlide">
            <div className="bg-white rounded-3xl editorial-shadow border border-slate-50 p-8 mb-10 flex flex-col md:flex-row items-center gap-6">
              <div className="text-7xl">{face.emoji}</div>
              <div className="flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full mb-3">
                  <span className="material-symbols-outlined text-[#0071c2] text-sm" style={{fontVariationSettings:"'FILL' 1"}}>verified</span>
                  <span className="text-[10px] font-bold text-[#0071c2] uppercase tracking-[0.2em]">Forme detectee</span>
                </div>
                <h2 className="text-4xl font-black text-slate-900 mb-2">Visage {face.label}</h2>
                <p className="text-slate-500 leading-relaxed">{face.desc}</p>
              </div>
              <button onClick={reset} className="flex-shrink-0 border-2 border-slate-100 text-slate-600 font-bold px-5 py-2 rounded-xl hover:bg-slate-50 text-sm flex items-center gap-2 transition-all">
                <span className="material-symbols-outlined text-base">refresh</span>Refaire
              </button>
            </div>

            <h3 className="text-2xl font-black text-slate-900 mb-6">Montures recommandees pour visage {face.label.toLowerCase()}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
              {face.frames.map((fr,i)=>(
                <div key={i} className="bg-white rounded-2xl editorial-shadow overflow-hidden hover:scale-[1.02] transition-all duration-300 group fadeSlide" style={{animationDelay:`${i*0.1}s`}}>
                  <div className="relative overflow-hidden bg-slate-100" style={{height:200}}>
                    <img src={fr.img} alt={fr.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={e=>{e.target.src="https://images.unsplash.com/photo-1509695507497-903c140c43b0?w=480&h=280&fit=crop";}}/>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"/>
                    <div className="absolute bottom-3 left-3">
                      <span className="bg-white text-[#0071c2] text-xs font-bold px-3 py-1 rounded-full shadow">{fr.name}</span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className="bg-[#0071c2] text-white text-[10px] font-bold px-2 py-1 rounded-full">Recommande</span>
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-sm text-slate-600 leading-relaxed">{fr.desc}</p>
                    <div className="flex items-center gap-1 mt-3 text-xs font-bold text-emerald-600">
                      <span className="material-symbols-outlined text-sm" style={{fontVariationSettings:"'FILL' 1"}}>check_circle</span>
                      Ideal pour votre visage
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <h3 className="text-2xl font-black text-slate-900 mb-2 flex items-center gap-3">
              <span className="material-symbols-outlined text-[#0071c2]">store</span>Opticiens a Marrakech
            </h3>
            <p className="text-slate-400 text-sm mb-5">Cliquez sur un marqueur pour voir les coordonnees</p>
            <div className="bg-white rounded-3xl editorial-shadow overflow-hidden mb-6">
              <div id="map-opticiens" style={{height:420,width:"100%"}}/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pb-10">
              {OPTICIENS.map((opt,i)=>(
                <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-start gap-3 hover:shadow-md transition-all editorial-shadow">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 text-xl">👓</div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{opt.name}</div>
                    <div className="text-xs text-slate-400 mt-0.5">📍 {opt.address}</div>
                    <div className="text-xs text-[#0071c2] mt-0.5 font-semibold">📞 {opt.tel}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <ChatPanel user={user}/>
    </div>
  );
}
