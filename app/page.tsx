"use client";

import { useEffect, useMemo, useState } from "react";

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
  { id: "pz", group: "П", name: "Пояснительная записка", share: 4, enabled: true },
  { id: "pzu", group: "П", name: "Схема планировочной организации", share: 7, enabled: true },
  { id: "ar", group: "П", name: "Архитектурные решения", share: 18, enabled: true },
  { id: "kr", group: "П", name: "Конструктивные решения", share: 20, enabled: true },
  { id: "ios", group: "П", name: "Инженерное оборудование и сети", share: 30, enabled: true },
  { id: "pos", group: "П", name: "Проект организации строительства", share: 6, enabled: true },
  { id: "otherp", group: "П", name: "Прочие разделы стадии П", share: 15, enabled: true },
  { id: "gp", group: "Р", name: "ГП — генеральный план", share: 7, enabled: true },
  { id: "arr", group: "Р", name: "АР — архитектурные решения", share: 18, enabled: true },
  { id: "kj", group: "Р", name: "КЖ / КМ — конструкции", share: 22, enabled: true },
  { id: "ov", group: "Р", name: "ОВ — отопление и вентиляция", share: 14, enabled: true },
  { id: "vk", group: "Р", name: "ВК — водоснабжение и канализация", share: 11, enabled: true },
  { id: "eom", group: "Р", name: "ЭОМ — электроснабжение", share: 13, enabled: true },
  { id: "ss", group: "Р", name: "СС и автоматизация", share: 15, enabled: true },
];

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
  const [vat, setVat] = useState(5);
  const [unitRate, setUnitRate] = useState(4200);
  const [hours, setHours] = useState(5200);
  const [hourRate, setHourRate] = useState(2100);
  const [fixedPrice, setFixedPrice] = useState(12_000_000);
  const [repeat, setRepeat] = useState(0.25);
  const [complexity, setComplexity] = useState(1);
  const [urgency, setUrgency] = useState(1);
  const [saved, setSaved] = useState(false);

  const chooseType = (next: ObjectType) => {
    const preset = objects[next]; setType(next); setArea(preset.area); setCapacity(preset.capacity); setMethod(preset.method);
    setTitle(next === "kindergarten" ? "Детское дошкольное учреждение на 150 мест" : preset.name);
    setSections(next === "residential" ? 4 : 1);
  };

  const calc = useMemo(() => {
    let base = method === "normative" ? 1_076_200 + 1_563 * area : method === "unit" ? area * unitRate : method === "labor" ? hours * hourRate : fixedPrice;
    const repeatFactor = sections > 1 ? (1 + (sections - 1) * repeat) / sections : 1;
    const adjusted = base * repeatFactor * complexity * urgency;
    const p = stageP ? adjusted * .6 * (method === "normative" ? 1.14 * index : 1) : 0;
    const r = stageR ? adjusted * .4 * (method === "normative" ? 1.16 * index : 1) : 0;
    const ep = sketch ? base * .2 * (method === "normative" ? index : 1) : 0;
    const subtotal = p + r + ep; const tax = subtotal * vat / 100;
    return { base, repeatFactor, adjusted, p, r, ep, subtotal, tax, total: subtotal + tax };
  }, [area, complexity, fixedPrice, hourRate, hours, index, method, repeat, sections, sketch, stageP, stageR, unitRate, urgency, vat]);

  const saveDraft = () => {
    localStorage.setItem("proektsmeta-draft", JSON.stringify({ type, title, location, area, capacity, sections, method, stageP, stageR, sketch, index, vat, repeat, complexity, urgency, works }));
    setSaved(true); setTimeout(() => setSaved(false), 1800);
  };
  useEffect(() => { const draft = localStorage.getItem("proektsmeta-draft"); if (draft) setSaved(false); }, []);

  const toggleWork = (id: string) => setWorks(list => list.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w));
  const next = () => setStep(s => Math.min(4, s + 1));
  const back = () => setStep(s => Math.max(1, s - 1));

  return <main className="shell">
    <aside className="sidebar"><div className="brand"><span className="brandMark">П</span><span>ПроектСмета</span></div><nav><button className="navItem active"><span>⌁</span> Расчёты</button><button className="navItem"><span>▤</span> Коммерческие предложения</button><button className="navItem"><span>▦</span> Нормативы</button><button className="navItem"><span>◎</span> Заказчики</button></nav><div className="sidebarBottom"><button className="navItem"><span>⚙</span> Настройки</button><div className="profile"><div className="avatar">Ф</div><div><strong>Фёдор</strong><small>Проектная организация</small></div></div></div></aside>
    <section className="workspace">
      <header className="topbar"><div><span className="crumb">Расчёты</span><span className="slash">/</span><span>Новый расчёт</span></div><div className="topActions"><button className="ghost" onClick={saveDraft}>{saved ? "✓ Сохранено" : "Сохранить черновик"}</button><button className="primary" onClick={() => setStep(4)}>Сформировать КП</button></div></header>
      <div className="content">
        <div className="titleRow"><div><div className="eyebrow">НОВЫЙ РАСЧЁТ</div><h1>{title || "Коммерческое предложение"}</h1><p>{location || "Укажите адрес объекта"}</p></div><span className="status">{step === 4 ? "Рассчитано" : "Черновик"}</span></div>
        <div className="steps">{["Объект", "Состав работ", "Расчёт", "Результат"].map((name, i) => <button key={name} className={step === i + 1 ? "step active" : step > i + 1 ? "step done" : "step"} onClick={() => setStep(i + 1)}><span>{step > i + 1 ? "✓" : i + 1}</span>{name}</button>)}</div>

        {step === 1 && <div className="flowGrid"><section className="card flowCard"><div className="cardHead"><div><h2>Выберите тип объекта</h2><p>Выбор определит рекомендуемый способ расчёта</p></div></div><div className="objectGrid">{(Object.keys(objects) as ObjectType[]).map(key => { const o = objects[key]; return <button key={key} className={type === key ? "objectCard selected" : "objectCard"} onClick={() => chooseType(key)}><span>{o.icon}</span><strong>{o.name}</strong><small>{o.subtitle}</small>{type === key && <b>✓</b>}</button>})}</div><div className="sectionTitle">Основные сведения</div><div className="fields"><label><span>Наименование объекта</span><input value={title} onChange={e => setTitle(e.target.value)}/></label><label><span>Адрес / местоположение</span><input value={location} onChange={e => setLocation(e.target.value)}/></label><label><span>Общая площадь</span><div className="inputUnit"><input type="number" value={area} onChange={e => setArea(+e.target.value)}/><b>м²</b></div></label><label><span>Вместимость</span><div className="inputUnit"><input type="number" value={capacity} onChange={e => setCapacity(+e.target.value)}/><b>{type === "residential" ? "квартир" : "мест"}</b></div></label><label><span>Количество секций / корпусов</span><input type="number" min="1" value={sections} onChange={e => setSections(Math.max(1, +e.target.value))}/></label><label><span>Вид строительства</span><select><option>Новое строительство</option><option>Реконструкция</option><option>Капитальный ремонт</option></select></label></div></section><FlowSummary step={step} calc={calc} method={method} /></div>}

        {step === 2 && <div className="flowGrid"><section className="card flowCard"><div className="cardHead"><div><h2>Состав проектных работ</h2><p>Выберите стадии, разделы П и связанные марки Р</p></div></div><div className="stageSwitches"><label className={stageP ? "stageChoice on" : "stageChoice"}><input type="checkbox" checked={stageP} onChange={e => setStageP(e.target.checked)}/><span className="stageBadge">П</span><div><strong>Проектная документация</strong><small>Состав по Постановлению № 87</small></div><b>60%</b></label><label className={stageR ? "stageChoice on" : "stageChoice"}><input type="checkbox" checked={stageR} onChange={e => setStageR(e.target.checked)}/><span className="stageBadge">Р</span><div><strong>Рабочая документация</strong><small>Комплекты рабочих марок</small></div><b>40%</b></label><label className={sketch ? "stageChoice on" : "stageChoice"}><input type="checkbox" checked={sketch} onChange={e => setSketch(e.target.checked)}/><span className="stageBadge pale">ЭП</span><div><strong>Эскизный проект</strong><small>Дополнительная работа</small></div><b>20%</b></label></div><div className="workColumns">{(["П", "Р"] as const).map(group => <div key={group}><div className="workHeader"><strong>{group === "П" ? "Разделы стадии П" : "Марки стадии Р"}</strong><small>{works.filter(w => w.group === group && w.enabled).length} выбрано</small></div>{works.filter(w => w.group === group).map(w => <label className="workItem" key={w.id}><input type="checkbox" checked={w.enabled} onChange={() => toggleWork(w.id)}/><span>{w.name}</span><b>{w.share}%</b></label>)}</div>)}</div><div className="mappingNote"><span>↔</span><p><strong>Связи П → Р будут сохранены.</strong> Например, ИОС раскладывается на ОВ, ВК, ЭОМ, СС и автоматизацию. Проценты сейчас демонстрационные и позже будут заменены справочником организации.</p></div></section><FlowSummary step={step} calc={calc} method={method} /></div>}

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
