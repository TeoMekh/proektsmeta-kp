"use client";

import { useEffect, useMemo, useState } from "react";
import "./extra.css";
import normative848 from "./normative-848.json";
import ktim848 from "./ktim-848.json";
import normativeSbcp from "./normative-sbcp.json";
import relativeShares848 from "./shares-848.json";

const rub = new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 });
const priceLevels: Record<string,{label:string;i2021:number;i2001:number;letter:string}> = {
  "2026-q3":{label:"III квартал 2026",i2021:1.71,i2001:7.22,letter:"№ 45358-ИФ/09 от 23.07.2026"},
  "2026-q2":{label:"II квартал 2026",i2021:1.68,i2001:7.10,letter:"№ 20212-ИФ/09 от 08.04.2026"},
  "2026-q1":{label:"I квартал 2026",i2021:1.65,i2001:6.99,letter:"№ 3017-ИФ/09 от 26.01.2026"},
  "2025-q4":{label:"IV квартал 2025",i2021:1.62,i2001:6.88,letter:"№ 62725-ИФ/09 от 20.10.2025"}
};

type Method = "normative" | "unit" | "labor";
type ObjectType = "kindergarten" | "residential" | "public" | "industrial";
type Work = { id: string; group: "П" | "Р"; name: string; share: number; enabled: boolean; family?: string };
type NormInterval = { label: string; min: number | null; max: number | null; unit: string; a: number | null; b: number | null };
type NormObject = { key: string; table: string; category: string; number: string; name: string; intervals: NormInterval[]; source?: "848" | "sbcp"; baseLevel?: string; bimFactor?: number | null; bimRef?: string };
type KtimRecord = { number: string; category: string; name: string; p: number; r: number };
type ShareProfile = { key: string; table: number; number: string; name: string; p: number[]; r: number[] };
type WorkTemplate = { id:string; name:string; works:Work[]; updatedAt:string };
type SavedOffer = { id:string; title:string; location:string; total:number; date:string; payload:any };

const objects = {
  kindergarten: { icon: "Д", name: "Детский сад", subtitle: "Объект образования", area: 2900, capacity: 150, method: "normative" as Method },
  residential: { icon: "Ж", name: "Жилой дом", subtitle: "Многоквартирный дом", area: 18000, capacity: 240, method: "unit" as Method },
  public: { icon: "О", name: "Общественное здание", subtitle: "Офисы, торговля, культура", area: 6500, capacity: 0, method: "unit" as Method },
  industrial: { icon: "П", name: "Промышленный объект", subtitle: "Производственное здание", area: 12000, capacity: 0, method: "labor" as Method },
};

const initialWorks: Work[] = [
  { id:"p1",group:"П",name:"1. Пояснительная записка",share:.5,enabled:true },
  { id:"p2",group:"П",name:"2. Схема планировочной организации земельного участка",share:4,enabled:true },
  { id:"p3",group:"П",name:"3. Объёмно-планировочные и архитектурные решения",share:17,enabled:true },
  { id:"p4",group:"П",name:"4. Конструктивные решения",share:16.3,enabled:true },
  { id:"p51",group:"П",name:"5.1. Система электроснабжения",share:3.9,enabled:true },
  { id:"p52",group:"П",name:"5.2–5.3. Системы водоснабжения и водоотведения",share:4.9,enabled:true },
  { id:"p54",group:"П",name:"5.4. Отопление, вентиляция, кондиционирование и тепловые сети",share:8.3,enabled:true },
  { id:"p55",group:"П",name:"5.5. Сети связи",share:2.9,enabled:true },
  { id:"p56",group:"П",name:"5.6. Система газоснабжения",share:0,enabled:false },
  { id:"p57",group:"П",name:"5.7. Автоматизация инженерных систем",share:2.1,enabled:true },
  { id:"p6",group:"П",name:"6. Технологические решения",share:12,enabled:true },
  { id:"p7",group:"П",name:"7. Проект организации строительства",share:6.1,enabled:true },
  { id:"p8",group:"П",name:"8. Мероприятия по охране окружающей среды",share:6,enabled:true },
  { id:"p9",group:"П",name:"9. Мероприятия по обеспечению пожарной безопасности",share:4.9,enabled:true },
  { id:"p10",group:"П",name:"10. Требования к обеспечению безопасной эксплуатации",share:1,enabled:true },
  { id:"p11",group:"П",name:"11. Мероприятия по обеспечению доступа инвалидов",share:1,enabled:true },
  { id:"p12",group:"П",name:"12. Смета на строительство, реконструкцию, капремонт или снос",share:7.1,enabled:true },
  { id:"p13",group:"П",name:"13. Иная документация, предусмотренная законодательством",share:0,enabled:false },
  { id:"r_gp",group:"Р",name:"ГП — генеральный план",share:2.4,enabled:true },
  { id:"r_ar",group:"Р",name:"АР — архитектурные решения",share:15.4,enabled:true },
  { id:"r_kj",group:"Р",name:"КЖ — железобетонные конструкции",share:18,enabled:true },
  { id:"r_km",group:"Р",name:"КМ — металлические конструкции",share:3.7,enabled:true },
  { id:"r_kd",group:"Р",name:"КД — деревянные конструкции",share:2,enabled:false },
  { id:"r_ov",group:"Р",name:"ОВ — отопление, вентиляция и кондиционирование",share:11.3,enabled:true },
  { id:"r_vk",group:"Р",name:"ВК — внутренние водопровод и канализация",share:6.3,enabled:true },
  { id:"r_nvk",group:"Р",name:"НВК — наружные сети водоснабжения и канализации",share:0,enabled:false },
  { id:"r_ts",group:"Р",name:"ТС — тепловые сети",share:0,enabled:false },
  { id:"r_tm",group:"Р",name:"ТМ — тепломеханические решения",share:0,enabled:false },
  { id:"r_eom",group:"Р",name:"ЭОМ — силовое электрооборудование и освещение",share:5.3,enabled:true },
  { id:"r_es",group:"Р",name:"ЭС — электроснабжение",share:0,enabled:false },
  { id:"r_en",group:"Р",name:"ЭН — наружное электроосвещение",share:0,enabled:false },
  { id:"r_ss",group:"Р",name:"СС — системы связи",share:3.9,enabled:true },
  { id:"r_sks",group:"Р",name:"СКС — структурированная кабельная система",share:0,enabled:false },
  { id:"r_aps",group:"Р",name:"АПС, СОУЭ, АПТ — противопожарные системы",share:3.9,enabled:true },
  { id:"r_soue",group:"Р",name:"СОУЭ — оповещение и управление эвакуацией",share:0,enabled:false },
  { id:"r_apt",group:"Р",name:"АПТ — автоматическое пожаротушение",share:2,enabled:false },
  { id:"r_aov",group:"Р",name:"АОВ — автоматизация ОВ",share:0,enabled:false },
  { id:"r_ak",group:"Р",name:"АК — комплексная автоматизация",share:3.1,enabled:true },
  { id:"r_atx",group:"Р",name:"АТХ — автоматизация технологических процессов",share:2,enabled:false },
  { id:"r_tx",group:"Р",name:"ТХ — технологические решения",share:17,enabled:true },
  { id:"r_gsv",group:"Р",name:"ГСВ — внутреннее газоснабжение",share:1,enabled:false },
  { id:"r_gsn",group:"Р",name:"ГСН — наружное газоснабжение",share:1,enabled:false },
  { id:"r_ad",group:"Р",name:"АД — автомобильные дороги",share:0,enabled:false },
  { id:"r_bg",group:"Р",name:"БГ — благоустройство и озеленение",share:0,enabled:false },
  { id:"r_pos",group:"Р",name:"ПОС — проект организации строительства",share:1.1,enabled:true },
  { id:"r_odi",group:"Р",name:"ОДИ — доступность для МГН",share:1,enabled:true },
  { id:"r_sm",group:"Р",name:"СМ — сметная документация",share:7.1,enabled:true },
  { id:"r_oos",group:"Р",name:"ООС — рабочие материалы по охране окружающей среды",share:0,enabled:false },
  { id:"r_tbe",group:"Р",name:"ТБЭ — решения по безопасной эксплуатации",share:0,enabled:false },
  { id:"r_ee",group:"Р",name:"ЭЭ — мероприятия по энергоэффективности",share:0,enabled:false },
];

const sbcpShares: Record<string, number> = {
  p1:2,p2:4,p3:14,p4:15,p51:7,p52:4,p53:4,p54:12,p55:3,p56:2,p57:0,p6:5,p7:6,p8:7,p9:6,p10:0,p11:2,p12:7,p13:0,
  r_pz:0,r_gp:1,r_ar:22,r_kj:22,r_km:5,r_kd:0,r_ov:14,r_vk:6,r_nvk:0,r_ts:0,r_tm:0,r_eom:5,r_es:0,r_en:0,r_ss:3,r_sks:0,r_aps:4,r_apt:0,r_aov:0,r_ak:0,r_atx:0,r_tx:4,r_gsv:2,r_gsn:0,r_ad:0,r_bg:0,r_pos:0,r_odi:3,r_sm:9,
};

const familyByWork: Record<string,string> = {
  p1:"general",p2:"site",p3:"architecture",p4:"structure",p6:"technology",p51:"engineering",p52:"engineering",p53:"engineering",p54:"engineering",p55:"engineering",p56:"engineering",p57:"engineering",p7:"construction",p8:"environment",p9:"fire",p10:"safety",p11:"access",p12:"estimate",p13:"other",
  r_gp:"site",r_ar:"architecture",r_kj:"structure",r_km:"structure",r_kd:"structure",r_tx:"technology",r_ov:"engineering",r_vk:"engineering",r_nvk:"engineering",r_ts:"engineering",r_tm:"engineering",r_eom:"engineering",r_es:"engineering",r_en:"engineering",r_ss:"engineering",r_sks:"engineering",r_aov:"engineering",r_ak:"engineering",r_atx:"engineering",r_gsv:"engineering",r_gsn:"engineering",r_aps:"fire",r_soue:"fire",r_apt:"fire",r_pos:"construction",r_oos:"environment",r_odi:"access",r_tbe:"safety",r_ee:"safety",r_sm:"estimate",r_ad:"site",r_bg:"site"
};
const rGroups = [
  {key:"site",name:"Генеральный план",marks:"ГП",members:["r_gp","r_ad","r_bg"]},
  {key:"architecture",name:"Архитектурные решения",marks:"АР",members:["r_ar"]},
  {key:"structure",name:"Конструктивные решения",marks:"КЖ / КМ / КД",members:["r_kj","r_km","r_kd"]},
  {key:"engineering",name:"Отопление и вентиляция",marks:"ОВ / ТС",members:["r_ov","r_ts"]},
  {key:"water",name:"Водоснабжение и водоотведение",marks:"ВК / НВК",members:["r_vk","r_nvk"]},
  {key:"electric",name:"Электроснабжение",marks:"ЭОМ / ЭС / ЭН",members:["r_eom","r_es","r_en"]},
  {key:"communications",name:"Сети связи и автоматизация",marks:"СС / СКС / АВТ",members:["r_ss","r_sks","r_aov","r_ak"]},
  {key:"fire",name:"Противопожарные системы",marks:"АУПТ / АПС / СОУЭ",members:["r_apt","r_aps","r_soue"]},
  {key:"technology",name:"Технологические решения",marks:"ТХ / АТХ",members:["r_tx","r_atx"]},
  {key:"gas",name:"Газоснабжение",marks:"ГСВ / ГСН",members:["r_gsv","r_gsn"]},
  {key:"environment",name:"Охрана окружающей среды",marks:"ООС",members:["r_oos"]},
  {key:"estimate",name:"Сметная документация",marks:"СМ",members:["r_sm"]}
];

function sharesFromProfile(profile: ShareProfile, group: "П"|"Р") {
  const v = group === "П" ? profile.p : profile.r;
  if (group === "П") {
    const map: Record<string,number> = {p1:v[0],p2:v[1],p3:v[2],p4:v[3],p6:v[4],p54:v[5]+v[10]+v[11],p52:v[6],p53:0,p51:v[7],p55:v[8]+v[9],p57:0,p56:v[12],p7:v[13],p8:v[14],p9:v[15],p11:v[16],p10:v[17],p12:v[19],p13:0};
    const solutionIds=["p3","p4","p6","p54","p52","p51","p55","p56"];
    const solutionTotal=solutionIds.reduce((s,id)=>s+(map[id]??0),0);
    if (v[18] && solutionTotal) solutionIds.forEach(id=>map[id]+=(v[18]*(map[id]??0)/solutionTotal));
    return map;
  }
  const map: Record<string,number> = {
    r_gp:v[0]+v[1],r_ar:v[2]+v[17],r_kj:v[3],r_km:0,r_kd:0,r_tx:v[4],r_atx:0,
    r_ov:v[5]+v[10]+v[11],r_ts:0,r_vk:v[6],r_nvk:0,r_eom:v[7],r_es:0,r_en:0,
    r_ss:v[8]+v[9],r_sks:0,r_aov:0,r_ak:0,r_gsv:v[12],r_gsn:0,r_oos:v[14],r_sm:v[19],
    r_apt:0,r_aps:0,r_soue:0,r_pos:0,r_odi:0,r_tbe:0,r_ee:0
  };
  const add=(id:string,value:number)=>map[id]=(map[id]??0)+value;
  const pos=v[13]; add("r_gp",pos*.40);add("r_kj",pos*.30);add("r_ar",pos*.10);add("r_ov",pos*.05);add("r_vk",pos*.05);add("r_eom",pos*.05);add("r_ss",pos*.05);
  const pb=v[15]; add("r_ar",pb*.20);add("r_kj",pb*.10);add("r_ov",pb*.20);add("r_vk",pb*.10);add("r_ss",pb*.15);add("r_apt",pb*.15);add("r_eom",pb*.10);
  const odi=v[16]; add("r_ar",odi*.80);add("r_gp",odi*.20);
  const solutionIds=["r_ar","r_kj","r_tx","r_ov","r_vk","r_eom","r_ss","r_gsv"];
  const solutionTotal=solutionIds.reduce((s,id)=>s+(map[id]??0),0);
  if (v[18] && solutionTotal) solutionIds.forEach(id=>map[id]+=(v[18]*(map[id]??0)/solutionTotal));
  return map;
}

export default function Home() {
  const [view, setView] = useState<"calculator"|"offers"|"norms">("calculator");
  const [step, setStep] = useState(1);
  const [type, setType] = useState<ObjectType>("kindergarten");
  const [title, setTitle] = useState("Детское дошкольное учреждение на 150 мест");
  const [location, setLocation] = useState("Екатеринбург, ул. Стрелочников");
  const [area, setArea] = useState(2900);
  const [capacity, setCapacity] = useState(150);
  const [sections, setSections] = useState(1);
  const [method, setMethod] = useState<Method>("normative");
  const [works, setWorks] = useState(initialWorks);
  const [stageP, setStageP] = useState(true);
  const [stageR, setStageR] = useState(true);
  const [sketch, setSketch] = useState(true);
  const [sketchPercent, setSketchPercent] = useState(20);
  const [index, setIndex] = useState(1.71);
  const [quarter, setQuarter] = useState("2026-q3");
  const [vat, setVat] = useState(5);
  const [unitRate, setUnitRate] = useState(4200);
  const [hours, setHours] = useState(5200);
  const [hourRate, setHourRate] = useState(2100);
  const [repeat, setRepeat] = useState(0.25);
  const [complexity, setComplexity] = useState(1);
  const [urgency, setUrgency] = useState(1);
  const [saved, setSaved] = useState(false);
  const [customer, setCustomer] = useState("ООО «Атлас Девелопмент»");
  const [contact, setContact] = useState("Румянцев Максим Андреевич");
  const [durationP, setDurationP] = useState(75);
  const [durationR, setDurationR] = useState(110);
  const [advance, setAdvance] = useState(30);
  const [validity, setValidity] = useState(30);
  const [distributionSourceP, setDistributionSourceP] = useState("848");
  const [distributionSourceR, setDistributionSourceR] = useState("848");
  const distributionSource = distributionSourceP === distributionSourceR ? distributionSourceP : "mixed";
  const [showDetails, setShowDetails] = useState(false);
  const [showInternal, setShowInternal] = useState(false);
  const [distributedGroups, setDistributedGroups] = useState<Record<string,boolean>>({});
  const [floors, setFloors] = useState(9);
  const [normTable, setNormTable] = useState("3.8");
  const [normKey, setNormKey] = useState("3.8-1");
  const [hasBim, setHasBim] = useState(true);
  const [sbcpIndex, setSbcpIndex] = useState(7.22);
  const [templates, setTemplates] = useState<WorkTemplate[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [savedOffers, setSavedOffers] = useState<SavedOffer[]>([]);

  const normObjects = useMemo(() => [
    ...(normative848 as NormObject[]).map(n => ({...n, source:"848" as const, baseLevel:"01.01.2021"})),
    ...(normativeSbcp as NormObject[])
  ], []);
  const normCategories = useMemo(() => Array.from(new Map(normObjects.map(n => [n.table, n.category])).entries()), []);
  const categoryNorms = useMemo(() => normObjects.filter(n => n.table === normTable), [normTable]);
  const selectedNorm = normObjects.find(n => n.key === normKey) ?? normObjects.find(n => n.table === normTable) ?? normObjects[0];
  const relativeTable = selectedNorm.source === "848" ? Number(selectedNorm.table.split(".")[1]) : 0;
  const shareProfiles = relativeShares848 as ShareProfile[];
  const isMultiResidential = selectedNorm.source === "848" && relativeTable === 1 && /многоквартир/i.test(selectedNorm.name);
  const profileNumber = isMultiResidential ? (floors <= 9 ? "3.1" : "3.2") : selectedNorm.number;
  const selectedShareProfile = shareProfiles.find(p => p.table === relativeTable && p.number === profileNumber) ?? shareProfiles.find(p => p.table === relativeTable);
  const normativeRTargets = useMemo<Record<string,number>>(() => selectedNorm.source === "sbcp" ? sbcpShares : selectedShareProfile ? sharesFromProfile(selectedShareProfile,"Р") : {}, [selectedNorm.source, selectedShareProfile?.key]);
  const pricing = useMemo(() => {
    const direct=selectedNorm.intervals.find(i => (i.min == null || area >= i.min) && (i.max == null || area <= i.max));
    const price=(i:NormInterval,x:number)=>(i.a != null ? (i.a+(i.b??0)*x)*1000 : 0);
    if(direct) return {interval:direct,base:price(direct,area),mode:"В пределах нормативного интервала",symbolFormula:"Cб = (a + b × X) × 1 000",formula:`(${direct.a ?? 0} + ${direct.b ?? 0} × ${area}) × 1 000`,referenceX:area,kex:1};
    const first=selectedNorm.intervals[0],last=selectedNorm.intervals[selectedNorm.intervals.length-1];
    const xmin=first?.min,max=last?.max;
    if(first && xmin != null && area < xmin){
      const half=xmin/2;
      if(area >= half){const xref=.4*xmin+.6*area;return {interval:first,base:price(first,xref),mode:"Экстраполяция по формуле 8.2",symbolFormula:"Cб = [a + b × (0,4Xmin + 0,6X)] × 1 000",formula:`(${first.a ?? 0} + ${first.b ?? 0} × (0,4 × ${xmin} + 0,6 × ${area})) × 1 000`,referenceX:xref,kex:1};}
      const kex=Math.max(.1,area/half),xref=.4*xmin+.6*half;
      return {interval:first,base:price(first,xref)*kex,mode:"Экстраполяция по формулам 8.4–8.5",symbolFormula:"Cб = [a + b × (0,4Xmin + 0,6X½min)] × Kэкс × 1 000",formula:`[(${first.a ?? 0} + ${first.b ?? 0} × (0,4 × ${xmin} + 0,6 × ${half})) × 1 000] × ${kex.toFixed(3)}`,referenceX:xref,kex};
    }
    if(last && max != null && area > max){const xref=.4*max+.6*area;return {interval:last,base:price(last,xref),mode:"Экстраполяция по формуле 8.3",symbolFormula:"Cб = [a + b × (0,4Xmax + 0,6X)] × 1 000",formula:`(${last.a ?? 0} + ${last.b ?? 0} × (0,4 × ${max} + 0,6 × ${area})) × 1 000`,referenceX:xref,kex:1};}
    return {interval:first,base:price(first,area),mode:"Расчёт по единственной нормативной строке",symbolFormula:"Cб = (a + b × X) × 1 000",formula:`(${first?.a ?? 0} + ${first?.b ?? 0} × ${area}) × 1 000`,referenceX:area,kex:1};
  },[selectedNorm,area]);
  const selectedInterval = pricing.interval;
  const normativeKtim = useMemo(() => {
    if (selectedNorm.source === "sbcp") return {number:selectedNorm.bimFactor ? "854" : "—",category:selectedNorm.category,name:selectedNorm.bimRef ?? "Коэффициент ТИМ не назначен",p:selectedNorm.bimFactor ?? 1,r:selectedNorm.bimFactor ?? 1};
    const candidates=(ktim848 as KtimRecord[]).filter(k => k.category === selectedNorm.category);
    const stop=new Set(["здание","объекта","корпуса","сооружение","центр"]);
    const words=selectedNorm.name.toLowerCase().split(/[^\p{L}]+/u).filter(w => w.length > 4 && !stop.has(w));
    return candidates.sort((a,b) => words.filter(w => b.name.toLowerCase().includes(w)).length - words.filter(w => a.name.toLowerCase().includes(w)).length)[0] ?? {number:"—",category:selectedNorm.category,name:"КТИМ не предусмотрен",p:1,r:1};
  }, [selectedNorm]);
  const selectedKtim = hasBim ? normativeKtim : { ...normativeKtim, p: 1, r: 1 };
  const effectiveKtim = selectedKtim;
  const isSbcp = selectedNorm.source === "sbcp";
  const stagePFactor = isSbcp ? .4 : .6;
  const stageRFactor = isSbcp ? .6 : .4;
  const activeIndex = isSbcp ? sbcpIndex : index;
  const expectedIndex = quarter === "future" ? null : isSbcp ? priceLevels[quarter]?.i2001 : priceLevels[quarter]?.i2021;
  const indexMismatch = expectedIndex != null && Math.abs(activeIndex - expectedIndex) > .001;

  useEffect(() => {
    if (isSbcp) {
      setDistributionSourceP("sbcp"); setDistributionSourceR("sbcp");
      setWorks(list => list.map(w => ({...w, share:sbcpShares[w.id] ?? 0, enabled:(sbcpShares[w.id] ?? 0) > 0})));
      return;
    }
    if (!selectedShareProfile) return;
    const pMap=sharesFromProfile(selectedShareProfile,"П"), rMap=sharesFromProfile(selectedShareProfile,"Р");
    setDistributionSourceP("848"); setDistributionSourceR("848");
    setWorks(list => list.map(w => {
      const share=(w.group === "П" ? pMap : rMap)[w.id] ?? 0;
      return {...w,share,enabled:share > 0};
    }));
  }, [isSbcp, normKey, selectedShareProfile?.key]);

  const chooseNormTable = (table: string) => {
    const first = normObjects.find(n => n.table === table); if (!first) return;
    setNormTable(table); setNormKey(first.key); setTitle(first.name);
    const source = first.source === "sbcp" ? "sbcp" : "848";
    setDistributionSourceP(source); setDistributionSourceR(source);
    const interval = first.intervals[0]; if (interval?.min != null && interval?.max != null) setArea(Math.round((interval.min + interval.max) / 2)); else if (interval) setArea(interval.b ? Math.max(interval.min ?? 1, 1) : 1);
  };
  const chooseNormObject = (key: string) => {
    const item = normObjects.find(n => n.key === key); if (!item) return;
    setNormKey(key); setTitle(item.name);
    const source = item.source === "sbcp" ? "sbcp" : "848";
    setDistributionSourceP(source); setDistributionSourceR(source);
    const interval = item.intervals[0]; if (interval?.min != null && interval?.max != null) setArea(Math.round((interval.min + interval.max) / 2)); else if (interval) setArea(interval.b ? Math.max(interval.min ?? 1, 1) : 1);
  };

  const chooseType = (next: ObjectType) => {
    const preset = objects[next]; setType(next); setArea(preset.area); setCapacity(preset.capacity); setMethod(preset.method);
    setTitle(next === "kindergarten" ? "Детское дошкольное учреждение на 150 мест" : preset.name);
    setSections(next === "residential" ? 4 : 1);
  };
  const chooseQuarter = (value: string) => {
    setQuarter(value);
    if (value !== "future" && priceLevels[value]) { setIndex(priceLevels[value].i2021); setSbcpIndex(priceLevels[value].i2001); }
  };

  const calc = useMemo(() => {
    const normBase = pricing.base;
    let base = method === "normative" ? normBase : method === "unit" ? area * unitRate : hours * hourRate;
    const repeatFactor = 1;
    const adjusted = method === "normative" ? base : base * complexity * urgency;
    const pScope = works.filter(w => w.group === "П" && w.enabled).reduce((s,w) => s + w.share, 0) / 100;
    const rScope = works.filter(w => w.group === "Р" && w.enabled).reduce((s,w) => s + w.share, 0) / 100;
    const p = stageP ? adjusted * stagePFactor * pScope * (method === "normative" ? effectiveKtim.p * activeIndex : 1) : 0;
    const r = stageR ? adjusted * stageRFactor * rScope * (method === "normative" ? effectiveKtim.r * activeIndex : 1) : 0;
    const ep = sketch ? (p + r) * Math.max(0, sketchPercent) / 100 : 0;
    const subtotal = p + r + ep; const tax = subtotal * vat / 100;
    return { base, repeatFactor, adjusted, pScope, rScope, p, r, ep, subtotal, tax, total: subtotal + tax };
  }, [activeIndex, area, complexity, effectiveKtim, hourRate, hours, method, pricing, repeat, sections, sketch, sketchPercent, stageP, stagePFactor, stageR, stageRFactor, unitRate, urgency, vat, works]);

  const currentPayload = () => ({ type, title, location, area, capacity, sections, method, stageP, stageR, sketch, sketchPercent, index, sbcpIndex, quarter, vat, repeat, complexity, urgency, works, normTable, normKey, floors, hasBim, distributionSourceP, distributionSourceR });
  const saveDraft = () => {
    const payload=currentPayload();
    localStorage.setItem("proektsmeta-draft", JSON.stringify(payload));
    const record:SavedOffer={id:`offer-${Date.now()}`,title:title||"Расчёт без названия",location,total:calc.total,date:new Date().toLocaleDateString("ru-RU"),payload};
    setSavedOffers(list=>{const next=[record,...list];localStorage.setItem("proektsmeta-offers",JSON.stringify(next));return next;});
    setSaved(true); setTimeout(() => setSaved(false), 1800);
  };
  useEffect(() => {
    try { setTemplates(JSON.parse(localStorage.getItem("proektsmeta-templates")||"[]")); } catch {}
    try { setSavedOffers(JSON.parse(localStorage.getItem("proektsmeta-offers")||"[]")); } catch {}
  }, []);
  useEffect(() => {
    if (!window.location.pathname.startsWith("/proektsmeta-kp/")) return;
    document.querySelectorAll<HTMLAnchorElement>('a[href^="/norms/"]').forEach(a => a.href = `/proektsmeta-kp${a.getAttribute("href")}`);
  }, [view]);

  const loadOffer=(offer:SavedOffer)=>{const d=offer.payload||{};if(d.title!=null)setTitle(d.title);if(d.location!=null)setLocation(d.location);if(d.area!=null)setArea(d.area);if(d.method)setMethod(d.method);if(d.works)setWorks(d.works);if(d.normTable)setNormTable(d.normTable);if(d.normKey)setNormKey(d.normKey);if(d.stageP!=null)setStageP(d.stageP);if(d.stageR!=null)setStageR(d.stageR);if(d.sketch!=null)setSketch(d.sketch);if(d.sketchPercent!=null)setSketchPercent(d.sketchPercent);if(d.vat!=null)setVat(d.vat);setStep(4);setView("calculator")};
  const deleteOffer=(id:string)=>setSavedOffers(list=>{const next=list.filter(x=>x.id!==id);localStorage.setItem("proektsmeta-offers",JSON.stringify(next));return next;});
  const persistTemplates=(next:WorkTemplate[])=>{setTemplates(next);localStorage.setItem("proektsmeta-templates",JSON.stringify(next));};
  const createTemplate=()=>{const name=templateName.trim();if(!name)return;const item={id:`tpl-${Date.now()}`,name,works:works.map(w=>({...w})),updatedAt:new Date().toLocaleDateString("ru-RU")};persistTemplates([...templates,item]);setSelectedTemplateId(item.id);setTemplateName("");setDistributionSourceP("company");setDistributionSourceR("company");};
  const applyTemplate=(id:string)=>{const tpl=templates.find(t=>t.id===id);setSelectedTemplateId(id);if(!tpl)return;setWorks(tpl.works.map(w=>({...w})));setDistributionSourceP("company");setDistributionSourceR("company");};
  const updateTemplate=()=>{if(!selectedTemplateId)return;persistTemplates(templates.map(t=>t.id===selectedTemplateId?{...t,works:works.map(w=>({...w})),updatedAt:new Date().toLocaleDateString("ru-RU")}:t));};
  const deleteTemplate=()=>{if(!selectedTemplateId)return;persistTemplates(templates.filter(t=>t.id!==selectedTemplateId));setSelectedTemplateId("");};

  const toggleWork = (id: string) => setWorks(list => list.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w));
  const updateShare = (id: string, value: number) => {
    const group = works.find(w => w.id === id)?.group;
    if (group === "П") setDistributionSourceP("manual");
    if (group === "Р") setDistributionSourceR("manual");
    setWorks(list => list.map(w => w.id === id ? { ...w, share: Math.max(0, Math.min(100, value)) } : w));
  };
  const setGroupTotal=(group:"П"|"Р",value:number)=>{
    const target=Math.max(0,Math.min(200,value));
    group==="П"?setDistributionSourceP("manual"):setDistributionSourceR("manual");
    setWorks(list=>{const current=list.filter(w=>w.group===group&&w.enabled).reduce((s,w)=>s+w.share,0);const enabled=list.filter(w=>w.group===group&&w.enabled);if(!enabled.length)return list;if(current<=0){const each=target/enabled.length;return list.map(w=>w.group===group&&w.enabled?{...w,share:each}:w)}const factor=target/current;return list.map(w=>w.group===group&&w.enabled?{...w,share:w.share*factor}:w)});
  };
  const addRWork = (family: string) => {
    const name=window.prompt("Наименование или марка нового комплекта РД");
    if (!name?.trim()) return;
    setWorks(list => [...list,{id:`custom-${Date.now()}`,group:"Р",name:name.trim(),share:0,enabled:true,family}]);
  };
  const removeRWork = (id:string) => setWorks(list => list.filter(w => w.id !== id));
  const setAllWorks = (group: "П" | "Р", enabled: boolean) => setWorks(list => list.map(w => w.group === group ? { ...w, enabled } : w));
  const chooseDistributionSource = (group: "П" | "Р", value: string) => {
    group === "П" ? setDistributionSourceP(value) : setDistributionSourceR(value);
    if (value === "848" && selectedShareProfile) {
      const map=sharesFromProfile(selectedShareProfile,group);
      setWorks(list => list.map(w => w.group === group ? {...w,share:map[w.id] ?? 0,enabled:(map[w.id] ?? 0)>0} : w));
    }
    if (value === "sbcp") setWorks(list => list.map(w => w.group === group ? { ...w, share: sbcpShares[w.id] ?? 0, enabled: (sbcpShares[w.id] ?? 0) > 0 } : w));
  };
  const next = () => setStep(s => Math.min(5, s + 1));
  const back = () => setStep(s => Math.max(1, s - 1));

  return <main className="shell">
    <aside className="sidebar"><div className="brand"><span className="brandMark">П</span><span>ПроектСмета</span></div><nav><button className={view==="calculator"?"navItem active":"navItem"} onClick={()=>setView("calculator")}><span>⌁</span> Расчёт</button><button className={view==="offers"?"navItem active":"navItem"} onClick={()=>setView("offers")}><span>▤</span> Коммерческие предложения</button><button className={view==="norms"?"navItem active":"navItem"} onClick={()=>setView("norms")}><span>▦</span> Нормативы</button></nav><div className="sidebarBottom"><div className="storageNote"><strong>Локальное хранение</strong><small>Шаблоны и КП сохраняются в этом браузере</small></div></div></aside>
    <section className="workspace">
      <header className="topbar"><div><span className="crumb">{view==="calculator"?"Расчёт":view==="offers"?"Коммерческие предложения":"Нормативы"}</span>{view==="calculator"&&<><span className="slash">/</span><span>Новый расчёт</span></>}</div>{view==="calculator"&&<div className="topActions"><button className="ghost" onClick={saveDraft}>{saved ? "✓ Сохранено" : "Сохранить расчёт"}</button><button className="primary" onClick={() => setStep(4)}>Сформировать КП</button></div>}</header>
      {view==="offers"&&<div className="content libraryPage"><div className="libraryHead"><div><div className="eyebrow">АРХИВ</div><h1>Коммерческие предложения</h1><p>Сохранённые расчёты на этом устройстве</p></div><button className="primary" onClick={()=>{setView("calculator");setStep(1)}}>+ Новый расчёт</button></div>{savedOffers.length?<div className="offerList">{savedOffers.map(o=><article className="card offerCard" key={o.id}><div><strong>{o.title}</strong><span>{o.location||"Адрес не указан"}</span><small>{o.date}</small></div><b>{rub.format(o.total)}</b><div><button className="ghost" onClick={()=>loadOffer(o)}>Открыть</button><button className="dangerLink" onClick={()=>deleteOffer(o.id)}>Удалить</button></div></article>)}</div>:<div className="card emptyState"><b>Пока нет сохранённых КП</b><p>Завершите расчёт и нажмите «Сохранить расчёт».</p></div>}</div>}
      {view==="norms"&&<div className="content libraryPage"><div className="libraryHead"><div><div className="eyebrow">НОРМАТИВНАЯ БАЗА</div><h1>Нормативы</h1><p>Документы, используемые калькулятором</p></div></div><div className="normLibrary"><a className="card normDoc" href="/norms/prikaz-848.rtf" download><span>848/пр</span><div><strong>Нормативные затраты для объектов жилищно-гражданского назначения</strong><small>Расценки, доли П/Р, разделы и коэффициенты ТИМ</small></div><b>Скачать</b></a><a className="card normDoc" href="/norms/prikaz-707.rtf" download><span>707/пр</span><div><strong>Методика определения стоимости проектных работ</strong><small>Формулы, интерполяция и экстраполяция</small></div><b>Скачать</b></a><a className="card normDoc" href="/norms/sbcp-81-2001-03.rtf" download><span>СБЦП</span><div><strong>Объекты жилищно-гражданского строительства</strong><small>Действующие таблицы и рекомендуемый состав работ</small></div><b>Скачать</b></a><div className="card normDoc info"><span>87</span><div><strong>Постановление Правительства РФ № 87</strong><small>Структура разделов проектной документации</small></div><a href="https://www.consultant.ru/document/cons_doc_LAW_75048/" target="_blank" rel="noreferrer">Открыть ↗</a></div></div></div>}
      {view==="calculator"&&<div className="content">
        <div className="titleRow"><div><div className="eyebrow">НОВЫЙ РАСЧЁТ</div><h1>{title || "Коммерческое предложение"}</h1><p>{location || "Укажите адрес объекта"}</p></div><span className="status">{step === 4 ? "Рассчитано" : "Черновик"}</span></div>
        <div className="steps">{["Объект", "Состав работ", "Расчёт", "Результат"].map((name, i) => <button key={name} className={step === i + 1 ? "step active" : step > i + 1 ? "step done" : "step"} onClick={() => setStep(i + 1)}><span>{step > i + 1 ? "✓" : i + 1}</span>{name}</button>)}</div>
        {step === 1 && <section className="normClassifier card"><div className="classifierHead"><div><span className="sourceBadge">{isSbcp ? "СБЦП 81-2001-03 · действующие таблицы 33–38" : "№ 848/пр · редакция 15.12.2025"}</span><h2>Классификация объекта по нормативным затратам</h2><p>Выберите группу и конкретный объект — приложение автоматически найдёт строку и интервал натурального показателя.</p></div><b>{normObjects.length} типов · {normCategories.length} параметрических групп</b></div><div className="classifierFields"><label><span>Нормативная группа</span><select value={normTable} onChange={e => chooseNormTable(e.target.value)}>{normCategories.map(([table,name]) => <option key={table} value={table}>{table} — {name}</option>)}</select></label><label><span>Конкретный объект</span><select value={selectedNorm.key} onChange={e => chooseNormObject(e.target.value)}>{categoryNorms.map(n => <option key={n.key} value={n.key}>{n.number}. {n.name}</option>)}</select></label></div><div className="activeNorm"><div><span>Применённая строка</span><strong>Таблица {selectedNorm.table}, пункт {selectedNorm.number}</strong><small>{selectedNorm.name}</small></div><div><span>Способ определения</span><strong>{pricing.mode}</strong><small>Нормативный интервал: {selectedInterval?.label}; X = {area.toLocaleString("ru-RU")} {selectedInterval?.unit}</small></div><div><span>Параметры</span><strong>a = {selectedInterval?.a?.toLocaleString("ru-RU") ?? "—"}; b = {selectedInterval?.b?.toLocaleString("ru-RU") ?? "—"}</strong><small>тыс. ₽ в уровне цен {selectedNorm.baseLevel}</small></div></div><p className="coverageNote"><strong>{isSbcp ? "Маршрут СБЦП выбран автоматически." : "Приоритет № 848/пр."}</strong> {isSbcp ? "В каталог включены только таблицы 33–38; отменённые главы 2.1–2.10, 12 и таблицы 1–32, 39–42 исключены." : "Для объектов таблиц 3.1–3.17 СБЦП не используется как параллельная альтернатива."}</p></section>}
        {step === 1 && <section className="routeCard card"><div><span className="sourceBadge">Автоматический выбор нормативного маршрута</span><h2>{isSbcp ? "СБЦП 81-2001-03 → правила 707/пр → при ТИМ 854/пр → индекс" : "848/пр → правила 707/пр → приложение 2 к 848/пр → индекс"}</h2><p>{isSbcp ? "Объект отсутствует в действующей номенклатуре № 848/пр и найден в неотменённых таблицах 33–38 СБЦП." : "Объект содержится в таблицах 3.1–3.17 № 848/пр; исключённые таблицы СБЦП параллельно не применяются."}</p></div><label className={hasBim ? "bimToggle on" : "bimToggle"}><input type="checkbox" checked={hasBim} onChange={e => setHasBim(e.target.checked)}/><span><strong>Документация в форме информационной модели (ТИМ/BIM)</strong><small>{hasBim ? (isSbcp ? selectedNorm.bimFactor ? `КИМ ${selectedKtim.p.toFixed(2)}: ${selectedNorm.bimRef}` : `Автоматический КИМ не назначен: ${selectedNorm.bimRef}` : `КТИМ из приложения 2 к № 848/пр: П ${selectedKtim.p.toFixed(2)}, Р ${selectedKtim.r.toFixed(2)}`) : "Коэффициент ТИМ не применяется: П = 1,00; Р = 1,00"}</small></span></label><div className="legacyRoute"><strong>Выбранный источник</strong><span>{isSbcp ? `${selectedNorm.table}, пункт ${selectedNorm.number}; цены на 01.01.2001; П 40%, Р 60%.` : `№ 848/пр, таблица ${selectedNorm.table}, пункт ${selectedNorm.number}; цены на 01.01.2021.`}</span></div></section>}
        {step === 3 && method === "normative" && <section className="dynamicNorm card"><div><span className="sourceBadge">{selectedNorm.table} · пункт {selectedNorm.number}</span><h2>{selectedNorm.name}</h2><p>{pricing.mode} · нормативный интервал {selectedInterval?.label}</p></div><div className="dynamicFormula"><span>Формула базовой цены в уровне {selectedNorm.baseLevel}</span><code className="symbolFormula">{pricing.symbolFormula}</code><code>{pricing.formula} = <strong>{rub.format(calc.base)}</strong></code><dl><div><dt>a</dt><dd>{selectedInterval?.a ?? 0} тыс. ₽ — постоянная из {selectedNorm.table}, п. {selectedNorm.number}</dd></div><div><dt>b</dt><dd>{selectedInterval?.b ?? 0} тыс. ₽/ед. — коэффициент из нормативной строки</dd></div><div><dt>X</dt><dd>{area.toLocaleString("ru-RU")} {selectedInterval?.unit} — натуральный показатель пользователя</dd></div><div><dt>1 000</dt><dd>перевод из тысяч рублей в рубли</dd></div></dl><small>Порядок расчёта и экстраполяции — Методика № 707/пр; a и b — из {isSbcp ? "СБЦП 81-2001-03" : "№ 848/пр"}.</small></div><div className="ktimStrip"><span>{hasBim ? (isSbcp ? "КИМ по Методике № 854/пр" : "КТИМ из приложения 2 к № 848/пр") : "ТИМ не выбрана"}</span><strong>П = {effectiveKtim.p.toFixed(2)} · Р = {effectiveKtim.r.toFixed(2)}</strong><small>{hasBim ? selectedKtim.name : "Повышающие коэффициенты ТИМ не применяются"}</small></div></section>}
        {step === 4 && <button className="detailsTrigger" onClick={() => setShowDetails(true)}>ⓘ Подробно о расчёте</button>}
        {showDetails && <div className="detailsOverlay" onClick={() => setShowDetails(false)}><section className="detailsModal card" onClick={e => e.stopPropagation()}><button className="detailsClose" onClick={() => setShowDetails(false)}>×</button><div className="eyebrow">ПРОВЕРОЧНЫЙ ЛИСТ</div><h2>Подробно о расчёте</h2><p className="detailsLead">Все множители приведены в порядке применения. Расчёт можно повторить вручную.</p><div className="auditFormula"><span>Базовая цена</span><strong>{pricing.formula} = {rub.format(calc.base)}</strong><small>{isSbcp ? "СБЦП 81-2001-03" : "№ 848/пр"}, {selectedNorm.table}, пункт {selectedNorm.number}; уровень цен {selectedNorm.baseLevel}</small></div><div className="auditRows"><div><b>Способ определения</b><span>{pricing.mode}</span><small>№ 707/пр, пункт 131, формулы 8.2–8.5</small></div><div><b>Площадь X</b><span>{area.toLocaleString("ru-RU")} {selectedInterval?.unit ?? "ед."}</span><small>Введено пользователем</small></div><div><b>Стадия П</b><span>{Math.round(stagePFactor*100)}% × КТИМ {selectedKtim.p.toFixed(2)} × индекс {activeIndex.toFixed(2)} × состав {(calc.pScope*100).toFixed(1)}%</span><small>{isSbcp ? selectedNorm.bimRef : `№ 848/пр, приложение 2, пункт ${selectedKtim.number}`}</small></div><div><b>Стадия Р</b><span>{Math.round(stageRFactor*100)}% × КТИМ {selectedKtim.r.toFixed(2)} × индекс {activeIndex.toFixed(2)} × состав {(calc.rScope*100).toFixed(1)}%</span><small>{isSbcp ? selectedNorm.bimRef : `№ 848/пр, приложение 2, пункт ${selectedKtim.number}`}</small></div><div><b>Распределение разделов</b><span>{distributionSource === "848" ? "№ 848/пр, приложение 1, таблица для выбранной группы" : distributionSource === "sbcp" ? "СБЦП 81-2001-03, таблицы 41 и 42" : "Ручное / организационное"}</span><small>Проценты показаны на шаге «Состав работ»</small></div><div><b>Индекс пересчёта</b><span>{activeIndex.toFixed(2)}{isSbcp ? " · введён вручную" : ` · ${priceLevels[quarter]?.label ?? "Будущий квартал"}`}</span><small>Переход от цен {selectedNorm.baseLevel}</small></div><div><b>Дополнительные нормативные условия</b><span>Не применены</span><small>Стеснённость и иные факторы должны включаться только после подтверждения основания</small></div></div><div className="methodSources"><h3>Нормативная основа</h3><a href="https://www.minstroyrf.gov.ru/docs/355755/" target="_blank" rel="noreferrer">Приказ Минстроя № 848/пр ↗</a><a href="https://minstroyrf.gov.ru/upload/iblock/0e3/Metodika-opredeleniya-stoimosti-rabot-po-podgotovke-proektnoy-dokumentatsii.pdf" target="_blank" rel="noreferrer">Методика № 707/пр ↗</a><a href="https://www.minstroyrf.gov.ru/docs/11900/" target="_blank" rel="noreferrer">СБЦП 81-2001-03 ↗</a><a href="https://base.garant.ru/400375659/" target="_blank" rel="noreferrer">Методика № 854/пр ↗</a><p>№ 707/пр устанавливает общий порядок определения стоимости; № 848/пр содержит нормативные затраты для жилищно-гражданских объектов. Коммерческие коэффициенты сложности и срочности в нормативном режиме не применяются.</p></div></section></div>}
        {step === 3 && method === "normative" && <div className="quarterBar card"><label><span>Уровень цен</span><select value={quarter} onChange={e => chooseQuarter(e.target.value)}>{Object.entries(priceLevels).map(([key,v])=><option key={key} value={key}>{v.label} — {isSbcp ? v.i2001.toFixed(2) : v.i2021.toFixed(2)}</option>)}<option value="future">Будущий квартал — индекс вручную</option></select><small>{quarter === "future" ? "Официальный индекс ещё не опубликован; значение задаётся вручную." : priceLevels[quarter]?.letter}</small></label><label className={indexMismatch ? "indexField mismatch" : "indexField"}><span>Индекс к {isSbcp ? "01.01.2001" : "01.01.2021"}</span><input type="number" step=".01" value={activeIndex} onChange={e => isSbcp ? setSbcpIndex(+e.target.value) : setIndex(+e.target.value)}/><small>{indexMismatch ? `Введено ${activeIndex.toFixed(2)}, но выбранному кварталу соответствует ${expectedIndex?.toFixed(2)}` : quarter === "future" ? "Проверьте значение после публикации очередного письма Минстроя." : `Значение соответствует ${priceLevels[quarter]?.label}`}</small><a href="https://minstroyrf.gov.ru/trades/tsenoobrazovanie/" target="_blank" rel="noreferrer">Источник: Минстрой России · Индексы изменения сметной стоимости ↗</a></label></div>}
        {step === 3 && method === "normative" && <div className="normBreakdown card"><div><strong>Как собрана нормативная цена</strong><span>Все применённые значения показаны отдельно</span></div><dl><div><dt>а = {selectedInterval?.a ?? 0} тыс. ₽; b = {selectedInterval?.b ?? 0}</dt><dd>{isSbcp ? "СБЦП 81-2001-03" : "Приказ № 848/пр"}, {selectedNorm.table}, пункт {selectedNorm.number}</dd></div><div><dt>X = {area.toLocaleString("ru-RU")} {selectedInterval?.unit}</dt><dd>Натуральный показатель, введённый на шаге 1</dd></div><div><dt>П = {Math.round(stagePFactor*100)}%; Р = {Math.round(stageRFactor*100)}%</dt><dd>{isSbcp ? "СБЦП, пункт 1.5" : "Распределение для выбранного норматива"}</dd></div><div><dt>{hasBim ? `ТИМ: П ${selectedKtim.p.toFixed(2)}; Р ${selectedKtim.r.toFixed(2)}` : "ТИМ не применяется"}</dt><dd>{isSbcp ? selectedNorm.bimRef : "№ 848/пр, приложение 2"}</dd></div><div><dt>Индекс = {activeIndex.toFixed(2)}</dt><dd>Пересчёт от уровня цен {selectedNorm.baseLevel}</dd></div></dl><p><strong>Методика № 707/пр</strong> задаёт общий порядок расчёта. Источник цены выбран автоматически: сначала № 848/пр, а для отсутствующих там объектов — только действующие таблицы 33–38 СБЦП.</p></div>}
        {step === 3 && method !== "normative" && <div className="commercialNotice card"><strong>Внутренние коэффициенты организации</strong><p>«Техническая сложность» и «Срочность» не являются коэффициентами приказа № 848/пр или Методики № 707/пр. Они применяются только в коммерческих методах и должны быть утверждены вашей организацией. В нормативном расчёте они отключены.</p></div>}

        {step === 1 && <div className="flowGrid"><section className="card flowCard"><div className="cardHead"><div><h2>Исходные данные объекта</h2><p>Показатель X и его единица определяются выбранной строкой № 848/пр</p></div></div><div className="sectionTitle">Основные сведения</div><div className="fields"><label><span>Наименование объекта</span><input value={title} onChange={e => setTitle(e.target.value)}/></label><label><span>Адрес / местоположение</span><input value={location} onChange={e => setLocation(e.target.value)}/></label><label><span>Натуральный показатель X</span><div className="inputUnit"><input type="number" value={area} onChange={e => setArea(+e.target.value)}/><b>{selectedInterval?.unit ?? "ед."}</b></div><small>Допустимый интервал: {selectedInterval?.label}</small></label></div></section><FlowSummary step={step} calc={calc} method={method} /></div>}

        {step === 2 && <div className="flowGrid"><section className="card flowCard">
          <div className="cardHead"><div><h2>Состав проектных работ</h2><p>Полный состав П по Постановлению № 87 и каталог основных марок Р</p></div></div>
          <div className="stageSwitches"><label className={stageP ? "stageChoice on" : "stageChoice"}><input type="checkbox" checked={stageP} onChange={e => setStageP(e.target.checked)}/><span className="stageBadge">П</span><div><strong>Проектная документация</strong><small>Объекты производственного и непроизводственного назначения</small></div><b>{Math.round(stagePFactor*100)}%</b></label><label className={stageR ? "stageChoice on" : "stageChoice"}><input type="checkbox" checked={stageR} onChange={e => setStageR(e.target.checked)}/><span className="stageBadge">Р</span><div><strong>Рабочая документация</strong><small>Каталог основных комплектов; расширяется под объект</small></div><b>{Math.round(stageRFactor*100)}%</b></label><div className={sketch ? "stageChoice on sketchChoice" : "stageChoice sketchChoice"}><label className="stageCheck"><input type="checkbox" checked={sketch} onChange={e => setSketch(e.target.checked)}/><span className="stageBadge pale">ЭП</span><span><strong>Эскизный проект</strong><small>Рассчитывается от суммы стоимости стадий П + Р</small></span></label><div className="sketchPercent"><input aria-label="Процент стоимости эскизного проекта" type="number" min="0" step="1" value={sketchPercent} disabled={!sketch} onChange={e => setSketchPercent(+e.target.value)}/><b>%</b></div><p>По умолчанию 20%. Для более точного определения стоимости рекомендуется отдельный расчёт по трудозатратам.</p></div></div>
          <div className="scopeOverview">
            <div><span>Стоимость П</span><strong>{rub.format(calc.p)}</strong></div>
            <div><span>Стоимость Р</span><strong>{rub.format(calc.r)}</strong></div>
            <div><span>П + Р</span><strong>{rub.format(calc.p + calc.r)}</strong></div>
            <button className="internalToggle" onClick={() => setShowInternal(v => !v)}>{showInternal ? "Скрыть внутреннюю раскладку" : "Внутренняя раскладка ПД и РД"}</button>
          </div>
          {isMultiResidential && <div className="floorProfile"><label><span>Этажность многоквартирного дома</span><input type="number" min="1" value={floors} onChange={e=>setFloors(Math.max(1,+e.target.value))}/></label><div><strong>{floors <= 9 ? "До 9 этажей включительно" : "10 этажей и более"}</strong><small>Автоматически выбран профиль {floors <= 9 ? "3.1" : "3.2"} таблицы 1 приложения 1 к № 848/пр. Газоснабжение показывается только при наличии процента в выбранной строке.</small></div></div>}
          {showInternal && <div className="internalLayout">
            <div className="distributionBar splitSources"><label><span>Источник процентов стадии П</span><select value={distributionSourceP} onChange={e => chooseDistributionSource("П", e.target.value)}><option value={isSbcp ? "sbcp" : "848"}>{isSbcp ? "СБЦП 81-2001-03 · таблица 41" : "№ 848/пр · приложение 1"}</option><option value="company">Шаблон организации</option><option value="manual">Ручное распределение</option></select></label><label><span>Источник процентов стадии Р</span><select value={distributionSourceR} onChange={e => chooseDistributionSource("Р", e.target.value)}><option value={isSbcp ? "sbcp" : "848"}>{isSbcp ? "СБЦП 81-2001-03 · таблица 42" : "№ 848/пр · приложение 1"}</option><option value="company">Шаблон организации</option><option value="manual">Ручное распределение</option></select></label></div>
            {(distributionSourceP==="company"||distributionSourceR==="company")&&<div className="templateManager"><div><label><span>Сохранённый шаблон</span><select value={selectedTemplateId} onChange={e=>applyTemplate(e.target.value)}><option value="">Выберите шаблон</option>{templates.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label><button className="ghost" disabled={!selectedTemplateId} onClick={updateTemplate}>Обновить</button><button className="dangerLink" disabled={!selectedTemplateId} onClick={deleteTemplate}>Удалить</button></div><div><input value={templateName} onChange={e=>setTemplateName(e.target.value)} placeholder="Название нового шаблона"/><button className="primary" disabled={!templateName.trim()} onClick={createTemplate}>Сохранить текущий состав</button></div><small>В шаблон входят разделы ПД, комплекты РД, их включение и проценты. Данные хранятся в этом браузере.</small></div>}
            <div className="shareProfileNote"><strong>{isSbcp ? "Профиль СБЦП" : `Профиль № 848/пр: ${selectedShareProfile?.name ?? "не найден"}`}</strong><span>{isSbcp ? "Проценты взяты из таблиц 41 и 42 СБЦП." : "Колонки № 848/пр скрыто переведены в разделы ПД по № 87 и группы РД. Прочерки отключают соответствующие позиции."}</span></div>
            <div className="mappingLegend"><span className="f-site">ПЗУ ↔ ГП</span><span className="f-architecture">АР ↔ АР</span><span className="f-structure">КР ↔ КЖ / КМ / КД</span><span className="f-engineering">ИОС ↔ инженерные группы</span><span className="f-technology">ТХ ↔ ТХ</span></div>
            <div className="workColumns mappedColumns">
              <div><div className="workHeader"><div><strong>Разделы ПД по постановлению № 87</strong><small>Итог можно менять — составляющие масштабируются один раз пропорционально</small></div><div className={Math.abs(works.filter(w=>w.group==="П"&&w.enabled).reduce((s,w)=>s+w.share,0)-100)<.05 ? "totalMarker ok editable" : "totalMarker bad editable"}><input aria-label="Общий процент ПД" type="number" step=".1" value={Number(works.filter(w=>w.group==="П"&&w.enabled).reduce((s,w)=>s+w.share,0).toFixed(2))} onChange={e=>setGroupTotal("П",+e.target.value)}/><b>%</b></div></div>{works.filter(w=>w.group==="П"&&w.enabled).map(w=><label className={`workItem family-${familyByWork[w.id] ?? "other"}`} key={w.id}><input type="checkbox" checked={w.enabled} onChange={()=>toggleWork(w.id)}/><span>{w.name}</span><div className="percentEdit"><input type="number" step=".1" value={Number(w.share.toFixed(2))} onChange={e=>updateShare(w.id,+e.target.value)}/><b>%</b></div></label>)}</div>
              <div><div className="workHeader"><div><strong>Группы и комплекты РД</strong><small>Итог синхронизирован с суммой всех включённых комплектов</small></div><div className={Math.abs(works.filter(w=>w.group==="Р"&&w.enabled).reduce((s,w)=>s+w.share,0)-100)<.05 ? "totalMarker ok editable" : "totalMarker bad editable"}><input aria-label="Общий процент РД" type="number" step=".1" value={Number(works.filter(w=>w.group==="Р"&&w.enabled).reduce((s,w)=>s+w.share,0).toFixed(2))} onChange={e=>setGroupTotal("Р",+e.target.value)}/><b>%</b></div></div>{rGroups.map(g=>{const items=works.filter(w=>w.group==="Р"&&(g.members.includes(w.id)||w.family===g.key));const enabled=items.filter(w=>w.enabled);const total=enabled.reduce((s,w)=>s+w.share,0);const normativeTarget=g.members.reduce((s,id)=>s+(normativeRTargets[id]??0),0);const organizational=distributionSourceR==="manual"||distributionSourceR==="company";const target=organizational?total:normativeTarget;if(target<=0&&!items.some(w=>w.id.startsWith("custom-")))return null;const distributed=!!distributedGroups[g.key];return <section className={`rdGroup family-${g.key}`} key={g.key}><div className="rdGroupHead"><div><strong>{g.name}</strong><small>{g.marks}</small></div><b>{target.toFixed(2)}%</b></div><div className="rdMarks">{items.map(w=><div className="rdMark" key={w.id}><input type="checkbox" checked={w.enabled} onChange={()=>toggleWork(w.id)}/>{w.id.startsWith("custom-")?<input className="markName" value={w.name} onChange={e=>setWorks(list=>list.map(x=>x.id===w.id?{...x,name:e.target.value}:x))}/>:<span>{w.name}</span>}{distributed&&<div className="percentEdit"><input type="number" step=".1" value={Number(w.share.toFixed(2))} disabled={!w.enabled} onChange={e=>updateShare(w.id,+e.target.value)}/><b>%</b></div>}{w.id.startsWith("custom-")&&<button className="removeMark" onClick={()=>removeRWork(w.id)}>×</button>}</div>)}</div><div className="rdGroupActions"><label><input type="checkbox" checked={distributed} onChange={e=>setDistributedGroups(v=>({...v,[g.key]:e.target.checked}))}/> Распределить процент между комплектами</label><button onClick={()=>addRWork(g.key)}>+ Добавить комплект</button></div>{distributed&&<small className={Math.abs(total-target)<.01?"distributionOk":"distributionBad"}>Сумма комплектов: {total.toFixed(2)}%{!organizational&&` · норматив группы ${target.toFixed(2)}%`}</small>}</section>})}</div>
            </div>
            <div className="mappingNote"><span>i</span><p><strong>Разделы ПД и группы РД не вложены друг в друга.</strong> Одинаковый цвет показывает соответствие. ПОС, ПБ и ОДИ в РД отдельными группами не выводятся: их проценты сразу распределены по вашей таблице. Колонки № 848/пр доступны только в проверочном листе.</p></div>
          </div>}        </section><FlowSummary step={step} calc={calc} method={method} /></div>}

        {step === 3 && <div className="flowGrid"><section className="card flowCard"><div className="cardHead"><div><h2>Метод и параметры расчёта</h2><p>Настройте нормативную основу и коммерческие факторы</p></div></div><div className="methodTabs">{[["normative","Нормативные затраты"],["unit","Ставка за м²"],["labor","Трудозатраты"]].map(([id,name]) => <button key={id} className={method === id ? "on" : ""} onClick={() => setMethod(id as Method)}>{name}</button>)}</div>{method === "normative" && <div className="normative"><div className="docIcon">§</div><div><strong>{isSbcp ? "СБЦП 81-2001-03" : "Приказ Минстроя России № 848/пр"}</strong><p>{selectedNorm.table}, пункт {selectedNorm.number} · база {selectedNorm.baseLevel}</p></div><span className="valid">✓ Применим</span></div>}{method === "unit" && <div className="methodPanel"><label><span>Коммерческая ставка</span><div className="inputUnit"><input type="number" value={unitRate} onChange={e => setUnitRate(+e.target.value)}/><b>₽/м²</b></div></label><div className="formula"><span>Расчёт</span><code>{area.toLocaleString("ru-RU")} м² × {rub.format(unitRate)} = <strong>{rub.format(calc.base)}</strong></code></div><p className="warning">Это внутренняя коммерческая ставка, а не норматив Минстроя.</p></div>}{method === "labor" && <div className="fields"><label><span>Трудоёмкость</span><div className="inputUnit"><input type="number" value={hours} onChange={e => setHours(+e.target.value)}/><b>чел.-ч</b></div></label><label><span>Средняя ставка</span><div className="inputUnit"><input type="number" value={hourRate} onChange={e => setHourRate(+e.target.value)}/><b>₽/ч</b></div></label></div>}<div className="sectionTitle">Повторяемость и сложность</div><div className="fields"><label><span>Коэффициент повторной секции</span><select value={repeat} onChange={e => setRepeat(+e.target.value)} disabled={sections === 1}><option value="1">Уникальные — 1,00</option><option value="0.5">Частично повторные — 0,50</option><option value="0.3">Зеркальные — 0,30</option><option value="0.25">Повторные — 0,25</option></select><small>{sections} секц. · итоговый фактор {calc.repeatFactor.toFixed(3)}</small></label><label><span>Техническая сложность</span><select value={complexity} onChange={e => setComplexity(+e.target.value)}><option value="1">Обычная — 1,00</option><option value="1.15">Повышенная — 1,15</option><option value="1.3">Высокая — 1,30</option><option value="1.5">Уникальный объект — 1,50</option></select></label><label><span>Срочность</span><select value={urgency} onChange={e => setUrgency(+e.target.value)}><option value="1">Стандартная — 1,00</option><option value="1.1">Ускоренная — 1,10</option><option value="1.2">Срочная — 1,20</option></select></label><label><span>НДС</span><select value={vat} onChange={e => setVat(+e.target.value)}><option value="0">Без НДС</option><option value="5">5%</option><option value="7">7%</option><option value="20">20%</option></select></label></div></section><FlowSummary step={step} calc={calc} method={method} /></div>}

        {step === 4 && <div className="resultLayout"><section className="proposal"><div className="proposalTop"><div><span>КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ</span><h2>{title}</h2><p>{location}</p></div><div className="proposalNumber">КП № 26-216<small>08.08.2026</small></div></div><div className="proposalFacts"><div><span>Тип объекта</span><strong>{selectedNorm.name}</strong></div><div><span>Площадь</span><strong>{area.toLocaleString("ru-RU")} {selectedInterval?.unit ?? "ед."}</strong></div><div><span>Стадийность</span><strong>{[sketch&&"ЭП",stageP&&"П",stageR&&"Р"].filter(Boolean).join(" + ")}</strong></div><div><span>Метод</span><strong>{method === "normative" ? (isSbcp ? "СБЦП 81-2001-03" : "№ 848/пр") : method === "unit" ? "Ставка за м²" : "Трудозатраты"}</strong></div></div><table className="resultTable"><thead><tr><th>№</th><th>Наименование работ</th><th>Основание</th><th>Стоимость</th></tr></thead><tbody>{stageP&&<tr><td>1</td><td><strong>Проектная документация</strong></td><td>{Math.round(stagePFactor*100)}% · КТИМ {selectedKtim.p.toFixed(2)}</td><td>{rub.format(calc.p)}</td></tr>}{stageR&&<tr><td>2</td><td><strong>Рабочая документация</strong></td><td>{Math.round(stageRFactor*100)}% · КТИМ {selectedKtim.r.toFixed(2)}</td><td>{rub.format(calc.r)}</td></tr>}{sketch&&<tr><td>3</td><td><strong>Эскизный проект</strong><small>Стоимость определена как настраиваемый процент от суммы стадий П и Р. Рекомендуется проверка по трудозатратам.</small></td><td>{sketchPercent}% от суммы П + Р</td><td>{rub.format(calc.ep)}</td></tr>}</tbody><tfoot><tr><td colSpan={3}>Итого без НДС</td><td>{rub.format(calc.subtotal)}</td></tr><tr><td colSpan={3}>НДС {vat}%</td><td>{rub.format(calc.tax)}</td></tr><tr className="final"><td colSpan={3}>Итого к оплате</td><td>{rub.format(calc.total)}</td></tr></tfoot></table><div className="assumptions"><h3>Параметры расчёта</h3><p>Показатель X = {area.toLocaleString("ru-RU")} {selectedInterval?.unit ?? "ед."} · таблица {selectedNorm.table}, пункт {selectedNorm.number}{method === "normative" ? ` · КТИМ П ${selectedKtim.p.toFixed(2)} / Р ${selectedKtim.r.toFixed(2)} · индекс ${activeIndex.toFixed(2)}` : ""}.</p><p className="muted">Демонстрационная версия. Состав разделов и коммерческие коэффициенты должны быть утверждены вашей организацией перед использованием в договорной работе.</p></div><section className="internalMoney noPrint"><div><h3>Внутренняя денежная раскладка</h3><p>Служебный расчёт организации. В печатную версию для заказчика не включается.</p></div><div className="moneyColumns"><div><strong>Проектная документация</strong>{works.filter(w=>w.group==="П"&&w.enabled).map(w=><p key={w.id}><span>{w.name} · {w.share.toFixed(2)}%</span><b>{rub.format(calc.p*w.share/100)}</b></p>)}</div><div><strong>Рабочая документация</strong>{rGroups.map(g=>{const share=works.filter(w=>w.group==="Р"&&w.enabled&&(g.members.includes(w.id)||w.family===g.key)).reduce((s,w)=>s+w.share,0);return share>0?<p key={g.key}><span>{g.name} · {share.toFixed(2)}%</span><b>{rub.format(calc.r*share/100)}</b></p>:null})}</div></div></section></section><aside className="resultActions card"><div className="successIcon">✓</div><h2>Расчёт готов</h2><p>Проверьте состав работ и итоговую стоимость.</p><div className="bigResult">{rub.format(calc.total)}<small>с НДС {vat}%</small></div><button className="primary wide" onClick={() => window.print()}>Печать / сохранить PDF</button><button className="ghost wide" onClick={saveDraft}>Сохранить расчёт</button><button className="linkButton wide" onClick={() => setStep(3)}>← Вернуться к расчёту</button></aside></div>}

        {step < 4 && <div className="flowNav"><button className="ghost" onClick={back} disabled={step === 1}>← Назад</button><span>Шаг {step} из 4</span><button className="primary" onClick={next}>{step === 3 ? "Рассчитать стоимость" : "Продолжить"} →</button></div>}
      </div>}
    </section>
  </main>;
}

function FlowSummary({ calc, method }: { step: number; calc: ReturnType<any>; method: Method }) {
  return <aside className="summary card"><div className="summaryHead"><span>ПРЕДВАРИТЕЛЬНЫЙ ИТОГ</span></div><div className="sumRows"><div><span>Базовая стоимость</span><strong>{rub.format(calc.base)}</strong></div><div><span>Стадия П</span><strong>{rub.format(calc.p)}</strong></div><div><span>Стадия Р</span><strong>{rub.format(calc.r)}</strong></div><div><span>Эскизный проект</span><strong>{rub.format(calc.ep)}</strong></div></div><div className="grandTotal"><span>Стоимость предложения</span><strong>{rub.format(calc.total)}</strong><small>{method === "normative" ? "нормативный расчёт" : "коммерческий расчёт"}</small></div><div className="summaryNote"><span>i</span><p>Итог меняется автоматически при переходе между шагами.</p></div></aside>;
}
