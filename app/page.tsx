"use client";

import { useEffect, useMemo, useState } from "react";
import "./extra.css";

const rub = new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 });

type Method = "normative" | "unit" | "labor" | "fixed";
type ObjectType = "kindergarten" | "residential" | "public" | "industrial";
type Work = { id: string; group: "П" | "Р"; name: string; share: number; enabled: boolean };

const objects = {
  kindergarten: { icon: "Д", name: "Детский сад", subtitle: "Объект образования", area: 2900, capacity: 150, method: "normative" as Method },
  residential: { icon: "Ж", name: "Жилой дом", subtitle: "Многоквартирный дом", area: 18000, capacity: 240, method: "unit" as Method },
  public: { icon: "О", name: "Общественное здание", subtitle: "Офисы, торговля, культура", area: 6500, capacity: 0, method: "unit" as Method },
  industrial: { icon: "П", name: "Промышленный объект", subtitle: "Производственное здание", area: 12000, capacity: 0, method: "labor" as Method },
};

const initialWorks: Work[] = [
  { id:"p1",group:"П",name:"1. Пояснительная записка (включая требования ЭЭ)",share:2.5,enabled:true },
  { id:"p2",group:"П",name:"2. Схема планировочной организации земельного участка",share:4,enabled:true },
  { id:"p3",group:"П",name:"3. Объёмно-планировочные и архитектурные решения",share:17,enabled:true },
  { id:"p4",group:"П",name:"4. Конструктивные решения",share:16.3,enabled:true },
  { id:"p51",group:"П",name:"5.1. Система электроснабжения",share:3.9,enabled:true },
  { id:"p52",group:"П",name:"5.2. Система водоснабжения",share:2.45,enabled:true },
  { id:"p53",group:"П",name:"5.3. Система водоотведения",share:2.45,enabled:true },
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
  { id:"r_pz",group:"Р",name:"ПЗ — общие данные и пояснения",share:.5,enabled:true },
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
];

const sbcpShares: Record<string, number> = {
  p1:2,p2:4,p3:14,p4:15,p51:7,p52:4,p53:4,p54:12,p55:3,p56:2,p57:0,p6:5,p7:6,p8:7,p9:6,p10:0,p11:2,p12:7,p13:0,
  r_pz:0,r_gp:1,r_ar:22,r_kj:22,r_km:5,r_kd:0,r_ov:14,r_vk:6,r_nvk:0,r_ts:0,r_tm:0,r_eom:5,r_es:0,r_en:0,r_ss:3,r_sks:0,r_aps:4,r_apt:0,r_aov:0,r_ak:0,r_atx:0,r_tx:4,r_gsv:2,r_gsn:0,r_ad:0,r_bg:0,r_pos:0,r_odi:3,r_sm:9,
};

export default function Home() {
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
  const [index, setIndex] = useState(1.68);
  const [quarter, setQuarter] = useState("2026-q2");
  const [vat, setVat] = useState(5);
  const [unitRate, setUnitRate] = useState(4200);
  const [hours, setHours] = useState(5200);
  const [hourRate, setHourRate] = useState(2100);
  const [fixedPrice, setFixedPrice] = useState(12_000_000);
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

  const chooseType = (next: ObjectType) => {
    const preset = objects[next]; setType(next); setArea(preset.area); setCapacity(preset.capacity); setMethod(preset.method);
    setTitle(next === "kindergarten" ? "Детское дошкольное учреждение на 150 мест" : preset.name);
    setSections(next === "residential" ? 4 : 1);
  };
  const chooseQuarter = (value: string) => {
    setQuarter(value);
    setIndex(value === "2025-q4" ? 1.62 : 1.68);
  };

  const calc = useMemo(() => {
    let base = method === "normative" ? 1_076_200 + 1_563 * area : method === "unit" ? area * unitRate : method === "labor" ? hours * hourRate : fixedPrice;
    const repeatFactor = 1;
    const adjusted = method === "normative" ? base : base * complexity * urgency;
    const pScope = works.filter(w => w.group === "П" && w.enabled).reduce((s,w) => s + w.share, 0) / 100;
    const rScope = works.filter(w => w.group === "Р" && w.enabled).reduce((s,w) => s + w.share, 0) / 100;
    const p = stageP ? adjusted * .6 * pScope * (method === "normative" ? 1.14 * index : 1) : 0;
    const r = stageR ? adjusted * .4 * rScope * (method === "normative" ? 1.16 * index : 1) : 0;
    const ep = sketch ? base * .2 * (method === "normative" ? index : 1) : 0;
    const subtotal = p + r + ep; const tax = subtotal * vat / 100;
    return { base, repeatFactor, adjusted, pScope, rScope, p, r, ep, subtotal, tax, total: subtotal + tax };
  }, [area, complexity, fixedPrice, hourRate, hours, index, method, repeat, sections, sketch, stageP, stageR, unitRate, urgency, vat, works]);

  const saveDraft = () => {
    localStorage.setItem("proektsmeta-draft", JSON.stringify({ type, title, location, area, capacity, sections, method, stageP, stageR, sketch, index, vat, repeat, complexity, urgency, works }));
    setSaved(true); setTimeout(() => setSaved(false), 1800);
  };
  useEffect(() => { const draft = localStorage.getItem("proektsmeta-draft"); if (draft) setSaved(false); }, []);

  const toggleWork = (id: string) => setWorks(list => list.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w));
  const updateShare = (id: string, value: number) => {
    const group = works.find(w => w.id === id)?.group;
    if (group === "П") setDistributionSourceP("manual");
    if (group === "Р") setDistributionSourceR("manual");
    setWorks(list => list.map(w => w.id === id ? { ...w, share: Math.max(0, Math.min(100, value)) } : w));
  };
  const setAllWorks = (group: "П" | "Р", enabled: boolean) => setWorks(list => list.map(w => w.group === group ? { ...w, enabled } : w));
  const chooseDistributionSource = (group: "П" | "Р", value: string) => {
    group === "П" ? setDistributionSourceP(value) : setDistributionSourceR(value);
    if (value === "848") setWorks(list => list.map(w => {
      if (w.group !== group) return w;
      const preset = initialWorks.find(p => p.id === w.id)!;
      return { ...preset };
    }));
    if (value === "sbcp") setWorks(list => list.map(w => w.group === group ? { ...w, share: sbcpShares[w.id] ?? 0, enabled: (sbcpShares[w.id] ?? 0) > 0 } : w));
  };
  const next = () => setStep(s => Math.min(5, s + 1));
  const back = () => setStep(s => Math.max(1, s - 1));

  return <main className="shell">
    <aside className="sidebar"><div className="brand"><span className="brandMark">П</span><span>ПроектСмета</span></div><nav><button className="navItem active"><span>⌁</span> Расчёты</button><button className="navItem"><span>▤</span> Коммерческие предложения</button><button className="navItem"><span>▦</span> Нормативы</button><button className="navItem"><span>◎</span> Заказчики</button></nav><div className="sidebarBottom"><button className="navItem"><span>⚙</span> Настройки</button><div className="profile"><div className="avatar">Ф</div><div><strong>Фёдор</strong><small>Проектная организация</small></div></div></div></aside>
    <section className="workspace">
      <header className="topbar"><div><span className="crumb">Расчёты</span><span className="slash">/</span><span>Новый расчёт</span></div><div className="topActions"><button className="ghost" onClick={saveDraft}>{saved ? "✓ Сохранено" : "Сохранить черновик"}</button><button className="primary" onClick={() => setStep(4)}>Сформировать КП</button></div></header>
      <div className="content">
        <div className="titleRow"><div><div className="eyebrow">НОВЫЙ РАСЧЁТ</div><h1>{title || "Коммерческое предложение"}</h1><p>{location || "Укажите адрес объекта"}</p></div><span className="status">{step === 4 ? "Рассчитано" : "Черновик"}</span></div>
        <div className="steps">{["Объект", "Состав работ", "Расчёт", "Результат"].map((name, i) => <button key={name} className={step === i + 1 ? "step active" : step > i + 1 ? "step done" : "step"} onClick={() => setStep(i + 1)}><span>{step > i + 1 ? "✓" : i + 1}</span>{name}</button>)}</div>
        {step === 4 && <button className="detailsTrigger" onClick={() => setShowDetails(true)}>ⓘ Подробно о расчёте</button>}
        {showDetails && <div className="detailsOverlay" onClick={() => setShowDetails(false)}><section className="detailsModal card" onClick={e => e.stopPropagation()}><button className="detailsClose" onClick={() => setShowDetails(false)}>×</button><div className="eyebrow">ПРОВЕРОЧНЫЙ ЛИСТ</div><h2>Подробно о расчёте</h2><p className="detailsLead">Все множители приведены в порядке применения. Расчёт можно повторить вручную.</p><div className="auditFormula"><span>Базовая цена</span><strong>(1 076 200 + 1 563 × {area.toLocaleString("ru-RU")}) = {rub.format(calc.base)}</strong><small>№ 848/пр, таблица 3.8, пункт 1; уровень цен 01.01.2021</small></div><div className="auditRows"><div><b>Площадь X</b><span>{area.toLocaleString("ru-RU")} м²</span><small>Введено пользователем</small></div><div><b>Стадия П</b><span>60% × КТИМ 1,14 × индекс {index.toFixed(2)} × состав {(calc.pScope*100).toFixed(1)}%</span><small>№ 848/пр и выбранный состав работ</small></div><div><b>Стадия Р</b><span>40% × КТИМ 1,16 × индекс {index.toFixed(2)} × состав {(calc.rScope*100).toFixed(1)}%</span><small>№ 848/пр и выбранный состав работ</small></div><div><b>Распределение разделов</b><span>{distributionSource === "848" ? "№ 848/пр, приложение 1, таблица 8" : distributionSource === "sbcp" ? "СБЦП 81-2001-03, таблицы 41 и 42" : "Ручное / организационное"}</span><small>Проценты показаны на шаге «Состав работ»</small></div><div><b>Индекс пересчёта</b><span>{index.toFixed(2)} · {quarter === "2025-q4" ? "IV квартал 2025" : "II квартал 2026"}</span><small>Переход от цен 01.01.2021 к выбранному кварталу</small></div><div><b>Дополнительные нормативные условия</b><span>Не применены</span><small>Стеснённость и иные факторы должны включаться только после подтверждения основания</small></div></div><div className="methodSources"><h3>Нормативная основа</h3><a href="https://www.minstroyrf.gov.ru/docs/355755/" target="_blank" rel="noreferrer">Приказ Минстроя № 848/пр ↗</a><a href="https://minstroyrf.gov.ru/upload/iblock/0e3/Metodika-opredeleniya-stoimosti-rabot-po-podgotovke-proektnoy-dokumentatsii.pdf" target="_blank" rel="noreferrer">Методика № 707/пр ↗</a><p>№ 707/пр устанавливает общий порядок определения стоимости; № 848/пр содержит нормативные затраты для жилищно-гражданских объектов. Коммерческие коэффициенты сложности и срочности в нормативном режиме не применяются.</p></div></section></div>}
        {step === 3 && method === "normative" && <div className="quarterBar card"><label><span>Индекс к 01.01.2021</span><input type="number" step=".01" value={index} onChange={e => setIndex(+e.target.value)}/><small>{Math.abs(index - (quarter === "2025-q4" ? 1.62 : 1.68)) > .001 ? "Изменён вручную · " : ""}{quarter === "2025-q4" ? "IV квартал 2025 · норматив 1,62 · № 62725-ИФ/09" : "II квартал 2026 · норматив 1,68 · № 20212-ИФ/09"}</small></label><label><span>Уровень цен</span><select value={quarter} onChange={e => chooseQuarter(e.target.value)}><option value="2026-q2">II квартал 2026 — индекс 1,68</option><option value="2025-q4">IV квартал 2025 — индекс 1,62</option></select><small>Коэффициент меняется автоматически при выборе квартала</small></label></div>}
        {step === 3 && method === "normative" && <div className="normBreakdown card"><div><strong>Как собрана нормативная цена</strong><span>Все применённые значения показаны отдельно</span></div><dl><div><dt>а = 1 076,2 тыс. ₽; b = 1,563 тыс. ₽/м²</dt><dd>Приказ № 848/пр, таблица 3.8, пункт 1</dd></div><div><dt>X = {area.toLocaleString("ru-RU")} м²</dt><dd>Площадь объекта, введённая на шаге 1</dd></div><div><dt>П = 60%; Р = 40%</dt><dd>Разделение стоимости проектной и рабочей документации</dd></div><div><dt>КТИМ: П = 1,14; Р = 1,16</dt><dd>№ 848/пр, приложение 2; коэффициенты различаются по стадии</dd></div><div><dt>Индекс = {index.toFixed(2)}</dt><dd>{quarter === "2025-q4" ? "IV квартал 2025" : "II квартал 2026"}, пересчёт от уровня цен 01.01.2021</dd></div></dl><p><strong>Методика № 707/пр</strong> задаёт общий порядок определения стоимости, а № 848/пр содержит нормативные затраты для жилищно-гражданских объектов. Дополнительные условия, например стеснённая территория, нельзя применять автоматически без подтверждения их применимости исходными данными и конкретным пунктом нормы.</p></div>}
        {step === 3 && method !== "normative" && <div className="commercialNotice card"><strong>Внутренние коэффициенты организации</strong><p>«Техническая сложность» и «Срочность» не являются коэффициентами приказа № 848/пр или Методики № 707/пр. Они применяются только в коммерческих методах и должны быть утверждены вашей организацией. В нормативном расчёте они отключены.</p></div>}

        {step === 1 && <div className="flowGrid"><section className="card flowCard"><div className="cardHead"><div><h2>Выберите тип объекта</h2><p>Выбор определит рекомендуемый способ расчёта</p></div></div><div className="objectGrid">{(Object.keys(objects) as ObjectType[]).map(key => { const o = objects[key]; return <button key={key} className={type === key ? "objectCard selected" : "objectCard"} onClick={() => chooseType(key)}><span>{o.icon}</span><strong>{o.name}</strong><small>{o.subtitle}</small>{type === key && <b>✓</b>}</button>})}</div><div className="sectionTitle">Основные сведения</div><div className="fields"><label><span>Наименование объекта</span><input value={title} onChange={e => setTitle(e.target.value)}/></label><label><span>Адрес / местоположение</span><input value={location} onChange={e => setLocation(e.target.value)}/></label><label><span>Общая площадь</span><div className="inputUnit"><input type="number" value={area} onChange={e => setArea(+e.target.value)}/><b>м²</b></div></label><label><span>Вид строительства</span><select><option>Новое строительство</option><option>Реконструкция</option><option>Капитальный ремонт</option></select></label></div></section><FlowSummary step={step} calc={calc} method={method} /></div>}

        {step === 2 && <div className="flowGrid"><section className="card flowCard">
          <div className="cardHead"><div><h2>Состав проектных работ</h2><p>Полный состав П по Постановлению № 87 и каталог основных марок Р</p></div></div>
          <div className="stageSwitches"><label className={stageP ? "stageChoice on" : "stageChoice"}><input type="checkbox" checked={stageP} onChange={e => setStageP(e.target.checked)}/><span className="stageBadge">П</span><div><strong>Проектная документация</strong><small>Объекты производственного и непроизводственного назначения</small></div><b>60%</b></label><label className={stageR ? "stageChoice on" : "stageChoice"}><input type="checkbox" checked={stageR} onChange={e => setStageR(e.target.checked)}/><span className="stageBadge">Р</span><div><strong>Рабочая документация</strong><small>Каталог основных комплектов; расширяется под объект</small></div><b>40%</b></label><label className={sketch ? "stageChoice on" : "stageChoice"}><input type="checkbox" checked={sketch} onChange={e => setSketch(e.target.checked)}/><span className="stageBadge pale">ЭП</span><div><strong>Эскизный проект</strong><small>Дополнительная работа</small></div><b>20%</b></label></div>
          <div className="distributionBar splitSources"><label><span>Источник процентов стадии П</span><select value={distributionSourceP} onChange={e => chooseDistributionSource("П", e.target.value)}><option value="848">№ 848/пр · приложение 1 · таблица 8</option><option value="sbcp">СБЦП · таблица 41</option><option value="company">Шаблон организации</option><option value="manual">Ручное распределение</option></select><small>Меняет только разделы П</small></label><label><span>Источник процентов стадии Р</span><select value={distributionSourceR} onChange={e => chooseDistributionSource("Р", e.target.value)}><option value="848">№ 848/пр · приложение 1 · таблица 8</option><option value="sbcp">СБЦП · таблица 42</option><option value="company">Шаблон организации</option><option value="manual">Ручное распределение</option></select><small>Меняет только марки Р</small></label></div>
          <div className="workColumns">{(["П", "Р"] as const).map(group => { const selected=works.filter(w=>w.group===group&&w.enabled); const total=selected.reduce((s,w)=>s+w.share,0); return <div key={group}><div className="workHeader"><div><strong>{group === "П" ? "Разделы стадии П" : "Марки стадии Р"}</strong><small>{selected.length} выбрано</small></div><div className={Math.abs(total-100)<.01 ? "totalMarker ok" : "totalMarker bad"}>{total.toFixed(1)}%</div></div><div className="selectActions"><button onClick={()=>setAllWorks(group,true)}>Выбрать все</button><button onClick={()=>setAllWorks(group,false)}>Снять все</button></div>{works.filter(w => w.group === group).map(w => <label className="workItem" key={w.id}><input type="checkbox" checked={w.enabled} onChange={() => toggleWork(w.id)}/><span>{w.name}</span><div className="percentEdit"><input type="number" step=".1" value={Number(w.share.toFixed(2))} disabled={!w.enabled} onChange={e=>updateShare(w.id,+e.target.value)}/><b>%</b></div></label>)}</div>})}</div>
          <div className="mappingNote"><span>∑</span><p><strong>Проценты управляют стоимостью разделов.</strong> Значения редактируются независимо и больше не влияют друг на друга. Индикатор зелёный только при сумме ровно 100%; если сумма больше или меньше — он красный.</p></div>
        </section><FlowSummary step={step} calc={calc} method={method} /></div>}

        {step === 3 && <div className="flowGrid"><section className="card flowCard"><div className="cardHead"><div><h2>Метод и параметры расчёта</h2><p>Настройте нормативную основу и коммерческие факторы</p></div></div><div className="methodTabs">{[["normative","Нормативные затраты"],["unit","Ставка за м²"],["labor","Трудозатраты"],["fixed","Фиксированная цена"]].map(([id,name]) => <button key={id} className={method === id ? "on" : ""} onClick={() => setMethod(id as Method)}>{name}</button>)}</div>{method === "normative" && <><div className="normative"><div className="docIcon">§</div><div><strong>Приказ Минстроя России № 848/пр</strong><p>Таблица 3.8, пункт 1 · база 01.01.2021</p></div><span className="valid">✓ Применим</span></div><div className="formula"><span>Базовая стоимость</span><code>1 076 200 + 1 563 × {area.toLocaleString("ru-RU")} = <strong>{rub.format(calc.base)}</strong></code></div><div className="fields topGap"><label><span>Индекс к 01.01.2021</span><input type="number" step=".01" value={index} onChange={e => setIndex(+e.target.value)}/><small>II квартал 2026 · № 20212-ИФ/09</small></label><label><span>Уровень цен</span><select><option>II квартал 2026</option><option>IV квартал 2025</option></select></label></div></>}{method === "unit" && <div className="methodPanel"><label><span>Коммерческая ставка</span><div className="inputUnit"><input type="number" value={unitRate} onChange={e => setUnitRate(+e.target.value)}/><b>₽/м²</b></div></label><div className="formula"><span>Расчёт</span><code>{area.toLocaleString("ru-RU")} м² × {rub.format(unitRate)} = <strong>{rub.format(calc.base)}</strong></code></div><p className="warning">Это внутренняя коммерческая ставка, а не норматив Минстроя.</p></div>}{method === "labor" && <div className="fields"><label><span>Трудоёмкость</span><div className="inputUnit"><input type="number" value={hours} onChange={e => setHours(+e.target.value)}/><b>чел.-ч</b></div></label><label><span>Средняя ставка</span><div className="inputUnit"><input type="number" value={hourRate} onChange={e => setHourRate(+e.target.value)}/><b>₽/ч</b></div></label></div>}{method === "fixed" && <div className="methodPanel"><label><span>Договорная цена</span><div className="inputUnit"><input type="number" value={fixedPrice} onChange={e => setFixedPrice(+e.target.value)}/><b>₽</b></div></label></div>}<div className="sectionTitle">Повторяемость и сложность</div><div className="fields"><label><span>Коэффициент повторной секции</span><select value={repeat} onChange={e => setRepeat(+e.target.value)} disabled={sections === 1}><option value="1">Уникальные — 1,00</option><option value="0.5">Частично повторные — 0,50</option><option value="0.3">Зеркальные — 0,30</option><option value="0.25">Повторные — 0,25</option></select><small>{sections} секц. · итоговый фактор {calc.repeatFactor.toFixed(3)}</small></label><label><span>Техническая сложность</span><select value={complexity} onChange={e => setComplexity(+e.target.value)}><option value="1">Обычная — 1,00</option><option value="1.15">Повышенная — 1,15</option><option value="1.3">Высокая — 1,30</option><option value="1.5">Уникальный объект — 1,50</option></select></label><label><span>Срочность</span><select value={urgency} onChange={e => setUrgency(+e.target.value)}><option value="1">Стандартная — 1,00</option><option value="1.1">Ускоренная — 1,10</option><option value="1.2">Срочная — 1,20</option></select></label><label><span>НДС</span><select value={vat} onChange={e => setVat(+e.target.value)}><option value="0">Без НДС</option><option value="5">5%</option><option value="7">7%</option><option value="20">20%</option></select></label></div></section><FlowSummary step={step} calc={calc} method={method} /></div>}

        {step === 4 && <div className="resultLayout"><section className="proposal"><div className="proposalTop"><div><span>КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ</span><h2>{title}</h2><p>{location}</p></div><div className="proposalNumber">КП № 26-216<small>08.08.2026</small></div></div><div className="proposalFacts"><div><span>Тип объекта</span><strong>{objects[type].name}</strong></div><div><span>Площадь</span><strong>{area.toLocaleString("ru-RU")} м²</strong></div><div><span>Стадийность</span><strong>{[sketch&&"ЭП",stageP&&"П",stageR&&"Р"].filter(Boolean).join(" + ")}</strong></div><div><span>Метод</span><strong>{method === "normative" ? "№ 848/пр" : method === "unit" ? "Ставка за м²" : method === "labor" ? "Трудозатраты" : "Фиксированная цена"}</strong></div></div><table className="resultTable"><thead><tr><th>№</th><th>Наименование работ</th><th>Основание</th><th>Стоимость</th></tr></thead><tbody>{stageP&&<tr><td>1</td><td><strong>Проектная документация</strong><small>{works.filter(w=>w.group==="П"&&w.enabled).map(w=>w.name).join(", ")}</small></td><td>60% · КТИМ 1,14</td><td>{rub.format(calc.p)}</td></tr>}{stageR&&<tr><td>2</td><td><strong>Рабочая документация</strong><small>{works.filter(w=>w.group==="Р"&&w.enabled).map(w=>w.name).join(", ")}</small></td><td>40% · КТИМ 1,16</td><td>{rub.format(calc.r)}</td></tr>}{sketch&&<tr><td>3</td><td><strong>Эскизный проект</strong><small>Концептуальные архитектурные решения</small></td><td>20% от базы</td><td>{rub.format(calc.ep)}</td></tr>}</tbody><tfoot><tr><td colSpan={3}>Итого без НДС</td><td>{rub.format(calc.subtotal)}</td></tr><tr><td colSpan={3}>НДС {vat}%</td><td>{rub.format(calc.tax)}</td></tr><tr className="final"><td colSpan={3}>Итого к оплате</td><td>{rub.format(calc.total)}</td></tr></tfoot></table><div className="assumptions"><h3>Параметры расчёта</h3><p>Площадь {area.toLocaleString("ru-RU")} м² · {sections} секц./корп. · повторяемость {calc.repeatFactor.toFixed(3)} · сложность {complexity.toFixed(2)} · срочность {urgency.toFixed(2)}{method === "normative" ? ` · индекс ${index.toFixed(2)}` : ""}.</p><p className="muted">Демонстрационная версия. Состав разделов и коммерческие коэффициенты должны быть утверждены вашей организацией перед использованием в договорной работе.</p></div></section><aside className="resultActions card"><div className="successIcon">✓</div><h2>Расчёт готов</h2><p>Проверьте состав работ и итоговую стоимость.</p><div className="bigResult">{rub.format(calc.total)}<small>с НДС {vat}%</small></div><button className="primary wide" onClick={() => window.print()}>Печать / сохранить PDF</button><button className="ghost wide" onClick={saveDraft}>Сохранить расчёт</button><button className="linkButton wide" onClick={() => setStep(3)}>← Вернуться к расчёту</button></aside></div>}

        {step < 4 && <div className="flowNav"><button className="ghost" onClick={back} disabled={step === 1}>← Назад</button><span>Шаг {step} из 4</span><button className="primary" onClick={next}>{step === 3 ? "Рассчитать стоимость" : "Продолжить"} →</button></div>}
      </div>
    </section>
  </main>;
}

function FlowSummary({ calc, method }: { step: number; calc: ReturnType<any>; method: Method }) {
  return <aside className="summary card"><div className="summaryHead"><span>ПРЕДВАРИТЕЛЬНЫЙ ИТОГ</span></div><div className="sumRows"><div><span>Базовая стоимость</span><strong>{rub.format(calc.base)}</strong></div><div><span>Стадия П</span><strong>{rub.format(calc.p)}</strong></div><div><span>Стадия Р</span><strong>{rub.format(calc.r)}</strong></div><div><span>Эскизный проект</span><strong>{rub.format(calc.ep)}</strong></div></div><div className="grandTotal"><span>Стоимость предложения</span><strong>{rub.format(calc.total)}</strong><small>{method === "normative" ? "нормативный расчёт" : "коммерческий расчёт"}</small></div><div className="summaryNote"><span>i</span><p>Итог меняется автоматически при переходе между шагами.</p></div></aside>;
}
